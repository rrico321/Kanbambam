# Phase 3: Core Kanban CLI - Research

**Researched:** 2026-03-26
**Domain:** CLI command implementation (Commander.js + Ink + API consumption)
**Confidence:** HIGH

## Summary

Phase 3 builds CLI commands that consume existing API endpoints for workspace, board, and column CRUD, plus a persistent context system. The API layer is complete -- all routes exist with standard envelope responses (`{ data, meta }`) and cursor-based pagination. The CLI already has established patterns from Phase 2: lazy command loading, output mode detection (ink/json/plain), Ink components, and `apiRequest()` with auto-refresh.

Two critical gaps exist in the API that the CLI must work around: (1) board creation does not auto-create default columns (BORD-05 requires "To Do, In Progress, Done"), so the CLI must issue 4 API calls (create board + 3 column creates), and (2) column deletion does not support item relocation -- the API cascade-deletes items with the column, so `--move-to` logic must be orchestrated CLI-side (list items, move each to target column, then delete the source column). Column reordering requires translating a user-friendly 1-based position to a fractional index string via the `fractional-indexing` library.

**Primary recommendation:** Follow existing Phase 2 patterns exactly. Each entity gets a command group directory, shared Ink table component, and the same lazy-import registration in index.ts. Context system extends the existing `conf` config with `activeWorkspace` and `activeBoard` fields.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Resource subcommands -- `kanbambam workspace create/list/rename/delete`, `kanbambam board create/list/...`, `kanbambam column add/rename/reorder/delete`. Groups by entity, consistent with existing `kanbambam auth` pattern.
- **D-02:** Positional arguments -- create takes name as positional arg, rename/delete take ID as positional. Parent entity via flags: `--workspace wks_abc`, `--board brd_xyz`. List commands take no positional args.
- **D-03:** Delete confirmation -- delete commands prompt "Are you sure?" by default. Pass `--force` or `-f` to skip confirmation. Protects against accidents, scriptable with -f.
- **D-04:** Implicit context with explicit overrides -- if context is set, commands use it automatically. `--workspace`/`--board` flags override context. Error if no context AND no flag provided.
- **D-05:** Setting board auto-sets parent workspace -- `context set --board brd_xyz` resolves and stores both the board and its parent workspace. One command for full context.
- **D-06:** Context display -- `kanbambam context` (no subcommand) shows active workspace and board with names and IDs, or "(not set)" for unset values. Supports `--json` output.
- **D-07:** Persistent context -- stored in conf alongside auth tokens. Survives terminal close/reopen. User sets it once, uses it until changed.
- **D-08:** Cache names with IDs -- when setting context, store both ID and name in conf. Display uses cached name. Avoids API calls for context display.
- **D-09:** Ink-bordered tables for list commands -- clean bordered table with columns for ID, Name, and relevant metadata (board count for workspaces, column count for boards, position for columns). Ink Box + Text components for TTY, plain aligned text for non-TTY.
- **D-10:** Short success confirmations -- one-line success messages with entity name and ID after create/rename/delete. Green text in TTY. e.g., `Created workspace My Project (wks_abc123)`.
- **D-11:** Helpful empty states -- when no results, show a dim message with the command to create the first entity. Guides new users.
- **D-12:** Safe column deletion -- if column has items, require `--move-to <column-id>` to relocate items OR `--force` to delete items too. Refuse without one of these flags. Empty columns delete without prompts (still respects --force for scripting).
- **D-13:** Numeric position -- `column reorder <id> --position N` where N is 1-based index. Simple and explicit.

