# Veloce ATS: System Architecture

Veloce ATS is engineered as an enterprise-grade applicant tracking platform prioritizing execution velocity, transactional integrity, and low cognitive overhead.

---

## 1. System Topology & Boundaries

```mermaid
graph TD
    subgraph Browser ["Client Presentation Tier (Edge / Browser)"]
        UI["Next.js App Router (Client Islands)"]
        RQ["TanStack React Query Cache"]
        ZS["Zustand UI & Keybinding Store"]
        DND["@dnd-kit Optimistic Kanban Engine"]
    end

    subgraph Server ["Next.js 14 Server Engine (Node.js)"]
        RH["Route Handlers (/api/v1/*)"]
        WA["withApi Guard (Zod Parse, RBAC, Actor Context)"]
        
        subgraph Services ["Domain Service Layer"]
            SE["Stage Engine (ACID Transitions)"]
            FI["Fractional Indexer (Order & Rebalance)"]
            SC["Deterministic Match Scoring Engine"]
            AP["Analytics & Funnel Aggregator"]
            AD["Automation & Webhook Dispatcher"]
        end
    end

    subgraph Data ["Persistence & Event Infrastructure"]
        PR["Prisma Client ORM (db-compat abstraction)"]
        PG[("PostgreSQL (Production)")]
        SQ[("SQLite (Zero-Config Local)")]
        WH[("External Webhook Endpoints")]
    end

    UI --> ZS
    UI --> DND
    DND --> RQ
    RQ -->|HTTP / JSON Envelopes| RH
    RH --> WA
    WA --> Services
    Services --> PR
    PR -->|PostgreSQL Target| PG
    PR -->|SQLite Target| SQ
    AD -.->|HMAC Signed Async Dispatch| WH
```

---

## 2. Layering & Architectural Boundaries

To preserve maintainability and eliminate circular dependencies, Veloce ATS enforces strict architectural boundaries:

1. **Presentation Components (`src/components/*`)**:
   - Pure UI or client-interactive islands (`use client`).
   - May consume TanStack Query hooks, Zustand store, and Tailwind classes.
   - **Never** import Prisma client, server filesystem, or secrets.
2. **Route Handlers (`src/app/api/v1/*`)**:
   - HTTP transport adapter layer.
   - Wrapped with `withApi()` for declarative schema parsing (`zod`), actor resolution (`getActor`), and standardized envelopes (`ApiResponse<T>`).
   - Delegate all mutations and aggregations directly to domain services.
3. **Domain Services (`src/lib/services/*`)**:
   - Encapsulate business invariants (stage progression rules, fractional rank calculation, audit logging).
   - Responsible for transaction boundaries (`prisma.$transaction`).
   - Decoupled from HTTP requests and response structures.
4. **Data Access & Compatibility Layer (`src/lib/db.ts`, `src/lib/db-compat.ts`)**:
   - Transparently normalizes differences between PostgreSQL (native JSON/arrays) and SQLite (serialized text strings).
   - Guarantees parity across development and production environments.

---

## 3. Transactional Kanban Drop Lifecycle

When a recruiter drags a candidate card between stages on the Kanban board:

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter
    participant UI as Kanban UI (@dnd-kit)
    participant RQ as TanStack Query Cache
    participant API as PATCH /api/v1/applications/:id/stage
    participant TX as Prisma $transaction
    participant Rules as Stage Rules Engine
    participant Log as StageTransitionLog & AuditLog
    participant Auto as Automation Dispatcher

    Recruiter->>UI: Drags card to "TECHNICAL_INTERVIEW"
    UI->>RQ: Optimistically reorders column and sets stage
    UI->>API: PATCH /api/v1/applications/:id/stage { toStage, expectedVersion: 0, beforeId, afterId }
    
    API->>TX: Begin serializable transaction
    TX->>Rules: Validate role permissions, gating scorecards, & headcount
    alt Rule Violation or Version Conflict (OCC)
        Rules-->>TX: Error (409 Conflict or 422 Rule Violation)
        TX-->>API: Rollback transaction
        API-->>RQ: HTTP 409/422 Error Envelope
        RQ-->>UI: Revert optimistic state & toast error
    else Transition Permitted
        Rules-->>TX: OK (valid transition)
        TX->>TX: Compute fractional rank (rebalance if gap <= 1e-6)
        TX->>Log: Append StageTransitionLog (duration, movedById, from/to)
        TX->>Log: Append immutable AuditLog
        TX->>TX: Update Application (version++, kanbanOrder, stage)
        TX-->>API: Commit transaction & return updated record + undoToken
        API-->>RQ: HTTP 200 OK Envelope
        RQ-->>UI: Reconcile server response with optimistic cache
        API-)Auto: Fire STAGE_ENTERED event (HMAC signed webhook async)
    end
```

---

## 4. Concurrency & Locking Strategy

- **Optimistic Concurrency Control (OCC)**:
  Every `Application` row contains an integer `version` field. When a mutation request is submitted, clients pass `expectedVersion`. If another recruiter or background sync updated the application in the interim (`version !== expectedVersion`), the transaction immediately aborts with `HTTP 409 Conflict`.
- **Database Serialization**:
  On SQLite, write transactions are serialized at the file lock level. On PostgreSQL, `prisma.$transaction` executes with isolation to guarantee that headcount decrements and job auto-closures are race-condition free.
