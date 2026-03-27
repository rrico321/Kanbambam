# Phase 5: Web App - Research

**Researched:** 2026-03-26
**Domain:** Next.js 16 + React 19 Kanban web app with drag-and-drop, inline editing, dark mode
**Confidence:** MEDIUM-HIGH

## Summary

Phase 5 builds the full Trello-style web experience on top of the existing Next.js shell (auth pages, layout, Tailwind CSS 4, API client stub). The web app already has Next.js 16.2.1, React 19.2.4, and Tailwind CSS 4 installed and configured. The API is complete with all CRUD endpoints for workspaces, boards, columns, and items, plus a move endpoint that accepts fractional-index positions.

Key technical challenges: (1) @dnd-kit has a new `@dnd-kit/react` package (v0.3.2) that is the recommended approach for React 18/19, replacing the older `@dnd-kit/core` + `@dnd-kit/sortable` combo -- this is a significant shift from the CLAUDE.md recommendation; (2) dark mode with Tailwind CSS v4 requires a custom CSS `@variant` directive instead of the old `darkMode: "class"` config; (3) the API client needs auth-aware fetch with cookie forwarding from server components and token refresh handling; (4) fractional-indexing must be used client-side for position calculation during drag-and-drop.

**Primary recommendation:** Use `@dnd-kit/react` + `@dnd-kit/helpers` (new API) for drag-and-drop, `next-themes` for dark mode, `@tanstack/react-query` for server state, and `sonner` for toast notifications. Build the API client as a full-method wrapper around fetch with cookie-based auth.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Horizontal scroll for many columns -- fixed-width columns, board scrolls horizontally when columns exceed viewport. Classic Trello behavior.
- **D-02:** Cards show title + metadata badges -- colored label chips, due date (with overdue/today coloring: red for overdue, yellow for today), and a description indicator icon when description exists.
- **D-03:** Column headers show name + item count + add button -- plus icon in header to create a new item directly in that column.
- **D-04:** Light and clean visual style as default -- light gray board background (`bg-gray-100`), white cards with subtle shadow (`shadow-sm rounded-lg`), colored label chips. Professional, minimal.
- **D-05:** Both light and dark mode supported -- system preference detection as default, with manual toggle button to override. Standard modern approach.
- **D-06:** Predefined label color palette -- fixed set of 6-8 colors (red, orange, yellow, green, blue, purple, pink, gray). Consistent, simple, Trello-like.
- **D-07:** Ghost card + drop placeholder during drag -- dragged card becomes semi-transparent, a colored line or empty slot appears at the drop target position. Classic Trello feel.
- **D-08:** Optimistic immediate save -- drop fires API call immediately. UI updates optimistically via TanStack Query, rolls back on error. Feels instant.
- **D-09:** Click card opens centered modal -- background board stays visible but dimmed. Modal shows all item fields. Trello pattern.
- **D-10:** Click-to-edit fields in modal -- fields display as text, click to toggle into edit mode, save on blur or Enter. Each field edits independently.
- **D-11:** Label editing via dropdown picker -- click "Labels" to open a dropdown showing predefined color palette. Toggle to add/remove labels.
- **D-12:** Due date editing via calendar date picker popup -- click due date field to open picker. Clear button to remove.
- **D-13:** Item deletion available from detail modal.
- **D-14:** Left sidebar with workspace/board tree -- collapsible sidebar showing workspaces as expandable sections, boards listed under each. Click to switch board. Linear/Notion style.
- **D-15:** Sidebar is collapsible -- toggle button to collapse/expand. Maximizes board space.
- **D-16:** Landing page shows last visited board -- redirect to most recently viewed board after login. First login shows workspace list.
- **D-17:** Full CRUD in web -- create/rename/delete workspaces, boards, and columns from the web app. Complete parity with CLI. The API supports it all already.

