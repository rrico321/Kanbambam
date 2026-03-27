---
phase: 04-item-management
plan: 03
subsystem: cli
tags: [commander, ink, item-move, item-reorder, board-view, fractional-indexing, kanban-layout]

# Dependency graph
requires:
  - phase: 04-item-management
    provides: Item create/list/show commands, ItemResponse type, resolveColumnId helper
  - phase: 03-workspace-board-column-commands
    provides: Column reorder fractional indexing pattern, CLI command registration pattern
provides:
  - Item move command (POST /move with target columnId)
  - Item reorder command (fractional indexing within column)
  - Board view command with Kanban layout (columns + items in parallel)
  - BoardView Ink component with due date coloring
  - All item commands registered in CLI entry point
affects: [05-web-app]

# Tech tracking
tech-stack:
  added: []
  patterns: [board-view-parallel-fetch, plain-text-kanban-fallback]

key-files:
  created:
    - apps/cli/src/commands/item/move.ts
    - apps/cli/src/commands/item/reorder.ts
    - apps/cli/src/commands/board/view.ts
    - apps/cli/src/components/BoardView.tsx
    - apps/cli/src/commands/item/__tests__/move.test.ts
    - apps/cli/src/commands/item/__tests__/reorder.test.ts
    - apps/cli/src/commands/board/__tests__/view.test.ts
  modified:
    - apps/cli/src/index.ts

key-decisions:
  - "Board view fetches items per column in parallel via Promise.all for performance"
  - "Item reorder replicates column reorder fractional indexing pattern exactly"

patterns-established:
  - "Parallel item fetch: Promise.all across columns for board view aggregation"
  - "Plain text Kanban fallback: chalk-colored due dates in non-TTY output"

requirements-completed: [ITEM-03, ITEM-04]

# Metrics
duration: 3min
completed: 2026-03-26
---

# Phase 04 Plan 03: Item Move, Reorder, Board View Summary

**Item move/reorder with fractional indexing, Kanban board view with parallel fetch and due date coloring, all 7 item commands registered in CLI**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-26T22:25:13Z
- **Completed:** 2026-03-26T22:28:15Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Item move command sends POST /move with target columnId for cross-column moves
- Item reorder command computes fractional index via generateKeyBetween for within-column repositioning
- Board view fetches columns then items in parallel, renders horizontal Kanban layout via Ink
- BoardView component colors due dates red (overdue) and yellow (today)
- All 7 item subcommands + board view registered in CLI entry point with lazy imports
- Full test suite: 99 tests across 29 files all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Create item move and item reorder commands with tests** - `1ea8e27` (feat)
2. **Task 2: Create board view command with BoardView component and register all commands** - `4216b4c` (feat)

## Files Created/Modified
- `apps/cli/src/commands/item/move.ts` - Item move command (POST /move with target column)
- `apps/cli/src/commands/item/reorder.ts` - Item reorder with fractional indexing
- `apps/cli/src/commands/board/view.ts` - Board view command with parallel item fetch
- `apps/cli/src/components/BoardView.tsx` - Ink component for Kanban board layout
- `apps/cli/src/commands/item/__tests__/move.test.ts` - 3 tests for move command
- `apps/cli/src/commands/item/__tests__/reorder.test.ts` - 3 tests for reorder command
- `apps/cli/src/commands/board/__tests__/view.test.ts` - 2 tests for board view
- `apps/cli/src/index.ts` - Registered all 7 item subcommands + board view + collect helper

## Decisions Made
- Board view fetches items per column in parallel via Promise.all for performance
- Item reorder replicates column reorder fractional indexing pattern exactly (same generateKeyBetween logic)
- Plain text fallback uses chalk for due date coloring in non-TTY environments

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All item CRUD commands complete (create, list, show, edit, move, reorder, delete)
- Board view with Kanban layout available
- CLI fully wired with all commands registered
- Ready for Phase 05 (web app)

## Self-Check: PASSED
