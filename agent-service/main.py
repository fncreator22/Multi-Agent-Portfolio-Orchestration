import os
import re
import time
from collections import defaultdict
from typing import Optional, List
from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import chromadb
from ingest import get_vector_embedding, check_ollama_status, COLLECTION_NAME, CHROMA_DB_DIR
from classifier import ConfidenceGateClassifier
from llm_stage import LLMEscalationStage

# Load environment variables
load_dotenv()

PORT = int(os.getenv("PORT", 8000))

app = FastAPI(
    title="Agentic Portfolio Backend API",
    description="FastAPI service for vector retrieval and portfolio agent capabilities",
    version="1.0.0"
)

# Configure CORS Middleware
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "*"  # Allow origins for local development flexibility
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory IP rate limiter store: client_ip -> list of request timestamps
ip_request_timestamps = defaultdict(list)
RATE_LIMIT_WINDOW = 60.0  # seconds
MAX_REQUESTS_PER_MINUTE = 30


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    path = request.url.path
    if path.startswith("/api/query"):
        client_ip = request.client.host if request.client else "127.0.0.1"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        now = time.time()
        timestamps = ip_request_timestamps[client_ip]
        # Keep only timestamps within rate limit window
        ip_request_timestamps[client_ip] = [ts for ts in timestamps if now - ts < RATE_LIMIT_WINDOW]

        if len(ip_request_timestamps[client_ip]) >= MAX_REQUESTS_PER_MINUTE:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Maximum 30 requests per minute allowed."}
            )

        ip_request_timestamps[client_ip].append(now)

    response = await call_next(request)
    return response


def sanitize_query(query_str: Optional[str]) -> str:
    if not query_str:
        return ""
    # Strip HTML tags
    clean = re.sub(r'<[^>]*>', '', query_str)
    # Truncate to max 500 characters and strip whitespace
    clean = clean[:500].strip()
    return clean


# Global Chroma Client & Collection reference
db_dir = os.path.abspath(CHROMA_DB_DIR)
chroma_client = chromadb.PersistentClient(path=db_dir)

# Initialize Confidence Gate Classifier (Stage 2)
classifier = ConfidenceGateClassifier()

# Initialize LLM Escalation Stage (Stage 3)
llm_stage = LLMEscalationStage()


class RetrieveRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3


class RetrieveResultItem(BaseModel):
    id: str
    slug: str
    name: str
    category: str
    tech: str
    description: str
    overview: str
    problem: str
    solution: str
    architecture: str
    metrics: str
    githubUrl: str
    liveUrl: Optional[str] = None
    distance: float
    document: str


class RetrieveResponse(BaseModel):
    query: str
    top_k: int
    results: List[RetrieveResultItem]


class AgentQueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3


class AgentQueryResponse(BaseModel):
    query: str
    retrieved_docs: List[RetrieveResultItem]
    gate_decision: str
    confidence_score: float
    reason: str
    llm_response: Optional[str] = None
    grounding_verified: Optional[bool] = None
    active_stage: str = "STAGE 3 LLM ESCALATION & GROUNDING READY"


class SLMHealthResponse(BaseModel):
    status: str
    base_url: str
    model: str
    latency_ms: float
    details: str


@app.get("/health")
def health():
    """Health check endpoint returning service status, active pipeline stage, and SLM health."""
    slm_status = llm_stage.check_slm_health()
    return {
        "status": "healthy",
        "stage": "STAGE 3 LLM ESCALATION & GROUNDING READY",
        "slm": slm_status
    }


@app.get("/api/slm/health", response_model=SLMHealthResponse)
def slm_health():
    """Dedicated SLM health check endpoint for Phase 6 admin monitoring console."""
    return llm_stage.check_slm_health()




@app.get("/api/retrieve", response_model=RetrieveResponse)
def retrieve_get(
    q: Optional[str] = Query(None, description="Search query string"),
    query: Optional[str] = Query(None, description="Alternative search query parameter"),
    top_k: int = Query(3, ge=1, le=20, description="Number of top matches to return")
):
    raw_query = q or query
    if not raw_query or not raw_query.strip():
        raise HTTPException(status_code=400, detail="Query parameter 'q' or 'query' is required.")
    
    sanitized = sanitize_query(raw_query)
    if not sanitized:
        raise HTTPException(status_code=400, detail="Query cannot be empty after sanitization.")

    return perform_retrieval(sanitized, top_k)


@app.post("/api/retrieve", response_model=RetrieveResponse)
def retrieve_post(req: RetrieveRequest):
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    
    sanitized = sanitize_query(req.query)
    if not sanitized:
        raise HTTPException(status_code=400, detail="Query cannot be empty after sanitization.")

    return perform_retrieval(sanitized, req.top_k or 3)


