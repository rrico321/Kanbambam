---
phase: 02-authentication-flows
plan: 03
subsystem: auth
tags: [cli, commander, jwt, jose, localhost-callback, csrf, ink]

# Dependency graph
requires:
  - phase: 02-01
    provides: CLI infrastructure (config, api-client, output formatter, types)
  - phase: 02-02
    provides: Web auth pages (login, signup, callback) that CLI opens in browser
provides:
  - CLI auth login command with browser localhost callback and --manual fallback
  - CLI auth logout command with server-side token revocation
  - CLI auth status command showing authentication state
  - AuthSuccess and AuthStatus Ink components
affects: [03-core-kanban-cli, 04-item-management]

# Tech tracking
tech-stack:
  added: [jose (JWT decoding in CLI)]
  patterns: [localhost HTTP callback for browser-to-CLI token transfer, CSRF state parameter, best-effort server revocation]

key-files:
  created:
    - apps/cli/src/commands/auth/login.ts
    - apps/cli/src/commands/auth/logout.ts
    - apps/cli/src/commands/auth/status.ts
    - apps/cli/src/components/AuthSuccess.tsx
    - apps/cli/src/components/AuthStatus.tsx
    - apps/cli/src/commands/auth/__tests__/login.test.ts
    - apps/cli/src/commands/auth/__tests__/logout.test.ts
    - apps/cli/src/commands/auth/__tests__/status.test.ts
  modified:
    - apps/cli/package.json

key-decisions:
  - "Login shows 'Logged in successfully' without email since no /me API endpoint exists yet"
  - "Added jose to CLI for JWT decoding in status command"
  - "Login uses _testTimeout and _testTokens params for test controllability without complex mocking"

patterns-established:
  - "Localhost callback pattern: HTTP server on port 0, browser opens web login with cli_callback param, tokens returned via query params"
  - "CSRF state: random hex generated per login, verified on callback"
  - "Best-effort revoke: try API call, always clear local tokens regardless of result"
  - "Output mode routing: detectOutputMode() then branch on json/plain/ink"

requirements-completed: [AUTH-04, AUTH-05, CLI-02, CLI-03, CLI-04]

# Metrics
duration: 5min
completed: 2026-03-26
---

# Phase 2 Plan 3: CLI Auth Commands Summary

**Three CLI auth commands (login, logout, status) with localhost browser callback, CSRF protection, --json envelope output, and TTY-aware formatting**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-26T16:59:55Z
- **Completed:** 2026-03-26T17:04:34Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Login command starts localhost HTTP server on random port, opens browser to web login, receives tokens via callback with CSRF state verification
- Login --manual mode for headless environments provides URL and accepts pasted tokens
- Logout command revokes server-side token (best effort) and always clears local storage
- Status command shows authentication state, decodes JWT for userId when available
- All commands support --json output in API envelope format and detect non-TTY for plain text

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth login command** - `07bea6e` (test), `0cc68ee` (feat)
2. **Task 2: Auth logout and status commands** - `7087b0f` (test), `ad23673` (feat)

_TDD workflow: failing tests committed first (RED), then implementation (GREEN)_

## Files Created/Modified
- `apps/cli/src/commands/auth/login.ts` - Login with localhost callback server and --manual fallback
- `apps/cli/src/commands/auth/logout.ts` - Logout with best-effort server revoke + local token clear
- `apps/cli/src/commands/auth/status.ts` - Status showing authenticated state with JWT decoding
- `apps/cli/src/components/AuthSuccess.tsx` - Ink component for login success display
- `apps/cli/src/components/AuthStatus.tsx` - Ink component for auth status display
- `apps/cli/src/commands/auth/__tests__/login.test.ts` - 7 tests for login command
- `apps/cli/src/commands/auth/__tests__/logout.test.ts` - 6 tests for logout command
- `apps/cli/src/commands/auth/__tests__/status.test.ts` - 4 tests for status command
- `apps/cli/package.json` - Added jose dependency

## Decisions Made
- Login shows "Logged in successfully" without email display since no /me API endpoint exists yet; AuthSuccess component accepts optional email prop for future enhancement
- Added jose to CLI package for JWT decoding in status command (was only in API package)
- Used _testTimeout and _testTokens test-only parameters for controllability instead of complex timer/stdin mocking

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added jose dependency to CLI package**
- **Found during:** Task 1 (Login command implementation)
- **Issue:** jose library needed for JWT decoding but only installed in API package
- **Fix:** `pnpm --filter @kanbambam/cli add jose`
- **Files modified:** apps/cli/package.json, pnpm-lock.yaml
- **Verification:** Import succeeds, tests pass, build succeeds
- **Committed in:** 0cc68ee (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for JWT decoding in status command. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all commands are fully functional with real logic.

## Next Phase Readiness
- All three CLI auth commands are working and tested (32 total CLI tests passing)
- CLI build succeeds with tsup bundling all commands
- Phase 2 authentication flows are complete: API auth (plan 01), web auth pages (plan 02), CLI auth commands (plan 03)
- Ready for Phase 3: Core Kanban CLI commands

## Self-Check: PASSED

All 9 created files verified on disk. All 4 commit hashes verified in git log.

---
*Phase: 02-authentication-flows*
*Completed: 2026-03-26*
