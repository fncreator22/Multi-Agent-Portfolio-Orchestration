import json
import os
import re
import sqlite3
import time
import uuid
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from typing import Optional

DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "leads.db")

_otp_rate_limit_store = defaultdict(list)

def check_otp_rate_limit(email: str, ip: str) -> bool:
    """
    Tracks OTP requests per email and per IP.
    Returns True if request exceeds rate limit (max 5 requests per 10 minutes / 600s),
    False otherwise.
    """
    now = time.time()
    window_seconds = 600  # 10 minutes
    max_requests = 5

    clean_email = email.strip().lower() if email else ""
    clean_ip = ip.strip() if ip else "127.0.0.1"

    # Prune old timestamps
    _otp_rate_limit_store[clean_email] = [ts for ts in _otp_rate_limit_store[clean_email] if now - ts < window_seconds]
    _otp_rate_limit_store[clean_ip] = [ts for ts in _otp_rate_limit_store[clean_ip] if now - ts < window_seconds]

    email_count = len(_otp_rate_limit_store[clean_email])
    ip_count = len(_otp_rate_limit_store[clean_ip])

    if email_count >= max_requests or ip_count >= max_requests:
        return True

    _otp_rate_limit_store[clean_email].append(now)
    _otp_rate_limit_store[clean_ip].append(now)
    return False

def reset_otp_rate_limit():
    _otp_rate_limit_store.clear()


