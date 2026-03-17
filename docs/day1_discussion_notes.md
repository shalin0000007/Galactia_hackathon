# Day 1 Discussion Notes — Person A & Person B

**Date**: Day 1  
**Attendees**: Person A (Backend), Person B (Frontend)

---

## 1. Morning Kickoff (9:00 AM)

### MVP Scope Confirmed — 5 Features ONLY
1. ✅ Code Generation from Natural Language
2. ✅ AI-Powered Autocomplete
3. ✅ Bug Detection & Auto-fix
4. ✅ Multi-Language Support (Python, JS, TS, Java, C++, Go, Rust)
5. ✅ Terminal / Run Code in Browser

> ⚠️ No new features until all 5 work end-to-end. New ideas → `v2_backlog.md`.

---

## 2. Architecture Decisions Agreed

| Decision | Choice | Reason |
|----------|--------|--------|
| AI Provider | OpenAI (gpt-4o-mini) | Fast, cheap, good code quality |
| Backend Framework | Express.js | Lightweight, everyone knows it |
| Frontend Framework | Next.js + React | SSR support, fast dev |
| Editor | Monaco Editor (@monaco-editor/react) | Same as VS Code, rich API |
| Auth (Day 1) | Dev bypass — no login needed | Ship faster, add auth Day 3+ |
| Database (Day 1) | Skip — add PostgreSQL on Day 3 | Don't waste Day 1 on DB setup |
| Code Execution | Defer to Day 3 — use Judge0 API | Focus on AI features first |

---

## 3. Folder Ownership — No Conflicts

| Folder | Owner | Rule |
|--------|-------|------|
| `/backend/**` | Person A | Person B does NOT edit backend code |
| `/frontend/**` | Person B | Person A does NOT edit frontend code |
| `/docs/**` | Both | Both can add docs |
| `.gitignore`, `README.md` | Both | Coordinate before editing |

---

## 4. Git Workflow Agreed

- **Person A branch**: `feature/backend-day1`
- **Person B branch**: `feature/frontend-day1`
- **Merge strategy**: Both push to their branches → create PRs to `main` → review & merge together at EOD
- **Commit often** — at least 1 commit per hour during active dev

---

## 5. API Contract — Person B's Checklist

Person B should call these endpoints from the frontend:

| UI Component | Endpoint | When |
|-------------|----------|------|
| AI Prompt Panel → Generate button | `POST /api/v1/generate` | User types prompt + clicks Generate |
| Editor → Ghost text | `POST /api/v1/autocomplete` | After 400ms typing pause |
| Toolbar → Bug Scan button | `POST /api/v1/bugs/analyze` | User clicks scan (Ctrl+Shift+B) |
| Bug tooltip → Auto-fix button | `POST /api/v1/bugs/fix` | User clicks Fix on a bug |

> Full contract: see `docs/api_contract.md`

---

## 6. Design System — Shared

Both Person A and Person B use the same design tokens:

| Token | Value |
|-------|-------|
| Background Primary | `#1E1E2E` |
| Background Secondary | `#252537` |
| Accent Blue | `#4FC3F7` |
| Success Green | `#A8FF78` |
| Error Red | `#FF6B6B` |
| Font — Editor | JetBrains Mono 14px |
| Font — UI | Inter 13px |

---

## 7. Mid-morning Sync (11:30 AM)

### Person A Status:
- ✅ Express server running on port 3000
- ✅ All 4 API routes live and tested
- ✅ AI service with OpenAI integration working
- ✅ 3 prompt templates with 4-section architecture

### Blockers:
- Need real OpenAI API key in `.env` to test AI responses
- No blockers from Person A side

---

## 8. End-of-Day Review (4:30 PM)

### Day 1 Deliverables:
- [x] Person A: Backend scaffold — DONE
- [x] Person A: AI SDK + test call — DONE
- [x] Person A: API routes (4 endpoints) — DONE
- [x] Person A: PromptBuilder (3 templates) — DONE
- [ ] Person B: Frontend scaffold — pending
- [ ] Person B: Monaco Editor — pending

### Day 2 Plan:
- Person A: Prompt refinement, add caching, tune AI quality
- Person B: Complete frontend scaffold + connect to backend API

---

## Action Items

| # | Action | Owner | Deadline |
|---|--------|-------|----------|
| 1 | Add real OpenAI API key to `.env` | Person A | Before Day 2 |
| 2 | Push backend to `feature/backend-day1` branch | Person A | EOD Day 1 |
| 3 | Start Next.js + Monaco setup | Person B | Day 2 Morning |
| 4 | Push frontend to `feature/frontend-day1` branch | Person B | EOD Day 2 |
| 5 | Integration test: frontend → backend → AI | Both | Day 2 Evening |
