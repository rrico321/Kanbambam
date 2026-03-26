# Phase 4: Item Management - Research

**Researched:** 2026-03-26
**Domain:** CLI command implementation for item CRUD, move, reorder, labels, due dates, and board view
**Confidence:** HIGH

## Summary

Phase 4 builds CLI commands that consume the already-existing API endpoints for item management. The API layer (items CRUD, move, list) was built in Phase 1 and is fully functional. The CLI patterns for command structure, output formatting, context resolution, confirmation prompts, and fractional indexing reorder were all established in Phases 2-3. This phase is primarily a matter of following those patterns for a new entity (items) plus two new capabilities: a board view command and visual due date flagging.

The `ItemResponse` type in `apps/cli/src/types.ts` is currently incomplete -- it lacks `description`, `dueDate`, and `labels` fields that the API returns. This must be fixed before implementing any item commands. The API's `UpdateItemSchema` accepts all optional fields (title, description, dueDate, labels) in a single PATCH, so `item edit` can combine multiple flags in one API call.

**Primary recommendation:** Follow the established command patterns from Phase 3 exactly. The only novel work is the board view Ink component (horizontal column layout) and the `resolveColumnId()` context helper. Everything else is pattern replication.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Simple table for `item list` -- bordered table with columns for ID, Title, Labels, Due Date. Consistent with workspace/board/column list commands from Phase 3.
- **D-02:** Board view command -- `kanbambam board view` renders the full Kanban board with side-by-side columns. Each column shows header with name and item count, items listed as titles underneath. Columns rendered horizontally in classic Kanban layout. Truncates if terminal is too narrow.
- **D-03:** Free-text tags -- labels are simple strings specified via `--label` flag (repeatable). No color mapping, displayed as comma-separated list in tables. Example: `--label bug --label urgent`.
- **D-04:** Replace-all semantics -- `--label` sets the full label array each time. To remove one label, re-specify the remaining labels. To clear all, use `--label ''`. Matches how the API works (PATCH with labels array).
- **D-05:** ISO date strings -- `--due-date 2026-04-01` for setting, `--due-date ''` for clearing. Simple, unambiguous, no extra dependencies.
- **D-06:** Overdue visual flagging -- due dates displayed in red when past due, yellow when due today. Subtle color cue in both list and board view.
- **D-07:** Inline description flag -- `--description 'text'` for setting, `--description ''` for clearing. Simple, scriptable, consistent with label and due date patterns.
- **D-08:** Dedicated item show command -- `kanbambam item show <id>` displays full item detail: title, description, labels, due date, column name, timestamps.
- **D-09:** Resource subcommands -- `kanbambam item create/list/show/edit/move/reorder/delete`. Follows established entity command pattern.
- **D-10:** Context resolution -- item commands resolve column/board from `--column`/`--board` flags or stored context. Move uses `--to <column-id>` for target column.
- **D-11:** Delete confirmation -- `kanbambam item delete <id>` prompts for confirmation, `--force` to skip.
- **D-12:** Reorder uses fractional indexing -- `kanbambam item reorder <id> --position N` translates 1-based position to fractional index, same pattern as column reorder.

### Claude's Discretion
- Board view Ink component architecture and terminal width handling
- Item show layout and formatting details
- How `item edit` combines multiple flags in one PATCH call (title + description + labels + due-date)
- Error handling for invalid date formats
- Column resolution for item commands (may need --column flag or resolve from context)
- Board view plain-text fallback for non-TTY environments
- Test structure following established mock patterns

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ITEM-01 | User can create an item in a column with a title | `POST /api/v1/columns/{columnId}/items` exists; CreateItemSchema accepts title + optional description; follow board create pattern |
| ITEM-02 | User can add/edit a description on an item | `PATCH /api/v1/items/{id}` with `description` field (nullable); `item edit --description` flag |
| ITEM-03 | User can move an item to a different column | `POST /api/v1/items/{id}/move` with `columnId` + optional `position`; `item move <id> --to <col-id>` |
| ITEM-04 | User can reorder items within a column | Move endpoint with same columnId + fractional position; reuse column reorder pattern |
| ITEM-05 | User can delete an item | `DELETE /api/v1/items/{id}`; GET-first pattern for confirmation display |
| ITEM-06 | User can add labels/tags to an item | `PATCH /api/v1/items/{id}` with `labels` array; `--label` repeatable flag with replace-all semantics |
| ITEM-07 | User can set a due date on an item | `PATCH /api/v1/items/{id}` with `dueDate` ISO string; `--due-date` flag |
| ITEM-08 | User can remove labels and due dates | Same PATCH endpoint with `null` for dueDate, `null`/empty array for labels; `--label ''` and `--due-date ''` |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Commander.js | ^12.x | Command parsing | Already used for all CLI commands |
| Ink | ^5.x | Rich terminal UI | Already used for Table, SuccessMessage, etc. |
| chalk | ^5.x | Terminal string styling | Already used; needed for due date color flagging |
| fractional-indexing | installed | Position calculation | Already used in column reorder; reuse for item reorder |
| conf | ^13.x | Local config storage | Already used for context system |

