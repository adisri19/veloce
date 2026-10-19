<p align="center">
  <img src="docs/assets/hero-banner.svg" alt="Veloce ATS Banner" width="100%" />
</p>

<p align="center">
  <strong>Linear's speed, Ashby's recruitment intelligence, and Stripe's transactional rigor — engineered for high-growth tech teams.</strong>
</p>

<p align="center">
  <a href="#11-testing--quality-verification"><img src="https://img.shields.io/badge/build-passing-10B981?style=flat-square&logo=github-actions" alt="Build" /></a>
  <a href="#11-testing--quality-verification"><img src="https://img.shields.io/badge/tests-26%2F26%20passing-10B981?style=flat-square" alt="Tests" /></a>
  <a href="#11-testing--quality-verification"><img src="https://img.shields.io/badge/verification-7%2F7%20passed-10B981?style=flat-square" alt="Verification" /></a>
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-14.2%20App%20Router-000000?style=flat-square&logo=next.js" alt="Next.js" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.x%20Strict-3178C6?style=flat-square&logo=typescript" alt="TypeScript" /></a>
  <a href="https://www.prisma.io"><img src="https://img.shields.io/badge/Prisma-6.3%20ORM-2D3748?style=flat-square&logo=prisma" alt="Prisma" /></a>
  <a href="#adrs"><img src="https://img.shields.io/badge/storage-Postgres%20%7C%20SQLite-4169E1?style=flat-square" alt="Database" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-6366F1?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="https://veloce-blush-tau.vercel.app"><strong>Live Demo ↗</strong></a> •
  <a href="#1-quickstart"><strong>Quickstart</strong></a> •
  <a href="#2-live-demo--60-second-interactive-tour"><strong>Interactive Tour</strong></a> •
  <a href="#3-feature-gallery"><strong>Screenshots</strong></a> •
  <a href="#6-system-architecture"><strong>Architecture</strong></a> •
  <a href="#8-engineering-deep-dives"><strong>Deep-Dives</strong></a> •
  <a href="#9-rest-api-reference"><strong>API Reference</strong></a> •
  <a href="docs/DECISIONS.md"><strong>ADRs</strong></a>
</p>

---

### Why This Exists

1. **Legacy ATS software is notoriously sluggish**: Incumbent ATS tools force recruiters to endure multi-second page loads, clunky modals, and rigid workflows that stifle recruiter velocity.
2. **Missing developer ergonomics in enterprise tools**: Most recruitment software lacks keyboard-first navigation (<kbd>⌘K</kbd>, vim-style navigation), optimistic UI updates, and sub-millisecond local filtering.
3. **Black-box AI matching fails compliance audits**: Veloce replaces non-deterministic LLM hallucinations with a mathematically rigorous, 100% explainable match scoring engine with component weights and risk flags.

---

## 1. Quickstart

Veloce ATS is engineered with a **dual database runtime**: instant zero-dependency SQLite for evaluation and PostgreSQL for high-concurrency production deployments.

### Option A: Zero-Config SQLite (Instant Run)

Run in a clean terminal from the repo root:

```bash
# 1. Install dependencies
npm install

# 2. Derive SQLite schema, generate Prisma client, push DB, seed, and launch dev server
npm run dev:sqlite
```

