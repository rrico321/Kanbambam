# Pitfalls Research

**Domain:** CLI-first Kanban board SaaS (CLI + REST API + Web App)
**Researched:** 2026-03-25
**Confidence:** MEDIUM (based on training data knowledge of CLI tools like gh, vercel, railway CLIs and Kanban products like Trello, Linear; no live web verification available)

## Critical Pitfalls

### Pitfall 1: CLI and Web App Diverge Into Separate Products

**What goes wrong:**
The CLI and web app start sharing an API but gradually develop client-specific endpoints, different data shapes, or features that only work in one client. The "one source of truth" promise breaks down. Users find that creating a board in the CLI produces slightly different results than creating one in the web app (missing defaults, different validation, etc.).

**Why it happens:**
Different developers work on CLI vs web. The web app needs "just one more field" so the endpoint gets a web-specific parameter. The CLI team adds a shortcut that bypasses a validation the web enforces. Without a shared API contract as the enforced boundary, drift is invisible until users report inconsistencies.

**How to avoid:**
- Define the API contract first (OpenAPI spec or shared TypeScript types in a monorepo package) and generate/validate both clients against it
- Both CLI and web app must use the exact same endpoints with the same request/response shapes -- no client-specific API routes in v1
- Integration tests that run the same operation through both CLI and web, then compare the resulting state
- Shared validation: put all business rules in the API, not in either client

**Warning signs:**
- An endpoint gains a parameter only one client sends
- A PR adds a "web-only" or "cli-only" API route
- Bug reports like "this works in the web but not the CLI"
- CLI and web have different error messages for the same validation failure

**Phase to address:**
Phase 1 (API foundation) -- establish the shared contract and monorepo structure before building either client. This is architectural and nearly impossible to retrofit.

---

### Pitfall 2: CLI Authentication That Frustrates Users

**What goes wrong:**
The browser-based auth flow (like `gh auth login`) seems simple but has many failure modes: the browser doesn't open on headless servers, the callback port is already in use, tokens expire with no clear re-auth UX, or the flow silently fails in SSH sessions, Docker containers, and CI environments.

**Why it happens:**
The happy path (developer on a Mac, browser opens, user clicks approve) works in development. Edge cases only surface when real users try it on servers, in containers, or after their token expires at 2am during a deploy.

**How to avoid:**
- Support multiple auth methods from day one: browser flow (primary), manual token paste (fallback for headless), environment variable `KANBAMBAM_TOKEN` (CI/automation)
- Detect headless environments and automatically fall back to token paste with clear instructions
- Token refresh: if the API returns 401, attempt a silent refresh before prompting re-auth. Never just fail with a cryptic error
- Store tokens in the OS keychain (via `keytar` or similar) not a plaintext file. Fall back to `~/.config/kanbambam/credentials` with 0600 permissions if keychain unavailable
- Print where the token is stored during `auth login` so users know how to revoke

**Warning signs:**
- Auth tests only run in a desktop environment
- No test for "what happens when the browser doesn't open"
- Token storage is a JSON file with no permission restrictions
- No `KANBAMBAM_TOKEN` env var support

**Phase to address:**
Phase 2 (CLI implementation) -- but the API auth design (JWT/refresh tokens, OAuth device flow) must be planned in Phase 1.

---

### Pitfall 3: Treating the Data Model as Flat When It Is Deeply Hierarchical

**What goes wrong:**
The User > Workspace > Board > Column > Item hierarchy creates a 4-level nesting problem. Naive implementations require users to specify the full path every time (`kanbambam item move --workspace "My Work" --board "Sprint 1" --column "Done" --item "Fix bug"`), making the CLI unusable. Or the API requires deeply nested URLs (`/workspaces/123/boards/456/columns/789/items/012`) that are brittle and hard to evolve.

**Why it happens:**
The data model maps cleanly to a relational schema but not to a CLI UX or REST URL structure. Developers design the API around the data model instead of around how users actually work.