### No New Dependencies Required
This phase requires zero new npm packages. All needed libraries are already installed from Phases 2-3.

## Architecture Patterns

### New Files to Create
```
apps/cli/src/
  commands/item/
    create.ts          # item create <title> --column <id> [--description]
    list.ts            # item list --column <id>
    show.ts            # item show <id>
    edit.ts            # item edit <id> [--title] [--description] [--label...] [--due-date]
    move.ts            # item move <id> --to <column-id>
    reorder.ts         # item reorder <id> --position N
    delete.ts          # item delete <id> [--force]
    __tests__/
      create.test.ts
      list.test.ts
      show.test.ts
      edit.test.ts
      move.test.ts
      reorder.test.ts
      delete.test.ts
  commands/board/
    view.ts            # board view [--board <id>]
    __tests__/
      view.test.ts
  components/
    BoardView.tsx       # Horizontal Kanban board layout
    ItemDetail.tsx      # Full item detail display for item show
```

### Modifications to Existing Files
```
apps/cli/src/types.ts           # Extend ItemResponse with description, dueDate, labels
apps/cli/src/lib/context.ts     # Add resolveColumnId() helper
apps/cli/src/index.ts           # Register item command group + board view subcommand
```

### Pattern: Command Implementation (established in Phase 3)
Every command follows this exact shape:
```typescript
import React from 'react'
import type { GlobalOptions, ApiEnvelope, ItemResponse, ApiError } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'
import { ErrorDisplay } from '../../components/ErrorDisplay.js'

export async function itemCreateCommand(
  title: string,
  options: { column?: string; description?: string },
  globalOptions: GlobalOptions,
): Promise<void> {
  const mode = detectOutputMode(globalOptions)
  const columnId = resolveColumnId(options)

  const response = await apiRequest(`/api/v1/columns/${columnId}/items`, {
    method: 'POST',
    body: JSON.stringify({ title, description: options.description }),
  })

  if (!response.ok) {
    // Error handling pattern: parse ApiError, display via mode
    // ...
  }

  const { data, meta } = (await response.json()) as ApiEnvelope<ItemResponse>

  if (mode === 'json') {
    outputJson(data, meta)
  } else if (mode === 'ink') {
    outputInk(React.createElement(SuccessMessage, { message: `Created item "${data.title}" (${data.id})` }))
  } else {
    outputPlain(`Created item "${data.title}" (${data.id})`)
  }
}
```

### Pattern: Delete with GET-first Confirmation (from workspace/board/column delete)
```typescript
// 1. GET /api/v1/items/{id} to get title for display
// 2. If not --force: confirm("Delete item 'title'?")
// 3. DELETE /api/v1/items/{id}
// 4. Output success
```

### Pattern: Fractional Index Reorder (from column reorder)
```typescript
// 1. GET /api/v1/items/{id} to get columnId
// 2. GET /api/v1/columns/{columnId}/items?limit=100 to get all items
// 3. Filter out target item, validate position range
// 4. generateKeyBetween(before, after) for new position
// 5. POST /api/v1/items/{id}/move with { columnId: sameColumnId, position: newPosition }
```

### Pattern: Item Move Between Columns
```typescript
// item move <id> --to <column-id> [--position N]
// 1. POST /api/v1/items/{id}/move with { columnId: targetColumnId }
// Without --position: API appends to end of target column
// With --position: compute fractional index in target column first
```

### Pattern: Item Edit with Combined PATCH
```typescript
// item edit <id> [--title X] [--description X] [--label X...] [--due-date X]
// Build body object from provided flags only
// Single PATCH /api/v1/items/{id} with all fields
// Handle empty string as null for clearing: --description '' -> { description: null }
// Handle --label '' as clearing: -> { labels: null }
// Handle --due-date '' as clearing: -> { dueDate: null }
```

### Pattern: Board View (new -- Kanban layout)
```typescript
// board view [--board <id>]
// 1. resolveBoardId(options) for board context
// 2. GET /api/v1/boards/{boardId}/columns?limit=100
// 3. For each column: GET /api/v1/columns/{colId}/items?limit=50
// 4. Render BoardView component with columns + items
// JSON mode: output { columns: [{ ...col, items: [...] }] }
// Plain mode: text table fallback
// Ink mode: horizontal Kanban layout
```