### Claude's Discretion
- @dnd-kit configuration and sensor setup
- TanStack Query cache invalidation strategy for optimistic updates
- Component architecture and file organization within apps/web/src/
- Date picker library selection (native HTML date input vs library)
- Dark mode implementation approach (CSS variables, Tailwind dark: prefix, next-themes)
- Sidebar state persistence (localStorage vs cookie)
- URL structure for workspace/board routes
- Empty state designs for boards with no columns and columns with no items
- Error handling and toast notification approach
- Loading skeleton patterns during data fetching

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WEB-01 | Trello-style board view with columns displayed side by side | Horizontal scroll layout pattern, fixed-width columns, Tailwind grid/flex |
| WEB-02 | Drag-and-drop items between columns | @dnd-kit/react useSortable + move helper, DragDropProvider with onDragOver |
| WEB-03 | Drag-and-drop to reorder items within a column | @dnd-kit/react sortable with group-based sorting, fractional-indexing for positions |
| WEB-04 | Inline editing of item title, description, labels, and due date | Click-to-edit pattern, modal detail view, native date input, label color picker |
| WEB-05 | Navigate between workspaces and boards | Collapsible sidebar, Next.js App Router dynamic routes, TanStack Query caching |
| WEB-06 | Board view reflects all changes made via CLI (same API, same data) | TanStack Query refetchOnWindowFocus, shared API, no local-only state |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack:** TypeScript everywhere. Web app uses Next.js, React, Tailwind CSS.
- **Data model:** User -> Workspaces -> Boards -> Columns -> Items
- **Hosting:** Vercel with GitHub integration for automatic deployments
- **API envelope format:** `{ data: T, meta: {...} }` for all responses
- **Pagination:** Cursor-based with `{ data: T[], meta: { total, cursor } }`
- **ID format:** Prefixed nanoid (wks_, brd_, col_, itm_)
- **Auth:** httpOnly cookies (access_token, refresh_token) managed by server actions
- **Ordering:** Fractional indexing (COLLATE "C") for positions
- **Linting:** Biome (not ESLint + Prettier)
- **Testing:** Vitest
- **Package manager:** pnpm
- **Bundling:** Next.js has its own bundler (no tsup needed)

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Verified |
|---------|---------|---------|----------|
| Next.js | 16.2.1 | React framework (App Router) | In package.json |
| React | 19.2.4 | UI library | In package.json |
| react-dom | 19.2.4 | React DOM renderer | In package.json |
| Tailwind CSS | ^4 | Utility-first CSS | In devDependencies |
| @tailwindcss/postcss | ^4 | PostCSS integration | In devDependencies |

### To Install
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/react | 0.3.2 | Drag-and-drop for React | New official React adapter, supports React 18/19. Replaces @dnd-kit/core + @dnd-kit/sortable. |
| @dnd-kit/helpers | 0.3.2 | DnD state helpers (move function) | Provides `move()` helper for multi-list sortable state management |
| @tanstack/react-query | 5.95.2 | Server state management | Caching, optimistic updates, refetching. Standard for React data fetching. |
| next-themes | 0.4.6 | Dark mode / theme switching | System preference detection + manual toggle. Supports React 16-19, data-theme attribute for Tailwind v4. |
| sonner | 2.0.7 | Toast notifications | Lightweight, React 18/19 compatible. Clean API for success/error toasts on CRUD operations. |
| fractional-indexing | 3.2.0 | Client-side position calculation | Same library used by API and CLI. Needed for drag-and-drop position strings. |
| nuqs | 2.8.9 | URL search params state | Type-safe URL state for board filters, views. Already recommended in CLAUDE.md. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit/react (new) | @dnd-kit/core + @dnd-kit/sortable (legacy) | Legacy has more examples/docs online but new package is officially recommended and has simpler API. Use new. |
| sonner | react-hot-toast 2.6.0 | Both work. Sonner has better default styling and dismiss behavior. |
| Native date input | react-day-picker 9.14.0 | Native `<input type="date">` is simpler, sufficient for single date selection. react-day-picker adds ~30KB for calendar popup. Use native first, upgrade if UX demands it. |
| next-themes | Manual CSS variables | next-themes handles SSR flash prevention, system preference detection, and localStorage persistence in 2 lines. Do not hand-roll. |