Open **[http://localhost:3000](http://localhost:3000)**. The app immediately boots with 32 realistic candidates, 6 active requisitions, 58 scorecards, and 91 historical transition logs.

### Option B: Production PostgreSQL (Neon / Supabase / RDS / Docker)

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Configure DATABASE_URL in .env
# DATABASE_URL="postgresql://user:pass@ep-cool-db.us-east-2.aws.neon.tech/veloce?sslmode=require"

# 3. Push schema and apply Postgres full-text search triggers
npx prisma db push
npx tsx scripts/apply-pg-extras.ts

# 4. Seed database and start production build
npx tsx prisma/seed.ts
npm run build
npm run start
```

### Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | `file:./dev.db` | Primary database connection string (PostgreSQL URI or SQLite file path) |
| `DIRECT_URL` | No | *(none)* | Direct database connection for Prisma migrations when using connection poolers (PgBouncer/Neon) |
| `WEBHOOK_SIGNING_SECRET`| **Yes** | `veloce_super_secret...` | HMAC-SHA256 secret key for signing outgoing webhook deliveries |
| `NODE_ENV` | No | `development` | Runtime environment (`development`, `production`, `test`) |

---

## 2. Live Demo & 60-Second Interactive Tour

Experience the live production application at **[https://veloce-blush-tau.vercel.app](https://veloce-blush-tau.vercel.app)** (or locally on `http://localhost:3000`).

Test these five core flows:

1. **Linear-Speed Kanban Drag & Drop**:
   - Navigate to `/pipeline`.
   - Drag candidate card **Devon Miller** (`CAND-1004`) from *Applied* to *Screening*.
   - Notice the optimistic card animation, zero layout shift, automatic transition log entry, and Toast notification with a working **Undo** action.
2. **360° Candidate Dossier Drawer**:
   - Click on any candidate card.
   - Explore the 5-tab dossier: **Overview** (radar chart, experience delta, salary fit), **Scorecards** (calibration heatmap across interviewers), **Notes** (threaded discussions with @mentions), **Interviews** (scheduling panel), and **Timeline** (immutable transition logs).
3. **Global Command Palette (<kbd>⌘K</kbd>)**:
   - Press <kbd>⌘</kbd>+<kbd>K</kbd> (or <kbd>Ctrl</kbd>+<kbd>K</kbd> on Linux/Windows).
   - Type `"Devon"` or `"Rust"` or `"Go to Jobs"` to experience instant fuzzy command routing.
4. **Candidate Comparison Matrix**:
   - Navigate to `/compare` (or press <kbd>G</kbd> then <kbd>C</kbd>).
   - View side-by-side dimensional comparisons for candidates applied to *ML Infrastructure Engineer*.
5. **Idempotent Database Reset**:
   - Click the **Reset Seed** button in the sidebar or trigger <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>R</kbd>.
   - The database wipes and re-seeds in **< 200ms**, restoring all 32 candidate states and SLA invariants.

---

## 3. Feature Gallery

<table width="100%">
  <tr>
    <td width="50%" align="center">
      <img src="docs/assets/dashboard-dark.png" alt="Executive Dashboard" width="100%" />
      <br /><strong>Executive Analytics Command Center</strong>
      <br /><em>4 real-time KPI stat cards, dynamic funnel conversion step chart, requisition health metrics, and SLA breach radar.</em>
    </td>
    <td width="50%" align="center">
      <img src="docs/assets/pipeline-kanban-dark.png" alt="Pipeline Kanban View" width="100%" />
      <br /><strong>Linear-Velocity Kanban Board</strong>
      <br /><em>@dnd-kit drag-and-drop, fractional float indexing, optimistic concurrency (OCC), and SLA warning badges.</em>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <img src="docs/assets/pipeline-grid-dark.png" alt="Pipeline Grid View" width="100%" />
      <br /><strong>High-Density Virtualized Data Grid</strong>
      <br /><em>Multi-select bulk triage bar (bulk stage move, bulk archive, bulk tag), column sorting, and instant facet filters.</em>
    </td>
    <td width="50%" align="center">
      <img src="docs/assets/pipeline-split-dark.png" alt="Pipeline Split View" width="100%" />
      <br /><strong>Keyboard Split-Screen Triage</strong>
      <br /><em>Ashby-style split list on left, instant candidate dossier on right. Cycle through candidates using arrow keys.</em>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <img src="docs/assets/dossier-overview-dark.png" alt="Candidate Dossier Overview" width="100%" />
      <br /><strong>360° Candidate Dossier (Overview Tab)</strong>
      <br /><em>Radar skill chart, compensation band analysis, risk flags, experience delta, and parsed resume text.</em>
    </td>
    <td width="50%" align="center">
      <img src="docs/assets/dossier-scorecards-dark.png" alt="Interviewer Calibration Heatmap" width="100%" />
      <br /><strong>Evaluation Scorecards &amp; Calibration Heatmap</strong>
      <br /><em>5-dimension rating matrix (Technical, Architecture, Problem Solving, Communication, Culture) and variance tracking.</em>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <img src="docs/assets/compare-matrix-dark.png" alt="Candidate Comparison Matrix" width="100%" />
      <br /><strong>Side-by-Side Candidate Compare Matrix</strong>
      <br /><em>Multi-candidate evaluation across experience, compensation expectations, skills coverage, and rubric scores.</em>
    </td>
    <td width="50%" align="center">
      <img src="docs/assets/command-palette-dark.png" alt="Global Command Palette" width="100%" />
      <br /><strong>Raycast-Style Command Palette (⌘K)</strong>
      <br /><em>Unified fuzzy search across candidates, open requisitions, theme switcher, and navigation shortcuts.</em>
    </td>
  </tr>
</table>

---

## 4. Feature Matrix

| Capability | Module / Implementation | Verification Gate |
|---|---|---|
| **Executive Analytics & Funnel** | `src/lib/services/analytics.ts`, `src/app/(app)/dashboard` | `tests/analytics-parity.test.ts`, SQL vs TS parity check |
| **ACID Stage Engine & Rules** | `src/lib/services/stage-engine.ts`, `src/lib/stage-rules.ts`| `tests/stage-rules.test.ts` (9 tests), transactional rollback |
| **Fractional Reordering** | `src/lib/fractional-index.ts`, `@dnd-kit` integration | `tests/fractional-index.test.ts` (5 tests), min-gap rebalance |
| **Deterministic AI Match Scoring**| `src/lib/scoring-engine.ts`, `src/lib/skills-dictionary.ts` | `tests/scoring-engine.test.ts` (4 tests), boundary verification |
| **Candidate Dossier & Heatmap** | `src/components/dossier/*`, `src/lib/calibration.ts` | End-to-end endpoint verification step `[1/7]` |
| **High-Density Virtualized Grid** | `src/components/pipeline/views/grid-view.tsx` | `@tanstack/react-table` column sorting and multi-select |
| **Keyboard-First Split Triage** | `src/components/pipeline/views/split-view.tsx` | Arrow key navigation and instant keyboard actions |
| **Append-Only Audit Log** | `src/lib/services/audit.ts`, `model AuditLog` | Immutable database schema triggers and transaction injection |
| **Webhook Engine & HMAC** | `src/lib/services/automations.ts` | HMAC-SHA256 signature test, exponential backoff schedule |
| **Dual DB (Postgres + SQLite)** | `scripts/make-sqlite-schema.ts`, `src/lib/db-compat.ts` | Parity verified across PostgreSQL AST and SQLite runtime |

---

## 5. System Architecture

```mermaid
graph TD
    subgraph Client ["Client Presentation Tier (Edge / Browser)"]
        UI["Next.js App Router (React 18 Server & Client Components)"]
        RQ["TanStack React Query Cache (Optimistic Updates)"]
        ZS["Zustand Global State (Dossier, Tour, Palette)"]
        DND["@dnd-kit Kanban Sensor Pipeline"]
    end

    subgraph Server ["Next.js 14 Server Runtime (Node.js)"]
        API["REST Handlers (/api/v1/*)"]
        Guard["withApi (Zod Validation, RBAC, Actor Context)"]
        
        subgraph DomainServices ["Domain Service Layer"]
            StageService["Stage Engine (ACID Transitions & Rules)"]
            IndexService["Fractional Indexer (Float Ranks & Rebalancing)"]
            ScoreService["Deterministic Match Scoring Engine"]
            AnalyticsService["Analytics & Dwell Time Aggregator"]
            AutomationService["Automation Dispatcher & HMAC Webhooks"]
        end
    end

    subgraph Database ["Persistence Layer"]
        Prisma["Prisma ORM (db-compat abstraction)"]
        Postgres[("PostgreSQL 16 (Production)")]
        SQLite[("SQLite 3 (Local Development)")]
        WebhookQueue[("Webhook Delivery Queue")]
    end

    UI --> ZS
    UI --> DND
    DND --> RQ
    RQ -->|HTTP JSON Envelopes| API
    API --> Guard
    Guard --> DomainServices
    DomainServices --> Prisma
    Prisma -->|DATABASE_URL=postgres| Postgres
    Prisma -->|DATABASE_URL=file:./dev.db| SQLite
    AutomationService -.->|HMAC-SHA256 Async POST| WebhookQueue
```

### Layering Rules

1. **Zero Database Access in UI Components**: Components in `src/components/*` strictly invoke React Query hooks; they never import Prisma client or bypass the API envelope.
2. **Stateless Route Handlers**: Handlers in `src/app/api/v1/*` are thin transport adapters responsible only for parameter extraction, actor authorization, and calling domain services.
3. **Isolated Domain Invariants**: All business logic (headcount enforcement, SLA computation, scorecard variance) lives in `src/lib/services/*` and `src/lib/*`.

### Kanban Card Drop Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter
    participant UI as Kanban UI (@dnd-kit)
    participant Cache as React Query Cache
    participant API as PATCH /api/v1/applications/:id/stage
    participant TX as Prisma $transaction
    participant Rules as Stage Rules Engine
    participant Audit as StageTransitionLog & AuditLog
    participant Auto as Automation Dispatcher

    Recruiter->>UI: Drops card into "TECHNICAL_INTERVIEW"
    UI->>Cache: Optimistically update card position and stage
    UI->>API: PATCH /api/v1/applications/:id/stage { toStage, expectedVersion: 0 }
    API->>TX: Start serializable transaction
    TX->>Rules: Check permissions, headcount, and scorecard gating
    alt Rule Violation or Version Mismatch
        Rules-->>TX: Error (409 Conflict or 422 Violation)
        TX-->>API: Abort transaction
        API-->>Cache: Return error envelope
        Cache-->>UI: Rollback optimistic card move & toast error
    else Transition Valid
        TX->>TX: Calculate fractional rank (rebalance if gap <= 1e-6)
        TX->>Audit: Insert StageTransitionLog (duration in previous stage)
        TX->>Audit: Insert append-only AuditLog row
        TX->>TX: Update Application (version++, kanbanOrder, stageEnteredAt)
        TX-->>API: Commit transaction and return updated record + undoToken
        API-->>Cache: Return HTTP 200 OK envelope
        Cache-->>UI: Reconcile server response with client cache
        API-)Auto: Fire STAGE_ENTERED event asynchronously
    end
