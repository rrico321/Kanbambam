# Phase 3: Core Kanban CLI - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver CLI commands for the complete workspace/board/column hierarchy: CRUD operations for workspaces, boards, and columns, plus a context system that lets users set active workspace/board to avoid repeating IDs. All commands support --json output and Ink-rendered TTY display. The API endpoints already exist from Phase 1 — this phase builds the CLI commands that consume them.

</domain>

<decisions>
## Implementation Decisions

### Command Structure
- **D-01:** Resource subcommands — `kanbambam workspace create/list/rename/delete`, `kanbambam board create/list/...`, `kanbambam column add/rename/reorder/delete`. Groups by entity, consistent with existing `kanbambam auth` pattern.
- **D-02:** Positional arguments — create takes name as positional arg, rename/delete take ID as positional. Parent entity via flags: `--workspace wks_abc`, `--board brd_xyz`. List commands take no positional args.
- **D-03:** Delete confirmation — delete commands prompt "Are you sure?" by default. Pass `--force` or `-f` to skip confirmation. Protects against accidents, scriptable with -f.

### Context System
- **D-04:** Implicit context with explicit overrides — if context is set, commands use it automatically. `--workspace`/`--board` flags override context. Error if no context AND no flag provided.
- **D-05:** Setting board auto-sets parent workspace — `context set --board brd_xyz` resolves and stores both the board and its parent workspace. One command for full context.
- **D-06:** Context display — `kanbambam context` (no subcommand) shows active workspace and board with names and IDs, or "(not set)" for unset values. Supports `--json` output.
- **D-07:** Persistent context — stored in conf alongside auth tokens. Survives terminal close/reopen. User sets it once, uses it until changed.
- **D-08:** Cache names with IDs — when setting context, store both ID and name in conf. Display uses cached name. Avoids API calls for context display. Acceptable trade-off if entity renamed elsewhere.

### Output Formatting
- **D-09:** Ink-bordered tables for list commands — clean bordered table with columns for ID, Name, and relevant metadata (board count for workspaces, column count for boards, position for columns). Ink Box + Text components for TTY, plain aligned text for non-TTY.
- **D-10:** Short success confirmations — one-line success messages with entity name and ID after create/rename/delete. Green text in TTY. e.g., `Created workspace My Project (wks_abc123)`.
- **D-11:** Helpful empty states — when no results, show a dim message with the command to create the first entity. Guides new users.

### Column Deletion Behavior
- **D-12:** Safe column deletion — if column has items, require `--move-to <column-id>` to relocate items OR `--force` to delete items too. Refuse without one of these flags. Empty columns delete without prompts (still respects --force for scripting).

### Column Reordering
- **D-13:** Numeric position — `column reorder <id> --position N` where N is 1-based index. Simple and explicit.

### Claude's Discretion
- Ink component architecture for tables and output rendering
- Error display format and error code handling
- API client helper methods for CRUD operations
- Command registration and lazy loading patterns in index.ts
- Test structure and mocking approach for CLI command tests
- How column reorder maps to the API's fractional indexing (translate position N to a fractional index)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specs
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — Phase 3 requirements: WKSP-01 through WKSP-04, BORD-01 through BORD-05, COLM-01 through COLM-04, CLI-01, CLI-05, CLI-06, CLI-07
- `.planning/ROADMAP.md` — Phase 3 success criteria and dependency chain

### Technology Stack
- `CLAUDE.md` §Recommended Stack — CLI stack (Commander.js, Ink, conf, chalk), API response format

### Prior Phase Context
- `.planning/phases/01-foundation-api/01-CONTEXT.md` — API decisions: ID format (D-01/02), response envelope (D-04/05), nested REST routes (D-06), hard delete (D-09), cursor pagination (D-10), empty start (D-11)
- `.planning/phases/02-authentication-flows/02-CONTEXT.md` — CLI decisions: output formatting (D-07/08/09), auto-refresh (D-11), conf storage pattern (D-03)

### Existing CLI Code
- `apps/cli/src/index.ts` — Commander.js program entry point with auth subcommands pattern
- `apps/cli/src/lib/api-client.ts` — HTTP client with auth header and auto-refresh on 401
- `apps/cli/src/lib/config.ts` — Conf-based config storage (tokens, apiBaseUrl)
- `apps/cli/src/lib/output.ts` — Output dispatcher: detectOutputMode, outputJson, outputPlain, outputInk, output()
- `apps/cli/src/types.ts` — GlobalOptions interface

### Existing API Routes
- `apps/api/src/routes/workspaces/` — Workspace CRUD endpoints
- `apps/api/src/routes/boards/` — Board CRUD endpoints
- `apps/api/src/routes/columns/` — Column CRUD endpoints (includes reorder)
- `apps/api/src/routes/items/` — Item CRUD endpoints (needed for column deletion with --move-to)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/cli/src/lib/api-client.ts` — `apiRequest()` with Bearer auth and auto-refresh. All new commands use this for API calls.
- `apps/cli/src/lib/output.ts` — Full output dispatcher (ink/json/plain). New commands use `detectOutputMode()` and `output()` or individual `outputJson`/`outputPlain`/`outputInk`.
- `apps/cli/src/lib/config.ts` — Conf instance with `config.get()`/`config.set()`. Context storage will extend this.
- `apps/cli/src/components/` — AuthSuccess.tsx, AuthStatus.tsx, ErrorDisplay.tsx, Spinner.tsx — Ink component patterns to follow for new table/list components.

### Established Patterns
- Lazy command loading via `await import('./commands/auth/login.js')` in index.ts — new commands should follow this
- Commander.js subcommand groups: `program.command('auth').description(...)` then chaining `.command('login')` etc.
- Output mode detection via `detectOutputMode(globalOpts)` then branching on mode
- Ink mock pattern in tests: `vi.mock('ink', ...)` to avoid yoga-layout WASM issues
- `fileParallelism: false` in vitest.config.ts for conf disk state isolation

### Integration Points
- `apps/cli/src/index.ts` — new workspace/board/column/context command groups register here
- `apps/cli/src/lib/config.ts` — extend KanbambamConfig interface with activeWorkspace/activeBoard fields
- API routes already exist — CLI commands are purely consumers via apiRequest()

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

*Phase: 03-core-kanban-cli*
*Context gathered: 2026-03-26*
