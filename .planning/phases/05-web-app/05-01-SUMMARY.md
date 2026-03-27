---
phase: 05-web-app
plan: 01
subsystem: ui
tags: [react, next-themes, tanstack-query, vitest, tailwind, dark-mode, dnd-kit, api-client]

# Dependency graph
requires:
  - phase: 02-authentication-flows
    provides: "Auth API endpoints (login, signup, refresh, logout) and web auth pages"
  - phase: 01-foundation-api
    provides: "API server with CORS, Hono framework, shared types"
provides:
  - "Full-method API client with credentials:include and 401 auto-refresh"
  - "TanStack Query provider wrapping all routes"
  - "Dark mode toggle with next-themes and Tailwind v4 @variant"
  - "Label color palette (8 colors) and fractional-indexing position helpers"
  - "Vitest config for React component testing with jsdom"
  - "Wave 0 test stubs for WEB-01/04/05/06"
affects: [05-02, 05-03, 05-04, 05-05]

# Tech tracking
tech-stack:
  added: ["@dnd-kit/react@0.3.2", "@dnd-kit/helpers@0.3.2", "@tanstack/react-query@^5.95", "next-themes@^0.4.6", "sonner@^2", "fractional-indexing@^3.2", "nuqs@^2", "lucide-react@^1.7", "vitest@^4.1", "@testing-library/react@^16.3", "@testing-library/jest-dom@^6.9", "jsdom@^29", "@vitejs/plugin-react@^4.7"]
  patterns: ["API client singleton with 401 retry", "QueryClient factory for SSR/browser", "data-theme attribute for dark mode", "test file exclusion from main tsconfig"]

key-files:
  created:
    - "apps/web/src/lib/query-client.ts"
    - "apps/web/src/lib/labels.ts"
    - "apps/web/src/lib/positions.ts"
    - "apps/web/src/components/layout/Providers.tsx"
    - "apps/web/src/components/layout/ThemeToggle.tsx"
    - "apps/web/vitest.config.ts"
    - "apps/web/src/test-helpers/setup.ts"
    - "apps/web/src/hooks/use-board-data.test.ts"
    - "apps/web/src/components/board/BoardView.test.tsx"
    - "apps/web/src/components/item-detail/ItemModal.test.tsx"
    - "apps/web/src/components/sidebar/Sidebar.test.tsx"
  modified:
    - "apps/web/src/lib/api.ts"
    - "apps/web/src/app/layout.tsx"
    - "apps/web/src/app/globals.css"
    - "apps/web/package.json"
    - "apps/web/tsconfig.json"
    - "apps/api/src/app.ts"

key-decisions:
  - "Preserved server-side apiPost for existing auth server actions while adding client-side api object"
  - "Used data-theme attribute with @variant dark for Tailwind v4 + next-themes compatibility"
  - "Excluded test files from main tsconfig, rely on vitest for test type-checking"
  - "Downgraded @vitejs/plugin-react to v4 for vite 7 / vitest 4 compatibility"

patterns-established:
  - "API client: import { api } from '@/lib/api' for client components, import { apiPost } from '@/lib/api' for server actions"
  - "QueryClient: factory pattern via makeQueryClient() for SSR safety"
  - "Dark mode: data-theme attribute, suppressHydrationWarning on html, mounted guard in ThemeToggle"
  - "Test setup: vitest with jsdom, mock next-themes and next/navigation globally"

requirements-completed: [WEB-06]

# Metrics
duration: 6min
completed: 2026-03-27
---

# Phase 5 Plan 1: Web App Foundation Summary

**Full-method API client with 401 auto-refresh, TanStack Query + dark mode providers, label/position utilities, and Vitest test infrastructure with Wave 0 stubs**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-27T01:14:21Z
- **Completed:** 2026-03-27T01:20:48Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Full API client (get/post/patch/delete) with credentials:include and automatic 401 retry via token refresh
- TanStack Query + ThemeProvider + Toaster providers wrapping all app routes
- Dark mode toggle with Sun/Moon icons and hydration-safe mounting
- Label color palette (8 colors), fractional-indexing position helpers
- Vitest configured with jsdom, React Testing Library, and global mocks
- 4 Wave 0 test stub files (14 todo tests) for WEB-01/04/05/06

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies, fix CORS, build API client with 401 retry, and utility modules** - `93ef75b` (feat)
2. **Task 2: Providers, dark mode, theme toggle, Vitest config, test infrastructure, and Wave 0 test stubs** - `d526ef2` (feat)

