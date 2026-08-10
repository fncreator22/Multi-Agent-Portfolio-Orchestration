import os
import re
import json
import hashlib
import subprocess
import requests
import numpy as np
from pathlib import Path
from dotenv import load_dotenv
import chromadb

# Load environment variables
load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
CHROMA_DB_DIR = os.getenv("CHROMA_DB_DIR", "./chroma_db")
COLLECTION_NAME = "portfolio_projects"


def load_projects_from_ts(ts_path: str) -> list:
    """
    Parses src/constants/projects.ts (the single source of truth from Phase 1)
    without duplicating content.
    """
    abs_path = os.path.abspath(ts_path)
    if not os.path.exists(abs_path):
        repo_root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ts_path))
        if os.path.exists(repo_root_path):
            abs_path = repo_root_path
        else:
            raise FileNotFoundError(f"Projects file not found at: {abs_path} or {repo_root_path}")

    # Primary method: Node.js execution
    try:
        js_script = (
            "const fs = require('fs');\n"
            f"const content = fs.readFileSync({json.dumps(abs_path)}, 'utf8');\n"
            "const start = content.indexOf('export const PROJECTS');\n"
            "if (start === -1) process.exit(1);\n"
            "const bracket = content.indexOf('[', start);\n"
            "const end = content.lastIndexOf('];');\n"
            "const arrayCode = content.substring(bracket, end + 1);\n"
            "const projects = eval(arrayCode);\n"
            "console.log(JSON.stringify(projects));\n"
        )
        res = subprocess.run(["node", "-e", js_script], capture_output=True, text=True)
        if res.returncode == 0 and res.stdout.strip():
            return json.loads(res.stdout.strip())
    except Exception as e:
        print(f"[ingest] Node parser fallback triggered: {e}", flush=True)

    # Fallback method: Pure Python string extraction & JSON conversion
    with open(abs_path, 'r', encoding='utf-8') as f:
        content = f.read()

    start = content.find("export const PROJECTS")
    if start == -1:
        raise ValueError("Could not find 'export const PROJECTS' in projects.ts")
    bracket = content.find("[", start)
    end = content.rfind("];")
    if bracket == -1 or end == -1:
        raise ValueError("Could not locate PROJECTS array boundary in projects.ts")

    array_str = content[bracket:end + 1]
    # Quote unquoted keys (e.g. id: -> "id":)
    json_like = re.sub(r'([{,]\s*)([a-zA-Z_]\w*)\s*:', r'\1"\2":', array_str)
    # Remove trailing commas
    json_like = re.sub(r',\s*([\}\]])', r'\1', json_like)
    
    return json.loads(json_like)


def check_ollama_status() -> bool:
    """
    Checks whether local Ollama service is active and the configured model can produce embeddings.
    """
    try:
        url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/embeddings"
        payload = {"model": OLLAMA_EMBED_MODEL, "prompt": "test"}
        res = requests.post(url, json=payload, timeout=1.0)
        if res.status_code == 200 and "embedding" in res.json():
            return True

        url_embed = f"{OLLAMA_BASE_URL.rstrip('/')}/api/embed"
        payload_embed = {"model": OLLAMA_EMBED_MODEL, "input": "test"}
        res_embed = requests.post(url_embed, json=payload_embed, timeout=1.0)
        if res_embed.status_code == 200 and "embeddings" in res_embed.json():
            return True
    except Exception:
        pass
    return False


def fallback_embedding_vectorizer(text: str, dim: int = 384) -> list:
    """
    Lightweight, deterministic dense embedding vectorizer fallback.
    Produces L2-normalized d-dimensional dense vectors for semantic/keyword retrieval
    when local Ollama service is unreachable or model is missing.
    """
    words = re.findall(r'\w+', text.lower())
    if not words:
        return [0.0] * dim

    vector = np.zeros(dim, dtype=np.float32)
    ngrams = words + [f"{words[i]}_{words[i+1]}" for i in range(len(words) - 1)]

    for ngram in ngrams:
        h = int(hashlib.md5(ngram.encode('utf-8')).hexdigest(), 16)
        bin_idx = h % dim
        sign = 1.0 if (h >> 16) % 2 == 0 else -1.0
        vector[bin_idx] += sign

    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm
    return vector.tolist()


