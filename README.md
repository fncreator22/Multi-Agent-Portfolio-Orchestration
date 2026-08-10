# Multi-Agent Portfolio Orchestration

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-VectorStore-orange.svg)](https://www.trychroma.com/)

An enterprise-grade, multi-agent hybrid portfolio platform featuring autonomous 3-stage RAG evaluation, TF-IDF + Logistic Regression confidence gating, local LLM grounding verification, interactive dual-mode shell (Cinematic vs. CRT Terminal), broker API integration, and an administrative dashboard.

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
  │ • AgentChatWidget UI      │         │ • Stage 3: LLM Escalation     │       │   (Leads & KB Editor)         │
  └───────────────────────────┘         │   (llama3.2:3b + Grounding)   │       └───────────────────────────────┘
                                        └───────────────────────────────┘
```

### Module Structure (Global Rules 0.1)
```
/src               <- Isolated Public Portfolio Shell (Vite + React + TS)
/agent-service     <- Autonomous 3-Stage RAG & LLM Escalation Pipeline (FastAPI + ChromaDB)
/api               <- Lead Capture, Google Calendar & OTP Authentication Broker API (FastAPI)
/admin             <- Admin Management Dashboard & KB Case Study Editor (Vite + React + TS)
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

### 1. Dual Shell Mode System
- **Cinematic Mode**: Generous whitespace, Space Grotesk typography, interactive 2D particle mesh canvas (`EntranceScene`).
- **Terminal Mode**: CRT scanline overlay, JetBrains Mono typography, full interactive command-line environment (`$ help`, `$ ls projects`, `$ cat bio.txt`).

### 2. 3-Stage Agentic Pipeline (`/agent-service`)
- **Stage 1 (Retrieval)**: Embedded ChromaDB vector store parsing `src/constants/projects.ts` documents with Ollama embeddings.
- **Stage 2 (Confidence Gate)**: TF-IDF + Logistic Regression intent classifier evaluating query intent and retrieval similarity.
- **Stage 3 (LLM Escalation)**: Ollama `llama3.2:3b` integration with automated entity term overlap grounding check (`verify_grounding`) and fallback handlers (`[FALLBACK: LOCAL_LLM_UNAVAILABLE]`, `[FALLBACK: UNGROUNDED_LLM_RESPONSE]`).

### 3. Real-Time State Visualizer & Chat Widget
- **`GuardianVisualizer.tsx`**: Dynamic HTML5 canvas widget updating pulse frequency and ring rotation velocity in real-time as queries progress through `STAGE_1_RETRIEVAL` ➔ `STAGE_2_GATE` ➔ `STAGE_3_LLM` ➔ `COMPLETE`.
- **`AgentChatWidget.tsx`**: Floating chat UI featuring client-side sanitization, character counter, confidence badges, and direct links to case studies.

### 4. Broker API & Admin Portal (`/api`, `/admin`)
- **Broker API (`/api`)**: SQLite persistent database (`leads.db`) supporting lead capture, Google Calendar slot scheduling, and rate limiting (20 req/min).
- **Admin Portal (`/admin`)**: 6-digit OTP email authentication (`/login`), Leads & Bookings Manager (`/leads`), and Knowledge Base Case Study Editor (`/kb`).

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

### Backend Agent Service Unit Tests (12/12 Tests)
```bash
python -m unittest discover -s agent-service
```

### Backend Broker API Unit Tests (9/9 Tests)
```bash
python -m unittest discover -s api
```

### Frontend Production Builds
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