DEFAULT_PROJECTS = [
    {
        "id": "lato-validation",
        "slug": "lato-validation",
        "name": "LATO Validation Framework",
        "category": "AI / Agentic Infrastructure",
        "description": "Latency, Accuracy, Throughput, and Observability framework for evaluating LLM agent pipelines in production.",
        "tech": ["TypeScript", "Python", "FastAPI", "React", "OpenTelemetry"],
        "githubUrl": "https://github.com/agentic-portfolio/lato-validation",
        "liveUrl": None,
        "caseStudy": {
            "overview": "An automated validation and benchmarking suite designed to measure real-time LLM inference latency, accuracy metrics, throughput limits, and agent token usage.",
            "problem": "Agentic AI applications lacked structured, reproducible benchmarking for latency, tool-invocation accuracy, and multi-turn reasoning degradation under load.",
            "solution": "Built an end-to-end telemetry collector and evaluation harness that continuously scores agent responses against synthetic and golden datasets with sub-millisecond precision.",
            "architecture": [
                "OpenTelemetry instrumentation layer for tool dispatch tracking",
                "Asynchronous Python worker queue for batch evaluation runs",
                "React dashboard rendering live latency distributions and accuracy drift curves"
            ],
            "metrics": [
                "99.4% evaluation pipeline uptime",
                "Reduced regression testing time from hours to 3.5 minutes",
                "Monitored over 500k daily tool calls"
            ]
        }
    },
    {
        "id": "sentinel-mcp",
        "slug": "sentinel-mcp",
        "name": "Sentinel Model Context Protocol",
        "category": "Agentic AI / Protocol Engineering",
        "description": "Secure Model Context Protocol server enabling agent sandboxing, fine-grained access control, and dynamic tool discovery.",
        "tech": ["TypeScript", "Node.js", "MCP Standard", "Docker", "JSON-RPC"],
        "githubUrl": "https://github.com/agentic-portfolio/sentinel-mcp",
        "liveUrl": None,
        "caseStudy": {
            "overview": "A security-first MCP server implementation designed to isolate AI agents while granting contextual access to internal APIs and databases.",
            "problem": "Connecting autonomous AI agents directly to enterprise APIs posed severe data exfiltration and prompt injection risks without strict boundary controls.",
            "solution": "Engineered a proxy-based Model Context Protocol gateway with granular RBAC, payload sanitization, and automated execution sandboxes.",
            "architecture": [
                "JSON-RPC 2.0 transport channel with TLS termination",
                "Dynamic capabilities negotiator and tool schema validator",
                "Isolated Docker execution containers for dynamic code evaluation"
            ],
            "metrics": [
                "Zero unauthorized boundary escapes across 100k test payloads",
                "< 5ms added gateway latency",
                "Supported 40+ concurrent agent tool registries"
            ]
        }
    },
    {
        "id": "sign-language-detection-yolov8",
        "slug": "sign-language-detection-yolov8",
        "name": "Sign Language Detection YOLOv8",
        "category": "Computer Vision Suite",
        "description": "Real-time sign language gesture recognition system leveraging custom-trained YOLOv8 models.",
        "tech": ["Python", "YOLOv8", "OpenCV", "PyTorch", "ONNX Runtime"],
        "githubUrl": "https://github.com/agentic-portfolio/sign-language-detection-yolov8",
        "liveUrl": None,
        "caseStudy": {
            "overview": "Computer vision pipeline capable of detecting and translating sign language alphabet and phrase gestures in real-time video streams.",
            "problem": "High latency and occlusion sensitivity in traditional pose-estimation models prevented smooth real-time sign language translation.",
            "solution": "Trained an optimized YOLOv8 nano model on a multi-angle hand gesture dataset, deployed with TensorRT and ONNX Runtime for web camera streaming.",
            "architecture": [
                "Bounding-box gesture detection fine-tuned on custom annotated dataset",
                "Spatial keypoint tracking module for dynamic hand movement",
                "ONNX quantization pipeline for low-latency browser & edge execution"
            ],
            "metrics": [
                "97.8% mAP@50 gesture classification accuracy",
                "60 FPS processing speed on standard edge GPU",
                "35ms end-to-end inference latency"
            ]
        }
    },
    {
        "id": "object-detection-algorithm-yolov8",
        "slug": "object-detection-algorithm-yolov8",
        "name": "High-Speed Object Detection YOLOv8",
        "category": "Computer Vision Suite",
        "description": "Multi-class object detection and tracking algorithm optimized for automated video analytics.",
        "tech": ["Python", "YOLOv8", "DeepSORT", "CUDA", "FastAPI"],
        "githubUrl": "https://github.com/agentic-portfolio/object-detection-algorithm-yolov8",
        "liveUrl": None,
        "caseStudy": {
            "overview": "Scalable object detection engine combining custom YOLOv8 object identification with DeepSORT multi-target tracking.",
            "problem": "Video feeds from industrial cameras suffered from frequent object swapping and tracking failures during temporal occlusion.",
            "solution": "Integrated feature vector embeddings with Kalman filter state estimation to sustain object identity across frame drops.",
            "architecture": [
                "YOLOv8 backbone optimized for spatial feature extraction",
                "Re-identification feature extraction head connected to DeepSORT tracker",
                "REST and WebSocket API for real-time telemetry streaming"
            ],
            "metrics": [
                "94.2% MOTA (Multiple Object Tracking Accuracy)",
                "Processed 120 FPS batch video feeds",
                "< 1% ID switch rate across complex scenes"
            ]
        }
    },
    {
        "id": "thief-detection-yolov11",
        "slug": "thief-detection-yolov11",
        "name": "Automated Thief & Intrusion Detection YOLOv11",
        "category": "Computer Vision Suite",
        "description": "Next-generation surveillance anomaly and perimeter intrusion detection model built with YOLOv11.",
        "tech": ["Python", "YOLOv11", "PyTorch", "OpenCV", "WebSockets"],
        "githubUrl": "https://github.com/agentic-portfolio/thief-detection-yolov11",
        "liveUrl": None,
        "caseStudy": {
            "overview": "An intelligent security camera framework that identifies suspicious behavioral patterns and unauthorized perimeter breaches.",
            "problem": "Traditional motion sensors generated excessive false alarms due to weather, animals, and lighting variations.",
            "solution": "Designed a vision pipeline utilizing YOLOv11 object detection alongside temporal action bounding boxes to verify human intrusion vectors.",
            "architecture": [
                "YOLOv11 real-time detection model with attention mechanisms",
                "Spatial perimeter polygon collision engine",
                "Instant notification dispatch worker via WebSockets"
            ],
            "metrics": [
                "98.9% true intrusion detection rate",
                "92% reduction in false positive security alarms",
                "Sub-second incident alerting"
            ]
        }
    },
    {
        "id": "ecg-feature-extraction",
        "slug": "ecg-feature-extraction",
        "name": "ECG Signal Feature Extraction & Classification",
        "category": "Computer Vision & Signal Processing",
        "description": "Biomedical signal processing tool for extracting PQRST waveforms and classifying cardiac arrhythmia.",
        "tech": ["Python", "SciPy", "NumPy", "Scikit-Learn", "Matplotlib"],
        "githubUrl": "https://github.com/agentic-portfolio/ecg-feature-extraction",
        "liveUrl": None,
        "caseStudy": {
            "overview": "Automated electrocardiogram signal processing pipeline designed to isolate heartbeat peaks and detect anomalous cardiac rhythms.",
            "problem": "Noise artifact corruption in wearable ECG sensor outputs degraded automatic R-peak detection accuracy.",
            "solution": "Implemented wavelet-transform filtering followed by dynamic adaptive thresholding to detect PQRST peak coordinates with high precision.",
            "architecture": [
                "Discrete Wavelet Transform (DWT) noise reduction filter",
                "Pan-Tompkins inspired R-peak detection algorithm",
                "Random Forest classifier for arrhythmia pattern categorization"
            ],
            "metrics": [
                "99.1% R-peak detection accuracy on MIT-BIH Arrhythmia Database",
                "Real-time processing capability for 12-lead signal inputs",
                "Processed 1,000 samples/sec continuous data stream"
            ]
        }
    },
    {
        "id": "career-os-suite",
        "slug": "career-os-suite",
        "name": "Career OS Platform",
        "category": "Full Stack / Productivity",
        "description": "AI-assisted career management platform for resume optimization, application tracking, and interview preparation.",
        "tech": ["React", "TypeScript", "Node.js", "Tailwind CSS", "PostgreSQL"],
        "githubUrl": "https://github.com/agentic-portfolio/career-os-suite",
        "liveUrl": "https://career-os-suite.demo.app",
        "caseStudy": {
            "overview": "A comprehensive developer workspace integrating job application pipelines, resume versioning, and AI interview feedback.",
            "problem": "Job seekers struggle with fragmented job tracking spreadsheet workflows and lack targeted ATS keyword alignment feedback.",
            "solution": "Engineered a unified dashboard with Kanban tracking, ATS parsing, and automated resume tailor suggestions.",
            "architecture": [
                "React client with stateful drag-and-drop job application boards",
                "Node.js REST backend managing relational PostgreSQL schemas",
                "ATS keyword extraction worker powered by NLP algorithms"
            ],
            "metrics": [
                "3.5x faster application tracking workflow",
                "Over 10,000 resume parsing iterations executed",
                "4.8/5 user satisfaction score"
            ]
        }
    },
    {
        "id": "examly-enterprise",
        "slug": "examly-enterprise",
        "name": "Examly Enterprise Assessment System",
        "category": "Full Stack / EdTech",
        "description": "High-throughput online assessment engine with live proctoring, code execution sandboxes, and analytics.",
        "tech": ["React", "TypeScript", "Node.js", "Docker", "MongoDB"],
        "githubUrl": "https://github.com/agentic-portfolio/examly-enterprise",
        "liveUrl": "https://examly-enterprise.demo.app",
        "caseStudy": {
            "overview": "Enterprise-grade online examination platform capable of hosting thousands of concurrent candidates with real-time code evaluation.",
            "problem": "Legacy exam engines failed during concurrent submission spikes and lacked automated code evaluation sandboxing.",
            "solution": "Architected a microservices engine with containerized code compilation, automated cheating detection algorithms, and instant grading.",
            "architecture": [
                "Distributed React SPA with offline auto-save capabilities",
                "Isolated Docker worker pools for multi-language code compilation",
                "Redis session queue for real-time telemetry and proctoring logs"
            ],
            "metrics": [
                "Handled 25,000+ concurrent exam sessions",
                "< 1.2s average code submission test runner speed",
                "Zero downtime during peak assessment windows"
            ]
        }
    },
    {
        "id": "nexware-erp",
        "slug": "nexware-erp",
        "name": "Nexware Enterprise Resource Planning",
        "category": "Enterprise Software",
        "description": "Cloud-native ERP platform managing inventory, multi-entity accounting, supply chain logistics, and HR workflows.",
        "tech": ["React", "TypeScript", "Express", "PostgreSQL", "Prisma"],
        "githubUrl": "https://github.com/agentic-portfolio/nexware-erp",
        "liveUrl": "https://nexware-erp.demo.app",
        "caseStudy": {
            "overview": "Modular ERP system designed for mid-market manufacturing companies requiring synchronized inventory and multi-currency ledgers.",
            "problem": "Siloed legacy systems created accounting mismatches and delayed supply chain reorder notifications.",
            "solution": "Created a modular backend architecture with reactive ledger recalculations and real-time inventory threshold alerts.",
            "architecture": [
                "React frontend with role-based component permissions",
                "Express backend API built with Prisma ORM and transactional query isolation",
                "Automated background job scheduler for financial reconciliation"
            ],
            "metrics": [
                "Reduced inventory audit discrepancies by 85%",
                "Accelerated monthly financial closing by 4 days",
                "Served 50+ enterprise entity branches"
            ]
        }
    },
    {
        "id": "split-money",
        "slug": "split-money",
        "name": "Split Money Financial Manager",
        "category": "Web & Mobile App",
        "description": "Smart expense sharing and debt simplification app featuring multi-currency conversion and group settlement algorithms.",
        "tech": ["React", "TypeScript", "Tailwind CSS", "Firebase", "Node.js"],
        "githubUrl": "https://github.com/agentic-portfolio/split-money",
        "liveUrl": "https://split-money.demo.app",
        "caseStudy": {
            "overview": "Intelligent group expense calculator that minimizes total payment transactions between members using graph debt simplification.",
            "problem": "Group trips and shared household expenses led to confusing webs of inter-member debts and transaction friction.",
            "solution": "Implemented an optimal debt simplification graph algorithm that reduces complex expense chains into minimal pairwise transfers.",
            "architecture": [
                "React progressive web app optimized for mobile viewports",
                "Graph algorithm core minimizing N-person debt balances",
                "Firebase real-time database synchronization for instant balance updates"
            ],
            "metrics": [
                "Reduced overall transaction count by up to 60% per group",
                "Processed over $500,000 in shared group expenses",
                "< 100ms calculation response time"
            ]
        }
    },
    {
        "id": "car-rental-booking",
        "slug": "car-rental-booking",
        "name": "Car Rental & Fleet Booking Engine",
        "category": "Full Stack / E-Commerce",
        "description": "Full-stack vehicle reservation portal with real-time fleet availability, dynamic pricing, and Stripe integration.",
        "tech": ["React", "TypeScript", "Tailwind CSS", "Node.js", "Stripe API"],
        "githubUrl": "https://github.com/agentic-portfolio/car-rental-booking",
        "liveUrl": "https://car-rental-booking.demo.app",
        "caseStudy": {
            "overview": "End-to-end car rental platform enabling users to search, reserve, and pay for fleet vehicles based on real-time availability filters.",
            "problem": "Double-booking issues and slow checkout flows caused vehicle reservation drop-offs.",
            "solution": "Built an optimistic locking reservation queue coupled with Stripe payment webhooks for instant reservation confirmation.",
            "architecture": [
                "React frontend with interactive date-range availability pickers",
                "Node.js backend with atomic booking locks and calendar availability engines",
                "Stripe payment gateway integration with webhooks for event verification"
            ],
            "metrics": [
                "100% elimination of double-booking race conditions",
                "30% increase in checkout conversion rate",
                "Sub-second search filter performance across 5,000+ vehicles"
            ]
        }
    },
    {
        "id": "lawyer-portfolio-website",
        "slug": "lawyer-portfolio-website",
        "name": "Legal Practice & Consultation Portal",
        "category": "Web Design & Development",
        "description": "Professional web application for legal firms featuring client consultation scheduling and case highlights.",
        "tech": ["React", "TypeScript", "Tailwind CSS", "Framer Motion"],
        "githubUrl": "https://github.com/agentic-portfolio/lawyer-portfolio-website",
        "liveUrl": "https://lawyer-portfolio.demo.app",
        "caseStudy": {
            "overview": "High-converting digital presence for legal professionals designed to streamline prospective client intake and case consultations.",
            "problem": "Legacy legal practice websites lacked mobile responsiveness, secure client intake forms, and automated calendar scheduling.",
            "solution": "Designed a modern UI with Framer Motion animations, accessible typography, and automated client intake routing.",
            "architecture": [
                "Responsive React SPA crafted with Tailwind design tokens",
                "Framer Motion layout animations and smooth scroll interactions",
                "Serverless client intake API with automated email notifications"
            ],
            "metrics": [
                "98/100 Google Lighthouse performance score",
                "45% increase in online consultation inquiries",
                "100% WCAG AA accessibility compliance"
            ]
        }
    }
]

