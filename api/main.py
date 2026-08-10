import os
import random
import re
import time
import uuid
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
from collections import defaultdict
from typing import Optional, Any, Union

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Response, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from starlette.middleware.base import BaseHTTPMiddleware

import email_service
from database import (
    init_db, create_lead, get_leads, create_booking, get_bookings,
    save_otp, verify_otp, verify_lead_otp, is_lead_verified,
    check_otp_rate_limit, get_kb_projects, save_kb_project,
    log_conversation_turn, link_session_to_lead, get_conversations_by_session,
    get_conversations_by_lead, get_db_connection
)

# Load environment variables
load_dotenv()

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def strip_html_tags(text: str) -> str:
    if not text:
        return ""
    clean = re.sub(r'<[^>]*>', '', text)
    return clean.strip()

def validate_email_format(email: str) -> str:
    if not email or not isinstance(email, str):
        raise HTTPException(status_code=400, detail="Invalid email address format.")
    clean_email = email.strip()
    if not EMAIL_REGEX.match(clean_email):
        raise HTTPException(status_code=400, detail="Invalid email address format.")
    return clean_email.lower()

_rate_limit_middleware_instance = None

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 50, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        global _rate_limit_middleware_instance
        _rate_limit_middleware_instance = self

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        
        # Keep only timestamps within window
        self.requests[client_ip] = [ts for ts in self.requests[client_ip] if now - ts < self.window_seconds]
        
        if len(self.requests[client_ip]) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Maximum requests per minute allowed."}
            )
        
        self.requests[client_ip].append(now)
        response = await call_next(request)
        return response

def reset_rate_limit_middleware():
    if _rate_limit_middleware_instance:
        _rate_limit_middleware_instance.requests.clear()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="Broker API Service",
    description="Backend API service for contact leads and calendar booking",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:8000", "http://localhost:8001", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware
app.add_middleware(RateLimitMiddleware, max_requests=50, window_seconds=60)

class ContactRequest(BaseModel):
    email: str
    name: str
    message: str
    project_slug: Optional[str] = ""

class BookingRequest(BaseModel):
    email: str
    slot_time: str

class OTPRequestPayload(BaseModel):
    email: str

class OTPVerifyPayload(BaseModel):
    email: str
    otp_code: str
    session_id: Optional[str] = None

class LogTurnRequest(BaseModel):
    session_id: str
    visitor_message: str
    agent_stage: str
    agent_response: str
    email: Optional[str] = None

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "broker-api",
        "stage": "PHASE 3 BROKER API READY"
    }

@app.post("/api/contact")
async def submit_contact(req: ContactRequest, background_tasks: BackgroundTasks):
    email = validate_email_format(req.email)
    name = strip_html_tags(req.name)
    message = strip_html_tags(req.message)
    project_slug = strip_html_tags(req.project_slug or "")

    if not name:
        raise HTTPException(status_code=400, detail="Name is required.")
    if not message:
        raise HTTPException(status_code=400, detail="Message is required.")

    lead = create_lead(
        email=email,
        name=name,
        message=message,
        project_slug=project_slug
    )

    background_tasks.add_task(email_service.send_lead_notification, lead)

    return {
        "status": "success",
        "message": "Lead received successfully",
        "lead": lead
    }

@app.get("/api/booking/slots")
async def get_booking_slots():
    return {
        "status": "success",
        "timezone": "UTC",
        "slots": [
            {"id": "slot-1", "slot_time": "2026-08-11T10:00:00Z", "available": True},
            {"id": "slot-2", "slot_time": "2026-08-11T14:00:00Z", "available": True},
            {"id": "slot-3", "slot_time": "2026-08-12T11:00:00Z", "available": True},
            {"id": "slot-4", "slot_time": "2026-08-12T15:00:00Z", "available": True},
            {"id": "slot-5", "slot_time": "2026-08-13T10:00:00Z", "available": True}
        ]
    }

@app.post("/api/booking")
async def create_booking_entry(req: BookingRequest, background_tasks: BackgroundTasks):
    email = validate_email_format(req.email)
    slot_time = strip_html_tags(req.slot_time)

    if not slot_time:
        raise HTTPException(status_code=400, detail="Slot time is required.")

    if not is_lead_verified(email):
        raise HTTPException(
            status_code=403,
            detail="Lead email must be OTP-verified before booking consultation."
        )

    meeting_link = f"https://meet.jit.si/portfolio-booking-{uuid.uuid4().hex[:8]}"

    booking = create_booking(
        email=email,
        slot_time=slot_time,
        meeting_link=meeting_link
    )

    background_tasks.add_task(email_service.send_booking_notification, booking)

    return {
        "status": "success",
        "message": "Booking created successfully",
        "booking": booking
    }