def perform_retrieval(query_str: str, top_k: int) -> RetrieveResponse:
    try:
        collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Collection '{COLLECTION_NAME}' access failed: {str(e)}")

    if collection.count() == 0:
        return RetrieveResponse(query=query_str, top_k=top_k, results=[])

    ollama_active = check_ollama_status()
    query_vector = get_vector_embedding(query_str, use_ollama=ollama_active)


    chroma_res = collection.query(
        query_embeddings=[query_vector],
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas", "distances"]
    )

    items = []
    if chroma_res and chroma_res.get("ids") and len(chroma_res["ids"]) > 0:
        doc_ids = chroma_res["ids"][0]
        metadatas = chroma_res["metadatas"][0] if chroma_res.get("metadatas") else []
        documents = chroma_res["documents"][0] if chroma_res.get("documents") else []
        distances = chroma_res["distances"][0] if chroma_res.get("distances") else []

        for idx, doc_id in enumerate(doc_ids):
            meta = metadatas[idx] if idx < len(metadatas) else {}
            doc_text = documents[idx] if idx < len(documents) else ""
            dist = float(distances[idx]) if idx < len(distances) else 0.0

            items.append(RetrieveResultItem(
                id=doc_id,
                slug=meta.get("slug", doc_id),
                name=meta.get("name", ""),
                category=meta.get("category", ""),
                tech=meta.get("tech", ""),
                description=meta.get("description", ""),
                overview=meta.get("overview", ""),
                problem=meta.get("problem", ""),
                solution=meta.get("solution", ""),
                architecture=meta.get("architecture", ""),
                metrics=meta.get("metrics", ""),
                githubUrl=meta.get("githubUrl", ""),
                liveUrl=meta.get("liveUrl") or None,
                distance=dist,
                document=doc_text
            ))

    return RetrieveResponse(
        query=query_str,
        top_k=top_k,
        results=items
    )


@app.get("/api/query", response_model=AgentQueryResponse)
def query_get(
    q: Optional[str] = Query(None, description="Search query string"),
    query: Optional[str] = Query(None, description="Alternative search query parameter"),
    top_k: int = Query(3, ge=1, le=20, description="Number of top matches to return")
):
    raw_query = q or query
    if not raw_query or not raw_query.strip():
        raise HTTPException(status_code=400, detail="Query parameter 'q' or 'query' is required.")
    
    sanitized = sanitize_query(raw_query)
    if not sanitized:
        raise HTTPException(status_code=400, detail="Query cannot be empty after sanitization.")

    return perform_agent_query(sanitized, top_k)


@app.post("/api/query", response_model=AgentQueryResponse)
def query_post(req: AgentQueryRequest):
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    
    sanitized = sanitize_query(req.query)
    if not sanitized:
        raise HTTPException(status_code=400, detail="Query cannot be empty after sanitization.")

    return perform_agent_query(sanitized, req.top_k or 3)



def perform_agent_query(query_str: str, top_k: int = 3) -> AgentQueryResponse:
    # Stage 1: Vector Retrieval
    retrieval_res = perform_retrieval(query_str, top_k)
    docs = retrieval_res.results

    # Calculate top vector retrieval similarity score
    if docs:
        top_distance = docs[0].distance
        retrieval_score = max(0.0, 1.0 - top_distance)
    else:
        retrieval_score = 0.0

    # Stage 2: Confidence Gate Classification
    gate_res = classifier.predict(query_str, retrieval_score)

    llm_response = None
    grounding_verified = None

    # Stage 3: LLM Escalation if gated to ESCALATE_LLM
    if gate_res["decision"] == "ESCALATE_LLM":
        doc_dicts = [d.model_dump() if hasattr(d, "model_dump") else d.dict() for d in docs]
        llm_res = llm_stage.escalate_and_generate(query_str, doc_dicts)
        llm_response = llm_res.get("llm_response")
        grounding_verified = llm_res.get("grounding_verified")

    return AgentQueryResponse(
        query=query_str,
        retrieved_docs=docs,
        gate_decision=gate_res["decision"],
        confidence_score=gate_res["confidence"],
        reason=gate_res["reason"],
        llm_response=llm_response,
        grounding_verified=grounding_verified,
        active_stage="STAGE 3 LLM ESCALATION & GROUNDING READY"
    )



if __name__ == "__main__":
    import uvicorn
    print(f"Starting Agent Service FastAPI app on port {PORT}...")
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
