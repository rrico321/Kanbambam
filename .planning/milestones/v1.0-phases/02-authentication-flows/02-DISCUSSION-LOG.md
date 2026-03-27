# Phase 2: Authentication Flows - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 02-authentication-flows
**Areas discussed:** CLI-to-browser auth flow, Web auth pages, CLI output formatting, Session & logout behavior

---

## CLI-to-Browser Auth Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Localhost callback | CLI starts temp HTTP server, opens browser, receives callback. Like gh auth login. | ✓ |
| Device code / polling | CLI displays URL + code, user enters in browser, CLI polls until confirmed. | |
| Copy-paste token | User copies token from web settings, pastes into CLI. | |

**User's choice:** Localhost callback
**Notes:** None

### Follow-up: Headless fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, add --manual flag | Fall back to URL display + paste for SSH/containers/CI | ✓ |
| No, browser-only | Simplest approach, no fallback | |
| You decide | Claude picks | |

**User's choice:** Yes, add --manual flag

### Follow-up: Token storage

| Option | Description | Selected |
|--------|-------------|----------|
| Both tokens | Store access + refresh token, auto-refresh | ✓ |
| Access token only | Simpler but 15min re-auth cycles | |
| You decide | Claude picks | |

**User's choice:** Both tokens

---

## Web Auth Pages

### Web scaffolding scope

| Option | Description | Selected |
|--------|-------------|----------|
| Auth pages only | Minimal Next.js with login/signup/logout only | ✓ |
| Auth + basic app shell | Login pages plus nav bar and layout | |
| You decide | Claude picks | |

**User's choice:** Auth pages only

### Auth page style

| Option | Description | Selected |
|--------|-------------|----------|
| Clean and minimal | Centered card, simple branding. GitHub/Linear style. | ✓ |
| Polished with personality | Gradients, illustrations, animations | |
| You decide | Claude picks | |

**User's choice:** Clean and minimal

### CLI callback page

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, CLI callback in Next.js | /auth/callback page handles CLI auth redirect | ✓ |
| No, CLI handles own callback | CLI localhost server serves its own HTML | |
| You decide | Claude picks | |

**User's choice:** Yes, CLI callback in Next.js

---

## CLI Output Formatting

### Default human-readable output style

| Option | Description | Selected |
|--------|-------------|----------|
| Ink-rendered tables & boxes | Rich terminal UI with bordered tables, colored badges | ✓ |
| Simple chalk-styled text | Plain text with colors, no borders | |
| You decide | Claude picks | |

**User's choice:** Ink-rendered tables & boxes

### --json output structure

| Option | Description | Selected |
|--------|-------------|----------|
| Match API envelope | Same { data, meta } as API responses | ✓ |
| Simplified flat JSON | Strip envelope, output data payload only | |
| You decide | Claude picks | |

**User's choice:** Match API envelope

### Piped output detection

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, smart detection | Auto-disable colors/Ink when stdout is not TTY | ✓ |
| No, explicit flags only | Always same output regardless of TTY | |
| You decide | Claude picks | |

**User's choice:** Yes, smart detection

---

## Session & Logout Behavior

### Web logout token handling

| Option | Description | Selected |
|--------|-------------|----------|
| Revoke current session only | Delete current refresh token, others stay | ✓ |
| Revoke all sessions | Delete ALL refresh tokens for user | |
| You decide | Claude picks | |

**User's choice:** Revoke current session only

### CLI expired token handling

| Option | Description | Selected |
|--------|-------------|----------|
| Silent auto-refresh | Transparently refresh before retrying | ✓ |
| Prompt to re-auth | Tell user to run auth login again | |
| You decide | Claude picks | |

**User's choice:** Silent auto-refresh

### CLI logout command

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, revoke + clear local | API revoke request + clear local tokens | ✓ |
| Yes, local-only clear | Just delete local tokens | |
| You decide | Claude picks | |

**User's choice:** Yes, revoke + clear local

---

## Claude's Discretion

- Localhost callback server port selection and lifecycle
- CLI auth flow error handling and timeout behavior
- Next.js project configuration and folder structure
- Ink component architecture for output rendering
- Token refresh retry logic and edge cases
- Web form validation approach and error display

## Deferred Ideas

None — discussion stayed within phase scope