def get_db_path() -> str:
    path = os.getenv("DB_PATH", DEFAULT_DB_PATH)
    if path == "./leads.db" or path == "leads.db":
        return DEFAULT_DB_PATH
    return path

def get_db_connection() -> sqlite3.Connection:
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            name TEXT NOT NULL,
            message TEXT NOT NULL,
            project_slug TEXT,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            slot_time TEXT NOT NULL,
            meeting_link TEXT,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS otp_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            otp_code TEXT NOT NULL,
            expires_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS kb_projects (
            id TEXT PRIMARY KEY,
            slug TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            tech TEXT NOT NULL,
            github_url TEXT NOT NULL,
            live_url TEXT,
            case_study TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            lead_id INTEGER,
            email TEXT,
            visitor_message TEXT NOT NULL,
            agent_stage TEXT NOT NULL,
            agent_response TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS digests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            digest_code TEXT UNIQUE NOT NULL,
            period_start TEXT NOT NULL,
            period_end TEXT NOT NULL,
            summary_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS finetune_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            visitor_query TEXT NOT NULL,
            context_retrieved TEXT NOT NULL,
            llm_response TEXT NOT NULL,
            grounding_score REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            approved_at TEXT,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS model_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version_tag TEXT UNIQUE NOT NULL,
            base_model TEXT NOT NULL,
            dataset_size INTEGER NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )
    """)
    
    conn.commit()

    # Seed default projects if kb_projects is empty
    cursor.execute("SELECT COUNT(*) as count FROM kb_projects")
    count = cursor.fetchone()["count"]
    if count == 0:
        for p in DEFAULT_PROJECTS:
            cursor.execute("""
                INSERT OR REPLACE INTO kb_projects (id, slug, name, category, description, tech, github_url, live_url, case_study)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p["id"],
                p["slug"],
                p["name"],
                p["category"],
                p["description"],
                json.dumps(p["tech"]),
                p["githubUrl"],
                p["liveUrl"],
                json.dumps(p["caseStudy"])
            ))
        conn.commit()

    conn.close()

