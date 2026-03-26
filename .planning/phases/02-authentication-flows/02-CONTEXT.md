# Phase 2: Authentication Flows - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver user authentication across web and CLI: signup/login web pages, browser-based CLI auth flow (localhost callback), session persistence with auto-refresh, CLI output formatting infrastructure (`--json` and human-readable), and logout for both interfaces. The auth API endpoints already exist from Phase 1 — this phase builds the clients that consume them.

</domain>

<decisions>
## Implementation Decisions

### CLI-to-Browser Auth Flow
- **D-01:** Localhost callback flow — `kanbambam auth login` starts a temporary HTTP server on localhost, opens the browser to the web login page with a callback URL, browser redirects back with auth code after login. Like `gh auth login`.
- **D-02:** Fallback for headless environments — `kanbambam auth login --manual` displays a URL the user can open elsewhere, then paste the resulting token back into the CLI. Covers SSH, containers, CI.
- **D-03:** CLI stores both access token and refresh token via `conf` library. CLI auto-refreshes silently when access token expires using the stored refresh token.

### Web Auth Pages
- **D-04:** Auth pages only — minimal Next.js setup with login, signup, and logout pages. No app shell, no navigation, no board views. Phase 5 builds the full web app on top.
- **D-05:** Clean and minimal styling — centered card with form fields, simple branding. GitHub/Linear login style. Tailwind utility classes.
- **D-06:** CLI callback page in Next.js — `/auth/callback` page receives the auth code from the CLI localhost redirect, exchanges tokens, shows "You can close this tab" message.

### CLI Output Formatting
- **D-07:** Ink-rendered tables and boxes for human-readable output — bordered tables, colored status badges, box-drawn layouts. Rich terminal UI using Ink (React for terminal).
- **D-08:** `--json` output matches API envelope format — same `{ data, meta }` structure as the API. One schema for scripts and AI agents to learn.
- **D-09:** Smart TTY detection — if stdout is not a TTY (piped), auto-disable colors and Ink rendering. Output plain text. Standard CLI practice.

### Session & Logout Behavior
- **D-10:** Web logout revokes current session only — deletes the current refresh token from the server. Other sessions (CLI, other browsers) stay active.
- **D-11:** CLI silent auto-refresh — if access token expired, CLI transparently refreshes using stored refresh token before retrying. User never sees an error unless refresh token is also expired.
- **D-12:** `kanbambam auth logout` revokes server-side + clears local — sends revoke request to API (deletes refresh token), then clears locally stored tokens. Clean logout from both sides.

### Claude's Discretion
- Localhost callback server port selection and lifecycle
- CLI auth flow error handling and timeout behavior
- Next.js project configuration and folder structure
- Ink component architecture for output rendering
- Token refresh retry logic and edge cases
- Web form validation approach and error display

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specs
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — Phase 2 requirements: AUTH-01 through AUTH-05, CLI-02, CLI-03, CLI-04
- `.planning/ROADMAP.md` — Phase 2 success criteria and dependency chain

### Technology Stack
- `CLAUDE.md` §Recommended Stack — CLI stack (Commander.js, Ink, conf, open, chalk), Web stack (Next.js, React, Tailwind CSS), API stack (Hono, jose)

### Phase 1 Foundation
- `.planning/phases/01-foundation-api/01-CONTEXT.md` — Prior decisions (D-01 through D-11) on IDs, API format, routing, data behavior
- `apps/api/src/routes/auth/auth.handlers.ts` — Existing auth endpoints (signup, login, refresh)
- `apps/api/src/lib/tokens.ts` — JWT creation and refresh token generation
- `apps/api/src/middleware/auth.ts` — JWT auth middleware pattern
- `packages/shared/src/schemas/user.ts` — User, Login, AuthTokens Zod schemas

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/api/src/routes/auth/auth.handlers.ts` — Signup, login, refresh endpoints already implemented. CLI and web auth consume these directly.
- `apps/api/src/lib/tokens.ts` — `createAccessToken`, `generateRefreshToken`, `hashToken` utilities. CLI callback will use the same token pair mechanism.
- `packages/shared/src/schemas/user.ts` — `CreateUserSchema`, `LoginSchema`, `AuthTokensSchema` Zod schemas. Web forms and CLI can validate with these.
- `apps/api/src/middleware/auth.ts` — JWT middleware using `hono/jwt` with HS256. Pattern for how all protected routes verify tokens.
- `packages/shared/src/schemas/common.ts` — `envelopeSchema`, `ErrorResponseSchema` — CLI `--json` output should match these shapes.

### Established Patterns
- OpenAPI route definitions with `@hono/zod-openapi` — auth routes follow this pattern
- Argon2 password hashing in signup handler
- Refresh token rotation with SHA-256 hashing on every refresh
- Envelope response format: `{ data, meta: { requestId } }` for single, `{ data, meta: { total, cursor } }` for lists

### Integration Points
- CLI `apps/cli` package needs creation (Commander.js + Ink + conf)
- Web `apps/web` package needs creation (Next.js + React + Tailwind)
- Both consume `@kanbambam/shared` for Zod schemas and types
- CLI auth callback coordinates with a web `/auth/callback` page
- API needs a new endpoint for CLI auth flow (token exchange via callback code)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for all implementation details within the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-authentication-flows*
*Context gathered: 2026-03-26*
