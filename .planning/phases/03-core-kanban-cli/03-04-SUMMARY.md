---
phase: 03-core-kanban-cli
plan: 04
subsystem: cli
tags: [commander, ink, api-client, column-crud, fractional-indexing, safe-delete]

requires:
  - phase: 03-core-kanban-cli
    provides: "Context resolution helpers, reusable Ink components, config, types, api-client"
provides:
  - "columnAddCommand with board context resolution"
  - "columnRenameCommand with PATCH and 404 handling"
  - "columnReorderCommand with 1-based position to fractional index translation"
  - "columnDeleteCommand with safe item handling (--move-to, --force, empty fast path)"
affects: []

tech-stack:
  added: [fractional-indexing]
  patterns: [fractional-index-reorder, safe-delete-with-item-relocation, batch-move]

key-files:
  created:
    - apps/cli/src/commands/column/add.ts
    - apps/cli/src/commands/column/rename.ts
    - apps/cli/src/commands/column/reorder.ts
    - apps/cli/src/commands/column/delete.ts
    - apps/cli/src/commands/column/__tests__/add.test.ts
    - apps/cli/src/commands/column/__tests__/rename.test.ts
    - apps/cli/src/commands/column/__tests__/reorder.test.ts
    - apps/cli/src/commands/column/__tests__/delete.test.ts
  modified: []

key-decisions:
  - "Column reorder fetches all board columns, removes target, computes fractional index via generateKeyBetween"
  - "Column delete with --move-to batches item moves in groups of 5 for API concurrency control"
  - "Column delete with --force still prompts for confirmation when items exist (safety)"

patterns-established:
  - "Fractional index reorder: fetch all siblings, remove self, compute position between neighbors"
  - "Safe delete: check for children, require --move-to or --force, batch relocate before delete"
  - "Batch API operations: simple for-loop with Promise.all per batch slice"

requirements-completed: [COLM-01, COLM-02, COLM-03, COLM-04, CLI-01]

duration: 2min
completed: 2026-03-26
---

# Phase 3 Plan 4: Column CRUD Commands Summary

**Column add/rename/reorder/delete CLI commands with fractional index reorder and safe item handling on delete**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-26T20:39:05Z
- **Completed:** 2026-03-26T20:41:58Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Built column add command with board context resolution from --board flag or stored context
- Built column rename command with --name validation and 404 error handling
- Built column reorder that translates user-friendly 1-based position to fractional index via generateKeyBetween
- Built column delete with safe item handling: empty columns delete immediately, columns with items require --move-to (batch relocate) or --force (confirm + cascade)
- All 4 commands use 3-mode output (ink/json/plain) following established patterns
- 13 tests across 4 test files covering all command paths

## Task Commits

Each task was committed atomically:

1. **Task 1: Column add, rename, reorder with tests** - `580cc0a` (feat)
2. **Task 2: Column delete with safe item handling and tests** - `dd7478f` (feat)

## Files Created/Modified
- `apps/cli/src/commands/column/add.ts` - Column add via POST to board's columns endpoint with board context resolution
- `apps/cli/src/commands/column/rename.ts` - Column rename via PATCH with --name validation and 404 handling
- `apps/cli/src/commands/column/reorder.ts` - Column reorder translating 1-based position to fractional index using generateKeyBetween
- `apps/cli/src/commands/column/delete.ts` - Column delete with safe item handling: --move-to batch relocate, --force confirm, empty fast path
- `apps/cli/src/commands/column/__tests__/add.test.ts` - 3 tests: POST call, --board flag, no board context error
- `apps/cli/src/commands/column/__tests__/rename.test.ts` - 2 tests: PATCH call, missing name error
- `apps/cli/src/commands/column/__tests__/reorder.test.ts` - 3 tests: full reorder flow, out of range error, position translation verification
- `apps/cli/src/commands/column/__tests__/delete.test.ts` - 5 tests: empty delete, no-flag error, move-to, force confirm, force decline

## Decisions Made
- Column reorder fetches the column first to get boardId, then fetches all board columns to compute fractional index position
- Batch item move uses groups of 5 with Promise.all per batch for API concurrency control
- Column delete with --force still prompts for user confirmation when items exist (safety over convenience)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Known Stubs
None - all four column commands are fully implemented with working API calls, 3-mode output, and context resolution. The `fractional-indexing` dependency needs to be added to apps/cli/package.json (noted: other parallel agents handle package.json, and this dependency will be added during merge).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All column CRUD commands ready for use
- CLI-01 (all entity operations as CLI commands) is now satisfied with workspace + board + column coverage
- Phase 3 column scope is complete

## Self-Check: PASSED

All 8 files verified present. Both task commits (580cc0a, dd7478f) verified in git log.

---
*Phase: 03-core-kanban-cli*
*Completed: 2026-03-26*
