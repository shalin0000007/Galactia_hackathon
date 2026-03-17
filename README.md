# CodeMind AI

> AI-Powered Code Editor — Write less, build more.

## 🚀 Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Add your OpenAI API key to .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
├── backend/          # Node.js + Express API server
│   ├── src/
│   │   ├── config/       # Environment & app config
│   │   ├── middleware/   # JWT auth, rate limiting
│   │   ├── routes/       # API route handlers
│   │   ├── services/     # AI service, execution service
│   │   └── prompts/      # Prompt engineering templates
│   └── server.js         # Express entry point
├── frontend/         # Next.js + Monaco Editor UI
│   └── src/
│       ├── components/   # Editor, Sidebar, Toolbar, etc.
│       └── lib/          # API client, utilities
└── docs/             # Architecture diagrams & docs
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Next.js + Monaco Editor |
| Backend | Node.js + Express |
| AI Engine | OpenAI API (GPT-4o-mini) |
| Database | PostgreSQL + Redis |
| Execution | Judge0 (sandboxed) |

## 🔑 Environment Variables

See `backend/.env.example` for all required variables.

## 👥 Team

- **Person A**: Backend + AI/ML
- **Person B**: Frontend + UI/UX