## Files Created/Modified
- `apps/web/src/lib/api.ts` - Full API client with get/post/patch/delete, 401 retry, and server-side apiPost
- `apps/web/src/lib/query-client.ts` - TanStack Query client factory for SSR/browser
- `apps/web/src/lib/labels.ts` - 8-color label palette with getLabelStyle helper
- `apps/web/src/lib/positions.ts` - fractional-indexing calculatePosition helper
- `apps/web/src/components/layout/Providers.tsx` - QueryClientProvider + ThemeProvider + Toaster wrapper
- `apps/web/src/components/layout/ThemeToggle.tsx` - Sun/Moon theme toggle with mounted guard
- `apps/web/src/app/layout.tsx` - Added Providers wrapper, suppressHydrationWarning, dark mode classes
- `apps/web/src/app/globals.css` - Added @variant dark for Tailwind v4 + next-themes
- `apps/web/vitest.config.ts` - Vitest config with jsdom, React plugin, path aliases
- `apps/web/src/test-helpers/setup.ts` - Global test setup with next-themes and next/navigation mocks
- `apps/web/src/hooks/use-board-data.test.ts` - WEB-06 test stub (4 todos)
- `apps/web/src/components/board/BoardView.test.tsx` - WEB-01 test stub (3 todos)
- `apps/web/src/components/item-detail/ItemModal.test.tsx` - WEB-04 test stub (4 todos)
- `apps/web/src/components/sidebar/Sidebar.test.tsx` - WEB-05 test stub (3 todos)
- `apps/api/src/app.ts` - CORS updated with origin whitelist and credentials: true
- `apps/web/package.json` - Added 13 new dependencies (runtime + dev)
- `apps/web/tsconfig.json` - Excluded test files from main compilation

## Decisions Made
- Preserved server-side `apiPost` export for backwards compatibility with existing auth server actions
- Used `data-theme` attribute (not `class`) for next-themes + Tailwind v4 integration via `@variant dark`
- Excluded test files from main tsconfig to avoid vitest global type conflicts
- Downgraded @vitejs/plugin-react from v6 to v4 for vite 7 / vitest 4 compatibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Preserved apiPost for existing server actions**
- **Found during:** Task 1 (API client replacement)
- **Issue:** Existing auth server actions (login, signup, logout) imported `apiPost` from `@/lib/api` which was removed when replacing with the new `api` object
- **Fix:** Added `apiPost` as a named export alongside the new `api` object, using server-side `API_URL` env var
- **Files modified:** apps/web/src/lib/api.ts
- **Verification:** TypeScript compiles with no errors
- **Committed in:** 93ef75b (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed @vitejs/plugin-react version incompatibility**
- **Found during:** Task 2 (Vitest configuration)
- **Issue:** @vitejs/plugin-react v6 requires vite 8, but vitest 4 ships with vite 7
- **Fix:** Downgraded @vitejs/plugin-react to v4 which is compatible with vite 7
- **Files modified:** apps/web/package.json, pnpm-lock.yaml
- **Verification:** `pnpm --filter @kanbambam/web test --run` passes (4 files, 14 todos, 0 failures)
- **Committed in:** d526ef2 (Task 2 commit)

**3. [Rule 3 - Blocking] Excluded test files from tsconfig**
- **Found during:** Task 2 (Vitest configuration)
- **Issue:** TypeScript compilation failed because `vi` global from vitest was not recognized in test setup file
- **Fix:** Added test file patterns to tsconfig exclude array
- **Files modified:** apps/web/tsconfig.json
- **Verification:** `tsc --noEmit` passes cleanly
- **Committed in:** d526ef2 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All auto-fixes necessary for compilation and test execution. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- API client ready for all subsequent plans to make authenticated requests
- QueryClient + ThemeProvider + Toaster available for all components
- Label palette and position helpers ready for board/item components
- Vitest infrastructure ready for component tests in Plans 02-05
- Test stubs provide scaffolding for behavioral tests

---
*Phase: 05-web-app*
*Completed: 2026-03-27*
