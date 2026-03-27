---
phase: 05-web-app
plan: 04
subsystem: ui
tags: [dnd-kit, drag-and-drop, react, optimistic-updates, fractional-indexing]

requires:
  - phase: 05-web-app/01
    provides: "positions.ts calculatePosition helper and fractional-indexing library"
  - phase: 05-web-app/02
    provides: "useMoveItem mutation hook for API persistence"
  - phase: 05-web-app/03
    provides: "BoardView, Column, Card components and useBoardData hook"
provides:
  - "Drag-and-drop card reordering between columns (WEB-02)"
  - "Drag-and-drop card reordering within columns (WEB-03)"
  - "Optimistic UI updates with rollback on API error (D-08)"
  - "Ghost card effect during drag (D-07)"
  - "Drop zone visual indicator (D-07)"
  - "useOptimisticMove hook for DnD state management"
affects: [05-web-app/05]

tech-stack:
  added: []
  patterns: ["useOptimisticMove hook pattern for DnD with API sync and rollback"]

key-files:
  created:
    - apps/web/src/hooks/use-optimistic-move.ts
  modified:
    - apps/web/src/components/board/BoardView.tsx
    - apps/web/src/components/board/Column.tsx
    - apps/web/src/components/board/Card.tsx
    - apps/web/src/test-helpers/setup.ts
    - apps/web/src/components/board/BoardView.test.tsx

key-decisions:
  - "Used @dnd-kit/helpers move() for cross-column item reordering state management"
  - "Used any type for dragEnd event due to union type incompatibility with canceled property"

patterns-established:
  - "Optimistic DnD: snapshot pre-drag state, update locally on dragOver, persist on dragEnd, rollback on error"
  - "useSortable with group prop for cross-column card movement"

requirements-completed: [WEB-02, WEB-03]

duration: 3min
completed: 2026-03-27
---

# Phase 5 Plan 4: Drag-and-Drop Summary

**@dnd-kit/react drag-and-drop with optimistic moves, fractional-index positions, ghost effects, and API rollback**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T01:37:09Z
- **Completed:** 2026-03-27T01:40:19Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Cards are draggable between columns and reorderable within columns using @dnd-kit/react sortable
- Optimistic UI: board updates instantly on drag, API call fires in background, rollback on error
- Ghost card effect (50% opacity) during drag per design spec D-07
- Drop zone visual indicator (dashed blue border) on target column per D-07
- Fractional-index position calculation ensures correct ordering persists to API

## Task Commits

Each task was committed atomically:

1. **Task 1: Optimistic move hook with fractional-index position calculation** - `53c3412` (feat)
2. **Task 2: Wire @dnd-kit into BoardView, Column, and Card** - `c00252e` (feat)

## Files Created/Modified
- `apps/web/src/hooks/use-optimistic-move.ts` - Optimistic DnD state hook with snapshot/rollback and fractional-index position calculation
- `apps/web/src/components/board/BoardView.tsx` - Added DragDropProvider wrapper connected to optimistic move hook
- `apps/web/src/components/board/Column.tsx` - Added useDroppable hook with drop target visual indicator
- `apps/web/src/components/board/Card.tsx` - Changed from button to div with useSortable hook and ghost opacity
- `apps/web/src/test-helpers/setup.ts` - Added ResizeObserver mock for dnd-kit jsdom compatibility
- `apps/web/src/components/board/BoardView.test.tsx` - Added useMoveItem mock

## Decisions Made
- Used `any` type for dragEnd event handler because the `move()` helper's union type (`dragover | dragend`) doesn't expose `canceled` on the dragover branch, causing TypeScript errors when checking `event.canceled`
- Skipped `CollisionPriority` import from `@dnd-kit/abstract` since pnpm strict mode doesn't expose transitive dependencies; the default collision priority works correctly without explicit configuration

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added ResizeObserver mock for jsdom test environment**
- **Found during:** Task 2 (wiring dnd-kit into components)
- **Issue:** @dnd-kit/dom uses ResizeObserver which is not available in jsdom, causing BoardView tests to fail
- **Fix:** Added ResizeObserver polyfill mock in apps/web/src/test-helpers/setup.ts
- **Files modified:** apps/web/src/test-helpers/setup.ts
- **Verification:** All 3 test files pass (7 tests + 4 todo)
- **Committed in:** c00252e (Task 2 commit)

**2. [Rule 3 - Blocking] Added useMoveItem mock to BoardView test**
- **Found during:** Task 2 (wiring dnd-kit into components)
- **Issue:** BoardView now uses useOptimisticMove which calls useMoveItem, but the test mock only had useCreateItem
- **Fix:** Added useMoveItem to the vi.mock return
- **Files modified:** apps/web/src/components/board/BoardView.test.tsx
- **Verification:** BoardView tests pass
- **Committed in:** c00252e (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for test compatibility after adding dnd-kit. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all DnD functionality is fully wired to the existing API hooks and position calculation.

## Next Phase Readiness
- Drag-and-drop is fully functional, ready for Plan 05 (item detail modal)
- useOptimisticMove hook available for any future DnD enhancements

---
*Phase: 05-web-app*
*Completed: 2026-03-27*
