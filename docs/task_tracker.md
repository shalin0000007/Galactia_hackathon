# CodeMind AI — Task Tracker

## ✅ Day 0 — Pre-Hackathon Setup (Complete)
- [x] Read & lock MVP scope (5 core features only)
- [x] Set up GitHub repo & project folder structure
- [x] Verify dev environment: Node.js, npm, VS Code
- [x] Install dependencies (Express, OpenAI, JWT, Joi, rate-limit)
- [x] Create `.env` file with all required environment variables
- [x] Write product backlog & assign Day 1 tasks

## ✅ Day 1 — Person A Tasks (Backend + AI) — Complete
- [x] Backend scaffold — Express server on port 3000, `GET /health`
- [x] Config module — env vars, AI model settings, rate limits
- [x] JWT Auth middleware (with dev-mode bypass)
- [x] Rate limiter middleware (10 AI req/min, 60 std req/min)
- [x] Install AI SDK (OpenAI) + verify connectivity
- [x] PromptBuilder — 3 prompt templates:
  - [x] Code Generation (SYSTEM/CONTEXT/INSTRUCTION/FEW-SHOT, temp 0.6)
  - [x] Autocomplete (temp 0.3, max 400 tokens)
  - [x] Bug Detection (structured JSON output, temp 0.2)
- [x] AI Service — `generateCode()`, `getAutoComplete()`, `detectBugs()`, `fixBug()`
- [x] API Routes:
  - [x] `POST /api/v1/generate` — code generation with Joi validation
  - [x] `POST /api/v1/autocomplete` — AI completions
  - [x] `POST /api/v1/bugs/analyze` — bug detection scan
  - [x] `POST /api/v1/bugs/fix` — auto-fix a bug

## 🔲 Day 1 — Person B Tasks (Frontend) — Pending
- [ ] Next.js + React app scaffolding
- [ ] Monaco Editor integration (syntax highlighting, dark theme)
- [ ] 5-zone UI layout (Sidebar, Toolbar, Editor, AI Panel, Terminal)
- [ ] AI prompt panel → backend connection
- [ ] Integration test: frontend → backend → AI → editor

## 🔲 Day 2 — AI Agent System
- [ ] Prompt refinement for all features
- [ ] Code generation tuning (multi-turn context)
- [ ] Autocomplete with caching
- [ ] Editor UI polish

## 🔲 Day 3 — Execution Engine
- [ ] Judge0 / Docker sandbox integration
- [ ] Terminal panel with real output
- [ ] Bug highlights inline in editor

## 🔲 Day 4 — Dashboard & Polish
- [ ] Full dashboard UI
- [ ] Error handling & edge cases
- [ ] README + architecture diagram

## 🔲 Day 5 — Testing, Demo & Submission
- [ ] End-to-end testing (all features)
- [ ] 5-minute demo video
- [ ] Final GitHub cleanup & submission