def save_otp(email: str, otp_code: str, expires_at: Optional[str] = None):
    if not expires_at:
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=600)).isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM otp_tokens WHERE LOWER(email) = LOWER(?)", (email,))
    cursor.execute(
        "INSERT INTO otp_tokens (email, otp_code, expires_at) VALUES (?, ?, ?)",
        (email, otp_code, expires_at)
    )
    conn.commit()
    conn.close()

def verify_otp(email: str, otp_code: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        "SELECT id, expires_at FROM otp_tokens WHERE LOWER(email) = LOWER(?) AND otp_code = ?",
        (email, otp_code)
    )
    row = cursor.fetchone()
    if not row:
        conn.close()
        return False
    
    expires_at = row["expires_at"]
    if expires_at < now_iso:
        conn.close()
        return False
        
    cursor.execute("DELETE FROM otp_tokens WHERE id = ?", (row["id"],))
    conn.commit()
    conn.close()
    return True

def verify_lead_otp(email: str, otp_code: str) -> bool:
    if not verify_otp(email, otp_code):
        return False
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE leads SET status = 'verified' WHERE LOWER(email) = LOWER(?)", (email,))
    if cursor.rowcount == 0:
        created_at = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            """
            INSERT INTO leads (email, name, message, project_slug, created_at, status)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (email.lower(), "Verified Lead", "OTP Verification", "", created_at, "verified")
        )
    conn.commit()
    conn.close()
    return True

def is_lead_verified(email: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id FROM leads WHERE LOWER(email) = LOWER(?) AND status = 'verified'",
        (email,)
    )
    row = cursor.fetchone()
    conn.close()
    return row is not None


def get_kb_projects() -> list:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, slug, name, category, description, tech, github_url, live_url, case_study FROM kb_projects ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    
    res = []
    for r in rows:
        row_dict = dict(r)
        tech_val = row_dict["tech"]
        try:
            tech_parsed = json.loads(tech_val)
        except Exception:
            tech_parsed = [t.strip() for t in tech_val.split(",") if t.strip()]
            
        case_study_val = row_dict["case_study"]
        try:
            cs_parsed = json.loads(case_study_val)
        except Exception:
            cs_parsed = {"overview": case_study_val, "problem": "", "solution": "", "architecture": [], "metrics": []}
            
        res.append({
            "id": row_dict["id"],
            "slug": row_dict["slug"],
            "name": row_dict["name"],
            "category": row_dict["category"],
            "description": row_dict["description"],
            "tech": tech_parsed,
            "githubUrl": row_dict["github_url"],
            "liveUrl": row_dict["live_url"],
            "caseStudy": cs_parsed
        })
    return res

def save_kb_project(project: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    p_id = project.get("id") or project.get("slug")
    slug = project.get("slug") or p_id
    name = project.get("name", "")
    category = project.get("category", "")
    description = project.get("description", "")
    tech = project.get("tech", [])
    tech_str = json.dumps(tech) if isinstance(tech, list) else str(tech)
    github_url = project.get("githubUrl", project.get("github_url", ""))
    live_url = project.get("liveUrl", project.get("live_url", None))
    case_study = project.get("caseStudy", project.get("case_study", {}))
    cs_str = json.dumps(case_study) if isinstance(case_study, dict) else str(case_study)

    cursor.execute("""
        INSERT OR REPLACE INTO kb_projects (id, slug, name, category, description, tech, github_url, live_url, case_study)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (p_id, slug, name, category, description, tech_str, github_url, live_url, cs_str))
    
    conn.commit()
    conn.close()

