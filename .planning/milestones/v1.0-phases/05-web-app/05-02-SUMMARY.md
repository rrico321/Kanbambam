---
phase: 05-web-app
plan: 02
subsystem: ui
tags: [react, tanstack-query, next.js, sidebar, navigation, tailwind]

requires:
  - phase: 05-web-app/01
    provides: "Next.js app scaffold, auth pages, TanStack Query provider, api client"
provides:
  - "Collapsible sidebar with workspace/board tree navigation"
  - "AppShell layout component wrapping sidebar + main content"
  - "TanStack Query hooks for all CRUD operations (workspace, board, column, item)"
  - "Column CRUD hooks (useCreateColumn, useRenameColumn, useDeleteColumn) per D-17"
  - "Board page route placeholder at /boards/[boardId]"
  - "Workspace list landing page with create form"
  - "EmptyState and LoadingSkeleton UI primitives"
  - "Home redirect logic based on last-visited board"
  - "ThemeToggle for dark/light mode switching"
affects: [05-web-app/03, 05-web-app/04, 05-web-app/05]

tech-stack:
  added: ["@tanstack/react-query", "sonner", "lucide-react", "@testing-library/react", "@testing-library/jest-dom", "vitest (web)", "jsdom"]
  patterns: ["TanStack Query hooks with toast notifications", "AppShell layout pattern", "localStorage for sidebar state persistence"]

key-files:
  created:
    - apps/web/src/hooks/use-api.ts
    - apps/web/src/components/sidebar/Sidebar.tsx
    - apps/web/src/components/sidebar/WorkspaceTree.tsx
    - apps/web/src/components/sidebar/SidebarToggle.tsx
    - apps/web/src/components/layout/AppShell.tsx
    - apps/web/src/components/layout/ThemeToggle.tsx
    - apps/web/src/components/ui/EmptyState.tsx
    - apps/web/src/components/ui/LoadingSkeleton.tsx
    - apps/web/src/app/workspaces/page.tsx
    - apps/web/src/app/boards/[boardId]/page.tsx
    - apps/web/src/app/HomeRedirect.tsx
    - apps/web/src/components/sidebar/Sidebar.test.tsx
    - apps/web/vitest.config.ts
    - apps/web/vitest.setup.ts
  modified:
    - apps/web/src/lib/api.ts
    - apps/web/src/app/page.tsx
    - apps/web/package.json

key-decisions:
  - "Expanded api.ts from apiPost-only to full get/post/patch/delete client with credentials include"
  - "Used localStorage for last-visited board persistence (D-16)"
  - "Created ThemeToggle component using document.documentElement.classList for dark mode"
  - "Set up vitest with jsdom and @vitejs/plugin-react v4 for web app testing"

patterns-established:
  - "AppShell pattern: pages wrap content in <AppShell> to get sidebar"
  - "TanStack Query hooks: one file (use-api.ts) centralizes all data fetching"
  - "Toast notifications via sonner on mutation success/error"

requirements-completed: [WEB-05]

duration: 5min
completed: 2026-03-27
---

# Phase 5 Plan 2: Navigation Shell Summary

**Collapsible sidebar with workspace/board tree, TanStack Query data hooks for all entities, AppShell layout, and route structure with home redirect logic**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-27T01:15:28Z
- **Completed:** 2026-03-27T01:20:45Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Full TanStack Query hook layer covering workspace, board, column (D-17), and item CRUD plus move operations
- Collapsible sidebar with workspace sections expanding to show boards, active board highlighting, and localStorage persistence
- AppShell layout pattern with sidebar + main content area used by all authenticated pages
- Home page redirect to last-visited board or workspace list, board page route placeholder ready for Plan 03

## Task Commits

Each task was committed atomically:

1. **Task 1: TanStack Query hooks, UI primitives, workspace list page** - `e870f33` (feat)
2. **Task 2: Sidebar, AppShell, route structure, home redirect, Sidebar test** - `ab8ee1d` (feat)

