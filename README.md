# Multi-Agent Portfolio Orchestration

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-VectorStore-orange.svg)](https://www.trychroma.com/)
[![Tests](https://img.shields.io/badge/Tests-56%2F56%20Passing-brightgreen.svg)](README.md#-running-test-suites)

An enterprise-grade, multi-agent hybrid portfolio platform featuring autonomous 3-stage RAG evaluation, TF-IDF + Logistic Regression confidence gating, local LLM grounding verification, interactive dual-mode shell (Cinematic vs. CRT Terminal), broker API integration, admin management portal, memory vault, pipeline visualizer, and fine-tuning engine.

---

## 🌟 Architecture Overview

```
                                [ Architecture Pipeline ]

        Public Shell (/src)             Agent Pipeline (/agent-service)         Broker & Admin (/api, /admin)
  ┌───────────────────────────┐         ┌───────────────────────────────┐       ┌───────────────────────────────┐
  │ • Dual Shell Modes        │         │ • Stage 1: ChromaDB Vector    │       │ • SQLite Persistent Database  │
  │   (Cinematic & Terminal)  │ (HTTP)  │   Retrieval (Ollama Embeds)   │ (HTTP)│ • Contact Capture & Booking   │
  │ • 12 Case Studies         ├────────►│ • Stage 2: Confidence Gate    │◄──────┤ • Admin OTP Authentication    │
  │ • GuardianVisualizer      │         │   (TF-IDF + Logistic Reg)     │       │ • Admin Portal (/admin)       │
  │ • AgentChatWidget UI      │         │ • Stage 3: LLM Escalation     │       │   (Leads, Memory Vault & KB)  │
  └───────────────────────────┘         │   (llama3.2:3b + Grounding)   │       └───────────────────────────────┘
                                        └───────────────────────────────┘
```

### Module Structure (Global Rules 0.1)
```
/src               <- Isolated Public Portfolio Shell (Vite + React + TS + Tailwind CSS)
/agent-service     <- Autonomous 3-Stage RAG & LLM Escalation Pipeline (FastAPI + ChromaDB)
/api               <- Lead Capture, Booking Broker, OTP Authentication & Memory Vault API (FastAPI)
/admin             <- Admin Management Dashboard & Memory Vault / Pipeline Visualizer (/admin)
```

---

## 🎨 Design Tokens (Global Rules 0.2)

Both Cinematic and Terminal shell modes share the exact same design language and custom property tokens:

| Token | CSS Custom Property | Color / Value | Usage |
|---|---|---|---|
| Page Base | `--bg-base` | `#0a0b12` | Deep space background |
| Primary Accent | `--accent-primary` | `#5eead4` | Teal/Cyan primary accent |
| Warning Accent | `--accent-warn` | `#ffb454` | Amber secondary/status accent |
| Primary Text | `--text-primary` | `#e8faf5` | High-contrast body text |
| Muted Text | `--text-muted` | `#7d9c96` | Subtitles, labels & borders |
| Display Font | `--font-display` | `Space Grotesk` | Headings & cinematic typography |
| Monospace Font | `--font-mono` | `JetBrains Mono` | Terminal mode, code & labels |

---

## 🚀 System Features

### 1. Dual Shell Mode System (`/src`)
- **Cinematic Mode**: Generous whitespace, Space Grotesk typography, interactive 2D particle mesh canvas (`EntranceScene`).
- **Terminal Mode**: CRT scanline overlay, JetBrains Mono typography, full interactive command-line environment (`$ help`, `$ ls projects`, `$ cat bio.txt`).

### 2. 3-Stage Agentic Pipeline (`/agent-service`)
- **Stage 1 (Retrieval)**: Embedded ChromaDB vector store parsing `src/constants/projects.ts` documents with Ollama / SentenceTransformer embeddings.
- **Stage 2 (Confidence Gate)**: TF-IDF + Logistic Regression intent classifier evaluating query intent and retrieval similarity.
- **Stage 3 (LLM Escalation)**: Ollama `llama3.2:3b` integration with automated entity term overlap grounding check (`verify_grounding`) and fallback handlers (`[FALLBACK: LOCAL_LLM_UNAVAILABLE]`, `[FALLBACK: UNGROUNDED_LLM_RESPONSE]`).

### 3. Real-Time State Visualizer & Chat Widget
- **`GuardianVisualizer.tsx`**: Dynamic HTML5 canvas widget updating pulse frequency and ring rotation velocity in real-time as queries progress through `STAGE_1_RETRIEVAL` ➔ `STAGE_2_GATE` ➔ `STAGE_3_LLM` ➔ `COMPLETE`.
- **`AgentChatWidget.tsx`**: Floating chat UI featuring client-side sanitization, character counter, confidence badges, and direct links to case studies.

### 4. Broker API & Admin Portal (`/api`, `/admin`)
- **Broker API (`/api`)**: SQLite persistent database (`leads.db`) supporting lead capture, Google Calendar slot scheduling, and rate limiting (20 req/min).
- **Admin Portal (`/admin`)**: 6-digit OTP email authentication (`/login`), Leads & Bookings Manager (`/leads`), and Knowledge Base Case Study Editor (`/kb`).

### 5. Advanced Admin Capabilities & Phase 6 Features
- **Admin Memory Vault (`/admin/memory`)**: Full audit history of agent interactions, conversation search/filters, JSON transcript exports, and data minimization purge operations.
- **Pipeline Visualizer Trace (`/admin/pipeline`)**: Real-time step-by-step pipeline execution inspection via `GET /api/pipeline/trace`.
- **Fine-Tuning Cycle & Version Engine**: Admin-controlled dataset compilation, fine-tuning job initiation, version management, and model rollback logic.
- **SLM Health Monitoring (`/admin/slm`)**: Real-time status polling of local/remote SLM inference endpoints with response latency indicators.

---

## 🔌 REST API Reference

### Agent Service Endpoints (`http://localhost:8000`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/query` | Execute 3-stage RAG query pipeline |
| `GET` | `/health` | Aggregate agent service health status |
| `GET` | `/api/slm/health` | Query Ollama / SLM host health & latency |
| `GET` | `/api/pipeline/trace` | Retrieve real-time execution trace logs |
| `POST` | `/api/finetune/trigger` | Initiate fine-tuning cycle |
| `GET` | `/api/finetune/versions` | List compiled model versions |

### Broker API Endpoints (`http://localhost:8001`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/leads` | Capture prospective lead submission |
| `GET` | `/api/leads` | Retrieve lead records (Admin authenticated) |
| `POST` | `/api/bookings` | Create calendar booking request |
| `POST` | `/api/auth/otp/send` | Dispatch 6-digit OTP email |
| `POST` | `/api/auth/otp/verify` | Verify OTP code and issue session token |
| `GET` | `/api/admin/memory/transcripts` | Retrieve transcript list for Memory Vault |
| `DELETE` | `/api/admin/memory/purge` | Perform data minimization purge |

---

## 🖥️ Server-Hosted SLM Endpoint Requirements

The Agent Service supports executing Small Language Models (SLMs) such as `llama3.2:3b` via a server-hosted Ollama endpoint for Stage 3 LLM escalation.

### 1. Host Server Configuration
To run Ollama on a dedicated persistent server or GPU node accessible over the local network or cloud VPC:
- Configure Ollama to listen on all network interfaces by setting `OLLAMA_HOST=0.0.0.0:11434`.
- Pull the required SLM and embedding models on the host server:
  ```bash
  ollama pull llama3.2:3b
  ollama pull nomic-embed-text
  ```

### 2. Agent Service Connection (`/agent-service`)
Configure the target host URL in `agent-service/.env` via `OLLAMA_HOST` or `OLLAMA_BASE_URL`:
```env
OLLAMA_HOST=http://<SERVER_IP>:11434
OLLAMA_BASE_URL=http://<SERVER_IP>:11434
OLLAMA_LLM_MODEL=llama3.2:3b
OLLAMA_EMBED_MODEL=nomic-embed-text
CHROMA_DB_DIR=./chroma_db
PORT=8000
```

### 3. Network Reachability & Health Check Endpoints
The agent service continuously monitors SLM health with a fast 2.0s timeout:
- **`GET /api/slm/health`**: Returns detailed SLM status (`online` | `offline`), host base URL, model name, response latency in milliseconds, and status details for the Phase 6 admin console.
- **`GET /health`**: Aggregates core agent service health alongside `slm` health data.

### 4. Automatic Fallback Behavior
If the remote Ollama server is offline, unreachable, or returns an ungrounded response:
- The system automatically triggers deterministic fallback summaries (`[FALLBACK: LOCAL_LLM_UNAVAILABLE]` / `[FALLBACK: UNGROUNDED_LLM_RESPONSE]`).
- Zero query failures or HTTP 500 errors occur when the SLM host server is restarting or undergoing maintenance.

---

## ⚙️ Environment Variables Setup

Copy `.env.example` templates to `.env` in each service directory prior to launching:

### Broker API (`/api/.env`)
```env
PORT=8001
DB_PATH=./leads.db
NOTIFICATION_EMAIL=owner@portfolio.internal
FROM_EMAIL=noreply@portfolio.internal
SMTP_HOST=smtp.example.com
SMTP_PORT=587
ENABLE_SMTP=false
```

### Admin Portal (`/admin/.env`)
```env
VITE_API_URL=http://localhost:8001
VITE_AGENT_API_URL=http://localhost:8000
```

---

## 🛠️ Quick Start & Installation

### Prerequisites
- Node.js >= 18.x
- Python >= 3.10
- (Optional) Local [Ollama](https://ollama.ai/) running `nomic-embed-text` and `llama3.2:3b`

### 1. Install & Launch Public Shell (`/src`)
```bash
npm install
npm run dev
```
Open `http://localhost:5173`.

### 2. Launch Agent Pipeline Service (`/agent-service`)
```bash
cd agent-service
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python ingest.py
python main.py
```
API runs at `http://localhost:8000`.

### 3. Launch Broker API (`/api`)
```bash
cd api
python main.py
```
Broker API runs at `http://localhost:8001`.

### 4. Launch Admin Portal (`/admin`)
```bash
cd admin
npm install
npm run dev
```
Admin Dashboard runs at `http://localhost:5174`.

---

## 🧪 Running Test Suites

All 56 unit and integration tests across backend microservices are fully passing:

### Backend Agent Service Unit Tests (19/19 Passing)
```bash
python -m unittest discover -s agent-service
```

### Backend Broker API Unit Tests (37/37 Passing)
```bash
python -m unittest discover -s api
```

### Frontend Production Builds Verification
```bash
npm run build
cd admin && npm run build
```

---

## 🤝 Contribution & Branching Strategy

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for full branch naming conventions (`feature/phase<N>-<slice-name>`, `fix/...`) and PR approval requirements.

> **Merge Policy**: All PRs require explicit review and approval from the Repository Owner (`@fncreator22`) before merging to `main`.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