### Claude's Discretion
- Ink component architecture for tables and output rendering
- Error display format and error code handling
- API client helper methods for CRUD operations
- Command registration and lazy loading patterns in index.ts
- Test structure and mocking approach for CLI command tests
- How column reorder maps to the API's fractional indexing (translate position N to a fractional index)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WKSP-01 | User can create a workspace with a name | API: `POST /api/v1/workspaces` with `{ name }`. CLI: positional name arg, apiRequest, success output. |
| WKSP-02 | User can list all their workspaces | API: `GET /api/v1/workspaces` with pagination. CLI: Ink table with ID, Name columns. |
| WKSP-03 | User can rename a workspace | API: `PATCH /api/v1/workspaces/{id}` with `{ name }`. CLI: positional ID + `--name` flag or positional name. |
| WKSP-04 | User can delete a workspace (and all its boards) | API: `DELETE /api/v1/workspaces/{id}` (DB cascade handles boards/columns/items). CLI: confirmation prompt, --force flag. |
| BORD-01 | User can create a board within a workspace | API: `POST /api/v1/workspaces/{workspaceId}/boards` with `{ name }`. CLI: requires workspace context or --workspace flag. |
| BORD-02 | User can list all boards in a workspace | API: `GET /api/v1/workspaces/{workspaceId}/boards` with pagination. CLI: Ink table with ID, Name columns. |
| BORD-03 | User can rename a board | API: `PATCH /api/v1/boards/{id}` with `{ name }`. |
| BORD-04 | User can delete a board (and all its columns/items) | API: `DELETE /api/v1/boards/{id}` (DB cascade). CLI: confirmation prompt. |
| BORD-05 | New boards are created with default columns (To Do, In Progress, Done) | API does NOT auto-create columns. CLI must call create-board then 3x create-column. |
| COLM-01 | User can add a column to a board | API: `POST /api/v1/boards/{boardId}/columns` with `{ name }`. CLI: requires board context or --board flag. |
| COLM-02 | User can rename a column | API: `PATCH /api/v1/columns/{id}` with `{ name }`. |
| COLM-03 | User can reorder columns within a board | API: `PATCH /api/v1/columns/{id}` with `{ position }`. CLI must translate 1-based index to fractional index string. |
| COLM-04 | User can delete a column (moves items to a target column or deletes them) | API: `DELETE /api/v1/columns/{id}` cascade-deletes items. CLI must orchestrate: check items, move if --move-to, then delete. |
| CLI-01 | All entity operations available as CLI commands | This phase covers workspace/board/column; items are Phase 4. |
| CLI-05 | User can set active workspace/board context | Extend conf KanbambamConfig with activeWorkspace/activeBoard. GET board endpoint returns workspaceId for auto-setting parent. |
| CLI-06 | User can view current context | Read from conf, display names+IDs or "(not set)". No API call needed (D-08 caches names). |
| CLI-07 | User can clear context | Delete activeWorkspace/activeBoard from conf. |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Commander.js | ^14 (installed) | Command parsing | Already in use for auth commands |
| Ink | ^6.8.0 (installed) | Terminal UI rendering | Already in use for auth output components |
| React | ^19 (installed) | Ink component rendering | Required by Ink 6 |
| conf | ^15 (installed) | Persistent config storage | Already stores auth tokens; extend for context |
| chalk | ^5 (installed) | Terminal colors | Already available for success/error coloring |

### New dependency needed
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fractional-indexing | ^3.2.0 | Translate 1-based position to fractional index string | Column reorder command (COLM-03). Already used in API package. |

**Installation:**
```bash
pnpm --filter @kanbambam/cli add fractional-indexing
```

**Note:** `fractional-indexing` is already a dependency of `apps/api`. Adding it to the CLI package enables position translation on the client side without requiring the API to expose a "reorder by position number" endpoint.

## Architecture Patterns

