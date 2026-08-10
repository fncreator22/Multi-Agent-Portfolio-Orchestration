import os
import re
import json
import logging
import requests
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "llama3.2:3b")

STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "if", "because", "as", "what", "which",
    "this", "that", "these", "those", "then", "just", "so", "than", "such", "both",
    "through", "about", "against", "between", "into", "throughout", "during",
    "before", "after", "above", "below", "to", "from", "up", "upon", "down", "in",
    "out", "on", "off", "over", "under", "again", "further", "once", "here",
    "there", "when", "where", "why", "how", "all", "any", "each", "few", "more",
    "most", "other", "some", "no", "nor", "not", "only", "own", "same", "too",
    "very", "can", "will", "should", "now", "is", "are", "was", "were", "be",
    "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing",
    "for", "with", "by", "at", "it", "its", "you", "your", "he", "she", "they",
    "them", "their", "we", "us", "our"
}


def extract_key_terms(text: str) -> set:
    """Extracts lowercase unique key terms from text excluding stop words and numeric strings."""
    if not text:
        return set()
    words = re.findall(r'\b[a-zA-Z0-9_\-]{3,}\b', text.lower())
    return {w for w in words if w not in STOP_WORDS and not w.isdigit()}


def verify_grounding(response_text: str, retrieved_context: list) -> Tuple[bool, float]:
    """
    Checks overlap of key entities/terms between LLM response and retrieved context documents.
    Returns tuple of (is_grounded: bool, grounding_score: float).
    """
    if not response_text or not response_text.strip():
        return False, 0.0

    context_texts = []
    for item in retrieved_context:
        if isinstance(item, dict):
            for k, v in item.items():
                if isinstance(v, str):
                    context_texts.append(v)
        elif hasattr(item, "__dict__"):
            for k, v in item.__dict__.items():
                if isinstance(v, str):
                    context_texts.append(v)

    combined_context = " ".join(context_texts)
    context_terms = extract_key_terms(combined_context)
    response_terms = extract_key_terms(response_text)

    if not response_terms:
        return True, 1.0

    if not context_terms:
        return False, 0.0

    overlap = response_terms.intersection(context_terms)
    score = len(overlap) / len(response_terms)
    is_grounded = score >= 0.25
    return is_grounded, round(score, 4)