## Files Created/Modified
- `apps/web/src/hooks/use-api.ts` - Central TanStack Query hooks for all entity CRUD
- `apps/web/src/components/sidebar/Sidebar.tsx` - Collapsible sidebar container with workspace tree
- `apps/web/src/components/sidebar/WorkspaceTree.tsx` - Expandable workspace sections with board links
- `apps/web/src/components/sidebar/SidebarToggle.tsx` - Collapse/expand toggle button
- `apps/web/src/components/layout/AppShell.tsx` - Sidebar + main content layout wrapper
- `apps/web/src/components/layout/ThemeToggle.tsx` - Dark/light mode toggle
- `apps/web/src/components/ui/EmptyState.tsx` - Reusable empty state component
- `apps/web/src/components/ui/LoadingSkeleton.tsx` - Board and sidebar skeleton loaders
- `apps/web/src/app/workspaces/page.tsx` - Workspace list page with create form
- `apps/web/src/app/boards/[boardId]/page.tsx` - Board page route placeholder
- `apps/web/src/app/HomeRedirect.tsx` - Client-side redirect based on localStorage
- `apps/web/src/app/page.tsx` - Updated home page with auth check and redirect
- `apps/web/src/lib/api.ts` - Expanded to full REST client (get/post/patch/delete)
- `apps/web/src/components/sidebar/Sidebar.test.tsx` - Sidebar rendering tests
- `apps/web/vitest.config.ts` - Vitest configuration for web app
- `apps/web/vitest.setup.ts` - Test setup with jest-dom matchers
- `apps/web/package.json` - Added dependencies and test script

## Decisions Made
- Expanded api.ts from single apiPost to full REST client object -- hooks needed get/patch/delete methods
- Used localStorage for last-visited board per D-16 (sidebar state persistence)
- Created ThemeToggle component inline since Sidebar referenced it but it didn't exist yet
- Chose @vitejs/plugin-react v4 over v6 for compatibility with vitest v4

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Expanded api.ts to full REST client**
- **Found during:** Task 1 (TanStack Query hooks)
- **Issue:** Existing api.ts only had apiPost, but hooks needed get/patch/delete
- **Fix:** Rewrote api.ts with full api object (get/post/patch/delete) plus legacy apiPost export
- **Files modified:** apps/web/src/lib/api.ts
- **Verification:** TypeScript check passes, hooks import correctly
- **Committed in:** e870f33

**2. [Rule 3 - Blocking] Created ThemeToggle component**
- **Found during:** Task 2 (Sidebar component)
- **Issue:** Sidebar.tsx imports ThemeToggle from @/components/layout/ThemeToggle but file didn't exist
- **Fix:** Created ThemeToggle with dark/light mode toggle using document.documentElement.classList
- **Files modified:** apps/web/src/components/layout/ThemeToggle.tsx
- **Verification:** TypeScript check passes, Sidebar renders correctly
- **Committed in:** ab8ee1d

**3. [Rule 3 - Blocking] Fixed @vitejs/plugin-react version incompatibility**
- **Found during:** Task 2 (Sidebar test)
- **Issue:** @vitejs/plugin-react v6 incompatible with vitest v4's vite dependency
- **Fix:** Downgraded to @vitejs/plugin-react v4 which is compatible
- **Files modified:** apps/web/package.json, pnpm-lock.yaml
- **Verification:** Sidebar test runs and passes
- **Committed in:** ab8ee1d

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All auto-fixes necessary for task completion. No scope creep.

## Known Stubs
- `apps/web/src/app/boards/[boardId]/page.tsx` - Board page shows placeholder text "coming in Plan 03". This is intentional -- Plan 03 will implement the full board view with columns and drag-and-drop.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Navigation shell complete, ready for Plan 03 (board view with columns and drag-and-drop)
- All TanStack Query hooks are in place for column and item operations
- AppShell pattern established for consistent layout across authenticated pages

## Self-Check: PASSED

All 12 created files verified present. Both task commits (e870f33, ab8ee1d) verified in git log.

---
*Phase: 05-web-app*
*Completed: 2026-03-27*