### Recommended Project Structure
```
apps/cli/src/
  commands/
    auth/               # existing
    workspace/          # NEW - create.ts, list.ts, rename.ts, delete.ts
    board/              # NEW - create.ts, list.ts, rename.ts, delete.ts
    column/             # NEW - add.ts, rename.ts, reorder.ts, delete.ts
    context/            # NEW - show.ts, set.ts, clear.ts
  components/
    AuthStatus.tsx      # existing
    AuthSuccess.tsx     # existing
    ErrorDisplay.tsx    # existing
    Spinner.tsx         # existing
    Table.tsx           # NEW - reusable bordered table for list commands
    SuccessMessage.tsx  # NEW - green success one-liner
    EmptyState.tsx      # NEW - dim helper message for empty lists
    ContextDisplay.tsx  # NEW - context show output
  lib/
    api-client.ts       # existing - apiRequest()
    config.ts           # EXTEND - add activeWorkspace/activeBoard to KanbambamConfig
    output.ts           # existing - detectOutputMode etc.
    context.ts          # NEW - resolveWorkspaceId(), resolveBoardId() helpers
    confirm.ts          # NEW - TTY confirmation prompt helper
  index.ts              # EXTEND - register workspace/board/column/context command groups
  types.ts              # EXTEND - add Workspace/Board/Column response types
```

### Pattern 1: Command Implementation
**What:** Each CLI command is a standalone async function in its own file.
**When to use:** Every command.
**Example:**
```typescript
// apps/cli/src/commands/workspace/create.ts
import React from 'react'
import type { GlobalOptions } from '../../types.js'
import { apiRequest } from '../../lib/api-client.js'
import { detectOutputMode, outputJson, outputPlain, outputInk } from '../../lib/output.js'
import { resolveWorkspaceId } from '../../lib/context.js'
import { SuccessMessage } from '../../components/SuccessMessage.js'

export async function workspaceCreateCommand(
  name: string,
  globalOptions: GlobalOptions,
): Promise<void> {
  const mode = detectOutputMode(globalOptions)

  const response = await apiRequest('/api/v1/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    // handle error using existing ErrorDisplay pattern
    return
  }

  const { data, meta } = await response.json()

  if (mode === 'json') {
    outputJson(data, meta)
  } else if (mode === 'ink') {
    outputInk(React.createElement(SuccessMessage, {
      message: `Created workspace ${data.name} (${data.id})`
    }))
  } else {
    outputPlain(`Created workspace ${data.name} (${data.id})`)
  }
}
```

### Pattern 2: Context Resolution
**What:** Helper functions that resolve workspace/board IDs from flags or stored context.
**When to use:** Any command requiring workspace or board ID.
**Example:**
```typescript
// apps/cli/src/lib/context.ts
import { config } from './config.js'

export function resolveWorkspaceId(flags: { workspace?: string }): string {
  const id = flags.workspace ?? config.get('activeWorkspace')?.id
  if (!id) {
    throw new Error(
      'No workspace specified. Use --workspace <id> or set context with: kanbambam context set --workspace <id>'
    )
  }
  return id
}

export function resolveBoardId(flags: { board?: string }): string {
  const id = flags.board ?? config.get('activeBoard')?.id
  if (!id) {
    throw new Error(
      'No board specified. Use --board <id> or set context with: kanbambam context set --board <id>'
    )
  }
  return id
}
```

### Pattern 3: Command Registration (lazy loading)
**What:** Register command groups in index.ts with lazy-imported action handlers.
**When to use:** Every new command group.
**Example:**
```typescript
// In index.ts
const workspace = program.command('workspace').description('Manage workspaces')

workspace
  .command('create')
  .description('Create a new workspace')
  .argument('<name>', 'Workspace name')
  .action(async (name: string) => {
    const { workspaceCreateCommand } = await import('./commands/workspace/create.js')
    await workspaceCreateCommand(name, program.opts())
  })
```

### Pattern 4: Delete Confirmation
**What:** Interactive confirmation prompt before destructive actions.
**When to use:** All delete commands (D-03).
**Example:**
```typescript
// apps/cli/src/lib/confirm.ts
import * as readline from 'node:readline/promises'

export async function confirm(message: string): Promise<boolean> {
  if (!process.stdin.isTTY) return false // non-interactive: refuse
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = await rl.question(`${message} [y/N] `)
    return answer.toLowerCase() === 'y'
  } finally {
    rl.close()
  }
}
```

