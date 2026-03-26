# Phase 1: Foundation & API - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 01-foundation-api
**Areas discussed:** ID format & naming, API design style, Delete behavior, Pagination style, Workspace defaults, API versioning

---

## ID Format & Naming

### Entity ID format

| Option | Description | Selected |
|--------|-------------|----------|
| Prefixed nanoid | e.g. wks_a3bK9x. Short, human-typeable, type hint in the ID | ✓ |
| Plain nanoid | e.g. a3bK9x. Shorter but no type hint | |
| UUID v4 | Standard but long, painful to type in CLI | |

**User's choice:** Prefixed nanoid
**Notes:** None

### Prefix convention

| Option | Description | Selected |
|--------|-------------|----------|
| 3-letter prefixes | wks_, brd_, col_, itm_, usr_. Clear, consistent | ✓ |
| 2-letter prefixes | ws_, bd_, cl_, it_, us_. More compact but less obvious | |
| You decide | Claude picks | |

**User's choice:** 3-letter prefixes
**Notes:** None

### Random part length

| Option | Description | Selected |
|--------|-------------|----------|
| 12 characters | ~71 bits of entropy, reasonable to type | ✓ |
| 8 characters | Shorter but higher collision risk (~47 bits) | |
| You decide | Claude picks | |

**User's choice:** 12 characters
**Notes:** None

### Slugs in URLs

| Option | Description | Selected |
|--------|-------------|----------|
| IDs only | /boards/brd_a3bK9xmP2qL1. Simpler, rename-safe | ✓ |
| Slug + ID hybrid | /boards/my-project-brd_a3bK. Human-readable but complex | |
| You decide | Claude picks | |

**User's choice:** IDs only
**Notes:** None

---

## API Design Style

### Response shape

| Option | Description | Selected |
|--------|-------------|----------|
| Envelope with data key | { "data": {...}, "meta": {...} }. Consistent, extensible | ✓ |
| Flat responses | Direct objects, pagination in headers. Simpler but harder to extend | |
| You decide | Claude picks | |

**User's choice:** Envelope with data key
**Notes:** None

### Error format

| Option | Description | Selected |
|--------|-------------|----------|
| Structured error object | { "error": { "code": "...", "message": "...", "details": {...} } } | ✓ |
| Simple message only | { "error": "Item not found" }. Minimal | |
| You decide | Claude picks | |

**User's choice:** Structured error object
**Notes:** None

### Nested resources

| Option | Description | Selected |
|--------|-------------|----------|
| Nested routes | /workspaces/:id/boards, /boards/:id/columns. Clear hierarchy | ✓ |
| Flat routes with query params | /boards?workspace=wks_abc. Simpler routing | |
| Hybrid | Nested for creation, flat for direct access | |
| You decide | Claude picks | |

**User's choice:** Nested routes
**Notes:** None

### REST conventions

| Option | Description | Selected |
|--------|-------------|----------|
| Pragmatic REST | Standard verbs + action endpoints where natural (POST /items/:id/move) | ✓ |
| Strict RESTful | Everything is a resource, no action endpoints | |
| You decide | Claude picks | |

**User's choice:** Pragmatic REST
**Notes:** None

---

## Delete Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Hard delete | Permanently removed. Simpler schema, no ghost data | ✓ |
| Soft delete everywhere | deletedAt timestamp, filtered from queries. Enables undo | |
| Soft delete items only | Hard delete containers, soft delete items | |
| You decide | Claude picks | |

**User's choice:** Hard delete
**Notes:** None

---

## Pagination Style

| Option | Description | Selected |
|--------|-------------|----------|
| Cursor-based | ?cursor=abc&limit=20. Stable with concurrent changes | ✓ |
| Offset/limit | ?page=2&limit=20. Simpler but can skip/duplicate items | |
| You decide | Claude picks | |

**User's choice:** Cursor-based
**Notes:** None

---

## Workspace Defaults

| Option | Description | Selected |
|--------|-------------|----------|
| Empty — no defaults | User creates everything explicitly | ✓ |
| Default workspace + board | Auto-create "My Workspace" with "Getting Started" board | |
| Default workspace only | Auto-create workspace, no boards | |

**User's choice:** Empty — no defaults
**Notes:** None

---

## API Versioning

| Option | Description | Selected |
|--------|-------------|----------|
| URL prefix /api/v1 | All routes under /api/v1/. Explicit, easy to reason about | ✓ |
| No versioning for v1 | Just /api/. Add versioning later. YAGNI | |
| You decide | Claude picks | |

**User's choice:** URL prefix /api/v1
**Notes:** None

---

## Claude's Discretion

- Fractional indexing implementation details
- Database schema design
- JWT token structure and expiry
- Hono middleware organization
- Zod schema structure
- Monorepo workspace configuration

## Deferred Ideas

None — discussion stayed within phase scope
