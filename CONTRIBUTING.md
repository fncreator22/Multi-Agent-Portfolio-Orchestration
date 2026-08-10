# Contributing Guidelines: Multi-Agent Portfolio Orchestration

Thank you for your interest in contributing to **Multi-Agent Portfolio Orchestration**! This document outlines our branch management strategy, pull request rules, and contribution workflow.

---

## 🔒 Branch & Merge Protection Policy

To maintain repository integrity, **direct pushes to the `main` branch are strictly prohibited**. All proposed changes must be submitted via Pull Request (PR) and require explicit review and approval from the Repository Owner (`@fncreator22`) before merging.

---

## 🌿 Branch Naming Conventions

Every contribution must be developed on a dedicated branch created from `main`. Use the following standardized naming pattern based on the type of work:

| Work Category | Branch Naming Pattern | Example Branch Name | Description |
|---|---|---|---|
| **Phase Slices / Features** | `feature/phase<N>-<slice-name>` | `feature/phase1-shell-modes` | Slices corresponding to planned build orchestration prompts |
| **New Capabilities** | `feature/<short-description>` | `feature/calendar-sync` | General new feature implementations |
| **Bug Fixes** | `fix/<issue-name>` | `fix/rate-limit-headers` | Bug fixes and patch resolutions |
| **Documentation** | `docs/<topic-name>` | `docs/api-schemas` | Updates to docs, guides, or README files |
| **Refactoring & Performance** | `refactor/<target-module>` | `refactor/vector-retrieval` | Code cleanup or optimization without scope changes |

### Standard Phase Branch Mapping
- `feature/phase1-scaffold`: Project scaffold, Vite, React, TS, Tailwind & tokens.css setup.
- `feature/phase1-shell-modes`: Hybrid shell mode system (`ShellProvider`, `ModeToggle`, CRT overlay).
- `feature/phase1-canvas-scenes`: Entrance particle canvas & GuardianVisualizer idle visualizer.
- `feature/phase1-content`: Single source of truth `projects.ts` & case study templates.
- `feature/phase1-terminal-parity`: Terminal boot sequence & content parity audit.
- `feature/phase2-retrieval-scaffold`: FastAPI service in `/agent-service` & ChromaDB vector store.
- `feature/phase2-confidence-gate`: TF-IDF + Logistic Regression Confidence Gate classifier.
- `feature/phase2-llm-escalation`: Ollama `llama3.2:3b` integration, grounding verification & ADR fallbacks.
- `feature/phase2-frontend-wiring`: Chat widget UI, rate limiting, and real-time canvas visualizer sync.
- `feature/phase3-broker-api`: Broker API (`/api`), contact capture & SQLite `leads.db`.
- `feature/phase3-admin-portal`: Admin dashboard (`/admin`), email OTP auth, lead list & KB editor.

---

## 🛠️ Contribution Workflow

1. **Fork & Clone**: Fork the repository on GitHub and clone your fork locally:
   ```bash
   git clone https://github.com/fncreator22/Multi-Agent-Portfolio-Orchestration.git
   cd Multi-Agent-Portfolio-Orchestration
   ```

2. **Create a Named Feature Branch**:
   ```bash
   git checkout -b feature/phase1-shell-modes
   ```

3. **Develop & Run Preflight Checks**:
   Before committing, verify all required design tokens (`--bg-base`, `--accent-primary`, `--accent-warn`) and ensure folder rules (Rule 0.1) are respected:
   - Public frontend code lives strictly in `/src`.
   - Agent pipeline service lives strictly in `/agent-service`.
   - Broker API service lives strictly in `/api`.
   - Admin portal app lives strictly in `/admin`.

4. **Run Verification & Unit Tests**:
   - Public Shell Build: `npm run build`
   - Agent Pipeline Tests: `python -m unittest discover -s agent-service`
   - Broker API Tests: `python -m unittest discover -s api`
   - Admin Portal Build: `cd admin && npm run build`

5. **Commit & Push**:
   Write clear commit messages following the convention `<phase>: <what changed>`:
   ```bash
   git commit -m "phase1: add hybrid shell mode context provider and ModeToggle"
   git push origin feature/phase1-shell-modes
   ```

6. **Open Pull Request (PR)**:
   Submit your PR against the `main` branch of the upstream repository using our PR template.

7. **Owner Review & Approval**:
   Your PR will be automatically flagged for review. **Merging is blocked until the Repository Owner reviews and approves your PR**.

---

## 📜 Code of Conduct & Standards

- **Zero Hardcoded Overrides**: Always use CSS custom property tokens (`var(--accent-primary)`, `var(--bg-base)`).
- **Sanitization & Security**: All public-facing endpoints must include rate limiting and HTML input sanitization.
- **Respect Single Source of Truth**: Data must be read dynamically from `src/constants/projects.ts` without hardcoding duplicate content.
