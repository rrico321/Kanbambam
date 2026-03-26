# Phase 1: Foundation & API - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a working monorepo with shared Zod schemas, a PostgreSQL database, and a REST API that serves full CRUD for the Kanban data model (workspaces, boards, columns, items) with JWT authentication. Any HTTP client can perform all operations after this phase.

</domain>

<decisions>
## Implementation Decisions

### ID Format & Naming
- **D-01:** Prefixed nanoid IDs — every entity gets a 3-letter prefix + underscore + 12 random characters (e.g., `wks_a3bK9xmP2qL1`, `brd_mP2qL1zR4nW8`)
- **D-02:** Prefixes: `wks_` (workspace), `brd_` (board), `col_` (column), `itm_` (item), `usr_` (user)
- **D-03:** IDs only in URLs — no slugs. Rename doesn't break URLs, no uniqueness constraints on names.

### API Response Format
- **D-04:** Envelope format with `data` key. Single: `{ "data": {...}, "meta": { "requestId": "..." } }`. List: `{ "data": [...], "meta": { "total": 42, "cursor": "..." } }`
- **D-05:** Structured error objects: `{ "error": { "code": "ITEM_NOT_FOUND", "message": "Item not found", "details": {...} } }`. Machine-parseable code for CLI, human message for display.

### API Routing & Style
- **D-06:** Nested REST routes following hierarchy: `/api/v1/workspaces/:id/boards`, `/api/v1/boards/:id/columns`, `/api/v1/columns/:id/items`
- **D-07:** Pragmatic REST — standard CRUD verbs (GET/POST/PATCH/DELETE) plus action endpoints where natural (e.g., `POST /items/:id/move`)
- **D-08:** URL-based versioning: all routes under `/api/v1/` prefix

### Data Behavior
- **D-09:** Hard delete — data is permanently removed on delete. No soft-delete, no trash. Keeps v1 schema and queries simple.
- **D-10:** Cursor-based pagination on all list endpoints (`?cursor=abc&limit=20`). Stable with concurrent changes, better performance at scale.
- **D-11:** Empty start on signup — no default workspace or board auto-created. User creates everything explicitly.

### Claude's Discretion
- Fractional indexing implementation details (library choice, index format)
- Database schema design (table structure, indexes, constraints)
- JWT token structure and expiry settings
- Hono middleware organization
- Zod schema structure in shared package
- Monorepo workspace configuration

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specs
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — Full v1 requirements with traceability (Phase 1: API-01 through API-04, AUTH-06)
- `.planning/ROADMAP.md` — Phase 1 success criteria and dependency chain

### Technology Stack
- `CLAUDE.md` §Recommended Stack — Full technology decisions with versions, rationale, and compatibility notes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, only CLAUDE.md exists

### Established Patterns
- None — patterns will be established in this phase

### Integration Points
- This phase establishes the foundation that all subsequent phases build on
- Shared Zod schemas (packages/shared) will be consumed by CLI (Phase 2-4) and Web (Phase 5)
- API endpoints will be consumed by CLI auth flow (Phase 2), CLI CRUD (Phase 3-4), and Web app (Phase 5)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for all implementation details within the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-api*
*Context gathered: 2026-03-25*