def create_lead(email: str, name: str, message: str, project_slug: str = "", status: str = "new") -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    created_at = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        """
        INSERT INTO leads (email, name, message, project_slug, created_at, status)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (email, name, message, project_slug, created_at, status)
    )
    conn.commit()
    lead_id = cursor.lastrowid
    conn.close()
    
    return {
        "id": lead_id,
        "email": email,
        "name": name,
        "message": message,
        "project_slug": project_slug,
        "created_at": created_at,
        "status": status
    }

def get_leads() -> list:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name, message, project_slug, created_at, status FROM leads ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def create_booking(email: str, slot_time: str, meeting_link: str = "", status: str = "confirmed") -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    created_at = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        """
        INSERT INTO bookings (email, slot_time, meeting_link, created_at, status)
        VALUES (?, ?, ?, ?, ?)
        """,
        (email, slot_time, meeting_link, created_at, status)
    )
    conn.commit()
    booking_id = cursor.lastrowid
    conn.close()
    
    return {
        "id": booking_id,
        "email": email,
        "slot_time": slot_time,
        "meeting_link": meeting_link,
        "created_at": created_at,
        "status": status
    }

def get_bookings() -> list:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, slot_time, meeting_link, created_at, status FROM bookings ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def log_conversation_turn(
    session_id: str,
    visitor_message: str,
    agent_stage: str,
    agent_response: str,
    email: Optional[str] = None
) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    created_at = datetime.now(timezone.utc).isoformat()
    
    lead_id = None
    if email:
        cursor.execute("SELECT id FROM leads WHERE LOWER(email) = LOWER(?) ORDER BY id DESC LIMIT 1", (email,))
        row = cursor.fetchone()
        if row:
            lead_id = row["id"]
    else:
        # If no email passed, try looking up from existing linked turn in this session
        cursor.execute(
            "SELECT lead_id, email FROM conversations WHERE session_id = ? AND (lead_id IS NOT NULL OR email IS NOT NULL) ORDER BY id DESC LIMIT 1",
            (session_id,)
        )
        row = cursor.fetchone()
        if row:
            if row["lead_id"]:
                lead_id = row["lead_id"]
            if row["email"]:
                email = row["email"]

    cursor.execute(
        """
        INSERT INTO conversations (session_id, lead_id, email, visitor_message, agent_stage, agent_response, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (session_id, lead_id, email, visitor_message, agent_stage, agent_response, created_at)
    )
    conn.commit()
    turn_id = cursor.lastrowid
    conn.close()

    return {
        "id": turn_id,
        "session_id": session_id,
        "lead_id": lead_id,
        "email": email,
        "visitor_message": visitor_message,
        "agent_stage": agent_stage,
        "agent_response": agent_response,
        "created_at": created_at
    }