@app.post("/api/conversations/log")
async def log_conversation_turn_endpoint(req: LogTurnRequest):
    session_id = req.session_id.strip() if req.session_id else ""
    visitor_message = strip_html_tags(req.visitor_message or "")
    agent_stage = strip_html_tags(req.agent_stage or "")
    agent_response = strip_html_tags(req.agent_response or "")
    email = req.email.strip().lower() if req.email else None

    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required.")
    if not visitor_message:
        raise HTTPException(status_code=400, detail="visitor_message is required.")

    turn = log_conversation_turn(
        session_id=session_id,
        visitor_message=visitor_message,
        agent_stage=agent_stage,
        agent_response=agent_response,
        email=email
    )

    return {
        "status": "success",
        "message": "Conversation turn logged successfully",
        "turn": turn
    }

@app.get("/api/leads")
async def list_leads():
    leads = get_leads()
    for lead in leads:
        lead["conversations"] = get_conversations_by_lead(lead["id"])
    return {
        "status": "success",
        "leads": leads
    }

@app.get("/api/bookings")
async def list_bookings():
    bookings = get_bookings()
    return {
        "status": "success",
        "bookings": bookings
    }

# Public Lead OTP Flow Endpoints
@app.post("/api/public/request-lead-otp")
async def request_lead_otp(req: OTPRequestPayload, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    email = validate_email_format(req.email)

    if check_otp_rate_limit(email, client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Maximum 5 OTP requests per 10 minutes allowed."
        )

    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    save_otp(email, otp_code, expires_at)
    email_service.send_otp_email(email, otp_code)
    return {
        "status": "success",
        "message": "OTP code generated and sent to email",
        "otp_code": otp_code
    }

@app.post("/api/public/verify-lead-otp")
async def verify_lead_otp_endpoint(req: OTPVerifyPayload):
    email = validate_email_format(req.email)
    otp_code = req.otp_code.strip()
    if not otp_code:
        raise HTTPException(status_code=400, detail="OTP code is required.")
    
    is_valid = verify_lead_otp(email, otp_code)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code.")
    
    # Retrieve verified lead record to get its ID
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM leads WHERE LOWER(email) = LOWER(?) ORDER BY id DESC LIMIT 1", (email,))
    row = cursor.fetchone()
    lead_id = row["id"] if row else None
    conn.close()

    if lead_id:
        link_session_to_lead(req.session_id or "", lead_id, email)

    return {
        "status": "success",
        "message": "Lead email verified successfully",
        "email": email,
        "lead_id": lead_id
    }

# Admin OTP Auth Endpoints
@app.post("/api/admin/auth/request-otp")
async def request_otp(req: OTPRequestPayload, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    email = validate_email_format(req.email)

    if check_otp_rate_limit(email, client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Maximum 5 OTP requests per 10 minutes allowed."
        )

    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    save_otp(email, otp_code, expires_at)
    email_service.send_otp_email(email, otp_code)
    return {
        "status": "success",
        "message": "OTP code generated and sent to email",
        "otp_code": otp_code
    }

@app.post("/api/admin/auth/verify-otp")
async def verify_otp_endpoint(req: OTPVerifyPayload):
    email = validate_email_format(req.email)
    otp_code = req.otp_code.strip()
    if not otp_code:
        raise HTTPException(status_code=400, detail="OTP code is required.")
    
    is_valid = verify_otp(email, otp_code)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code.")
    
    admin_token = f"admin-token-{uuid.uuid4().hex}"
    return {
        "status": "success",
        "message": "OTP verified successfully",
        "admin_token": admin_token,
        "email": email
    }

# Admin KB Management Endpoints
@app.get("/api/admin/kb")
async def get_admin_kb():
    projects = get_kb_projects()
    return {
        "status": "success",
        "projects": projects
    }

@app.post("/api/admin/kb/update")
async def update_admin_kb(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")
    
    if isinstance(body, list):
        for item in body:
            if isinstance(item, dict):
                save_kb_project(item)
    elif isinstance(body, dict):
        if "projects" in body and isinstance(body["projects"], list):
            for item in body["projects"]:
                if isinstance(item, dict):
                    save_kb_project(item)
        elif "project" in body and isinstance(body["project"], dict):
            save_kb_project(body["project"])
        else:
            save_kb_project(body)
    else:
        raise HTTPException(status_code=400, detail="Unsupported payload format.")
        
    updated_projects = get_kb_projects()
    return {
        "status": "success",
        "message": "Knowledge base updated successfully",
        "projects": updated_projects
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

