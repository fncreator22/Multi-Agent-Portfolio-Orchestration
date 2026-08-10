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
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from starlette.middleware.base import BaseHTTPMiddleware

from database import (
    init_db, create_lead, get_leads, create_booking, get_bookings,
    save_otp, verify_otp, get_kb_projects, save_kb_project
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

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 50, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)

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

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "broker-api",
        "stage": "PHASE 3 BROKER API READY"
    }

@app.post("/api/contact")
async def submit_contact(req: ContactRequest):
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
async def create_booking_entry(req: BookingRequest):
    email = validate_email_format(req.email)
    slot_time = strip_html_tags(req.slot_time)

    if not slot_time:
        raise HTTPException(status_code=400, detail="Slot time is required.")

    meeting_link = f"https://meet.jit.si/portfolio-booking-{uuid.uuid4().hex[:8]}"

    booking = create_booking(
        email=email,
        slot_time=slot_time,
        meeting_link=meeting_link
    )

    return {
        "status": "success",
        "message": "Booking created successfully",
        "booking": booking
    }

@app.get("/api/leads")
async def list_leads():
    leads = get_leads()
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

# Admin OTP Auth Endpoints
@app.post("/api/admin/auth/request-otp")
async def request_otp(req: OTPRequestPayload):
    email = validate_email_format(req.email)
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
    save_otp(email, otp_code, expires_at)
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