class LLMEscalationStage:
    """
    Stage 3 LLM Escalation & Grounding Stage.
    Connects to local Ollama LLM, handles grounding verification and fallbacks.
    """

    def __init__(self, model_name: Optional[str] = None, base_url: Optional[str] = None, timeout: float = 5.0):
        self.model_name = model_name or os.getenv("OLLAMA_LLM_MODEL", "llama3.2:3b")
        self.base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        self.timeout = timeout
        self.log_dir = os.path.join(os.path.dirname(__file__), "logs")
        os.makedirs(self.log_dir, exist_ok=True)
        self.log_file = os.path.join(self.log_dir, "stage3.log")

    def log_event(self, query: str, response_text: str, grounding_score: float, grounding_verified: bool, status: str):
        timestamp = datetime.now(timezone.utc).isoformat()
        entry = (
            f"[{timestamp}] STATUS: {status} | GROUNDED: {grounding_verified} | SCORE: {grounding_score:.4f}\n"
            f"QUERY: {query}\n"
            f"RESPONSE: {response_text}\n"
            f"{'-'*60}\n"
        )
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(entry)
        except Exception as e:
            print(f"[LLMEscalationStage] Logging error: {e}")

    def synthesize_fallback_offline(self, retrieved_context: list) -> str:
        """Fallback when LLM times out or is offline."""
        if not retrieved_context:
            return "[FALLBACK: LOCAL_LLM_UNAVAILABLE] No context documents found for query."

        summaries = []
        for doc in retrieved_context:
            if isinstance(doc, dict):
                name = doc.get("name") or doc.get("slug") or "Project"
                tech = doc.get("tech", "")
                desc = doc.get("description") or doc.get("overview") or doc.get("document") or ""
            else:
                name = getattr(doc, "name", None) or getattr(doc, "slug", "Project")
                tech = getattr(doc, "tech", "")
                desc = getattr(doc, "description", None) or getattr(doc, "overview", None) or getattr(doc, "document", "")

            line = f"• {name}"
            if tech:
                line += f" ({tech})"
            if desc:
                line += f": {desc[:150]}"
            summaries.append(line)

        return "[FALLBACK: LOCAL_LLM_UNAVAILABLE] Synthesized Context Summary:\n" + "\n".join(summaries)

    def synthesize_fallback_ungrounded(self, retrieved_context: list) -> str:
        """Fallback when LLM response fails grounding check."""
        if not retrieved_context:
            return "[FALLBACK: UNGROUNDED_LLM_RESPONSE] No context documents available."

        summaries = []
        for doc in retrieved_context:
            if isinstance(doc, dict):
                name = doc.get("name") or doc.get("slug") or "Project"
                category = doc.get("category", "")
                tech = doc.get("tech", "")
                overview = doc.get("overview") or doc.get("description") or ""
                metrics = doc.get("metrics", "")
            else:
                name = getattr(doc, "name", None) or getattr(doc, "slug", "Project")
                category = getattr(doc, "category", "")
                tech = getattr(doc, "tech", "")
                overview = getattr(doc, "overview", None) or getattr(doc, "description", "")
                metrics = getattr(doc, "metrics", "")

            parts = [f"Project: {name}"]
            if category:
                parts.append(f"Category: {category}")
            if tech:
                parts.append(f"Tech: {tech}")
            if overview:
                parts.append(f"Overview: {overview[:150]}")
            if metrics:
                parts.append(f"Metrics: {metrics}")
            summaries.append(" | ".join(parts))

        return "[FALLBACK: UNGROUNDED_LLM_RESPONSE] Structured Context Summary:\n" + "\n".join(summaries)

    def verify_grounding(self, response_text: str, retrieved_context: list) -> Tuple[bool, float]:
        return verify_grounding(response_text, retrieved_context)

    def escalate_and_generate(self, query: str, retrieved_context: list) -> dict:
        """
        Builds strict prompt, calls Ollama LLM with 5s timeout, checks grounding, and logs.
        """
        system_prompt = "You are an AI Assistant for the Agentic Portfolio. Answer the user prompt strictly using the provided context."

        context_blocks = []
        for idx, doc in enumerate(retrieved_context, 1):
            if isinstance(doc, dict):
                name = doc.get("name", "")
                tech = doc.get("tech", "")
                desc = doc.get("description", "")
                doc_text = doc.get("document", "")
            else:
                name = getattr(doc, "name", "")
                tech = getattr(doc, "tech", "")
                desc = getattr(doc, "description", "")
                doc_text = getattr(doc, "document", "")

            block = f"Document {idx} - Name: {name}\nTech: {tech}\nDescription: {desc}\nContent: {doc_text}"
            context_blocks.append(block)

        context_str = "\n\n".join(context_blocks)
        prompt_content = f"{system_prompt}\n\nRetrieved Context:\n{context_str}\n\nUser Query: {query}"

        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model_name,
            "prompt": prompt_content,
            "stream": False
        }

        response_text = ""
        ollama_success = False

        try:
            res = requests.post(url, json=payload, timeout=self.timeout)
            if res.status_code == 200:
                data = res.json()
                if "response" in data and data["response"].strip():
                    response_text = data["response"].strip()
                    ollama_success = True
        except (requests.RequestException, Exception) as e:
            print(f"[LLMEscalationStage] Ollama request failed or timed out: {e}")
            ollama_success = False

        if not ollama_success:
            fallback_text = self.synthesize_fallback_offline(retrieved_context)
            self.log_event(query, fallback_text, 0.0, False, "LLM_OFFLINE_FALLBACK")
            return {
                "llm_response": fallback_text,
                "grounding_verified": False,
                "grounding_score": 0.0,
                "status": "LLM_OFFLINE_FALLBACK"
            }

        # Verify Grounding
        is_grounded, score = verify_grounding(response_text, retrieved_context)

        if not is_grounded:
            fallback_text = self.synthesize_fallback_ungrounded(retrieved_context)
            self.log_event(query, f"Original: {response_text} -> Fallback: {fallback_text}", score, False, "UNGROUNDED_FALLBACK")
            return {
                "llm_response": fallback_text,
                "grounding_verified": False,
                "grounding_score": score,
                "status": "UNGROUNDED_FALLBACK"
            }

        self.log_event(query, response_text, score, True, "SUCCESS")
        return {
            "llm_response": response_text,
            "grounding_verified": True,
            "grounding_score": score,
            "status": "SUCCESS"
        }


def escalate_and_generate(query: str, retrieved_context: list) -> dict:
    """Module-level helper function for LLM escalation & generation."""
    stage = LLMEscalationStage()
    return stage.escalate_and_generate(query, retrieved_context)
