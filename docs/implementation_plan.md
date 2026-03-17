# CodeMind AI — Implementation Plan

## Project Overview
**CodeMind AI** is a browser-based, AI-powered code editor with 5 core features:
1. Code Generation from Natural Language
2. AI-Powered Auto-complete & Suggestions
3. Bug Detection & Auto-fix
4. Multi-Language Support (Python, JS, TS, Java, C++, Go, Rust)
5. Terminal / Run Code in Browser

**Tech Stack**: React + Next.js + Monaco Editor | Node.js + Express | OpenAI API | PostgreSQL + Redis | Judge0

---

## Project Structure
```
Galactia_hackathon/
├── backend/
│   ├── server.js               # Express entry point (port 3000)
│   ├── src/
│   │   ├── config/index.js     # Environment & AI model config
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT auth (dev bypass enabled)
│   │   │   └── rateLimiter.js  # 10 AI req/min, 60 std req/min
│   │   ├── routes/
│   │   │   ├── generate.js     # POST /api/v1/generate
│   │   │   ├── autocomplete.js # POST /api/v1/autocomplete
│   │   │   └── bugDetection.js # POST /api/v1/bugs/analyze & /fix
│   │   ├── services/
│   │   │   └── aiService.js    # OpenAI integration (4 methods)
│   │   └── prompts/
│   │       ├── generatePrompt.js      # 4-section prompt builder
│   │       ├── autocompletePrompt.js  # Low-temp completion prompts
│   │       └── bugDetectionPrompt.js  # Structured JSON bug output
│   ├── .env.example
│   └── package.json
├── frontend/                   # Next.js + Monaco Editor (Person B)
├── docs/
├── README.md
└── .gitignore
```

---

## API Endpoints (All Implemented)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/generate` | Code generation from prompt |
| POST | `/api/v1/autocomplete` | AI-powered completions |
| POST | `/api/v1/bugs/analyze` | Bug detection scan |
| POST | `/api/v1/bugs/fix` | Auto-fix a bug |

---

## AI Model Settings

| Feature | Model | Temperature | Max Tokens |
|---------|-------|-------------|------------|
| Code Generation | gpt-4o-mini | 0.6 | 800 |
| Autocomplete | gpt-4o-mini | 0.3 | 400 |
| Bug Detection | gpt-4o-mini | 0.2 | 600 |

---

## Design System (from Doc 6)

| Token | Value |
|-------|-------|
| Background Primary | `#1E1E2E` |
| Background Secondary | `#252537` |
| Accent Blue | `#4FC3F7` |
| Success Green | `#A8FF78` |
| Warning Orange | `#FFB347` |
| Error Red | `#FF6B6B` |
| Text Primary | `#CDD6F4` |
| Text Muted | `#6C7086` |
| Font — Editor | JetBrains Mono 14px |
| Font — UI | Inter 13px |

---

## 5-Day Sprint Plan

| Day | Person A (Backend + AI) | Person B (Frontend) |
|-----|------------------------|---------------------|
| 0 | ✅ Project setup, env, backlog | ✅ Read WDK docs, clone repo |
| 1 | ✅ Express server, AI SDK, API routes, prompts | Next.js + Monaco Editor scaffold |
| 2 | PromptBuilder refinement, code gen tuning | Editor UI zones, AI panel |
| 3 | Bug detection, execution engine | Bug highlights, terminal panel |
| 4 | Polish API, error handling, CORS | Dashboard, responsive layout |
| 5 | Testing, demo prep | Video recording, README polish |