### Board View Component Architecture (Claude's Discretion)
```
BoardView.tsx:
- Accepts: columns with their items, terminal width
- Uses process.stdout.columns for terminal width detection
- Divides width evenly among columns (min 20 chars per column)
- If too many columns for width: show as many as fit, append "... +N more"
- Each column: bordered box with header (name + count), items as truncated titles
- Due dates: red if overdue, yellow if today (using chalk or Ink Text color)
- Labels: dimmed comma-separated after title if space allows
```

### ItemResponse Type Fix
The current type is missing fields the API returns:
```typescript
// CURRENT (incomplete):
export interface ItemResponse {
  id: string
  title: string
  columnId: string
  position: string
  createdAt: string
  updatedAt: string
}

// REQUIRED (matches API ItemSchema):
export interface ItemResponse {
  id: string
  title: string
  description: string | null
  columnId: string
  position: string
  dueDate: string | null
  labels: string[] | null
  createdAt: string
  updatedAt: string
}
```

### resolveColumnId() Helper
```typescript
// Add to apps/cli/src/lib/context.ts
// Context system does not store column context (only workspace + board)
// So resolveColumnId only checks flags -- no fallback to stored context
export function resolveColumnId(flags: { column?: string }): string {
  if (flags.column) return flags.column
  throw new Error(
    'No column specified. Use --column <id>. List columns with: kanbambam column list',
  )
}
```

### Anti-Patterns to Avoid
- **Do NOT add column to stored context** -- the context system stores workspace + board only (per Phase 3 decisions). Column must always be specified via `--column` flag for item create/list.
- **Do NOT use `--label` as a single comma-separated string** -- use Commander's repeatable `.option('-l, --label <tag>', 'Label', collect)` pattern so each label is a separate flag invocation.
- **Do NOT parse relative dates** -- D-05 locks ISO date strings only. No "tomorrow", "next week", etc.
- **Do NOT create separate commands for label/due-date management** -- `item edit` handles all fields via flags in a single PATCH.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fractional indexing | Custom position math | `fractional-indexing` `generateKeyBetween()` | Already installed and proven in column reorder |
| Date comparison | Manual date parsing/comparison | Direct string comparison `new Date(dueDate) < new Date()` | ISO dates sort lexicographically; simple Date comparison for overdue logic |
| Terminal width detection | Custom terminal size logic | `process.stdout.columns` | Standard Node.js API, no library needed |
| Confirmation prompts | Custom readline | `confirm()` from `lib/confirm.ts` | Already built and tested |

## Common Pitfalls

### Pitfall 1: ItemResponse Type Mismatch
**What goes wrong:** Commands crash or silently drop data because the CLI type lacks `description`, `dueDate`, `labels` fields.
**Why it happens:** ItemResponse was forward-declared in Phase 3 with only the fields needed for column delete's item move logic.
**How to avoid:** Fix ItemResponse in types.ts FIRST before implementing any item commands.
**Warning signs:** TypeScript errors on `.description`, `.dueDate`, `.labels` access.

### Pitfall 2: Label Flag Collection
**What goes wrong:** `--label bug urgent` captures only "bug", or `--label "bug,urgent"` treats it as one label.
**Why it happens:** Commander.js repeatable options need a custom collect function.
**How to avoid:** Use Commander's variadic pattern:
```typescript
function collect(value: string, previous: string[]) {
  return previous.concat([value])
}
.option('-l, --label <tag>', 'Add label (repeatable)', collect, [])
```
**Warning signs:** Labels array has wrong length or contains commas within values.

### Pitfall 3: Empty String vs Null for Clearing
**What goes wrong:** `--description ''` sends empty string `""` to API instead of `null`, failing Zod validation (min length 1 on some fields) or not actually clearing.
**Why it happens:** Commander passes empty string for `--flag ''`.
**How to avoid:** In edit command, check `if (value === '') body.field = null` before sending PATCH.
**Warning signs:** API 400 errors on clear operations.