### Pattern 5: Column Reorder (fractional index translation)
**What:** Convert user-provided 1-based position number to a fractional index string.
**When to use:** `column reorder` command (COLM-03).
**Example:**
```typescript
// In column reorder command
import { generateKeyBetween } from 'fractional-indexing'

// 1. Fetch all columns for the board, sorted by position
// 2. Remove the column being moved from the list
// 3. Calculate new fractional index:
//    - position 1: generateKeyBetween(null, remainingColumns[0].position)
//    - position N (last): generateKeyBetween(remainingColumns[N-2].position, null)
//    - position M (middle): generateKeyBetween(remainingColumns[M-2].position, remainingColumns[M-1].position)
// 4. PATCH /api/v1/columns/{id} with { position: newFractionalIndex }
```

### Pattern 6: Board Create with Default Columns
**What:** After creating a board, automatically create 3 default columns.
**When to use:** `board create` command (BORD-05).
**Example:**
```typescript
// In board create command
const boardResponse = await apiRequest(
  `/api/v1/workspaces/${workspaceId}/boards`,
  { method: 'POST', body: JSON.stringify({ name }) }
)
const { data: board } = await boardResponse.json()

// Create default columns sequentially (order matters for position)
for (const colName of ['To Do', 'In Progress', 'Done']) {
  await apiRequest(
    `/api/v1/boards/${board.id}/columns`,
    { method: 'POST', body: JSON.stringify({ name: colName }) }
  )
}
```

### Anti-Patterns to Avoid
- **Do not create a generic "entity command factory":** Each entity has slightly different behavior (boards need workspace context, columns need board context, workspace is top-level). Shared helpers for context resolution and output are fine, but command logic should stay in individual files.
- **Do not call API for context display:** D-08 explicitly says cache names with IDs. Reading from conf is sufficient.
- **Do not use Ink for confirmation prompts:** Ink manages its own render loop. Use Node.js `readline` for the simple "Are you sure? [y/N]" prompt. Ink components should only be used for displaying results.
- **Do not build a custom table renderer:** Use Ink's `Box` and `Text` with border styles for TTY. For plain mode, use simple string padding/alignment.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fractional index calculation | Custom position math | `fractional-indexing` library | Edge cases with adjacent positions, proven algorithm |
| Bordered terminal tables | Custom ANSI string building | Ink `Box` with `borderStyle` | Ink handles terminal width, Unicode borders, color |
| Config persistence | Custom JSON file management | `conf` (already in use) | Handles OS-appropriate paths, atomic writes, schema |
| Terminal color codes | Manual ANSI escape sequences | `chalk` (already in use) | Cross-platform, handles `NO_COLOR` env var |
| JSON output formatting | Custom serialization | `outputJson()` from output.ts | Already follows the `{ data, meta }` envelope pattern |

## Common Pitfalls

### Pitfall 1: Board Create Without Default Columns
**What goes wrong:** Creating a board via the API does not create default columns. User sees an empty board.
**Why it happens:** The API is stateless and generic -- it creates exactly what you ask for.
**How to avoid:** The `board create` CLI command must issue 4 sequential API calls: create board, then create "To Do", "In Progress", "Done" columns. If any column create fails, the board still exists but without all defaults -- handle gracefully.
**Warning signs:** New board created with `board list` showing 0 columns.

### Pitfall 2: Column Delete with Items Cascade
**What goes wrong:** The API's `DELETE /api/v1/columns/{id}` cascade-deletes all items in that column at the database level. If the CLI passes through without checking, items are silently lost.
**Why it happens:** PostgreSQL ON DELETE CASCADE on items.columnId.
**How to avoid:** Before calling the delete endpoint, the CLI must: (1) list items in the column, (2) if items exist and no `--move-to` or `--force`, error out, (3) if `--move-to`, move each item first via `POST /api/v1/items/{id}/move`, (4) then delete.
**Warning signs:** Column deleted without user being warned about items.

