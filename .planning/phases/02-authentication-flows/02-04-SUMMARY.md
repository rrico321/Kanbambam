---
phase: 02-authentication-flows
plan: 04
subsystem: cli
tags: [ink, react, cli-output, testing, vitest]

# Dependency graph
requires:
  - phase: 02-01
    provides: CLI config, api-client, output module, auth logout endpoint
  - phase: 02-02
    provides: Web auth pages (login, signup, callback, logout)
  - phase: 02-03
    provides: CLI auth commands (login, logout, status) with plain/json output
provides:
  - Complete output module with ink/json/plain dispatch (outputInk, output)
  - All CLI auth commands rendering Ink components in TTY mode
  - AuthSuccess and AuthStatus components wired (no longer orphaned)
  - Reliable test suite with ink mocking and sequential file execution
affects: [03-cli-crud, cli-output-patterns]

# Tech tracking
tech-stack:
  added: []
  patterns: [outputInk-pattern, ink-component-rendering-in-commands, vi-mock-ink-for-tests]

key-files:
  created: []
  modified:
    - apps/cli/src/lib/output.ts
    - apps/cli/src/commands/auth/login.ts
    - apps/cli/src/commands/auth/logout.ts
    - apps/cli/src/commands/auth/status.ts
    - apps/cli/src/commands/auth/__tests__/status.test.ts
    - apps/cli/src/commands/auth/__tests__/logout.test.ts
    - apps/cli/vitest.config.ts
    - .planning/REQUIREMENTS.md

key-decisions:
  - "Use React.createElement instead of JSX in command files for Ink component rendering"
  - "Mock ink module in tests to avoid yoga-layout WASM loading in test environment"
  - "Set fileParallelism: false in vitest config to prevent conf disk state races between test files"

patterns-established:
  - "outputInk pattern: import outputInk from output.ts, call with React.createElement(Component, props)"
  - "Ink test mocking: vi.mock('ink', () => ({ render: vi.fn(), Text: vi.fn(), Box: vi.fn() }))"
  - "CLI output dispatch: check mode for json/ink/plain branches in each command"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, CLI-02, CLI-03, CLI-04]

# Metrics
duration: 6min
completed: 2026-03-26
---

# Phase 2 Plan 4: Gap Closure Summary

**Ink rendering wired in output module and all auth commands with test isolation fixes enabling all 32 CLI tests to pass**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-26T18:25:11Z
- **Completed:** 2026-03-26T18:31:37Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Added outputInk() and output() dispatcher to output.ts, completing the 3-mode output pattern (ink/json/plain)
- Wired AuthSuccess, AuthStatus, and Text Ink components in login, logout, and status commands
- Fixed pre-existing test failures: mocked ink module to avoid yoga-layout WASM errors, added fileParallelism: false to prevent conf disk state races
- Updated REQUIREMENTS.md to mark AUTH-01 and AUTH-02 as Complete

## Task Commits

Each task was committed atomically:

1. **Task 1: Add outputInk and wire Ink rendering in all auth commands** - `bf9a857` (feat)
2. **Task 2: Fix test isolation and update REQUIREMENTS.md** - `bc5527c` (fix)

## Files Created/Modified
- `apps/cli/src/lib/output.ts` - Added outputInk() using ink render() and output() generic dispatcher
- `apps/cli/src/commands/auth/login.ts` - Wired AuthSuccess component in ink mode
- `apps/cli/src/commands/auth/logout.ts` - Wired green Text component for success, dim Text for not-logged-in
- `apps/cli/src/commands/auth/status.ts` - Wired AuthStatus component for both authenticated and unauthenticated states
- `apps/cli/src/commands/auth/__tests__/logout.test.ts` - Added ink mock to prevent WASM errors
- `apps/cli/src/commands/auth/__tests__/status.test.ts` - Added ink mock to prevent WASM errors
- `apps/cli/vitest.config.ts` - Added fileParallelism: false to fix test isolation
- `.planning/REQUIREMENTS.md` - Marked AUTH-01 and AUTH-02 as Complete

## Decisions Made
- Used React.createElement() instead of JSX syntax in command files to avoid needing JSX transform in .ts files
- Mocked ink at the vi.mock level in test files rather than making ink imports dynamic, keeping production code clean
- Set vitest fileParallelism to false rather than creating per-test conf instances, simpler fix for shared disk state

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pre-existing test failures from yoga-layout WASM loading**
- **Found during:** Task 1 verification
- **Issue:** All 6 logout tests and some status tests failed because importing `ink` or `{ Text } from 'ink'` in command files triggers yoga-layout WASM initialization which fails in the vitest test environment
- **Fix:** Added vi.mock('ink', ...) to logout.test.ts and status.test.ts to stub out ink module
- **Files modified:** apps/cli/src/commands/auth/__tests__/logout.test.ts, apps/cli/src/commands/auth/__tests__/status.test.ts
- **Verification:** All 32 tests pass
- **Committed in:** bc5527c (Task 2 commit)

**2. [Rule 1 - Bug] Fixed test isolation issue from parallel conf file access**
- **Found during:** Task 2 verification
- **Issue:** Tests across files shared the same conf backing file on disk. Vitest runs test files in parallel by default, causing token state races between config.test.ts, logout.test.ts, and status.test.ts
- **Fix:** Added fileParallelism: false to vitest.config.ts
- **Files modified:** apps/cli/vitest.config.ts
- **Verification:** All 32 tests pass consistently
- **Committed in:** bc5527c (Task 2 commit)

**3. [Plan deviation] Removed vi.resetModules() from plan**
- **Found during:** Task 2
- **Issue:** Plan specified adding vi.resetModules() to status.test.ts beforeEach, but this caused fresh Conf instances that didn't see the test file's config.clear() calls
- **Fix:** Did not add vi.resetModules(). Instead, the ink mock + fileParallelism fix resolved the actual root cause
- **Files modified:** apps/cli/src/commands/auth/__tests__/status.test.ts
- **Verification:** All 32 tests pass
- **Committed in:** bc5527c (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 plan deviation)
**Impact on plan:** All fixes necessary for test suite correctness. No scope creep. The plan's vi.resetModules() approach was incorrect; the actual root causes were ink WASM loading and test file parallelism.

## Issues Encountered
- The plan's proposed vi.resetModules() fix for the status test was incorrect. The real problem was that yoga-layout WASM loading fails in vitest, causing 6+ test failures. The fix was mocking ink at the test level and disabling file parallelism.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all Ink components are properly wired and rendered.

## Next Phase Readiness
- All Phase 2 authentication functionality is complete and verified
- CLI output module has the full 3-mode dispatch pattern ready for Phase 3 CLI CRUD commands
- Test infrastructure is stable with ink mocking pattern established for future CLI component tests

---
*Phase: 02-authentication-flows*
*Completed: 2026-03-26*
