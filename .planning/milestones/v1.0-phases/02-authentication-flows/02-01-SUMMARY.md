---
phase: 02-authentication-flows
plan: 01
subsystem: auth, cli
tags: [commander, conf, jwt, logout, auto-refresh, output-formatter, ink]

requires:
  - phase: 01-foundation-api
    provides: REST API with auth routes (signup, login, refresh), Hono framework, shared Zod schemas
provides:
  - API POST /api/v1/auth/logout endpoint for refresh token revocation
  - CLI package scaffold with Commander.js entry point and tsup build
  - CLI token storage via conf (persistent across sessions)
  - CLI API client with automatic 401 refresh token rotation
  - CLI output formatter with JSON/Ink/plain mode detection
  - ErrorDisplay and Spinner Ink components
affects: [02-02-web-auth-pages, 02-03-cli-auth-commands, 03-core-kanban-cli]

tech-stack:
  added: [commander ^14, ink ^6, react ^19, conf ^15, chalk ^5, open ^11, tsup, tsx]
  patterns: [CLI auto-refresh on 401, output mode detection (json/ink/plain), conf-based token persistence]

key-files:
  created:
    - apps/cli/package.json
    - apps/cli/tsconfig.json
    - apps/cli/tsup.config.ts
    - apps/cli/vitest.config.ts
    - apps/cli/src/index.ts
    - apps/cli/src/types.ts
    - apps/cli/src/lib/config.ts
    - apps/cli/src/lib/api-client.ts
    - apps/cli/src/lib/output.ts
    - apps/cli/src/components/ErrorDisplay.tsx
    - apps/cli/src/components/Spinner.tsx
    - apps/cli/src/commands/auth/login.ts
    - apps/cli/src/commands/auth/logout.ts
    - apps/cli/src/commands/auth/status.ts
    - apps/cli/src/lib/__tests__/config.test.ts
    - apps/cli/src/lib/__tests__/output.test.ts
    - apps/cli/src/lib/__tests__/api-client.test.ts
  modified:
    - apps/api/src/routes/auth/auth.routes.ts
    - apps/api/src/routes/auth/auth.handlers.ts
    - apps/api/src/routes/auth/auth.test.ts
    - pnpm-lock.yaml

key-decisions:
  - "Created stub command files for login/logout/status to allow tsup build to succeed (Plan 03 will implement)"
  - "Used Ink 6 with React 19 (newer than originally planned Ink 5 with React 18) since pnpm resolved compatible versions"
  - "Output module excludes Ink render() to keep it testable without React renderer in unit tests"

patterns-established:
  - "CLI config pattern: Conf with projectName 'kanbambam' storing accessToken, refreshToken, apiBaseUrl"
  - "CLI API client pattern: auto-refresh on 401 with token rotation, clearTokens on failure"
  - "CLI output pattern: detectOutputMode checks --json flag then TTY, formatJson wraps in {data, meta} envelope"
  - "CLI test mocking pattern: vi.mock config module with in-memory Map store"

requirements-completed: [AUTH-03, CLI-02, CLI-03]

duration: 5min
completed: 2026-03-26
---

# Phase 2 Plan 1: API Logout and CLI Foundation Summary

**API logout endpoint with refresh token revocation, plus full CLI package scaffold with Commander.js, conf-based token storage, auto-refresh API client, and JSON/Ink/plain output formatter**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-26T14:54:12Z
- **Completed:** 2026-03-26T14:59:30Z
- **Tasks:** 2
- **Files modified:** 20

## Accomplishments
- API POST /api/v1/auth/logout endpoint that revokes refresh tokens with 3 integration tests
- CLI package scaffold with Commander.js, tsup ESM build, vitest configuration
- Token storage module using conf for OS-appropriate persistent config
- API client with transparent 401 auto-refresh and token rotation
- Output formatter supporting JSON envelope, Ink components, and plain text modes
- 15 CLI unit tests and 79 API tests all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Add API logout endpoint and CLI package scaffold** - `014b702` (feat)
2. **Task 2 RED: Failing tests for config, api-client, output** - `cab5664` (test)
3. **Task 2 GREEN: Implement config, api-client, output, components** - `428a571` (feat)

