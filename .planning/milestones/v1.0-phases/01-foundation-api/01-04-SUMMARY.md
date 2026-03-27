---
phase: 01-foundation-api
plan: 04
subsystem: api
tags: [hono, drizzle, fractional-indexing, crud, columns, items, pagination]

# Dependency graph
requires:
  - phase: 01-foundation-api/02
    provides: "API server core, auth middleware, lib helpers (id, pagination, fractional-index)"
provides:
  - "Column CRUD endpoints (5 routes) with fractional indexing"
  - "Item CRUD + move endpoints (6 routes) with fractional indexing"
  - "Ownership verification helpers (verifyBoardOwnership, verifyColumnOwnership)"
  - "Complete REST API for Kanban data model (11 new endpoints)"
affects: [02-cli-core, 05-web-app]

# Tech tracking
tech-stack:
  added: []
  patterns: ["COLLATE C for fractional-index position ordering in PostgreSQL", "ownership chain verification via SQL joins", "cursor-based pagination by position"]

key-files:
  created:
    - apps/api/src/routes/columns/columns.routes.ts
    - apps/api/src/routes/columns/columns.handlers.ts
    - apps/api/src/routes/columns/columns.test.ts
    - apps/api/src/routes/items/items.routes.ts
    - apps/api/src/routes/items/items.handlers.ts
    - apps/api/src/routes/items/items.test.ts
  modified:
    - apps/api/src/app.ts

key-decisions:
  - "COLLATE C required for fractional-indexing position sorting in PostgreSQL (default locale collation sorts uppercase after lowercase, breaking fractional-index key ordering)"

patterns-established:
  - "COLLATE C on all position ORDER BY and comparison clauses when using fractional-indexing library"
  - "Ownership chain verification via inner joins back to user for multi-level entity access control"
  - "Reuse verifyColumnOwnership from columns.handlers in items.handlers for DRY ownership checks"

requirements-completed: [API-01, API-03, API-04]

# Metrics
duration: 7min
completed: 2026-03-26
---

# Phase 1 Plan 4: Column & Item CRUD Summary

**11 REST endpoints for column and item CRUD with fractional indexing, cursor pagination, and ownership chain verification**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-26T04:09:22Z
- **Completed:** 2026-03-26T04:17:21Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- 5 column endpoints: list, create, get, update, delete with fractional index ordering
- 6 item endpoints: list, create, get, update, delete, move with cross-column transfer support
- Ownership chain verification (column -> board -> workspace -> user) ensures data isolation
- 32 integration tests covering CRUD, ordering, reordering, move, pagination, and ownership enforcement

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement column CRUD routes with fractional indexing and tests** - `01484c2` (feat)
2. **Task 2: Implement item CRUD and move routes with fractional indexing and tests** - `6e4b9f3` (feat)

## Files Created/Modified
- `apps/api/src/routes/columns/columns.routes.ts` - OpenAPI route definitions for 5 column endpoints
- `apps/api/src/routes/columns/columns.handlers.ts` - Column CRUD handlers with ownership verification helpers
- `apps/api/src/routes/columns/columns.test.ts` - 15 integration tests for columns
- `apps/api/src/routes/items/items.routes.ts` - OpenAPI route definitions for 6 item endpoints
- `apps/api/src/routes/items/items.handlers.ts` - Item CRUD + move handlers with fractional indexing
- `apps/api/src/routes/items/items.test.ts` - 17 integration tests for items
- `apps/api/src/app.ts` - Mounted column and item route handlers

## Decisions Made
- Used COLLATE "C" on all position ORDER BY and cursor comparison queries to ensure fractional-indexing keys sort correctly in PostgreSQL (default locale collation breaks the library's key ordering assumptions)
- Exported verifyBoardOwnership and verifyColumnOwnership from column handlers for reuse by item handlers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed fractional-index position sorting with COLLATE "C"**
- **Found during:** Task 2 (Item reorder test failing)
- **Issue:** PostgreSQL default locale collation sorts uppercase letters after lowercase (e.g., `Zz > a0`), but fractional-indexing library generates keys that require byte-order (C locale) sorting where `Zz < a0`
- **Fix:** Added `COLLATE "C"` to all ORDER BY position clauses and cursor comparison conditions in both column and item handlers
- **Files modified:** apps/api/src/routes/columns/columns.handlers.ts, apps/api/src/routes/items/items.handlers.ts
- **Verification:** All 32 tests pass including reorder tests that exercise position sorting
- **Committed in:** 6e4b9f3 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for correctness of fractional-index ordering. No scope creep.

## Issues Encountered
- Pre-existing auth test failures (from Plan 02) due to DB state -- unrelated to this plan's changes, not addressed

## Known Stubs
None -- all endpoints are fully wired to the database with real data flow.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full Kanban data model API is operational (workspaces, boards, columns, items pending workspace/board routes from Plan 03)
- Column and item routes are functional and can be tested independently via direct DB setup
- Ready for CLI integration in Phase 2

## Self-Check: PASSED

All 7 created/modified files verified present. Both task commits (01484c2, 6e4b9f3) verified in git log.

---
*Phase: 01-foundation-api*
*Completed: 2026-03-26*