### Pitfall 3: Context Staleness After Entity Deletion
**What goes wrong:** User deletes the workspace/board that's currently set as active context. Subsequent commands fail with 404.
**Why it happens:** Context is cached locally; no server-side validation on context display.
**How to avoid:** On 404 responses, show a clear error suggesting the entity may have been deleted and to clear/reset context. Do not auto-clear context on 404 (could be network issue).
**Warning signs:** "Not found" errors after `workspace delete` or `board delete`.

### Pitfall 4: Ink Render vs readline Conflict
**What goes wrong:** Using Ink's `render()` while readline is active causes terminal output corruption.
**Why it happens:** Both try to manage stdin/stdout simultaneously.
**How to avoid:** Run the confirmation prompt (readline) BEFORE any Ink rendering. The confirmation step returns a boolean, then the command proceeds to the API call and displays the result with Ink.
**Warning signs:** Garbled terminal output during delete commands.

### Pitfall 5: Mocking Ink in Tests
**What goes wrong:** Tests fail with yoga-layout WASM loading errors.
**Why it happens:** Ink 6 uses yoga-layout for terminal layout, which loads a WASM binary. Vitest's module resolution chokes on this.
**How to avoid:** Use `vi.mock('ink', ...)` at the top of every test file that imports a module using Ink. This is already established in Phase 2 tests.
**Warning signs:** `Cannot find module 'yoga-wasm-web'` errors in vitest.

### Pitfall 6: Fractional Index Ordering Requires COLLATE C
**What goes wrong:** Column reorder sends a fractional index string, but the position comparison fails.
**Why it happens:** PostgreSQL default collation sorts strings differently than byte-order comparison.
**How to avoid:** The API already uses `COLLATE "C"` for position sorting (verified in handlers). No action needed on CLI side, but be aware the position strings must be valid fractional-indexing output.
**Warning signs:** Columns appear in wrong order after reorder.

## Code Examples

### Config Extension for Context Storage
```typescript
// apps/cli/src/lib/config.ts - UPDATED
interface ContextEntry {
  id: string
  name: string
}

interface KanbambamConfig {
  accessToken?: string
  refreshToken?: string
  apiBaseUrl: string
  activeWorkspace?: ContextEntry
  activeBoard?: ContextEntry
}
```

### Ink Table Component
```typescript
// apps/cli/src/components/Table.tsx
import React from 'react'
import { Box, Text } from 'ink'

interface TableColumn {
  key: string
  label: string
  width?: number
}

interface TableProps {
  columns: TableColumn[]
  rows: Record<string, string>[]
}

export function Table({ columns, rows }: TableProps) {
  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      {/* Header row */}
      <Box>
        {columns.map((col) => (
          <Box key={col.key} width={col.width ?? 20}>
            <Text bold>{col.label}</Text>
          </Box>
        ))}
      </Box>
      {/* Data rows */}
      {rows.map((row, i) => (
        <Box key={i}>
          {columns.map((col) => (
            <Box key={col.key} width={col.width ?? 20}>
              <Text>{row[col.key] ?? ''}</Text>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  )
}
```

### API Response Type Handling
```typescript
// Response shapes from existing API
// Single entity: { data: { id, name, ... }, meta: { requestId } }
// List (paginated): { data: [...], meta: { total, cursor } }
// Delete: 204 No Content (no body)
// Error: { error: { code, message, details? } }

// Type the response before using:
interface ApiEnvelope<T> {
  data: T
  meta: Record<string, unknown>
}

interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; cursor: string | null }
}
```

## API Endpoint Reference

Complete map of API endpoints this phase consumes:

