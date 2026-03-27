# Phase 4: Item Management - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver CLI commands for the full item lifecycle: create items in columns, edit title/description/labels/due dates, move between columns, reorder within a column, delete items, and view item details. Also includes a board view command showing the Kanban board in the terminal. All commands support --json output and resolve board/column from context. The API endpoints already exist from Phase 1 — this phase builds the CLI commands that consume them.

</domain>

<decisions>
## Implementation Decisions

### Item Display
- **D-01:** Simple table for `item list` — bordered table with columns for ID, Title, Labels, Due Date. Consistent with workspace/board/column list commands from Phase 3.
- **D-02:** Board view command — `kanbambam board view` renders the full Kanban board with side-by-side columns. Each column shows header with name and item count, items listed as titles underneath. Columns rendered horizontally in classic Kanban layout. Truncates if terminal is too narrow.

### Label System
- **D-03:** Free-text tags — labels are simple strings specified via `--label` flag (repeatable). No color mapping, displayed as comma-separated list in tables. Example: `--label bug --label urgent`.
- **D-04:** Replace-all semantics — `--label` sets the full label array each time. To remove one label, re-specify the remaining labels. To clear all, use `--label ''`. Matches how the API works (PATCH with labels array).

### Due Date UX
- **D-05:** ISO date strings — `--due-date 2026-04-01` for setting, `--due-date ''` for clearing. Simple, unambiguous, no extra dependencies.
- **D-06:** Overdue visual flagging — due dates displayed in red when past due, yellow when due today. Subtle color cue in both list and board view.

### Item Editing
- **D-07:** Inline description flag — `--description 'text'` for setting, `--description ''` for clearing. Simple, scriptable, consistent with label and due date patterns.
- **D-08:** Dedicated item show command — `kanbambam item show <id>` displays full item detail: title, description, labels, due date, column name, timestamps.

### Command Structure (carried from Phase 3)
- **D-09:** Resource subcommands — `kanbambam item create/list/show/edit/move/reorder/delete`. Follows established entity command pattern.
- **D-10:** Context resolution — item commands resolve column/board from `--column`/`--board` flags or stored context. Move uses `--to <column-id>` for target column.
- **D-11:** Delete confirmation — `kanbambam item delete <id>` prompts for confirmation, `--force` to skip.
- **D-12:** Reorder uses fractional indexing — `kanbambam item reorder <id> --position N` translates 1-based position to fractional index, same pattern as column reorder.

### Claude's Discretion
- Board view Ink component architecture and terminal width handling
- Item show layout and formatting details
- How `item edit` combines multiple flags in one PATCH call (title + description + labels + due-date)
- Error handling for invalid date formats
- Column resolution for item commands (may need --column flag or resolve from context)
- Board view plain-text fallback for non-TTY environments
- Test structure following established mock patterns

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specs
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — Phase 4 requirements: ITEM-01 through ITEM-08
- `.planning/ROADMAP.md` — Phase 4 success criteria and dependency chain

### Technology Stack
- `CLAUDE.md` §Recommended Stack — CLI stack (Commander.js, Ink, conf, chalk, fractional-indexing)

### Prior Phase Context
- `.planning/phases/01-foundation-api/01-CONTEXT.md` — API decisions: ID format, response envelope, nested REST routes, hard delete, cursor pagination
- `.planning/phases/02-authentication-flows/02-CONTEXT.md` — CLI decisions: output formatting, auto-refresh, conf storage pattern
- `.planning/phases/03-core-kanban-cli/03-CONTEXT.md` — CLI command patterns: subcommand structure, context system, output formatting, delete confirmation, column reorder with fractional indexing

### Existing API Routes
- `apps/api/src/routes/items/items.routes.ts` — Item CRUD endpoints (create, get, update, delete, move, list)
- `apps/api/src/routes/items/items.handlers.ts` — Item handler implementations

### Shared Schemas
- `packages/shared/src/schemas/item.ts` — CreateItemSchema (title, description?), UpdateItemSchema (title?, description?, dueDate?, labels?), MoveItemSchema (columnId, position?)

### Existing CLI Code
- `apps/cli/src/index.ts` — Commander.js program with workspace/board/column/context command groups
- `apps/cli/src/lib/api-client.ts` — apiRequest() with auth and auto-refresh
- `apps/cli/src/lib/output.ts` — Output dispatcher (ink/json/plain)
- `apps/cli/src/lib/context.ts` — resolveWorkspaceId, resolveBoardId helpers
- `apps/cli/src/lib/confirm.ts` — TTY confirmation prompt
- `apps/cli/src/lib/config.ts` — Conf with context storage (ContextEntry)
- `apps/cli/src/components/Table.tsx` — Reusable bordered table component
- `apps/cli/src/components/SuccessMessage.tsx` — Green success message
- `apps/cli/src/components/EmptyState.tsx` — Empty state with command hint
- `apps/cli/src/types.ts` — ItemResponse, ColumnResponse, GlobalOptions, ApiEnvelope, PaginatedMeta

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/cli/src/components/Table.tsx` — Bordered table for item list display
- `apps/cli/src/components/SuccessMessage.tsx` — Success confirmations after create/edit/delete
- `apps/cli/src/components/EmptyState.tsx` — Empty column state
- `apps/cli/src/lib/context.ts` — resolveBoardId() for board context resolution; will need resolveColumnId() for item commands
- `apps/cli/src/lib/confirm.ts` — Confirmation prompt for item delete
- `apps/cli/src/commands/column/reorder.ts` — Fractional indexing pattern with generateKeyBetween for item reorder

### Established Patterns
- Lazy command loading via `await import('./commands/item/create.js')` in index.ts
- 3-mode output: detectOutputMode → outputJson / outputInk / outputPlain
- Mock ink in tests to avoid yoga-layout WASM issues
- fileParallelism: false in vitest.config.ts for conf state isolation
- Delete commands: GET entity first for name display, then confirm, then DELETE

### Integration Points
- `apps/cli/src/index.ts` — new `item` command group and `board view` subcommand register here
- `apps/cli/src/lib/context.ts` — may need resolveColumnId() helper for item create/list
- `apps/cli/src/types.ts` — ItemResponse already exists from Phase 3
- `fractional-indexing` package already installed in apps/cli for item reorder

</code_context>

<specifics>
## Specific Ideas

- Board view should render the classic Kanban layout: bordered columns side-by-side with item titles stacked underneath, column name + count in header
- Labels displayed as comma-separated text in tables, no color coding
- Due dates colored red when overdue, yellow when due today

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-item-management*
*Context gathered: 2026-03-26*