def link_session_to_lead(session_id: str, lead_id: int, email: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    clean_email = email.strip().lower() if email else ""
    if session_id and clean_email:
        cursor.execute(
            "UPDATE conversations SET lead_id = ?, email = ? WHERE session_id = ? OR LOWER(email) = LOWER(?)",
            (lead_id, clean_email, session_id, clean_email)
        )
    elif session_id:
        cursor.execute(
            "UPDATE conversations SET lead_id = ?, email = ? WHERE session_id = ?",
            (lead_id, clean_email, session_id)
        )
    elif clean_email:
        cursor.execute(
            "UPDATE conversations SET lead_id = ?, email = ? WHERE LOWER(email) = LOWER(?)",
            (lead_id, clean_email, clean_email)
        )
    conn.commit()
    conn.close()


def get_conversations_by_session(session_id: str) -> list:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, session_id, lead_id, email, visitor_message, agent_stage, agent_response, created_at FROM conversations WHERE session_id = ? ORDER BY id ASC",
        (session_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_conversations_by_lead(lead_id: int) -> list:
    conn = get_db_connection()
    cursor = conn.cursor()
    # Also fetch lead email to catch turns matching lead's email
    cursor.execute("SELECT email FROM leads WHERE id = ?", (lead_id,))
    lead_row = cursor.fetchone()
    lead_email = lead_row["email"].lower() if lead_row and lead_row["email"] else None

    if lead_email:
        cursor.execute(
            """
            SELECT id, session_id, lead_id, email, visitor_message, agent_stage, agent_response, created_at
            FROM conversations
            WHERE lead_id = ? OR LOWER(email) = LOWER(?)
            ORDER BY id ASC
            """,
            (lead_id, lead_email)
        )
    else:
        cursor.execute(
            """
            SELECT id, session_id, lead_id, email, visitor_message, agent_stage, agent_response, created_at
            FROM conversations
            WHERE lead_id = ?
            ORDER BY id ASC
            """,
            (lead_id,)
        )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def generate_fortnightly_summary(days: int = 14) -> dict:
    now_dt = datetime.now(timezone.utc)
    cutoff_dt = now_dt - timedelta(days=days)
    period_start = cutoff_dt.isoformat()
    period_end = now_dt.isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT created_at, status FROM leads")
    leads_rows = cursor.fetchall()
    total_leads = 0
    verified_leads_count = 0
    for r in leads_rows:
        try:
            created_dt = datetime.fromisoformat(r["created_at"].replace("Z", "+00:00"))
            if created_dt >= cutoff_dt:
                total_leads += 1
                if r["status"] == "verified":
                    verified_leads_count += 1
        except Exception:
            pass

    cursor.execute("SELECT created_at FROM bookings")
    booking_rows = cursor.fetchall()
    bookings_count = 0
    for r in booking_rows:
        try:
            created_dt = datetime.fromisoformat(r["created_at"].replace("Z", "+00:00"))
            if created_dt >= cutoff_dt:
                bookings_count += 1
        except Exception:
            pass

    cursor.execute("SELECT session_id, visitor_message, created_at FROM conversations")
    conv_rows = cursor.fetchall()
    conversation_turns_count = 0
    unique_sessions = set()
    messages_in_period = []
    for r in conv_rows:
        try:
            created_dt = datetime.fromisoformat(r["created_at"].replace("Z", "+00:00"))
            if created_dt >= cutoff_dt:
                conversation_turns_count += 1
                if r["session_id"]:
                    unique_sessions.add(r["session_id"])
                if r["visitor_message"]:
                    messages_in_period.append(r["visitor_message"])
        except Exception:
            pass

    conn.close()

    stopwords = {
        "the", "a", "an", "is", "are", "to", "for", "of", "in", "and", "i", "can", "you",
        "what", "how", "with", "my", "me", "on", "it", "this", "that", "hello", "hi", "help",
        "please", "tell", "about", "your", "does", "do", "have", "be", "or", "as", "at", "by", "we", "us"
    }
    word_freq = defaultdict(int)
    for msg in messages_in_period:
        tokens = re.findall(r'[a-zA-Z0-9]+', msg.lower())
        for token in tokens:
            if len(token) >= 3 and token not in stopwords:
                word_freq[token] += 1

    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
    top_query_themes = [{"theme": item[0], "count": item[1]} for item in sorted_words]

    digest_code = f"DIGEST-{uuid.uuid4().hex[:8].upper()}"

    return {
        "digest_code": digest_code,
        "period_start": period_start,
        "period_end": period_end,
        "total_leads": total_leads,
        "verified_leads_count": verified_leads_count,
        "bookings_count": bookings_count,
        "conversation_turns_count": conversation_turns_count,
        "unique_sessions_count": len(unique_sessions),
        "top_query_themes": top_query_themes
    }


def store_digest(digest_data: dict) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    digest_code = digest_data.get("digest_code") or f"DIGEST-{uuid.uuid4().hex[:8].upper()}"
    period_start = digest_data.get("period_start", datetime.now(timezone.utc).isoformat())
    period_end = digest_data.get("period_end", datetime.now(timezone.utc).isoformat())
    created_at = digest_data.get("created_at", datetime.now(timezone.utc).isoformat())

    summary_obj = digest_data.get("summary", digest_data)
    if isinstance(summary_obj, dict):
        summary_json = json.dumps(summary_obj)
    elif isinstance(summary_obj, str):
        summary_json = summary_obj
        try:
            summary_obj = json.loads(summary_obj)
        except Exception:
            pass
    else:
        summary_json = json.dumps(str(summary_obj))

    cursor.execute("""
        INSERT INTO digests (digest_code, period_start, period_end, summary_json, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (digest_code, period_start, period_end, summary_json, created_at))
    conn.commit()
    digest_id = cursor.lastrowid
    conn.close()

    return {
        "id": digest_id,
        "digest_code": digest_code,
        "period_start": period_start,
        "period_end": period_end,
        "summary": summary_obj,
        "summary_json": summary_json,
        "created_at": created_at
    }


def get_digests() -> list:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, digest_code, period_start, period_end, summary_json, created_at FROM digests ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        row_dict = dict(r)
        try:
            row_dict["summary"] = json.loads(row_dict["summary_json"])
        except Exception:
            row_dict["summary"] = {}
        result.append(row_dict)
    return result


def get_digest_by_id(digest_id: int) -> Optional[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, digest_code, period_start, period_end, summary_json, created_at FROM digests WHERE id = ?", (digest_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    row_dict = dict(row)
    try:
        row_dict["summary"] = json.loads(row_dict["summary_json"])
    except Exception:
        row_dict["summary"] = {}
    return row_dict


def add_to_finetune_queue(
    session_id: str,
    visitor_query: str,
    context_retrieved: str,
    llm_response: str,
    grounding_score: float,
    status: str = "pending"
) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    created_at = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        """
        INSERT INTO finetune_queue (session_id, visitor_query, context_retrieved, llm_response, grounding_score, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (session_id, visitor_query, context_retrieved, llm_response, float(grounding_score), status, created_at)
    )
    conn.commit()
    item_id = cursor.lastrowid
    conn.close()

    return {
        "id": item_id,
        "session_id": session_id,
        "visitor_query": visitor_query,
        "context_retrieved": context_retrieved,
        "llm_response": llm_response,
        "grounding_score": float(grounding_score),
        "status": status,
        "approved_at": None,
        "created_at": created_at
    }


def get_finetune_queue(status: Optional[str] = "pending") -> list:
    conn = get_db_connection()
    cursor = conn.cursor()
    if status and status.lower() != "all":
        cursor.execute(
            """
            SELECT id, session_id, visitor_query, context_retrieved, llm_response, grounding_score, status, approved_at, created_at
            FROM finetune_queue
            WHERE status = ?
            ORDER BY id DESC
            """,
            (status.lower(),)
        )
    else:
        cursor.execute(
            """
            SELECT id, session_id, visitor_query, context_retrieved, llm_response, grounding_score, status, approved_at, created_at
            FROM finetune_queue
            ORDER BY id DESC
            """
        )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def review_finetune_item(item_id: int, status: str) -> Optional[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    clean_status = status.strip().lower()
    now_iso = datetime.now(timezone.utc).isoformat()
    approved_at = now_iso if clean_status == "approved" else None

    cursor.execute(
        "UPDATE finetune_queue SET status = ?, approved_at = ? WHERE id = ?",
        (clean_status, approved_at, item_id)
    )
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        return None

    cursor.execute(
        """
        SELECT id, session_id, visitor_query, context_retrieved, llm_response, grounding_score, status, approved_at, created_at
        FROM finetune_queue
        WHERE id = ?
        """,
        (item_id,)
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def run_finetune_cycle(base_model: str = "llama3.2:3b") -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as count FROM finetune_queue WHERE status = 'approved'")
    approved_count = cursor.fetchone()["count"]

    cursor.execute("SELECT version_tag FROM model_versions ORDER BY id DESC LIMIT 1")
    last_row = cursor.fetchone()

    if not last_row:
        new_version_tag = f"{base_model}-v1.0"
    else:
        last_tag = last_row["version_tag"]
        match = re.search(r'-v(\d+)\.(\d+)$', last_tag)
        if match:
            major = int(match.group(1))
            minor = int(match.group(2)) + 1
            new_version_tag = f"{base_model}-v{major}.{minor}"
        else:
            new_version_tag = f"{base_model}-v1.0"

    created_at = datetime.now(timezone.utc).isoformat()

    cursor.execute("UPDATE model_versions SET is_active = 0")
    cursor.execute(
        """
        INSERT INTO model_versions (version_tag, base_model, dataset_size, is_active, created_at)
        VALUES (?, ?, ?, 1, ?)
        """,
        (new_version_tag, base_model, approved_count, created_at)
    )
    new_id = cursor.lastrowid
    conn.commit()

    cursor.execute(
        "SELECT id, version_tag, base_model, dataset_size, is_active, created_at FROM model_versions WHERE id = ?",
        (new_id,)
    )
    row = cursor.fetchone()
    conn.close()

    version_dict = dict(row) if row else None
    return {
        "status": "success",
        "message": f"Scheduled fine-tune job completed successfully. Created model version {new_version_tag}.",
        "version": version_dict
    }


def get_model_versions() -> list:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, version_tag, base_model, dataset_size, is_active, created_at FROM model_versions ORDER BY id DESC"
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def rollback_model_version(version_id: int) -> Optional[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM model_versions WHERE id = ?", (version_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    cursor.execute("UPDATE model_versions SET is_active = 0")
    cursor.execute("UPDATE model_versions SET is_active = 1 WHERE id = ?", (version_id,))
    conn.commit()

    cursor.execute(
        "SELECT id, version_tag, base_model, dataset_size, is_active, created_at FROM model_versions WHERE id = ?",
        (version_id,)
    )
    updated_row = cursor.fetchone()
    conn.close()
    return dict(updated_row) if updated_row else None


def get_all_conversations(
    session_id: Optional[str] = None,
    lead_id: Optional[int] = None,
    search_query: Optional[str] = None
) -> list:
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT id, session_id, lead_id, email, visitor_message, agent_stage, agent_response, created_at FROM conversations"
    conditions = []
    params = []

    if session_id and session_id.strip():
        conditions.append("session_id = ?")
        params.append(session_id.strip())

    if lead_id is not None:
        conditions.append("lead_id = ?")
        params.append(lead_id)

    if search_query and search_query.strip():
        q_str = f"%{search_query.strip()}%"
        conditions.append("(visitor_message LIKE ? OR agent_response LIKE ? OR COALESCE(email, '') LIKE ? OR session_id LIKE ?)")
        params.extend([q_str, q_str, q_str, q_str])

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY id DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_memory_vault_stats() -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as count FROM conversations")
    total_conversations = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(DISTINCT session_id) as count FROM conversations WHERE session_id IS NOT NULL AND session_id != ''")
    total_sessions = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(DISTINCT lead_id) as count FROM conversations WHERE lead_id IS NOT NULL")
    converted_leads = cursor.fetchone()["count"]

    conn.close()

    return {
        "total_conversations": total_conversations,
        "total_sessions": total_sessions,
        "converted_leads": converted_leads,
        "retention_days": 60
    }


def purge_old_conversations(days: int = 60) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cutoff_dt = datetime.now(timezone.utc) - timedelta(days=days)
    cutoff_iso = cutoff_dt.isoformat()

    cursor.execute("DELETE FROM conversations WHERE created_at < ?", (cutoff_iso,))
    deleted_count = cursor.rowcount
    conn.commit()
    conn.close()
    return deleted_count