| Command | Method | Endpoint | Request Body | Notes |
|---------|--------|----------|-------------|-------|
| workspace create | POST | `/api/v1/workspaces` | `{ name }` | Returns 201 |
| workspace list | GET | `/api/v1/workspaces?limit=N&cursor=X` | -- | Paginated |
| workspace rename | PATCH | `/api/v1/workspaces/{id}` | `{ name }` | |
| workspace delete | DELETE | `/api/v1/workspaces/{id}` | -- | Returns 204, cascades |
| board create | POST | `/api/v1/workspaces/{wksId}/boards` | `{ name }` | Then 3x column create |
| board list | GET | `/api/v1/workspaces/{wksId}/boards?limit=N` | -- | Paginated |
| board rename | PATCH | `/api/v1/boards/{id}` | `{ name }` | |
| board delete | DELETE | `/api/v1/boards/{id}` | -- | Returns 204, cascades |
| board get | GET | `/api/v1/boards/{id}` | -- | Used by context set --board |
| column add | POST | `/api/v1/boards/{brdId}/columns` | `{ name }` | |
| column list | GET | `/api/v1/boards/{brdId}/columns?limit=N` | -- | Sorted by position |
| column rename | PATCH | `/api/v1/columns/{id}` | `{ name }` | |
| column reorder | PATCH | `/api/v1/columns/{id}` | `{ position }` | Fractional index string |
| column delete | DELETE | `/api/v1/columns/{id}` | -- | Cascade-deletes items |
| item list | GET | `/api/v1/columns/{colId}/items` | -- | For checking column has items |
| item move | POST | `/api/v1/items/{id}/move` | `{ columnId }` | For --move-to relocation |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Ink 4 + React 18 | Ink 6 + React 19 | Ink 6.x release | This project already uses Ink 6. No migration needed. |
| Commander ^12 | Commander ^14 | 2025 | This project uses ^14. Minor API differences from docs examples online. |
| conf ^13 | conf ^15 | 2025 | This project uses ^15. ESM-only, TypeScript generics for schema. |

## Open Questions

1. **Board count / column count in list tables (D-09)**
   - What we know: The list endpoints return only the entity data, not counts of children. The workspace list does not include board count; board list does not include column count.
   - What's unclear: Should we make N+1 API calls to get counts, or display without counts?
   - Recommendation: Display without counts for now. The data is still useful (ID, Name, timestamps). Counts can be added later if the API gets count-enriched list endpoints.

2. **Column delete --move-to with many items**
   - What we know: Moving items requires one API call per item (`POST /api/v1/items/{id}/move`).
   - What's unclear: If a column has 100 items, that's 100 sequential API calls.
   - Recommendation: Use `Promise.all` with a concurrency limit (5-10 parallel calls) to keep it reasonable. Show a progress indicator.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | `apps/cli/vitest.config.ts` |
| Quick run command | `pnpm --filter @kanbambam/cli test` |
| Full suite command | `pnpm --filter @kanbambam/cli test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WKSP-01 | workspace create calls API, shows success | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/workspace/__tests__/create.test.ts` | Wave 0 |
| WKSP-02 | workspace list calls API, renders table | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/workspace/__tests__/list.test.ts` | Wave 0 |
| WKSP-03 | workspace rename calls PATCH | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/workspace/__tests__/rename.test.ts` | Wave 0 |
| WKSP-04 | workspace delete with confirmation | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/workspace/__tests__/delete.test.ts` | Wave 0 |
| BORD-01 | board create calls API with workspace context | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/board/__tests__/create.test.ts` | Wave 0 |
| BORD-02 | board list with workspace context | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/board/__tests__/list.test.ts` | Wave 0 |
| BORD-03 | board rename calls PATCH | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/board/__tests__/rename.test.ts` | Wave 0 |
| BORD-04 | board delete with confirmation | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/board/__tests__/delete.test.ts` | Wave 0 |
| BORD-05 | board create also creates 3 default columns | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/board/__tests__/create.test.ts` | Wave 0 |
| COLM-01 | column add calls API with board context | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/column/__tests__/add.test.ts` | Wave 0 |
| COLM-02 | column rename calls PATCH | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/column/__tests__/rename.test.ts` | Wave 0 |
| COLM-03 | column reorder translates position to fractional index | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/column/__tests__/reorder.test.ts` | Wave 0 |
| COLM-04 | column delete checks items, supports --move-to and --force | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/column/__tests__/delete.test.ts` | Wave 0 |
| CLI-05 | context set stores workspace/board in conf | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/context/__tests__/set.test.ts` | Wave 0 |
| CLI-06 | context show displays current context | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/context/__tests__/show.test.ts` | Wave 0 |
| CLI-07 | context clear removes context from conf | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/context/__tests__/clear.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @kanbambam/cli test`
- **Per wave merge:** `pnpm --filter @kanbambam/cli test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- All 16 test files listed above need to be created
- Test pattern: mock `apiRequest` via `vi.mock`, mock `ink` to avoid WASM, use `config.clear()` in beforeEach/afterEach
- Shared test fixtures: mock API response factories for workspace/board/column envelopes