**How to avoid:**
- CLI must have a "context" concept: `kanbambam use workspace "My Work"` sets the active workspace, then subsequent commands operate within it. Like `kubectl config use-context` or `git` operating within a repo
- Store CLI context in `~/.config/kanbambam/context.json` (active workspace, active board)
- API endpoints should be flat with query parameters, not deeply nested: `GET /items?board_id=456` not `GET /workspaces/123/boards/456/columns/789/items`
- Items should have globally unique IDs and be addressable directly: `GET /items/012` works regardless of hierarchy
- Short IDs for CLI display (like git short hashes or Linear's `KAN-123` style) -- nobody wants to type UUIDs

**Warning signs:**
- CLI commands require more than 2 flags to identify a resource
- API URLs are more than 3 levels deep
- Users need to look up parent IDs before operating on child resources
- No "current context" concept in CLI design docs

**Phase to address:**
Phase 1 (API + data model design). The URL structure and ID scheme are foundational. The CLI context system should be Phase 2 priority #1.

---

### Pitfall 4: Column Ordering and Item Positioning Nightmares

**What goes wrong:**
Kanban boards require ordered columns and ordered items within columns. Naive implementations use integer positions (1, 2, 3) which cause race conditions on reorder, require renumbering all items on every move, and break when two clients move items simultaneously. The drag-and-drop web experience and CLI `move` command produce different ordering results.

**Why it happens:**
Integer ordering is the first thing developers reach for. It works in a single-user, single-client demo. It breaks the moment you have concurrent operations or need to insert between positions.

**How to avoid:**
- Use fractional indexing (like Linear does) or a lexicographic ordering scheme (e.g., the `fractional-indexing` npm package). Position "between A and C" gets position "B" without renumbering anything
- The API `move` endpoint should accept `after_item_id` or `before_item_id` (relative positioning) not an absolute position index
- Include an `updated_at` or version field on columns/items for optimistic concurrency -- reject moves based on stale state with a clear error
- Test with concurrent moves: two clients moving different items in the same column simultaneously must both succeed without data loss

**Warning signs:**
- Position column in the database is an integer
- Move endpoint accepts `{ position: 3 }` instead of `{ after: "item_id" }`
- No concurrency handling on reorder operations
- Manual tests only ever move one item at a time

**Phase to address:**
Phase 1 (data model). Fractional indexing must be in the schema from day one. Retrofitting ordering schemes requires a data migration and breaks all client code.

---

### Pitfall 5: Building the Web App Before the API Is Battle-Tested

**What goes wrong:**
The team builds the API and web app in parallel. The web app shapes the API to serve its rendering needs (e.g., returning deeply nested board state in one call). When the CLI tries to use the same API, the responses are bloated, the create/update flows don't match CLI interaction patterns, and the API is really a BFF (backend-for-frontend) disguised as a general API.

**Why it happens:**
Web apps have complex rendering needs (show a full board with all columns and items in one page load). It's natural to build the API around this. But a general-purpose API serves multiple clients with different needs.

**How to avoid:**
- Build the CLI first. Seriously. If the API works well for a CLI, it will work well for everything. CLIs need clean, focused endpoints
- Design API endpoints as resources (items, columns, boards) not as screens (board-with-everything)
- If the web app needs aggregated data, add it as query parameters (`?include=columns,items`) or a separate GraphQL/BFF layer, not by warping the REST API
- Validate every endpoint works well from `curl` before building either client

**Warning signs:**
- API endpoints named after web pages (`/api/board-view`, `/api/dashboard`)
- Endpoints that return 5+ levels of nested JSON
- CLI needs multiple API calls to do what the web does in one
- API response includes fields only the web app uses (like `renderHints` or `displayOrder`)

**Phase to address:**
Phase 1 (API) should be CLI-driven. Phase 2 (CLI) validates the API works for the thin-client model. Phase 3 (Web) consumes the proven API. This ordering is critical.

---

### Pitfall 6: CLI Output That Cannot Be Scripted

**What goes wrong:**
The CLI outputs pretty, colorized, human-readable tables by default. But AI agents, shell scripts, and piped commands need machine-readable output. If structured output is an afterthought, the pretty output becomes the de facto API that scripts parse with fragile regex, and any formatting change breaks downstream automation.

**Why it happens:**
Developers demo the CLI to humans and optimize for that experience. The `--json` flag gets added later and covers only some commands, with inconsistent schemas across commands.

**How to avoid:**
- Every command must support `--json` from day one, returning consistent JSON with the same field names the API uses
- Detect when stdout is not a TTY (`process.stdout.isTTY`) and automatically switch to JSON/plain output -- this is how `gh` works
- Define an output interface that every command implements: `{ data: T, errors?: string[] }`
- `--quiet` flag that outputs only the created/modified resource ID (useful for scripting: `ITEM_ID=$(kanbambam item create --title "Fix bug" --quiet)`)
- Never put essential information only in color/formatting (accessibility + machine readability)

**Warning signs:**
- Commands that only output formatted tables with no `--json` option
- No TTY detection in the output layer
- Scripts in docs that parse CLI output with `grep` or `awk`
- Different JSON shapes across different commands

**Phase to address:**
Phase 2 (CLI) -- build the output formatting layer as infrastructure before implementing individual commands. Every command should go through it.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded column defaults ("To Do", "In Progress", "Done") | Fast board creation | Users can't customize defaults; migration needed to make them configurable | MVP only, with a TODO to make configurable |
| Single API response shape (no sparse fieldsets) | Simpler API code | Over-fetching kills CLI performance on slow connections; web loads unnecessary data | Never for list endpoints; OK for single-resource GETs in MVP |
| Storing auth tokens in plaintext config file | Easy to implement | Security vulnerability; users on shared systems exposed | Only as fallback when OS keychain is unavailable, with 0600 permissions |
| No pagination on list endpoints | Simpler client code | Boards with 100+ items become unusable; memory issues on large workspaces | Never -- add cursor-based pagination from the start |
| Skipping input validation on CLI (relying on API) | Less duplicate code | Poor UX -- users wait for an HTTP round trip to learn their input was invalid | MVP only for complex validation; basic checks (required fields, format) should be client-side |
| No rate limiting on API | Faster development | Abuse, accidental infinite loops from scripts, cost exposure | Never in production, even for single-user v1 |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| CLI browser auth flow | Opening browser with `open`/`xdg-open` and assuming it works | Use `open` package with fallback to printing URL + manual code entry. Support device code flow for headless |
| JWT token management | Storing only access token, no refresh flow | Issue short-lived access tokens (15min) + long-lived refresh tokens. CLI silently refreshes. Store refresh token securely |
| CLI config files | Custom config format or single JSON blob | Use XDG Base Directory spec: config in `~/.config/kanbambam/`, data in `~/.local/share/kanbambam/`. Separate auth from preferences |
| npm global install | Assuming `npm install -g` works everywhere | Support `npx kanbambam`, Homebrew formula, and standalone binaries (via `pkg` or `bun compile`). Many environments restrict global npm installs |
| Web app real-time updates | Polling the API every N seconds | Use WebSockets or Server-Sent Events for the web app. The CLI does not need real-time -- it reads fresh data on each command invocation |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading full board state for every CLI command | CLI feels sluggish (300ms+ response time) | CLI commands should hit focused endpoints; `GET /boards/:id` should not auto-include all nested data | Boards with 50+ items |
| No database indexes on foreign keys in hierarchy | Board list page slows down | Index `workspace_id` on boards, `board_id` on columns, `column_id` on items from the start | 20+ boards per workspace |
| Returning all items regardless of column/archive state | List endpoints return hundreds of results | Default to active items only; archived items require explicit `?status=archived` filter | 100+ total items across board history |
| No connection pooling in API | API response times spike under modest load | Use connection pooling (e.g., pgBouncer or built-in pool in Drizzle/Prisma) | 10+ concurrent requests |
| CLI making sequential API calls for board display | `kanbambam board show` takes 2+ seconds | Single `GET /boards/:id?include=columns,items` endpoint for board display; avoid N+1 pattern | Any board with 3+ columns |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| CLI token stored in plaintext without file permission restrictions | Token theft on shared systems or compromised machines | Use OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service). Fall back to file with 0600 permissions. Warn user |
| No authorization checks beyond authentication | User A can access User B's boards by guessing IDs | Every API endpoint must verify the authenticated user owns the requested resource. Use middleware that checks ownership on every request |
| Sequential/guessable resource IDs | Enumeration attacks -- increment ID to find other users' boards | Use UUIDs or CUIDs for all resource IDs. Never expose database auto-increment IDs in the API |
| CLI `--verbose` or `--debug` mode printing auth headers | Tokens leaked in CI logs, bug report pastes, screen shares | Redact `Authorization` header in debug output. Replace token with `***` after first 4 characters |
| No CORS configuration on API | Any website can make authenticated requests if user has a valid session | Strict CORS: allow only the Kanbambam web app origin. API tokens (for CLI) bypass CORS since they're not browser-based |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Requiring full resource names in CLI commands | Typos, frustration, long commands | Support short IDs (`KAN-42`), fuzzy matching on names, tab completion, and `kanbambam use` for context setting |
| No confirmation for destructive operations | Accidental board/workspace deletion | Require `--yes` flag or interactive confirmation for delete operations. `kanbambam board delete "Sprint 1"` should prompt; `kanbambam board delete "Sprint 1" --yes` skips prompt |
| Web app drag-and-drop with no keyboard alternative | Accessibility failure; power users slowed down | Keyboard shortcuts for moving items (like Trello's). Accessible drag-and-drop with ARIA attributes |
| CLI error messages showing raw HTTP status codes | "Error: 422" means nothing to users | Map API errors to human-readable messages: "Item title is required" not "422 Unprocessable Entity". Include the fix: "Use --title to set the item title" |
| Inconsistent command naming (`item create` vs `add-item` vs `new item`) | Users can never remember the right command | Pick one pattern and enforce it. Recommendation: noun-verb (`board create`, `item move`, `column list`). Add aliases for common alternatives |
| No progress indicator for slow operations | Users think CLI is frozen | Show spinner for any operation taking 500ms+. Use `ora` or similar. Suppress spinner when stdout is not a TTY |

## "Looks Done But Isn't" Checklist

- [ ] **Board display:** Often missing column ordering -- verify columns render in user-defined order, not alphabetical or insertion order
- [ ] **Item move:** Often missing position specification -- verify user can move item to a specific position within a column, not just "to column X" (which appends to end)
- [ ] **CLI auth:** Often missing token expiry handling -- verify the CLI gracefully handles expired tokens with auto-refresh, not a crash
- [ ] **Item creation:** Often missing default column assignment -- verify new items go to the first column (or user-specified column), not nowhere
- [ ] **Board deletion:** Often missing cascade behavior -- verify deleting a board also deletes its columns and items, with confirmation showing what will be lost
- [ ] **CLI context:** Often missing context validation -- verify `kanbambam board list` fails clearly if no workspace is selected, not with a confusing "no results" empty state
- [ ] **API error responses:** Often missing consistent error shape -- verify all error responses follow the same `{ error: { code, message, details } }` structure
- [ ] **Web app:** Often missing empty states -- verify new users see helpful onboarding, not a blank white page with no affordances

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| CLI/Web API divergence | HIGH | Audit all endpoints for client-specific behavior. Extract shared contract. Write integration tests for parity. May require API versioning |
| Integer-based ordering | HIGH | Data migration to fractional indexing. All clients must update move logic. Requires downtime or careful dual-write migration |
| No pagination | MEDIUM | Add cursor-based pagination to API. Update all clients. Existing scripts break if they assume full results |
| Pretty-only CLI output | MEDIUM | Add `--json` flag to all commands. Define output schema. Low risk but tedious across many commands |
| Plaintext token storage | LOW | Add keychain support, migrate existing tokens, warn users to revoke old tokens |
| No resource ownership checks | HIGH | Security audit all endpoints. Add authorization middleware. May need to invalidate sessions and force re-auth |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| CLI/Web API divergence | Phase 1 (API contract) | Shared TypeScript types compile-checked by both clients; integration test suite runs same operations through CLI and web |
| Auth flow failures | Phase 1 (API auth design) + Phase 2 (CLI auth implementation) | Auth works in: desktop terminal, SSH session, Docker container, CI environment with env var |
| Deep hierarchy UX problems | Phase 1 (data model + URL design) + Phase 2 (CLI context system) | CLI can operate on items with max 2 flags; API URLs are max 2 levels deep |
| Column/item ordering issues | Phase 1 (data model) | Fractional index column exists in schema; concurrent move test passes |
| API shaped by web, not general-purpose | Phase 1 (API) must complete before Phase 3 (Web) | Every endpoint works cleanly from curl; CLI is the first client |
| CLI output not scriptable | Phase 2 (CLI infrastructure) | Every command supports `--json`; piping output to `jq` works; non-TTY detection automatic |
| No authorization beyond auth | Phase 1 (API middleware) | Test: User A's token cannot access User B's resources on any endpoint |
| Guessable resource IDs | Phase 1 (data model) | All IDs are UUIDs/CUIDs; no auto-increment IDs exposed |
| No pagination | Phase 1 (API) | All list endpoints accept cursor parameter; response includes `hasMore` + `nextCursor` |
| Web drag-and-drop accessibility | Phase 3 (Web) | Keyboard-only user can reorder items; screen reader announces position changes |

## Sources

- GitHub CLI (`gh`) design patterns: browser auth flow, `--json` flag, TTY detection, token storage in OS keychain
- Linear: fractional indexing for issue ordering, short IDs (`LIN-123`), workspace context model
- Trello API: board/list/card hierarchy, flat REST endpoints with query params, webhook patterns
- Vercel CLI: `vercel link` for project context, environment detection for headless fallback
- Railway CLI: project/environment context model, `railway link` pattern
- kubectl: context/namespace model for hierarchical resource management
- Common Node.js CLI libraries (Commander, Ink, oclif): known patterns and anti-patterns
- XDG Base Directory Specification for config file locations

*Note: Sources are based on training data knowledge. Web search was unavailable during research. Confidence is MEDIUM -- patterns are well-established but specific version details should be verified during implementation.*

---
*Pitfalls research for: CLI-first Kanban board SaaS*
*Researched: 2026-03-25*

# Pitfalls Research

**Domain:** CLI-first Kanban board SaaS (CLI + REST API + Web App)
**Researched:** 2026-03-25
**Confidence:** MEDIUM (based on training data knowledge of CLI tools like gh, vercel, railway CLIs and Kanban products like Trello, Linear; no live web verification available)

## Critical Pitfalls

### Pitfall 1: CLI and Web App Diverge Into Separate Products

**What goes wrong:**
The CLI and web app start sharing an API but gradually develop client-specific endpoints, different data shapes, or features that only work in one client. The "one source of truth" promise breaks down. Users find that creating a board in the CLI produces slightly different results than creating one in the web app (missing defaults, different validation, etc.).

**Why it happens:**
Different developers work on CLI vs web. The web app needs "just one more field" so the endpoint gets a web-specific parameter. The CLI team adds a shortcut that bypasses a validation the web enforces. Without a shared API contract as the enforced boundary, drift is invisible until users report inconsistencies.

**How to avoid:**
- Define the API contract first (OpenAPI spec or shared TypeScript types in a monorepo package) and generate/validate both clients against it
- Both CLI and web app must use the exact same endpoints with the same request/response shapes -- no client-specific API routes in v1
- Integration tests that run the same operation through both CLI and web, then compare the resulting state
- Shared validation: put all business rules in the API, not in either client

**Warning signs:**
- An endpoint gains a parameter only one client sends
- A PR adds a "web-only" or "cli-only" API route
- Bug reports like "this works in the web but not the CLI"
- CLI and web have different error messages for the same validation failure

**Phase to address:**
Phase 1 (API foundation) -- establish the shared contract and monorepo structure before building either client. This is architectural and nearly impossible to retrofit.

---

### Pitfall 2: CLI Authentication That Frustrates Users

**What goes wrong:**
The browser-based auth flow (like `gh auth login`) seems simple but has many failure modes: the browser doesn't open on headless servers, the callback port is already in use, tokens expire with no clear re-auth UX, or the flow silently fails in SSH sessions, Docker containers, and CI environments.

**Why it happens:**
The happy path (developer on a Mac, browser opens, user clicks approve) works in development. Edge cases only surface when real users try it on servers, in containers, or after their token expires at 2am during a deploy.

**How to avoid:**
- Support multiple auth methods from day one: browser flow (primary), manual token paste (fallback for headless), environment variable `KANBAMBAM_TOKEN` (CI/automation)
- Detect headless environments and automatically fall back to token paste with clear instructions
- Token refresh: if the API returns 401, attempt a silent refresh before prompting re-auth. Never just fail with a cryptic error
- Store tokens in the OS keychain (via `keytar` or similar) not a plaintext file. Fall back to `~/.config/kanbambam/credentials` with 0600 permissions if keychain unavailable
- Print where the token is stored during `auth login` so users know how to revoke

**Warning signs:**
- Auth tests only run in a desktop environment
- No test for "what happens when the browser doesn't open"
- Token storage is a JSON file with no permission restrictions
- No `KANBAMBAM_TOKEN` env var support

**Phase to address:**
Phase 2 (CLI implementation) -- but the API auth design (JWT/refresh tokens, OAuth device flow) must be planned in Phase 1.

---

### Pitfall 3: Treating the Data Model as Flat When It Is Deeply Hierarchical

**What goes wrong:**
The User > Workspace > Board > Column > Item hierarchy creates a 4-level nesting problem. Naive implementations require users to specify the full path every time (`kanbambam item move --workspace "My Work" --board "Sprint 1" --column "Done" --item "Fix bug"`), making the CLI unusable. Or the API requires deeply nested URLs (`/workspaces/123/boards/456/columns/789/items/012`) that are brittle and hard to evolve.

**Why it happens:**
The data model maps cleanly to a relational schema but not to a CLI UX or REST URL structure. Developers design the API around the data model instead of around how users actually work.

**How to avoid:**
- CLI must have a "context" concept: `kanbambam use workspace "My Work"` sets the active workspace, then subsequent commands operate within it. Like `kubectl config use-context` or `git` operating within a repo
- Store CLI context in `~/.config/kanbambam/context.json` (active workspace, active board)
- API endpoints should be flat with query parameters, not deeply nested: `GET /items?board_id=456` not `GET /workspaces/123/boards/456/columns/789/items`
- Items should have globally unique IDs and be addressable directly: `GET /items/012` works regardless of hierarchy
- Short IDs for CLI display (like git short hashes or Linear's `KAN-123` style) -- nobody wants to type UUIDs

**Warning signs:**
- CLI commands require more than 2 flags to identify a resource
- API URLs are more than 3 levels deep
- Users need to look up parent IDs before operating on child resources
- No "current context" concept in CLI design docs

**Phase to address:**
Phase 1 (API + data model design). The URL structure and ID scheme are foundational. The CLI context system should be Phase 2 priority #1.

---

### Pitfall 4: Column Ordering and Item Positioning Nightmares

**What goes wrong:**
Kanban boards require ordered columns and ordered items within columns. Naive implementations use integer positions (1, 2, 3) which cause race conditions on reorder, require renumbering all items on every move, and break when two clients move items simultaneously. The drag-and-drop web experience and CLI `move` command produce different ordering results.

**Why it happens:**
Integer ordering is the first thing developers reach for. It works in a single-user, single-client demo. It breaks the moment you have concurrent operations or need to insert between positions.

**How to avoid:**
- Use fractional indexing (like Linear does) or a lexicographic ordering scheme (e.g., the `fractional-indexing` npm package). Position "between A and C" gets position "B" without renumbering anything
- The API `move` endpoint should accept `after_item_id` or `before_item_id` (relative positioning) not an absolute position index
- Include an `updated_at` or version field on columns/items for optimistic concurrency -- reject moves based on stale state with a clear error
- Test with concurrent moves: two clients moving different items in the same column simultaneously must both succeed without data loss

**Warning signs:**
- Position column in the database is an integer
- Move endpoint accepts `{ position: 3 }` instead of `{ after: "item_id" }`
- No concurrency handling on reorder operations
- Manual tests only ever move one item at a time

**Phase to address:**
Phase 1 (data model). Fractional indexing must be in the schema from day one. Retrofitting ordering schemes requires a data migration and breaks all client code.

---

### Pitfall 5: Building the Web App Before the API Is Battle-Tested

**What goes wrong:**
The team builds the API and web app in parallel. The web app shapes the API to serve its rendering needs (e.g., returning deeply nested board state in one call). When the CLI tries to use the same API, the responses are bloated, the create/update flows don't match CLI interaction patterns, and the API is really a BFF (backend-for-frontend) disguised as a general API.

**Why it happens:**
Web apps have complex rendering needs (show a full board with all columns and items in one page load). It's natural to build the API around this. But a general-purpose API serves multiple clients with different needs.

**How to avoid:**
- Build the CLI first. Seriously. If the API works well for a CLI, it will work well for everything. CLIs need clean, focused endpoints
- Design API endpoints as resources (items, columns, boards) not as screens (board-with-everything)
- If the web app needs aggregated data, add it as query parameters (`?include=columns,items`) or a separate GraphQL/BFF layer, not by warping the REST API
- Validate every endpoint works well from `curl` before building either client

**Warning signs:**
- API endpoints named after web pages (`/api/board-view`, `/api/dashboard`)
- Endpoints that return 5+ levels of nested JSON
- CLI needs multiple API calls to do what the web does in one
- API response includes fields only the web app uses (like `renderHints` or `displayOrder`)

**Phase to address:**
Phase 1 (API) should be CLI-driven. Phase 2 (CLI) validates the API works for the thin-client model. Phase 3 (Web) consumes the proven API. This ordering is critical.

---

### Pitfall 6: CLI Output That Cannot Be Scripted

**What goes wrong:**
The CLI outputs pretty, colorized, human-readable tables by default. But AI agents, shell scripts, and piped commands need machine-readable output. If structured output is an afterthought, the pretty output becomes the de facto API that scripts parse with fragile regex, and any formatting change breaks downstream automation.

**Why it happens:**
Developers demo the CLI to humans and optimize for that experience. The `--json` flag gets added later and covers only some commands, with inconsistent schemas across commands.

**How to avoid:**
- Every command must support `--json` from day one, returning consistent JSON with the same field names the API uses
- Detect when stdout is not a TTY (`process.stdout.isTTY`) and automatically switch to JSON/plain output -- this is how `gh` works
- Define an output interface that every command implements: `{ data: T, errors?: string[] }`
- `--quiet` flag that outputs only the created/modified resource ID (useful for scripting: `ITEM_ID=$(kanbambam item create --title "Fix bug" --quiet)`)
- Never put essential information only in color/formatting (accessibility + machine readability)

**Warning signs:**
- Commands that only output formatted tables with no `--json` option
- No TTY detection in the output layer
- Scripts in docs that parse CLI output with `grep` or `awk`
- Different JSON shapes across different commands

**Phase to address:**
Phase 2 (CLI) -- build the output formatting layer as infrastructure before implementing individual commands. Every command should go through it.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded column defaults ("To Do", "In Progress", "Done") | Fast board creation | Users can't customize defaults; migration needed to make them configurable | MVP only, with a TODO to make configurable |
| Single API response shape (no sparse fieldsets) | Simpler API code | Over-fetching kills CLI performance on slow connections; web loads unnecessary data | Never for list endpoints; OK for single-resource GETs in MVP |
| Storing auth tokens in plaintext config file | Easy to implement | Security vulnerability; users on shared systems exposed | Only as fallback when OS keychain is unavailable, with 0600 permissions |
| No pagination on list endpoints | Simpler client code | Boards with 100+ items become unusable; memory issues on large workspaces | Never -- add cursor-based pagination from the start |
| Skipping input validation on CLI (relying on API) | Less duplicate code | Poor UX -- users wait for an HTTP round trip to learn their input was invalid | MVP only for complex validation; basic checks (required fields, format) should be client-side |
| No rate limiting on API | Faster development | Abuse, accidental infinite loops from scripts, cost exposure | Never in production, even for single-user v1 |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| CLI browser auth flow | Opening browser with `open`/`xdg-open` and assuming it works | Use `open` package with fallback to printing URL + manual code entry. Support device code flow for headless |
| JWT token management | Storing only access token, no refresh flow | Issue short-lived access tokens (15min) + long-lived refresh tokens. CLI silently refreshes. Store refresh token securely |
| CLI config files | Custom config format or single JSON blob | Use XDG Base Directory spec: config in `~/.config/kanbambam/`, data in `~/.local/share/kanbambam/`. Separate auth from preferences |
| npm global install | Assuming `npm install -g` works everywhere | Support `npx kanbambam`, Homebrew formula, and standalone binaries (via `pkg` or `bun compile`). Many environments restrict global npm installs |
| Web app real-time updates | Polling the API every N seconds | Use WebSockets or Server-Sent Events for the web app. The CLI does not need real-time -- it reads fresh data on each command invocation |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading full board state for every CLI command | CLI feels sluggish (300ms+ response time) | CLI commands should hit focused endpoints; `GET /boards/:id` should not auto-include all nested data | Boards with 50+ items |
| No database indexes on foreign keys in hierarchy | Board list page slows down | Index `workspace_id` on boards, `board_id` on columns, `column_id` on items from the start | 20+ boards per workspace |
| Returning all items regardless of column/archive state | List endpoints return hundreds of results | Default to active items only; archived items require explicit `?status=archived` filter | 100+ total items across board history |
| No connection pooling in API | API response times spike under modest load | Use connection pooling (e.g., pgBouncer or built-in pool in Drizzle/Prisma) | 10+ concurrent requests |
| CLI making sequential API calls for board display | `kanbambam board show` takes 2+ seconds | Single `GET /boards/:id?include=columns,items` endpoint for board display; avoid N+1 pattern | Any board with 3+ columns |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| CLI token stored in plaintext without file permission restrictions | Token theft on shared systems or compromised machines | Use OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service). Fall back to file with 0600 permissions. Warn user |
| No authorization checks beyond authentication | User A can access User B's boards by guessing IDs | Every API endpoint must verify the authenticated user owns the requested resource. Use middleware that checks ownership on every request |
| Sequential/guessable resource IDs | Enumeration attacks -- increment ID to find other users' boards | Use UUIDs or CUIDs for all resource IDs. Never expose database auto-increment IDs in the API |
| CLI `--verbose` or `--debug` mode printing auth headers | Tokens leaked in CI logs, bug report pastes, screen shares | Redact `Authorization` header in debug output. Replace token with `***` after first 4 characters |
| No CORS configuration on API | Any website can make authenticated requests if user has a valid session | Strict CORS: allow only the Kanbambam web app origin. API tokens (for CLI) bypass CORS since they're not browser-based |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Requiring full resource names in CLI commands | Typos, frustration, long commands | Support short IDs (`KAN-42`), fuzzy matching on names, tab completion, and `kanbambam use` for context setting |
| No confirmation for destructive operations | Accidental board/workspace deletion | Require `--yes` flag or interactive confirmation for delete operations. `kanbambam board delete "Sprint 1"` should prompt; `kanbambam board delete "Sprint 1" --yes` skips prompt |
| Web app drag-and-drop with no keyboard alternative | Accessibility failure; power users slowed down | Keyboard shortcuts for moving items (like Trello's). Accessible drag-and-drop with ARIA attributes |
| CLI error messages showing raw HTTP status codes | "Error: 422" means nothing to users | Map API errors to human-readable messages: "Item title is required" not "422 Unprocessable Entity". Include the fix: "Use --title to set the item title" |
| Inconsistent command naming (`item create` vs `add-item` vs `new item`) | Users can never remember the right command | Pick one pattern and enforce it. Recommendation: noun-verb (`board create`, `item move`, `column list`). Add aliases for common alternatives |
| No progress indicator for slow operations | Users think CLI is frozen | Show spinner for any operation taking 500ms+. Use `ora` or similar. Suppress spinner when stdout is not a TTY |

## "Looks Done But Isn't" Checklist

- [ ] **Board display:** Often missing column ordering -- verify columns render in user-defined order, not alphabetical or insertion order
- [ ] **Item move:** Often missing position specification -- verify user can move item to a specific position within a column, not just "to column X" (which appends to end)
- [ ] **CLI auth:** Often missing token expiry handling -- verify the CLI gracefully handles expired tokens with auto-refresh, not a crash
- [ ] **Item creation:** Often missing default column assignment -- verify new items go to the first column (or user-specified column), not nowhere
- [ ] **Board deletion:** Often missing cascade behavior -- verify deleting a board also deletes its columns and items, with confirmation showing what will be lost
- [ ] **CLI context:** Often missing context validation -- verify `kanbambam board list` fails clearly if no workspace is selected, not with a confusing "no results" empty state
- [ ] **API error responses:** Often missing consistent error shape -- verify all error responses follow the same `{ error: { code, message, details } }` structure
- [ ] **Web app:** Often missing empty states -- verify new users see helpful onboarding, not a blank white page with no affordances

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| CLI/Web API divergence | HIGH | Audit all endpoints for client-specific behavior. Extract shared contract. Write integration tests for parity. May require API versioning |
| Integer-based ordering | HIGH | Data migration to fractional indexing. All clients must update move logic. Requires downtime or careful dual-write migration |
| No pagination | MEDIUM | Add cursor-based pagination to API. Update all clients. Existing scripts break if they assume full results |
| Pretty-only CLI output | MEDIUM | Add `--json` flag to all commands. Define output schema. Low risk but tedious across many commands |
| Plaintext token storage | LOW | Add keychain support, migrate existing tokens, warn users to revoke old tokens |
| No resource ownership checks | HIGH | Security audit all endpoints. Add authorization middleware. May need to invalidate sessions and force re-auth |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| CLI/Web API divergence | Phase 1 (API contract) | Shared TypeScript types compile-checked by both clients; integration test suite runs same operations through CLI and web |
| Auth flow failures | Phase 1 (API auth design) + Phase 2 (CLI auth implementation) | Auth works in: desktop terminal, SSH session, Docker container, CI environment with env var |
| Deep hierarchy UX problems | Phase 1 (data model + URL design) + Phase 2 (CLI context system) | CLI can operate on items with max 2 flags; API URLs are max 2 levels deep |
| Column/item ordering issues | Phase 1 (data model) | Fractional index column exists in schema; concurrent move test passes |
| API shaped by web, not general-purpose | Phase 1 (API) must complete before Phase 3 (Web) | Every endpoint works cleanly from curl; CLI is the first client |
| CLI output not scriptable | Phase 2 (CLI infrastructure) | Every command supports `--json`; piping output to `jq` works; non-TTY detection automatic |
| No authorization beyond auth | Phase 1 (API middleware) | Test: User A's token cannot access User B's resources on any endpoint |
| Guessable resource IDs | Phase 1 (data model) | All IDs are UUIDs/CUIDs; no auto-increment IDs exposed |
| No pagination | Phase 1 (API) | All list endpoints accept cursor parameter; response includes `hasMore` + `nextCursor` |
| Web drag-and-drop accessibility | Phase 3 (Web) | Keyboard-only user can reorder items; screen reader announces position changes |

## Sources

- GitHub CLI (`gh`) design patterns: browser auth flow, `--json` flag, TTY detection, token storage in OS keychain
- Linear: fractional indexing for issue ordering, short IDs (`LIN-123`), workspace context model
- Trello API: board/list/card hierarchy, flat REST endpoints with query params, webhook patterns
- Vercel CLI: `vercel link` for project context, environment detection for headless fallback
- Railway CLI: project/environment context model, `railway link` pattern
- kubectl: context/namespace model for hierarchical resource management
- Common Node.js CLI libraries (Commander, Ink, oclif): known patterns and anti-patterns
- XDG Base Directory Specification for config file locations

*Note: Sources are based on training data knowledge. Web search was unavailable during research. Confidence is MEDIUM -- patterns are well-established but specific version details should be verified during implementation.*

---
*Pitfalls research for: CLI-first Kanban board SaaS*
*Researched: 2026-03-25*