## Files Created/Modified
- `apps/api/src/routes/auth/auth.routes.ts` - Added logoutRoute OpenAPI definition
- `apps/api/src/routes/auth/auth.handlers.ts` - Added logout handler (hash token, delete from DB)
- `apps/api/src/routes/auth/auth.test.ts` - 3 logout tests (valid, invalid, reuse prevention)
- `apps/cli/package.json` - CLI package with commander, ink, conf, react dependencies
- `apps/cli/tsconfig.json` - TypeScript config extending base with JSX support
- `apps/cli/tsup.config.ts` - ESM bundler with node20 target and shebang banner
- `apps/cli/vitest.config.ts` - Test config with globals and node environment
- `apps/cli/src/index.ts` - Commander.js program with auth subcommands
- `apps/cli/src/types.ts` - GlobalOptions, AuthTokens, ApiEnvelope, ApiError interfaces
- `apps/cli/src/lib/config.ts` - Conf-based token storage with clearTokens/hasTokens helpers
- `apps/cli/src/lib/api-client.ts` - HTTP client with Bearer auth and 401 auto-refresh
- `apps/cli/src/lib/output.ts` - Output mode detection and JSON envelope formatter
- `apps/cli/src/components/ErrorDisplay.tsx` - Red bordered error box with suggestion text
- `apps/cli/src/components/Spinner.tsx` - Animated spinner with label
- `apps/cli/src/commands/auth/login.ts` - Stub (implemented in Plan 03)
- `apps/cli/src/commands/auth/logout.ts` - Stub (implemented in Plan 03)
- `apps/cli/src/commands/auth/status.ts` - Stub (implemented in Plan 03)

## Decisions Made
- Created stub command files for login/logout/status so tsup build succeeds. Plan 03 will provide real implementations.
- Used Ink 6 with React 19 (pnpm resolved compatible versions, newer than originally planned Ink 5).
- Kept output module's Ink rendering separate from formatJson/detectOutputMode to keep unit tests simple.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created stub command files for build to succeed**
- **Found during:** Task 1 (CLI package scaffold)
- **Issue:** tsup build failed because index.ts dynamically imports commands/auth/*.js which did not exist
- **Fix:** Created stub files for login.ts, logout.ts, status.ts with placeholder implementations
- **Files modified:** apps/cli/src/commands/auth/login.ts, logout.ts, status.ts
- **Verification:** `pnpm --filter @kanbambam/cli build` succeeds
- **Committed in:** 014b702 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for build to pass. Stubs will be replaced in Plan 03.

## Known Stubs

| File | Line | Description | Resolved By |
|------|------|-------------|-------------|
| apps/cli/src/commands/auth/login.ts | 6 | Placeholder console.log | Plan 02-03 |
| apps/cli/src/commands/auth/logout.ts | 4 | Placeholder console.log | Plan 02-03 |
| apps/cli/src/commands/auth/status.ts | 4 | Placeholder console.log | Plan 02-03 |

These stubs are intentional scaffolding -- Plan 03 (CLI Auth Commands) implements the real login/logout/status flows.

## Issues Encountered
None beyond the stub files documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CLI package is a monorepo member, builds and tests clean
- API logout endpoint ready for CLI logout command (Plan 03)
- Config, API client, and output modules ready for all future CLI commands
- Plan 02-02 (web auth pages) can proceed independently
- Plan 02-03 (CLI auth commands) has all infrastructure it needs

## Self-Check: PASSED

- All 15 key files verified present
- All 3 commit hashes verified in git log
- 15 CLI tests pass, 79 API tests pass
- CLI build succeeds via tsup

---
*Phase: 02-authentication-flows*
*Completed: 2026-03-26*