**Installation:**
```bash
cd apps/web && pnpm add @dnd-kit/react @dnd-kit/helpers @tanstack/react-query next-themes sonner fractional-indexing nuqs
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/
  app/
    layout.tsx              # Root layout: providers (QueryClient, ThemeProvider, Toaster)
    page.tsx                # Redirect to last board or workspace list
    boards/
      [boardId]/
        page.tsx            # Board view (columns + cards)
    workspaces/
      page.tsx              # Workspace list (first login landing)
  components/
    board/
      BoardView.tsx         # Horizontal scroll container with columns
      Column.tsx            # Single column: header + item list (droppable)
      Card.tsx              # Single card: title + badges (sortable/draggable)
      AddItemForm.tsx       # Inline "add item" input at column bottom/header
    item-detail/
      ItemModal.tsx         # Centered modal overlay
      EditableTitle.tsx     # Click-to-edit title field
      EditableDescription.tsx  # Click-to-edit description (textarea)
      LabelPicker.tsx       # Dropdown with predefined color palette
      DueDatePicker.tsx     # Date input with clear button
      DeleteButton.tsx      # Delete item with confirmation
    sidebar/
      Sidebar.tsx           # Collapsible left sidebar
      WorkspaceTree.tsx     # Expandable workspace -> board tree
      SidebarToggle.tsx     # Collapse/expand button
    layout/
      AppShell.tsx          # Sidebar + main content area
      ThemeToggle.tsx       # Dark/light mode toggle button
    ui/
      Modal.tsx             # Reusable modal component
      LoadingSkeleton.tsx   # Skeleton loading patterns
      EmptyState.tsx        # Empty board/column states
  hooks/
    use-api.ts              # TanStack Query hooks for all entities
    use-board-data.ts       # Composite hook: columns + items for a board
    use-optimistic-move.ts  # Optimistic DnD with rollback
  lib/
    api.ts                  # Extended API client (GET/POST/PATCH/DELETE + auth)
    auth.ts                 # Existing server actions (cookies)
    query-client.ts         # TanStack Query client configuration
    labels.ts               # Predefined label color palette constants
    positions.ts            # fractional-indexing helpers for client-side position calc
```

### Pattern 1: Auth-Aware API Client
**What:** Extend the existing `apiPost` to support all HTTP methods with cookie-forwarded auth.
**When to use:** Every API call from the web app.
**Example:**
```typescript
// apps/web/src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

type ApiResult<T> = { data?: T; error?: { code: string; message: string } }

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Send cookies
  })

  if (res.status === 204) return { data: undefined as T }

  const json = await res.json()
  if (!res.ok) return { error: json.error }
  return { data: json.data }
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}
```

**CRITICAL NOTE:** The current `apiPost` sends requests server-side (no cookies). Client components need `credentials: 'include'` to send httpOnly cookies. The API CORS config must allow credentials from the web app origin. Verify the API has `Access-Control-Allow-Credentials: true` and the correct `Access-Control-Allow-Origin` (not wildcard).

### Pattern 2: @dnd-kit/react Multi-List Sortable (Kanban)
**What:** New dnd-kit API for moving items between columns.
**When to use:** Board view with drag-and-drop.
**Example:**
```typescript
// Source: dndkit.com multiple-sortable-lists guide
import { DragDropProvider } from '@dnd-kit/react'
import { move } from '@dnd-kit/helpers'

// In BoardView component:
<DragDropProvider
  onDragOver={(event) => {
    // Optimistic local reorder during drag
    setColumns((cols) => move(cols, event))
  }}
  onDragEnd={(event) => {
    // Persist to API on drop
    if (event.canceled) return
    const { source, target } = event.operation
    // Call API move endpoint with new columnId + position
  }}
>
  {columns.map(col => <Column key={col.id} ... />)}
</DragDropProvider>

// In Card component:
import { useSortable } from '@dnd-kit/react/sortable'

function Card({ id, index, column, ...props }) {
  const { ref, isDragging } = useSortable({
    id, index,
    type: 'item',
    accept: 'item',
    group: column, // Enables cross-column sorting
  })
  return <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }} ... />
}

// In Column component:
import { useDroppable } from '@dnd-kit/react'
import { CollisionPriority } from '@dnd-kit/abstract'

function Column({ id, items, ...props }) {
  const { ref, isDropTarget } = useDroppable({
    id, type: 'column',
    accept: 'item',
    collisionPriority: CollisionPriority.Low,
  })
  return <div ref={ref} ... />
}
```