### Pitfall 4: Board View Fetching N+1
**What goes wrong:** Board view makes 1 + N API calls (1 for columns, N for each column's items). Slow with many columns.
**Why it happens:** No single API endpoint returns board + columns + items.
**How to avoid:** Accept the N+1 for now -- the API was designed this way. Use `Promise.all()` for parallel item fetches across columns. Typical boards have 3-5 columns, so 4-6 API calls is acceptable.
**Warning signs:** Visibly slow board view with many columns (>10).

### Pitfall 5: Item Reorder vs Move Confusion
**What goes wrong:** `item reorder` and `item move` both use the same `/move` endpoint but serve different UX purposes.
**Why it happens:** Reorder = same column, new position. Move = different column, optional position.
**How to avoid:** `item reorder <id> --position N` always uses the item's current columnId. `item move <id> --to <col-id>` uses the target columnId. Both call `POST /items/{id}/move`.
**Warning signs:** Item accidentally moves to wrong column during reorder.

### Pitfall 6: Due Date Timezone
**What goes wrong:** Due date comparison for "overdue" or "due today" is off by a day because of timezone differences.
**Why it happens:** ISO datetime strings from API are in UTC. Local "today" may differ from UTC "today".
**How to avoid:** Compare date portion only: extract `YYYY-MM-DD` from both the due date and local today, compare strings. Or use `new Date(dueDate).toLocaleDateString()` vs `new Date().toLocaleDateString()`.
**Warning signs:** Items show as overdue when they shouldn't, or vice versa.

## Code Examples

### Commander Repeatable Option (for labels)
```typescript
// Source: Commander.js documentation
function collect(value: string, previous: string[]) {
  return previous.concat([value])
}

item
  .command('edit')
  .argument('<id>', 'Item ID')
  .option('-t, --title <title>', 'New title')
  .option('-d, --description <text>', 'Description (empty string to clear)')
  .option('-l, --label <tag>', 'Label (repeatable, replaces all)', collect, [])
  .option('--due-date <date>', 'Due date YYYY-MM-DD (empty string to clear)')
  .action(async (id, options) => { ... })
```

### Due Date Color Logic
```typescript
// Source: project decision D-06
function dueDateColor(dueDate: string | null): string | undefined {
  if (!dueDate) return undefined
  const due = new Date(dueDate)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())

  if (dueDay < today) return 'red'       // overdue
  if (dueDay.getTime() === today.getTime()) return 'yellow' // due today
  return undefined  // future -- default color
}
```

### Board View Ink Component Skeleton
```tsx
// Source: project decision D-02
import React from 'react'
import { Box, Text } from 'ink'

interface BoardColumn {
  id: string
  name: string
  items: { id: string; title: string; dueDate: string | null; labels: string[] | null }[]
}

export function BoardView({ columns, width }: { columns: BoardColumn[]; width: number }) {
  const colWidth = Math.max(20, Math.floor(width / columns.length) - 2)

  return (
    <Box>
      {columns.map((col) => (
        <Box key={col.id} flexDirection="column" width={colWidth} borderStyle="round" paddingX={1}>
          <Text bold>{col.name} ({col.items.length})</Text>
          <Text dimColor>{'-'.repeat(colWidth - 4)}</Text>
          {col.items.map((item) => (
            <Text key={item.id} wrap="truncate">{item.title}</Text>
          ))}
          {col.items.length === 0 && <Text dimColor>(empty)</Text>}
        </Box>
      ))}
    </Box>
  )
}
```

### Label Handling in Edit Command
```typescript
// Source: project decisions D-03, D-04, D-08
// labels comes from Commander as string[] (via collect function)
// Empty label list means no --label flag was passed
// Single empty string [''] means clear all labels
function resolveLabels(labels: string[]): string[] | null | undefined {
  if (labels.length === 0) return undefined  // not specified, don't include in PATCH
  if (labels.length === 1 && labels[0] === '') return null  // --label '' clears
  return labels  // replace-all with new labels
}
```

## API Endpoint Reference

| CLI Command | HTTP Method | API Route | Request Body |
|-------------|-------------|-----------|-------------|
| `item create <title> --column <id>` | POST | `/api/v1/columns/{columnId}/items` | `{ title, description? }` |
| `item list --column <id>` | GET | `/api/v1/columns/{columnId}/items` | query: `limit`, `cursor` |
| `item show <id>` | GET | `/api/v1/items/{id}` | -- |
| `item edit <id> [flags]` | PATCH | `/api/v1/items/{id}` | `{ title?, description?, dueDate?, labels? }` |
| `item delete <id>` | DELETE | `/api/v1/items/{id}` | -- |
| `item move <id> --to <col>` | POST | `/api/v1/items/{id}/move` | `{ columnId, position? }` |
| `item reorder <id> --position N` | POST | `/api/v1/items/{id}/move` | `{ columnId: sameCol, position }` |
| `board view` | GET x (1+N) | columns list + items list per column | -- |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already configured) |
| Config file | `apps/cli/vitest.config.ts` |
| Quick run command | `cd apps/cli && pnpm vitest run --reporter=verbose` |
| Full suite command | `cd apps/cli && pnpm vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ITEM-01 | Create item with title | unit | `cd apps/cli && pnpm vitest run src/commands/item/__tests__/create.test.ts -x` | Wave 0 |
| ITEM-02 | Edit description | unit | `cd apps/cli && pnpm vitest run src/commands/item/__tests__/edit.test.ts -x` | Wave 0 |
| ITEM-03 | Move item to column | unit | `cd apps/cli && pnpm vitest run src/commands/item/__tests__/move.test.ts -x` | Wave 0 |
| ITEM-04 | Reorder within column | unit | `cd apps/cli && pnpm vitest run src/commands/item/__tests__/reorder.test.ts -x` | Wave 0 |
| ITEM-05 | Delete item | unit | `cd apps/cli && pnpm vitest run src/commands/item/__tests__/delete.test.ts -x` | Wave 0 |
| ITEM-06 | Add labels | unit | `cd apps/cli && pnpm vitest run src/commands/item/__tests__/edit.test.ts -x` | Wave 0 |
| ITEM-07 | Set due date | unit | `cd apps/cli && pnpm vitest run src/commands/item/__tests__/edit.test.ts -x` | Wave 0 |
| ITEM-08 | Remove labels/due dates | unit | `cd apps/cli && pnpm vitest run src/commands/item/__tests__/edit.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/cli && pnpm vitest run --reporter=verbose`
- **Per wave merge:** `cd apps/cli && pnpm vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/cli/src/commands/item/__tests__/create.test.ts` -- covers ITEM-01
- [ ] `apps/cli/src/commands/item/__tests__/list.test.ts` -- covers item listing
- [ ] `apps/cli/src/commands/item/__tests__/show.test.ts` -- covers item show
- [ ] `apps/cli/src/commands/item/__tests__/edit.test.ts` -- covers ITEM-02, ITEM-06, ITEM-07, ITEM-08
- [ ] `apps/cli/src/commands/item/__tests__/move.test.ts` -- covers ITEM-03
- [ ] `apps/cli/src/commands/item/__tests__/reorder.test.ts` -- covers ITEM-04
- [ ] `apps/cli/src/commands/item/__tests__/delete.test.ts` -- covers ITEM-05
- [ ] `apps/cli/src/commands/board/__tests__/view.test.ts` -- covers board view

### Test Pattern (established)
All tests follow this pattern:
1. Mock `ink` to avoid yoga-layout WASM loading
2. Mock `api-client.js` with `vi.mock()`
3. Mock `fractional-indexing` if used
4. Use `vi.resetAllMocks()` + `vi.resetModules()` in beforeEach
5. Reset `process.exitCode` in afterEach
6. Dynamic import command after mocks: `const { cmd } = await import('../file.js')`
7. Test with `{ json: true }` global options, spy on `console.log`

## Project Constraints (from CLAUDE.md)

- TypeScript everywhere -- all commands in TypeScript
- CLI uses Commander.js, Ink, conf, chalk
- Vitest for testing
- Biome for linting/formatting
- pnpm workspaces monorepo
- No Express, Prisma, Redux, MongoDB, jsonwebtoken, dotenv, ESLint+Prettier, npm/yarn, Lerna
- Data model: User -> Workspaces -> Boards -> Columns -> Items
- Ink 5 uses its own React renderer (React 18); separate from web's React 19

## Sources

### Primary (HIGH confidence)
- `apps/api/src/routes/items/items.routes.ts` -- all 6 API routes verified
- `apps/api/src/routes/items/items.handlers.ts` -- handler implementations, move endpoint behavior confirmed
- `packages/shared/src/schemas/item.ts` -- CreateItemSchema, UpdateItemSchema, MoveItemSchema verified
- `apps/cli/src/commands/column/reorder.ts` -- fractional indexing pattern reference
- `apps/cli/src/commands/column/delete.ts` -- delete confirmation + item move pattern reference
- `apps/cli/src/commands/board/list.ts` -- list command pattern reference
- `apps/cli/src/lib/context.ts` -- context resolution pattern
- `apps/cli/src/lib/output.ts` -- 3-mode output pattern
- `apps/cli/src/commands/column/__tests__/reorder.test.ts` -- test mock pattern reference

### Secondary (MEDIUM confidence)
- Commander.js repeatable option pattern (training data, stable library)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used in prior phases
- Architecture: HIGH -- all patterns established in Phases 2-3, code examined directly
- Pitfalls: HIGH -- identified from direct code inspection and API schema analysis

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable -- no new dependencies, all patterns established)