### Testing Pattern
```typescript
// Standard test structure for CLI commands
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config } from '../../../lib/config.js'

vi.mock('ink', () => ({
  render: vi.fn(),
  Text: vi.fn(),
  Box: vi.fn(),
}))

vi.mock('../../../lib/api-client.js', () => ({
  apiRequest: vi.fn(),
}))

describe('workspaceCreateCommand', () => {
  beforeEach(() => { config.clear() })
  afterEach(() => { config.clear() })

  it('calls POST /api/v1/workspaces with name', async () => {
    const { apiRequest } = await import('../../../lib/api-client.js')
    const mockApiRequest = vi.mocked(apiRequest)
    mockApiRequest.mockResolvedValue(
      new Response(JSON.stringify({
        data: { id: 'wks_abc', name: 'Test', userId: 'usr_1', createdAt: '...', updatedAt: '...' },
        meta: { requestId: 'req_1' }
      }), { status: 201 })
    )

    const { workspaceCreateCommand } = await import('../create.js')
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await workspaceCreateCommand('Test', {})
    consoleSpy.mockRestore()

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/v1/workspaces',
      expect.objectContaining({ method: 'POST' })
    )
  })
})
```

## Project Constraints (from CLAUDE.md)

- **Tech stack:** TypeScript everywhere -- CLI uses Node.js
- **CLI libraries:** Commander.js for parsing, Ink for rich terminal UI, conf for config, chalk for colors
- **Do not use:** Express, Prisma, jsonwebtoken, dotenv, ESLint+Prettier separately, npm/yarn, Lerna
- **Testing:** Vitest across all packages
- **Linting:** Biome (single tool)
- **Package manager:** pnpm with workspaces
- **Build:** tsup for CLI bundling

## Sources

### Primary (HIGH confidence)
- Existing codebase: `apps/cli/src/` -- command patterns, config, output, components
- Existing codebase: `apps/api/src/routes/` -- all endpoint shapes, response formats, cascade behavior
- Existing codebase: `packages/shared/src/schemas/` -- Zod schemas for all entities
- Existing codebase: `apps/api/src/db/schema.ts` -- FK cascade behavior confirmed
- Existing codebase: `apps/cli/package.json` -- Ink 6, Commander 14, conf 15, React 19 confirmed installed

### Secondary (MEDIUM confidence)
- Training knowledge: Commander.js v14 API (stable, well-known)
- Training knowledge: Node.js `readline/promises` for confirmation prompts
- Training knowledge: `fractional-indexing` npm package API

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and used in Phase 2
- Architecture: HIGH - patterns directly derived from existing Phase 2 code
- Pitfalls: HIGH - identified from actual codebase analysis (API cascade behavior, Ink WASM mock, etc.)

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable -- all libraries already locked in package.json)
