# API Contract — Person A ↔ Person B Agreement

> This document defines the exact API contracts between backend (Person A) and frontend (Person B).
> Person B: use these endpoints to build the frontend. All endpoints are **live and tested**.

## Base URL
```
http://localhost:3000
```

## Authentication (Day 1 — Dev Mode)
- **No auth required** during development — dev bypass is enabled.
- In production, add `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "CodeMind AI Backend",
  "version": "1.0.0",
  "timestamp": "2026-03-17T13:25:02.158Z",
  "environment": "development"
}
```

---

## 2. Code Generation

```
POST /api/v1/generate
Content-Type: application/json
```

**Request Body:**
```json
{
  "prompt": "Write a function to reverse a linked list",
  "file_content": "class Node:\n  def __init__(self, val)...",
  "language": "python",
  "cursor_line": 45,
  "max_tokens": 800
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `prompt` | string | ✅ | 1–500 chars |
| `file_content` | string | ❌ | max 50,000 chars |
| `language` | string | ❌ | `python` \| `javascript` \| `typescript` \| `java` \| `cpp` \| `go` \| `rust` (default: `python`) |
| `cursor_line` | number | ❌ | default: 0 |
| `max_tokens` | number | ❌ | 50–2000 (default: 800) |

**Success Response (200):**
```json
{
  "code": "def reverse_linked_list(head):\n    prev = None\n    ...",
  "explanation": "Uses iterative pointer reversal...",
  "language": "python",
  "tokens_used": 312,
  "response_time_ms": 2140,
  "insertion_point": { "line": 45, "column": 0 }
}
```

---

## 3. Autocomplete

```
POST /api/v1/autocomplete
Content-Type: application/json
```

**Request Body:**
```json
{
  "partial_code": "def calculate_",
  "file_context": "...last 50 lines of file...",
  "language": "python",
  "cursor_position": { "line": 12, "column": 15 }
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `partial_code` | string | ✅ | 1–5,000 chars |
| `file_context` | string | ❌ | max 20,000 chars |
| `language` | string | ❌ | same as generate |
| `cursor_position` | object | ❌ | `{ line: int, column: int }` |

**Success Response (200):**
```json
{
  "suggestion": "def calculate_average(numbers):\n    return sum(numbers) / len(numbers)",
  "confidence": 0.85,
  "cached": false
}
```

---

## 4. Bug Detection (Scan)

```
POST /api/v1/bugs/analyze
Content-Type: application/json
```

**Request Body:**
```json
{
  "file_content": "...full file code...",
  "language": "javascript",
  "file_id": "optional-uuid"
}
```

**Success Response (200):**
```json
{
  "bugs": [
    {
      "line": 23,
      "column": 5,
      "severity": "critical",
      "type": "NullPointerException",
      "description": "Variable user may be null at this point",
      "suggested_fix": "Add null check: if (user && user.id)"
    }
  ],
  "scan_time_ms": 1240,
  "total_issues": 1
}
```

---

## 5. Bug Auto-fix

```
POST /api/v1/bugs/fix
Content-Type: application/json
```

**Request Body:**
```json
{
  "bug_id": "bug_001",
  "file_content": "...full file...",
  "language": "javascript",
  "bug_description": "Variable user may be null at this point"
}
```

**Success Response (200):**
```json
{
  "fixed_code": "...corrected file content...",
  "explanation": "Added null guard to prevent TypeError",
  "tokens_used": 245
}
```

---

## Error Response Format (All Endpoints)

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "You have exceeded 10 AI requests per minute",
    "status": 429
  }
}
```

| Status | Code | When |
|--------|------|------|
| 400 | `BAD_REQUEST` | Missing or invalid request fields |
| 401 | `UNAUTHORIZED` | Missing JWT token (production only) |
| 429 | `RATE_LIMIT_EXCEEDED` | >10 AI requests per minute |
| 429 | `AI_RATE_LIMITED` | OpenAI rate limit hit |
| 500 | `GENERATION_FAILED` | AI call failed |
| 500 | `AUTOCOMPLETE_FAILED` | AI call failed |
| 500 | `ANALYSIS_FAILED` | Bug scan failed |
| 500 | `FIX_FAILED` | Auto-fix failed |

---

## Supported Languages

```
python | javascript | typescript | java | cpp | go | rust
```

---

## CORS
- Frontend origin `http://localhost:3001` is whitelisted
- Credentials, GET, POST, PUT, DELETE, OPTIONS are all allowed

---

## Rate Limits
- **AI endpoints**: 10 requests/minute per user
- **Standard endpoints**: 60 requests/minute per user
