# Veloce ATS: REST API Reference (`/api/v1`)

All API endpoints follow strict REST conventions, validate inputs with Zod, authenticate actors via `x-user-id` header or session cookie, and return standard JSON response envelopes.

---

## 1. Response Envelope Format

### Success Response (`200 OK`, `201 Created`)
```json
{
  "ok": true,
  "data": { ... },
  "meta": {
    "total": 32,
    "page": 1,
    "limit": 20
  }
}
```

### Error Response (`400`, `403`, `404`, `409`, `422`, `500`)
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | CONFLICT | FORBIDDEN | RULE_VIOLATION | INTERNAL",
    "message": "Human-readable description",
    "details": [ ... ]
  }
}
```

---

## 2. API Endpoint Directory

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | Public | System status, database type, and active user count |
| `GET` | `/api/v1/users` | All | List all active team members and roles |
| `GET` | `/api/v1/jobs` | All | List job requisitions with department, status, and headcount filters |
| `POST` | `/api/v1/jobs` | ADMIN, HIRING_MANAGER, RECRUITER | Create a new job requisition |
| `GET` | `/api/v1/jobs/:id` | All | Fetch single job requisition with hiring manager details |
| `PATCH` | `/api/v1/jobs/:id` | ADMIN, HIRING_MANAGER, RECRUITER | Update requisition fields, status, or salary bands |
| `DELETE` | `/api/v1/jobs/:id` | ADMIN | Delete or close requisition |
| `GET` | `/api/v1/candidates` | All | Paginated candidate search with skills, source, and tag filters |
| `POST` | `/api/v1/candidates` | All | Create a candidate record and optional application |
| `GET` | `/api/v1/candidates/:id` | All | Candidate profile, resume, notes, and application history |
| `PATCH` | `/api/v1/candidates/:id` | All | Update candidate contact details, skills, or tags |
| `POST` | `/api/v1/candidates/parse-and-score` | All | Parse raw resume text or structured data and compute live score breakdown |
| `GET` | `/api/v1/applications` | All | Core pipeline query with multi-stage, multi-job, SLA, and sort filters |
| `GET` | `/api/v1/applications/:id` | All | Full 360° candidate application dossier (scorecards, notes, interviews, logs) |
| `PATCH` | `/api/v1/applications/:id/stage` | RBAC-gated | Transition stage or reorder within column (ACID transaction) |
| `POST` | `/api/v1/applications/bulk` | ADMIN, RECRUITER | Bulk transition, archive, tag, or rejection across multiple candidates |
| `GET` | `/api/v1/applications/:id/notes` | All | Collaborative discussion thread and replies |
| `POST` | `/api/v1/applications/:id/notes` | All | Append note with @mentions and private visibility flag |
| `POST` | `/api/v1/applications/:id/scorecards`| All | Submit 5-dimension interview evaluation scorecard |
| `GET` | `/api/v1/applications/:id/interviews`| All | List scheduled interview events |
| `POST` | `/api/v1/applications/:id/interviews`| All | Schedule interview with meeting link and panel |
| `PATCH` | `/api/v1/interviews/:id` | All | Update interview status (`SCHEDULED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`) |
| `GET` | `/api/v1/analytics/dashboard` | All | Aggregated executive KPIs, funnel, dwell times, and SLA radar |
| `GET` | `/api/v1/search/global` | All | Unified search across candidates, jobs, and quick commands |
| `GET` | `/api/v1/export/applications.csv` | All | Export pipeline applications as RFC 4180 CSV |
| `POST` | `/api/v1/automations/dispatch` | ADMIN | Trigger automation evaluations and drain webhook retry queue |
| `POST` | `/api/v1/seed/reset` | ADMIN, RECRUITER | Idempotent database reset to pristine seed state |

---

## 3. Copy-Pasteable `curl` Examples

### 3.1. Stage Transition with Optimistic Locking
```bash
curl -X PATCH http://localhost:3000/api/v1/applications/cmve11kjp000nufxz9y437m3n/stage \
  -H "Content-Type: application/json" \
  -H "x-user-id: usr_recruiter_01" \
  -d '{
    "toStage": "SCREENING",
    "expectedVersion": 0,
    "reason": "Recruiter screening call scheduled"
  }'
```

### 3.2. Resume Parsing & Live Match Scoring
```bash
curl -X POST http://localhost:3000/api/v1/candidates/parse-and-score \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "cmve0wfv500knufunru1w3t8l",
    "structured": {
      "fullName": "Alex Mercer",
      "email": "alex.mercer@example.com",
      "currentTitle": "Lead Product Manager",
      "skills": ["Product Strategy", "B2B SaaS", "Roadmapping", "SQL", "Agile"],
      "experienceYears": 9,
      "expectedSalary": 210000
    },
    "persist": false
  }'
```

### 3.3. Transactional Bulk Stage Move
```bash
curl -X POST http://localhost:3000/api/v1/applications/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "applicationIds": ["app_id_1", "app_id_2"],
    "action": "MOVE_STAGE",
    "payload": {
      "toStage": "TECHNICAL_INTERVIEW"
    }
  }'
```

### 3.4. Executive Analytics Dashboard
```bash
curl -X GET "http://localhost:3000/api/v1/analytics/dashboard?from=2026-07-01&to=2026-10-18"
```

### 3.5. Idempotent Seed Reset
```bash
curl -X POST http://localhost:3000/api/v1/seed/reset \
  -H "Content-Type: application/json" \
  -d '{"confirm": "RESET"}'
```
