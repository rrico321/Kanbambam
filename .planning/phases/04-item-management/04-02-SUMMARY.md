---
phase: 04-item-management
plan: 02
subsystem: cli
tags: [commander, ink, item-crud, patch, delete, clearing-semantics]

# Dependency graph
requires:
  - phase: 04-item-management
    provides: ItemResponse type, api-client, output helpers, ErrorDisplay/SuccessMessage components
provides:
  - Item edit command (PATCH /api/v1/items/{id}) with title, description, labels, due-date flags
  - Item delete command (DELETE /api/v1/items/{id}) with GET-first confirmation pattern
  - collect() helper for repeatable Commander flags
affects: [04-item-management]

# Tech tracking
tech-stack:
  added: []
  patterns: [clearing-semantics-empty-string-to-null, repeatable-flag-collection, get-first-delete-confirmation]

key-files:
  created:
    - apps/cli/src/commands/item/edit.ts
    - apps/cli/src/commands/item/delete.ts
    - apps/cli/src/commands/item/__tests__/edit.test.ts
    - apps/cli/src/commands/item/__tests__/delete.test.ts
  modified: []

key-decisions:
  - "Empty string clears nullable fields (description, labels, due date) by sending null in PATCH body"
  - "Labels use replace-all semantics: --label replaces entire array, --label '' clears all"
  - "Due date validated with YYYY-MM-DD regex before sending to API"

patterns-established:
  - "Clearing semantics: empty string flag value maps to null in API body (D-04/D-05/D-07)"
  - "Repeatable flags: collect() function concatenates repeated --label values into array"
  - "GET-first delete: fetch entity for display name before confirmation prompt"

requirements-completed: [ITEM-02, ITEM-05, ITEM-06, ITEM-07, ITEM-08]

# Metrics
duration: 2min
completed: 2026-03-26
---

# Phase 04 Plan 02: Item Edit & Delete Summary

**Item edit command with clearing semantics for description/labels/due-date and item delete with GET-first confirmation pattern**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-26T22:25:07Z
- **Completed:** 2026-03-26T22:26:49Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Implemented item edit command combining title, description, labels, due-date in single PATCH
- Empty string clearing semantics: description='', labels=[''], dueDate='' all map to null per design decisions D-04/D-05/D-07
- Implemented item delete with GET-first confirmation pattern and --force bypass
- All 14 tests passing across 2 test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Create item edit command with combined PATCH and clearing semantics** - `035dce9` (feat)
2. **Task 2: Create item delete command with GET-first confirmation pattern** - `303aed1` (feat)

## Files Created/Modified
- `apps/cli/src/commands/item/edit.ts` - Item edit command with PATCH, clearing semantics, date validation
- `apps/cli/src/commands/item/delete.ts` - Item delete command with GET-first confirmation and --force
- `apps/cli/src/commands/item/__tests__/edit.test.ts` - 10 tests for edit command
- `apps/cli/src/commands/item/__tests__/delete.test.ts` - 4 tests for delete command

## Decisions Made
- Empty string clears nullable fields by sending null in PATCH body (consistent pattern for description, labels, due date)
- Labels use replace-all semantics: each edit replaces entire label array rather than appending
- Due date validated with YYYY-MM-DD regex client-side before API call

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Item edit and delete commands complete
- Ready for item move command in Plan 03
- All item mutation commands (create, edit, delete) now available

## Self-Check: PASSED

All 4 files verified present. Both commit hashes (035dce9, 303aed1) confirmed in git log.

---
*Phase: 04-item-management*
*Completed: 2026-03-26*