### Pattern 3: TanStack Query Optimistic Updates with Rollback
**What:** Instant UI updates on mutation, rollback on API error.
**When to use:** Item move, item edit, item create/delete.
**Example:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

function useMoveItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, columnId, position }) =>
      api.post(`/api/v1/items/${itemId}/move`, { columnId, position }),
    onMutate: async ({ itemId, columnId, position }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['board'] })
      // Snapshot previous value
      const previous = queryClient.getQueryData(['board'])
      // Optimistically update
      queryClient.setQueryData(['board'], (old) => /* move item in cache */)
      return { previous }
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      queryClient.setQueryData(['board'], context?.previous)
      toast.error('Failed to move item')
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['board'] })
    },
  })
}
```

### Pattern 4: Dark Mode with Tailwind CSS v4 + next-themes
**What:** CSS custom variant for data-theme attribute.
**When to use:** Global setup, all components use `dark:` prefix.
**Example:**
```css
/* globals.css */
@import 'tailwindcss';
@variant dark (&:where([data-theme="dark"] *));
```
```typescript
// layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Anti-Patterns to Avoid
- **Fetching data in server components then passing to client DnD:** DnD is entirely client-side. Fetch board data client-side with TanStack Query so optimistic updates work. Server components are only useful for the initial page shell/layout.
- **Storing board state in useState without TanStack Query:** Leads to stale data, no cache invalidation, no optimistic update rollback. Always use TanStack Query as the source of truth.
- **Using `@dnd-kit/core` + `@dnd-kit/sortable` (legacy):** The new `@dnd-kit/react` package is the officially recommended approach for React apps. It has a simpler API with built-in framework integration.
- **Wildcard CORS with credentials:** `Access-Control-Allow-Origin: *` does not work with `credentials: 'include'`. Must set the exact origin.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dark mode | CSS variable toggle + localStorage | next-themes + Tailwind dark variant | Handles SSR flash prevention, system preference detection, hydration mismatch |
| Drag and drop | HTML5 drag API | @dnd-kit/react | Accessibility, mobile touch support, collision detection, keyboard DnD |
| Server state cache | useState + useEffect + fetch | @tanstack/react-query | Cache invalidation, optimistic updates, refetch on focus, retry logic |
| Toast notifications | Custom toast component | sonner | Animation, stacking, dismiss, styling all handled |
| Fractional position calc | Custom ordering math | fractional-indexing | Edge cases with position strings, same library as API |
| URL state management | useSearchParams + manual sync | nuqs | Type-safe, SSR-compatible, supports shallow routing |

**Key insight:** The web app is a thin UI layer over a complete API. Every operation is an API call. TanStack Query is the bridge between API and UI -- it handles caching, refetching, and optimistic updates so the board feels instant while staying consistent with CLI changes.

## Common Pitfalls

### Pitfall 1: Cookie Forwarding in Next.js Server Components vs Client Components
**What goes wrong:** Server components can read cookies via `cookies()` but client components use `credentials: 'include'` on fetch. Mixing these up causes auth failures.
**Why it happens:** Next.js 16 App Router has both server and client execution contexts.
**How to avoid:** Use client-side fetching (TanStack Query + `credentials: 'include'`) for all board data. Server components only for layout/redirect logic. The existing `lib/auth.ts` server actions handle cookie management.
**Warning signs:** 401 errors on API calls, data not loading in client components.