def get_vector_embedding(text: str, use_ollama: bool = True) -> list:
    """
    Generates vector embedding for input text using local Ollama (nomic-embed-text)
    if active, or falls back to deterministic dense vectorizer.
    """
    if use_ollama:
        try:
            url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/embeddings"
            payload = {"model": OLLAMA_EMBED_MODEL, "prompt": text}
            res = requests.post(url, json=payload, timeout=1.0)
            if res.status_code == 200:
                data = res.json()
                if "embedding" in data:
                    return data["embedding"]

            url_embed = f"{OLLAMA_BASE_URL.rstrip('/')}/api/embed"
            payload_embed = {"model": OLLAMA_EMBED_MODEL, "input": text}
            res_embed = requests.post(url_embed, json=payload_embed, timeout=1.0)
            if res_embed.status_code == 200:
                data = res_embed.json()
                if "embeddings" in data and len(data["embeddings"]) > 0:
                    return data["embeddings"][0]
        except Exception:
            pass

    return fallback_embedding_vectorizer(text)


def run_ingestion():
    ts_file = os.path.join(os.path.dirname(__file__), "..", "src", "constants", "projects.ts")
    if not os.path.exists(ts_file):
        ts_file = os.path.join("src", "constants", "projects.ts")

    print(f"[ingest] Loading project entries from {ts_file}...", flush=True)
    projects = load_projects_from_ts(ts_file)
    print(f"[ingest] Loaded {len(projects)} projects.", flush=True)

    ollama_active = check_ollama_status()
    if ollama_active:
        print(f"[ingest] Connected to local Ollama on {OLLAMA_BASE_URL} (model: {OLLAMA_EMBED_MODEL}).", flush=True)
    else:
        print(f"[ingest] Local Ollama port 11434 unreachable or model '{OLLAMA_EMBED_MODEL}' unavailable. Using lightweight dense fallback vectorizer.", flush=True)

    db_dir = os.path.abspath(CHROMA_DB_DIR)
    os.makedirs(db_dir, exist_ok=True)
    print(f"[ingest] Initializing Chroma DB in persistent mode at: {db_dir}", flush=True)
    
    client = chromadb.PersistentClient(path=db_dir)
    collection = client.get_or_create_collection(name=COLLECTION_NAME)

    ids = []
    documents = []
    metadatas = []
    embeddings = []

    for p in projects:
        slug = p.get("slug", p.get("id", ""))
        name = p.get("name", "")
        category = p.get("category", "")
        description = p.get("description", "")
        tech_list = p.get("tech", [])
        tech_str = ", ".join(tech_list) if isinstance(tech_list, list) else str(tech_list)

        case_study = p.get("caseStudy", {})
        overview = case_study.get("overview", "")
        problem = case_study.get("problem", "")
        solution = case_study.get("solution", "")

        arch_raw = case_study.get("architecture", [])
        arch_str = " | ".join(arch_raw) if isinstance(arch_raw, list) else str(arch_raw)

        metrics_raw = case_study.get("metrics", [])
        metrics_str = " | ".join(metrics_raw) if isinstance(metrics_raw, list) else str(metrics_raw)

        doc_text = (
            f"Project Name: {name}\n"
            f"Category: {category}\n"
            f"Description: {description}\n"
            f"Overview: {overview}\n"
            f"Problem Statement: {problem}\n"
            f"Solution: {solution}\n"
            f"Architecture Components: {arch_str}\n"
            f"Key Metrics: {metrics_str}\n"
            f"Tech Stack: {tech_str}"
        ).strip()

        embedding_vector = get_vector_embedding(doc_text, use_ollama=ollama_active)

        ids.append(slug)
        documents.append(doc_text)
        metadatas.append({
            "slug": slug,
            "name": name,
            "category": category,
            "tech": tech_str,
            "description": description,
            "overview": overview,
            "problem": problem,
            "solution": solution,
            "architecture": arch_str,
            "metrics": metrics_str,
            "githubUrl": p.get("githubUrl", ""),
            "liveUrl": p.get("liveUrl") or ""
        })
        embeddings.append(embedding_vector)

    print(f"[ingest] Upserting {len(ids)} project documents into Chroma DB collection '{COLLECTION_NAME}'...", flush=True)
    collection.upsert(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
        embeddings=embeddings
    )
    print(f"[ingest] Ingestion complete. {collection.count()} items currently in collection '{COLLECTION_NAME}'.", flush=True)


if __name__ == "__main__":
    run_ingestion()