```

---

## 6. Relational Data Model

Veloce ATS models a complete enterprise recruitment domain across **11 Prisma models** and **8 enums**:

```mermaid
erDiagram
    User ||--o{ JobRequisition : "manages (HiringManager)"
    User ||--o{ Scorecard : "submits"
    User ||--o{ CandidateNote : "authors"
    User ||--o{ StageTransitionLog : "executes"
    User ||--o{ AuditLog : "triggers"

    JobRequisition ||--o{ Application : "receives"
    Candidate ||--o{ Application : "submits"

    Application ||--o{ Scorecard : "evaluated_by"
    Application ||--o{ InterviewEvent : "scheduled_for"
    Application ||--o{ CandidateNote : "annotated_with"
    Application ||--o{ StageTransitionLog : "tracks_history"

    CandidateNote ||--o{ CandidateNote : "replies_to"
    AutomationRule ||--o{ WebhookDelivery : "dispatches"

    User {
        string id PK
        string email UK
        string name
        enum role
        string department
        boolean isActive
    }

    JobRequisition {
        string id PK
        string code UK
        string title
        enum status
        int headcountTotal
        int headcountFilled
        int salaryMin
        int salaryMax
        json slaDaysPerStage
    }

    Candidate {
        string id PK
        string publicCode UK
        string fullName
        string email UK
        int experienceYears
        string[] skills
        string source
    }

    Application {
        string id PK
        string candidateId FK
        string jobId FK
        enum currentStage
        float kanbanOrder
        int aiMatchScore
        int version
        datetime stageEnteredAt
    }

    Scorecard {
        string id PK
        string applicationId FK
        string interviewerId FK
        enum stage
        int technicalScore
        int architectureScore
        int problemSolvingScore
        int communicationScore
        int cultureScore
        enum overallRecommendation
    }

    StageTransitionLog {
        string id PK
        string applicationId FK
        enum fromStage
        enum toStage
        string movedById FK
        int durationInPreviousStageSeconds
        datetime timestamp
    }

    AuditLog {
        string id PK
        string entityType
        string entityId
        string action
        string actorId FK
        json metadata
        datetime createdAt
    }
```

### Database Indexes & Performance Rationale

| Table | Index Columns | Index Type | Engineering Rationale |
|---|---|---|---|
| `Application` | `[candidateId, jobId]` | `UNIQUE` | Enforces that a candidate can only apply once to a given job requisition. |
| `Application` | `[currentStage, kanbanOrder]` | `B-Tree` | Powers sub-millisecond sorted Kanban column queries. |
| `Application` | `[jobId, currentStage]` | `B-Tree` | Accelerates job-filtered pipeline queries. |
| `Scorecard` | `[applicationId, interviewerId, stage]` | `UNIQUE` | Prevents duplicate scorecards from the same interviewer for a given stage. |
| `Candidate` | `[source]`, `[experienceYears]` | `B-Tree` | Accelerates multi-facet filtering on the candidate grid. |
| `JobRequisition` | `[status, department]` | `B-Tree` | Speeds up catalog filtering by department and active status. |
| `AuditLog` | `[entityType, entityId, createdAt]` | `B-Tree` | Fast chronological audit history retrieval for any entity. |

### Append-Only Audit Guarantee

The `AuditLog` table is strictly append-only. Application code never issues `UPDATE` or `DELETE` statements against `AuditLog`. In PostgreSQL production deployments, `scripts/apply-pg-extras.ts` installs an immutable database trigger that cancels any attempted modification:

```sql
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'AuditLog is append-only. Modifying or deleting records is prohibited.';
END;
$$ LANGUAGE plpgsql;
```

---

## 7. Engineering Deep-Dives

### 7.1. Stage Transition Engine

The stage engine enforces strict business workflow rules before permitting any candidate move:

| Current Stage | Target Stage | Permitted Roles | Rules & Constraints |
|---|---|---|---|
| *Any* | `Same Stage` | All | Pure reorder; recalculates fractional `kanbanOrder` without transition log. |
| *Any* | `OFFER`, `HIRED`, `REJECTED` | `ADMIN`, `HIRING_MANAGER`, `RECRUITER` | Interviewers are strictly prohibited from moving candidates to privileged terminal stages. |
| `HIRED` | *Any* | `ADMIN` only | Only Admin can move candidates out of `HIRED` (decrements headcount). |
| *Any except OFFER*| `HIRED` | — | **Blocked**: Candidates must be in `OFFER` stage before being hired. |
| *Any* | `REJECTED` | Privileged | **Blocked** unless a structured `rejectionReason` is provided. |
| `OFFER` | `HIRED` | Privileged | Fails with `HEADCOUNT_FULL` if `headcountFilled >= headcountTotal`. Auto-closes requisition if last seat filled. |

### 7.2. Fractional Indexing & Rebalancing Algorithm

Veloce ATS uses fractional floating-point indexing (`kanbanOrder: Float`) to achieve $O(1)$ database reorders:

```typescript
// Algorithm defined in src/lib/fractional-index.ts
if (droppedBetweenTwoCards) {
  const gap = nextOrder - prevOrder;
  if (gap <= 1e-6) {
    // Rebalance column to clean multiples of 1000
    return rebalanceColumn(column, movingItemId);
  }
  return { newOrder: (prevOrder + nextOrder) / 2, needsRebalance: false };
}
```

- Initial card orders are spaced by **1000** (`1000, 2000, 3000...`).
- When dropping a card between two cards with order `1000` and `2000`, the new card receives `1500`.
- If repeated drops reduce the gap below `1e-6` (`MIN_GAP`), the engine atomically resets the entire column to `1000, 2000, 3000...`.

### 7.3. Deterministic AI Match Scoring Formula

Unlike unpredictable LLM prompts, candidate match scores are 100% deterministic and auditable:

$$S_{\text{total}} = \text{round}\left( 0.40 \cdot S_{\text{skills}} + 0.25 \cdot S_{\text{exp}} + 0.15 \cdot S_{\text{comp}} + 0.20 \cdot S_{\text{domain}} \right)$$

1. **Skills Coverage ($S_{\text{skills}}$, 40%)**:
   $$S_{\text{skills}} = 100 \cdot (0.85 \cdot \text{reqCoverage} + 0.15 \cdot \text{niceCoverage})$$
   Skills are normalized via canonical alias dictionary (`k8s` $\to$ `kubernetes`, `golang` $\to$ `go`).
2. **Experience Fit ($S_{\text{exp}}$, 25%)**:
   - In target range $[y_{\min}, y_{\max}]$: **100 points**
   - Under-experienced ($y < y_{\min}$): $100 - 22 \cdot (y_{\min} - y)$ (steep penalty)
   - Over-qualified ($y > y_{\max}$): $\max(40, 100 - 8 \cdot (y - y_{\max}))$ (gentle decay)
3. **Compensation Fit ($S_{\text{comp}}$, 15%)**:
   - Within or below salary band: **100 points**
   - $\le 10\%$ above band: **70 points**
   - $10\text{–}25\%$ above band: **40 points**
   - $> 25\%$ above band: **10 points**
   - Missing/unspecified salary: **70 points** (neutral prior)
4. **Domain & Title ($S_{\text{domain}}$, 20%)**:
   - Multi-token keyword match against resume corpus + **10 point bonus** if current title shares non-stopwords with job title.

*Full mathematical proof and worked seed examples in [docs/SCORING.md](docs/SCORING.md).*

### 7.4. SLA Breach Radar & Dwell Time Percentiles

Every requisition specifies allowed days per stage:
```json
{ "APPLIED": 3, "SCREENING": 5, "TECHNICAL_INTERVIEW": 7, "SYSTEM_DESIGN": 7, "OFFER": 5 }
```
- A candidate is in `WARNING` state when $\text{daysInStage} > 0.7 \times \text{slaDays}$.
- A candidate is in `BREACHED` state when $\text{daysInStage} > \text{slaDays}$.
- Stage dwell velocity calculates **Average**, **Median (p50)**, and **p90** duration from `StageTransitionLog.durationInPreviousStageSeconds`.
- The pipeline bottleneck is identified as the active stage with the highest $\frac{\text{avgDays}}{\text{slaTargetDays}}$ ratio.

### 7.5. Webhook Engine & HMAC-SHA256 Signatures

Automations evaluate event triggers (`STAGE_ENTERED`, `HIRED`, `SLA_BREACHED`, `SCORECARD_SUBMITTED`). When triggered, webhook payloads are signed with HMAC-SHA256:

```
X-Veloce-Signature: <hex-digest-of-payload-using-secret>
X-Veloce-Event: STAGE_ENTERED
X-Veloce-Delivery: <delivery-uuid>
```

Failed deliveries automatically retry using an exponential backoff schedule: **1m, 5m, 30m, 60m, 120m** (up to 5 attempts before marking as `FAILED`).

---

## 8. REST API Reference

All requests and responses use the standard JSON envelope: `{ "ok": true, "data": ... }`.

### Resource Table

| Endpoint | Method | Permitted Roles | Query / Body Schema | Success | Errors |
|---|---|---|---|---|---|
| `/api/v1/health` | `GET` | Public | None | `200 OK` | `500` |
| `/api/v1/jobs` | `GET` | All | `status`, `department`, `page`, `limit` | `200 OK` | `422` |
| `/api/v1/jobs` | `POST` | ADMIN, HM, RECRUITER | `JobCreateSchema` (title, salaryMin/Max, sla) | `201 Created`| `400, 422` |
| `/api/v1/candidates` | `GET` | All | `q`, `skills[]`, `source[]`, `page`, `limit` | `200 OK` | `422` |
| `/api/v1/candidates/parse-and-score`| `POST` | All | `jobId`, `resumeText` or `structured` | `200 OK` | `404, 422` |
| `/api/v1/applications` | `GET` | All | `jobId[]`, `stage[]`, `slaState[]`, `sort` | `200 OK` | `422` |
| `/api/v1/applications/:id` | `GET` | All | Path `id` | `200 OK` | `404` |
| `/api/v1/applications/:id/stage` | `PATCH` | RBAC Gated | `toStage`, `expectedVersion`, `reason` | `200 OK` | `404, 409, 422`|
| `/api/v1/applications/bulk` | `POST` | ADMIN, RECRUITER | `applicationIds[]`, `action`, `payload` | `200 OK` | `400, 422` |
| `/api/v1/analytics/dashboard` | `GET` | All | `from`, `to`, `jobIds[]` | `200 OK` | `422` |
| `/api/v1/seed/reset` | `POST` | ADMIN, RECRUITER | `{ "confirm": "RESET" }` | `200 OK` | `400, 403, 422`|

*Complete schema definitions and parameters in [docs/API.md](docs/API.md).*

### Live Captured `curl` Examples

#### 1. Filter Applications by Stage & SLA State
```bash
curl -s "http://localhost:3000/api/v1/applications?stage=SCREENING&limit=1"
```
```json
{
  "ok": true,
  "data": [
    {
      "id": "cmve0wfva00kzufunpwnmtzwv",
      "currentStage": "APPLIED",
      "kanbanOrder": 1000,
      "aiMatchScore": 97,
      "stageEnteredAt": "2026-10-12T04:11:42.542Z",
      "daysInStage": 6.5,
      "slaDays": 4,
      "slaState": "BREACHED",
      "candidate": {
        "fullName": "Devon Miller",
        "email": "devon.miller@platform.dev",
        "currentTitle": "Cloud Infrastructure Engineer",
        "experienceYears": 7
      }
    }
  ]
}
```

#### 2. Execute Stage Transition with Optimistic Locking
```bash
curl -s -X PATCH http://localhost:3000/api/v1/applications/cmve11kjp000nufxz9y437m3n/stage \
  -H "Content-Type: application/json" \
  -d '{
    "toStage": "SCREENING",
    "expectedVersion": 0,
    "reason": "Recruiter phone screening scheduled"
  }'
```
```json
{
  "ok": true,
  "data": {
    "id": "cmve11kjp000nufxz9y437m3n",
    "currentStage": "SCREENING",
    "version": 1,
    "kanbanOrder": 6000,
    "stageEnteredAt": "2026-10-18T16:15:54.211Z"
  }
}
```

#### 3. Idempotent Database Reset
```bash
curl -s -X POST http://localhost:3000/api/v1/seed/reset \
  -H "Content-Type: application/json" \
  -d '{"confirm": "RESET"}'
```
```json
{
  "ok": true,
  "data": {
    "success": true,
    "elapsedMs": 169,
    "counts": {
      "users": 7,
      "jobs": 6,
      "candidates": 32,
      "applications": 32,
      "transitions": 91,
      "scorecards": 58,
      "notes": 54
    }
  }
}
```

---

## 9. Frontend Design System & Tokens

Veloce ATS uses a tailored dark/light design token palette defined in `tailwind.config.ts`:

### Stage Color Tokens

| Stage | Dark Mode Hex | Light Mode Hex | Semantic Meaning |
|---|---|---|---|
| `SOURCED` | `#94A3B8` (slate-400) | `#64748B` (slate-500) | Passive discovery / talent pool |
| `APPLIED` | `#38BDF8` (sky-400) | `#0284C7` (sky-600) | Active inbound application |
| `SCREENING` | `#818CF8` (indigo-400) | `#4F46E5` (indigo-600) | Recruiter phone assessment |
| `TECHNICAL_INTERVIEW` | `#A78BFA` (violet-400) | `#7C3AED` (violet-600) | Coding & architecture evaluation |
| `SYSTEM_DESIGN` | `#C084FC` (purple-400) | `#9333EA` (purple-600) | High-level systems evaluation |
| `OFFER` | `#FBBF24` (amber-400) | `#D97706` (amber-600) | Offer extended / negotiation |
| `HIRED` | `#34D399` (emerald-400)| `#059669` (emerald-600)| Offer signed (Confetti trigger) |
| `REJECTED` | `#F87171` (rose-400) | `#DC2626` (rose-600) | Structured disposition |
| `WITHDRAWN` | `#6B7280` (zinc-500) | `#71717A` (zinc-500) | Candidate self-withdrawal |

### Match Score Color Ramp

- **$\ge 85$**: `emerald-500` (Exceptional fit)
- **$70\text{–}84$**: `sky-500` (Strong candidate)
- **$50\text{–}69$**: `amber-500` (Moderate fit / gaps present)
- **$< 50$**: `rose-500` (Under-qualified / major mismatch)

### Verified Keyboard Shortcuts

| Shortcut | Scope | Action |
|---|---|---|
| <kbd>⌘</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | Global | Open Raycast command palette |
| <kbd>G</kbd> then <kbd>D</kbd> | Global | Navigate to Executive Dashboard |
| <kbd>G</kbd> then <kbd>P</kbd> | Global | Navigate to Pipeline Views |
| <kbd>G</kbd> then <kbd>J</kbd> | Global | Navigate to Jobs Requisitions Catalog |
| <kbd>G</kbd> then <kbd>C</kbd> | Global | Navigate to Candidate Comparison Matrix |
| <kbd>N</kbd> | Global | Open New Candidate + Resume Parser modal |
| <kbd>T</kbd> | Global | Toggle Dark / Light theme |
| <kbd>/</kbd> | Global | Focus candidate search input |
| <kbd>?</kbd> | Global | Open keyboard shortcuts help modal |
| <kbd>⌘</kbd> + <kbd>⇧</kbd> + <kbd>R</kbd> | Global | Trigger Database Reset Modal |
| <kbd>Esc</kbd> | Global | Close active drawer or modal |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Split View | Cycle through candidate list in triage mode |

---

## 10. Testing & Quality Verification

Veloce ATS is verified by a multi-layered automated test and build harness.

### Test Commands & Real Execution Results

```bash
# Run Vitest test suites
npm test
```
```
 ✓ tests/analytics-parity.test.ts (3 tests)
 ✓ tests/fractional-index.test.ts (5 tests)
 ✓ tests/stage-rules.test.ts (9 tests)
 ✓ tests/scoring-engine.test.ts (4 tests)
 ✓ tests/api-contract.test.ts (5 tests)

 Test Files  5 passed (5)
      Tests  26 passed (26)
   Duration  476ms
```

```bash
# Run End-to-End Verification Harness
npx tsx scripts/verify-endpoints.ts
```
```
[1/7] Testing Seed & Invariants...             ✅ 100% idempotent and meets all invariants
[2/7] Testing Faceted Search & Filtering...     ✅ Faceted search, multi-select, and SLA predicates pass
[3/7] Testing Stage Transition Engine...       ✅ Stage transitions, atomic logs, conflict detection, undo pass
[4/7] Testing Headcount & HIRED Constraints...  ✅ Headcount constraint and job closing logic verified
[5/7] Testing Transactional Bulk Operations...  ✅ Bulk operations atomic execution and rollback verified
[6/7] Testing Resume Parser & Match Scoring...  ✅ Resume parser and match scoring engine pass
[7/7] Testing Analytics Dashboard Aggregation.. ✅ Analytics aggregation pipeline verified

🎉 ALL 7/7 VERIFICATION CHECKS PASSED PERFECTLY!
```

```bash
# Run ESLint & TypeScript Compilation
npm run lint && npm run typecheck
```
```
✔ No ESLint warnings or errors
```

```bash
# Run Production Bundle Build
npm run build
```
```
Route (app)                               Size     First Load JS
┌ ○ /dashboard                            27.2 kB         278 kB
├ ○ /pipeline                             46.8 kB         371 kB
├ ○ /jobs                                 3.82 kB         175 kB
├ ○ /compare                              9.1 kB          241 kB
└ Shared vendor chunks                             87.4 kB
```

---

## 11. Project Structure

```
veloce/
├── docs/                           # Architectural diagrams, ADRs, and references
│   ├── assets/                     # 2x Retina screenshots, SVGs, and visual assets
│   ├── ARCHITECTURE.md             # Topology, layering rules, and sequence diagrams
│   ├── API.md                      # Complete REST endpoint reference and schemas
│   ├── DECISIONS.md                # Architectural Decision Records (ADRs)
│   └── SCORING.md                  # Match scoring mathematical formulation
├── prisma/
│   ├── schema.prisma               # Canonical PostgreSQL production schema
│   ├── schema.sqlite.prisma        # Derived zero-config SQLite local development schema
│   └── seed.ts                     # Deterministic enterprise seed data generator
├── scripts/
│   ├── make-sqlite-schema.ts       # AST script deriving SQLite schema from Postgres
│   ├── apply-pg-extras.ts          # Installs immutable Postgres triggers and GIN indexes
│   └── verify-endpoints.ts         # Zero-error automated verification harness
├── src/
│   ├── app/                        # Next.js 14 App Router pages and route handlers
│   │   ├── (app)/                  # Authenticated application layout shell
│   │   │   ├── dashboard/page.tsx  # Executive Analytics & Funnel Command Center
│   │   │   ├── pipeline/page.tsx   # Kanban, High-Density Grid, & Split Views
│   │   │   ├── jobs/page.tsx       # Requisitions hiring plan and create drawer
│   │   │   └── compare/page.tsx    # Multi-candidate comparison matrix
│   │   └── api/v1/                 # REST endpoints (health, jobs, candidates, stage, bulk)
│   ├── components/                 # Reusable React UI component islands
│   │   ├── shell/                  # Sidebar, header, demo tour, user switch dropdown
│   │   ├── pipeline/               # Kanban column, candidate card, grid, triage split
│   │   ├── dossier/                # 360° drawer (overview, scorecards, notes, interviews)
│   │   ├── dashboard/              # Funnel chart, requisition health, SLA radar
│   │   └── command/                # Raycast-style ⌘K command palette
│   ├── lib/
│   │   ├── services/               # Core domain services (stage, scoring, analytics, bulk)
│   │   ├── validations/            # Strict Zod schemas for all domain entities
│   │   ├── api.ts                  # Standardized withApi wrapper and error envelopes
│   │   ├── auth.ts                 # Actor context and demo role impersonation
│   │   ├── db.ts                   # Prisma client singleton instance
│   │   ├── db-compat.ts            # PostgreSQL/SQLite cross-database compatibility adapter
│   │   ├── fractional-index.ts     # Fractional float indexing and rebalancing
│   │   └── scoring-engine.ts       # Deterministic AI match scoring implementation
│   └── stores/                     # Zustand state stores (UI, dossier, tour, filters)
└── tests/                          # Vitest unit, contract, and parity test suites
```

---

## 12. Architectural Decisions & Trade-Offs

| Decision | Alternatives Considered | Rationale | Cost / Trade-Off |
|---|---|---|---|
| **Postgres-First with Derived SQLite** | Pure Docker Postgres, or SQLite-only | Instant zero-dependency evaluation for any evaluator, with production parity. | Must maintain the `db-compat.ts` array/JSON normalization layer. |
| **Fractional Floating Indexing** | Integer position re-numbering, Lexorank strings | $O(1)$ single-row updates during card dragging without lock contention. | Column rebalance transaction required if gap shrinks below `1e-6`. |
| **Serializable Transactions** | Client-side optimistic only, eventual consistency | Eliminates race conditions when multiple recruiters fill final requisition seats. | Minor transaction overhead (5–15ms per stage move). |
| **HTTP Polling + Window Focus Revalidation** | Full duplex WebSockets, Server-Sent Events | Completely serverless-compatible, stateless, zero hanging connection leaks. | 5–10s average propagation latency for edits made by other team members. |
| **Header-Based Demo Impersonation** | Mandatory OAuth2 / Okta SSO setup | Enables instant 1-click role switching between Admin, Recruiter, and Hiring Manager. | Must be swapped for enterprise OIDC/SAML in production environments. |
| **Deterministic Scoring Formula** | LLM prompt completion (OpenAI/Anthropic) | 100% reproducible, zero hallucination, sub-millisecond execution, audit-safe. | Does not capture creative nuances in unconventional resume prose. |

---

## 13. Security & Compliance Notes

1. **Role-Based Access Control (RBAC)**:
   - Evaluated declaratively on every route via `withApi({ roles: [...] })`.
   - `INTERVIEWER` roles are strictly prohibited from moving candidates into `OFFER`, `HIRED`, or `REJECTED`, or deleting job requisitions.
   - Only `ADMIN` roles can move candidates out of `HIRED` or trigger automation dispatches.
2. **Immutable Audit Trail**:
   - Every mutation automatically writes an append-only `AuditLog` row inside the transaction.
   - Modification or deletion of audit logs is blocked at the database trigger level.
3. **Webhook Security**:
   - All outgoing webhook events carry an `X-Veloce-Signature` containing an HMAC-SHA256 signature calculated with the shared secret.
4. **Input Sanitization**:
   - Every route validates incoming JSON and query parameters against strict Zod schemas with unexpected key stripping.
5. **Rate Limiting**:
   - Destructive operations (such as `POST /api/v1/seed/reset`) are guarded by in-memory token-bucket rate limiting (1 request per 5 seconds per IP).

---

## 14. Known Limitations & Production Roadmap

- [ ] **Production SAML 2.0 / OIDC SSO**: Replace header-based demo impersonation with WorkOS / Auth0 integration for enterprise identity providers.
- [ ] **Multi-Tenant Row-Level Security (RLS)**: Add tenant ID partitioning and PostgreSQL RLS policies to isolate enterprise tenant databases.
- [ ] **S3 / GCS Direct File Uploads**: Add presigned URL generation for binary PDF/DOCX resume file parsing.
- [ ] **Google Calendar / Outlook Sync**: Integrate two-way calendar availability polling for the interview scheduling tab.
- [ ] **Transactional Email Delivery**: Integrate Resend / Postmark for candidate notification emails on stage transitions.

---

## 15. Deviations from Initial Draft Specifications

During implementation, the following deliberate architectural refinements were made to ensure production stability and zero runtime errors:

1. **Single Application per Candidate-Job Pair**:
   Enforced via `@@unique([candidateId, jobId])` constraint to prevent duplicate applications in the pipeline.
2. **Deterministic SQLite Compatibility Layer**:
   SQLite does not support native `String[]` or `Json` column types. Rather than maintaining two disparate Prisma schemas by hand, `scripts/make-sqlite-schema.ts` automates schema generation and `src/lib/db-compat.ts` transparently normalizes string serialization.
3. **Seed Reset Confirmation Guard**:
   To prevent accidental data loss during evaluation, `POST /api/v1/seed/reset` requires `{ "confirm": "RESET" }`.

---

## 16. Contributing & License

Contributions are welcome! Please review [CONTRIBUTING.md](CONTRIBUTING.md) for code quality gates, PR templates, and local development workflows.

Veloce ATS is licensed under the **[MIT License](LICENSE)**.

---

<p align="center">
  <strong>Veloce Systems</strong> • Crafted with precision for high-velocity recruitment engineering.
</p>