### Pitfall 2: CORS Configuration for Credentials
**What goes wrong:** API responds with `Access-Control-Allow-Origin: *` which browsers reject when `credentials: 'include'` is set.
**Why it happens:** Wildcard origin is not allowed with credentials per the CORS spec.
**How to avoid:** API must set `Access-Control-Allow-Origin: http://localhost:3001` (or the web app's exact origin) and `Access-Control-Allow-Credentials: true`. Check the Hono CORS middleware config.
**Warning signs:** CORS preflight failures in browser console.

### Pitfall 3: Hydration Mismatch with Theme
**What goes wrong:** Server renders light mode, client has dark mode preference -- causes hydration error flash.
**Why it happens:** next-themes reads system preference on client only.
**How to avoid:** Use `suppressHydrationWarning` on `<html>` tag. next-themes injects a blocking script to set the attribute before React hydrates.
**Warning signs:** Flash of wrong theme on page load, React hydration warnings in console.

### Pitfall 4: Stale Optimistic State After DnD
**What goes wrong:** After drag-and-drop, the optimistic update and the API response create conflicting states in the cache.
**Why it happens:** The optimistic update runs before the API call, then `onSettled` invalidates queries triggering a refetch that might arrive while another drag is in progress.
**How to avoid:** Cancel in-flight queries before optimistic update (`queryClient.cancelQueries`). Use `onSettled` to invalidate but not if another mutation is pending.
**Warning signs:** Items jumping back to old positions momentarily after drop.

### Pitfall 5: @dnd-kit/react is Pre-1.0
**What goes wrong:** API may change between minor versions. Documentation may be incomplete.
**Why it happens:** @dnd-kit/react v0.3.2 is relatively new.
**How to avoid:** Pin the exact version in package.json. Reference the official docs at dndkit.com for the React-specific API. The multi-list sortable guide covers the Kanban use case directly.
**Warning signs:** Breaking changes on minor version bump, missing TypeScript types.

### Pitfall 6: Position Calculation on Client
**What goes wrong:** Drag-and-drop produces visual reorder but sends wrong position string to API, causing incorrect sort order on refresh.
**Why it happens:** fractional-indexing `generateKeyBetween` needs the positions of the items above and below the drop target.
**How to avoid:** After DnD resolves the new index, look up the position strings of items at index-1 and index+1 in the target column, then call `generateKeyBetween(before, after)`. If dropping at start, use `generateKeyBetween(null, firstPosition)`. If at end, use `generateKeyBetween(lastPosition, null)`.
**Warning signs:** Items appear in wrong order after page refresh.

## Code Examples

### Predefined Label Color Palette (D-06)
```typescript
// apps/web/src/lib/labels.ts
export const LABEL_COLORS = [
  { name: 'red', bg: 'bg-red-500', text: 'text-white', dark: 'dark:bg-red-600' },
  { name: 'orange', bg: 'bg-orange-500', text: 'text-white', dark: 'dark:bg-orange-600' },
  { name: 'yellow', bg: 'bg-yellow-400', text: 'text-gray-900', dark: 'dark:bg-yellow-500' },
  { name: 'green', bg: 'bg-green-500', text: 'text-white', dark: 'dark:bg-green-600' },
  { name: 'blue', bg: 'bg-blue-500', text: 'text-white', dark: 'dark:bg-blue-600' },
  { name: 'purple', bg: 'bg-purple-500', text: 'text-white', dark: 'dark:bg-purple-600' },
  { name: 'pink', bg: 'bg-pink-500', text: 'text-white', dark: 'dark:bg-pink-600' },
  { name: 'gray', bg: 'bg-gray-500', text: 'text-white', dark: 'dark:bg-gray-600' },
] as const

export type LabelColor = (typeof LABEL_COLORS)[number]['name']
```

### Board Data Composite Hook
```typescript
// apps/web/src/hooks/use-board-data.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Column, Item } from '@kanbambam/shared'

export function useBoardData(boardId: string) {
  const columnsQuery = useQuery({
    queryKey: ['boards', boardId, 'columns'],
    queryFn: () => api.get<Column[]>(`/api/v1/boards/${boardId}/columns`),
  })

  const itemQueries = useQuery({
    queryKey: ['boards', boardId, 'items'],
    queryFn: async () => {
      if (!columnsQuery.data?.data) return {}
      const entries = await Promise.all(
        columnsQuery.data.data.map(async (col) => {
          const result = await api.get<Item[]>(`/api/v1/columns/${col.id}/items`)
          return [col.id, result.data ?? []] as const
        })
      )
      return Object.fromEntries(entries) as Record<string, Item[]>
    },
    enabled: !!columnsQuery.data?.data,
  })

  return {
    columns: columnsQuery.data?.data ?? [],
    itemsByColumn: itemQueries.data ?? {},
    isLoading: columnsQuery.isLoading || itemQueries.isLoading,
    error: columnsQuery.error || itemQueries.error,
  }
}
```

### Click-to-Edit Field Pattern (D-10)
```typescript
// apps/web/src/components/item-detail/EditableTitle.tsx
'use client'
import { useState, useRef, useEffect } from 'react'

interface EditableTitleProps {
  value: string
  onSave: (value: string) => void
}

export function EditableTitle({ value, onSave }: EditableTitleProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const handleSave = () => {
    setEditing(false)
    if (draft.trim() && draft !== value) onSave(draft.trim())
    else setDraft(value) // Reset on empty
  }

  if (!editing) {
    return (
      <h2
        className="text-xl font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1"
        onClick={() => setEditing(true)}
      >
        {value}
      </h2>
    )
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSave()
        if (e.key === 'Escape') { setDraft(value); setEditing(false) }
      }}
      className="text-xl font-semibold w-full border rounded px-2 py-1"
    />
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @dnd-kit/core + @dnd-kit/sortable | @dnd-kit/react + @dnd-kit/helpers | 2025 | New framework-specific package with simpler API, built-in React 19 support |
| Tailwind darkMode: "class" in JS config | @variant dark in CSS file | Tailwind v4 (2025) | Config moved from tailwind.config.js to CSS-first. No more JS config file. |
| Next.js 15 | Next.js 16.2.1 | 2025-2026 | Already installed in project. App Router stable. |
| react-hot-toast | sonner | 2024+ | Sonner is the modern default for toast notifications |

**Important version note:** The project already has Next.js 16.2.1 installed (not 15 as in CLAUDE.md). CLAUDE.md recommendations for Next.js 15 still apply -- the App Router API is the same.

## Open Questions

1. **CORS credentials configuration**
   - What we know: The API uses Hono CORS middleware. Web app needs `credentials: 'include'`.
   - What's unclear: Whether the API CORS config currently allows credentials and sets the correct origin.
   - Recommendation: Check and fix the Hono CORS middleware as the first task. This blocks all client-side API calls.

2. **@dnd-kit/react state shape for multi-list sortable**
   - What we know: The `move()` helper from `@dnd-kit/helpers` expects a specific data structure (nested arrays or object).
   - What's unclear: Exact TypeScript types for the state shape that `move()` expects, and how to map API response shape to it.
   - Recommendation: Start with the official multi-list sortable example and adapt. Pin @dnd-kit/react@0.3.2 exactly.

3. **Token refresh flow for client-side fetching**
   - What we know: Access token expires in 15 minutes (from auth.ts cookie config). Refresh token is 7 days.
   - What's unclear: How to automatically refresh the access token from a client component when a 401 is received. Server actions can set cookies, but client fetch gets 401.
   - Recommendation: Implement a fetch wrapper that catches 401, calls a Next.js API route (or server action) to refresh the token, then retries the original request.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes | v24.13.0 | -- |
| pnpm | Package manager | Yes | 10.33.0 | -- |
| Docker | Local PostgreSQL | Yes | 29.2.1 | -- |
| Next.js | Web framework | Yes | 16.2.1 (installed) | -- |
| React | UI library | Yes | 19.2.4 (installed) | -- |
| Tailwind CSS | Styling | Yes | ^4 (installed) | -- |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None. All required tools are available.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (used by API and CLI packages) |
| Config file | None in apps/web -- needs creation (Wave 0) |
| Quick run command | `cd apps/web && pnpm vitest run --reporter=verbose` |
| Full suite command | `cd apps/web && pnpm vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WEB-01 | Board view renders columns side by side | component | `pnpm vitest run src/components/board/BoardView.test.tsx -t "renders columns"` | Wave 0 |
| WEB-02 | Items can be dragged between columns | integration | Manual -- requires browser DnD events | Manual-only (DnD interaction) |
| WEB-03 | Items can be reordered within a column | integration | Manual -- requires browser DnD events | Manual-only (DnD interaction) |
| WEB-04 | Item modal opens and fields are editable | component | `pnpm vitest run src/components/item-detail/ItemModal.test.tsx` | Wave 0 |
| WEB-05 | Sidebar shows workspaces and boards, navigation works | component | `pnpm vitest run src/components/sidebar/Sidebar.test.tsx` | Wave 0 |
| WEB-06 | Board reflects API data (no local-only state) | unit | `pnpm vitest run src/hooks/use-board-data.test.ts` | Wave 0 |

**Note on DnD testing:** WEB-02 and WEB-03 (drag-and-drop) are inherently browser interaction tests. Unit testing the state mutation logic (optimistic update, position calculation) is possible and should be tested. The actual DnD gesture requires E2E testing (Playwright) which is out of scope for v1 but the optimistic update logic can be unit tested.

### Sampling Rate
- **Per task commit:** `cd apps/web && pnpm vitest run --reporter=verbose`
- **Per wave merge:** Full suite across all packages
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
- [ ] `apps/web/vitest.config.ts` -- Vitest config with jsdom environment for React component tests
- [ ] `apps/web/src/test-helpers/setup.ts` -- Test setup (mock fetch, mock next-themes, etc.)
- [ ] Install vitest + @testing-library/react + @testing-library/jest-dom as devDependencies
- [ ] `apps/web/src/hooks/use-board-data.test.ts` -- covers WEB-06
- [ ] `apps/web/src/components/board/BoardView.test.tsx` -- covers WEB-01
- [ ] `apps/web/src/components/item-detail/ItemModal.test.tsx` -- covers WEB-04
- [ ] `apps/web/src/components/sidebar/Sidebar.test.tsx` -- covers WEB-05

## API Endpoint Reference

Complete list of API endpoints the web app will use:

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/workspaces | List user's workspaces |
| POST | /api/v1/workspaces | Create workspace |
| GET | /api/v1/workspaces/:id | Get workspace |
| PATCH | /api/v1/workspaces/:id | Rename workspace |
| DELETE | /api/v1/workspaces/:id | Delete workspace |
| GET | /api/v1/workspaces/:wksId/boards | List boards in workspace |
| POST | /api/v1/workspaces/:wksId/boards | Create board |
| GET | /api/v1/boards/:id | Get board |
| PATCH | /api/v1/boards/:id | Rename board |
| DELETE | /api/v1/boards/:id | Delete board |
| GET | /api/v1/boards/:brdId/columns | List columns in board |
| POST | /api/v1/boards/:brdId/columns | Create column |
| GET | /api/v1/columns/:id | Get column |
| PATCH | /api/v1/columns/:id | Update/reorder column |
| DELETE | /api/v1/columns/:id | Delete column |
| GET | /api/v1/columns/:colId/items | List items in column |
| POST | /api/v1/columns/:colId/items | Create item |
| GET | /api/v1/items/:id | Get item |
| PATCH | /api/v1/items/:id | Update item |
| DELETE | /api/v1/items/:id | Delete item |
| POST | /api/v1/items/:id/move | Move item (column + position) |
| POST | /api/v1/auth/refresh | Refresh access token |

## Sources

### Primary (HIGH confidence)
- Project codebase: `apps/web/package.json`, `apps/web/src/` -- actual installed versions and existing code
- Project codebase: `apps/api/src/routes/` -- API endpoint definitions
- Project codebase: `packages/shared/src/schemas/` -- data model schemas
- npm registry: verified versions of @dnd-kit/react (0.3.2), @tanstack/react-query (5.95.2), next-themes (0.4.6), sonner (2.0.7), fractional-indexing (3.2.0), nuqs (2.8.9)
- npm registry: verified peer dependencies for all packages (React 18/19 compatibility confirmed)

### Secondary (MEDIUM confidence)
- [dndkit.com](https://dndkit.com/) -- Official @dnd-kit documentation, multi-list sortable guide
- [Tailwind CSS v4 dark mode with next-themes](https://jianliao.github.io/blog/tailwindcss-v4) -- CSS @variant approach verified

### Tertiary (LOW confidence)
- @dnd-kit/react exact TypeScript types and `move()` helper shape -- needs validation at implementation time

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry and project package.json
- Architecture: MEDIUM-HIGH -- patterns based on official docs and project conventions, but @dnd-kit/react is pre-1.0
- Pitfalls: HIGH -- CORS/auth/hydration issues are well-documented in Next.js ecosystem

**Research date:** 2026-03-26
**Valid until:** 2026-04-10 (14 days -- @dnd-kit/react is fast-moving pre-1.0)
