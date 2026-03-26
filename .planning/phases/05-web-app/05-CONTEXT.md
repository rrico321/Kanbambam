# Phase 5: Web App - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a Trello-style web app with board view, drag-and-drop, inline editing, and workspace navigation. The Next.js shell already exists (auth pages, layout, Tailwind, API client, cookie-based auth). This phase builds the full app experience on top — board view with columns and cards, drag-and-drop for moving and reordering items, a detail modal for editing item fields, a sidebar for workspace/board navigation, and full CRUD for all entities from the web. The same REST API and data serves both CLI and web.

</domain>

<decisions>
## Implementation Decisions

### Board Layout & Card Design
- **D-01:** Horizontal scroll for many columns — fixed-width columns, board scrolls horizontally when columns exceed viewport. Classic Trello behavior.
- **D-02:** Cards show title + metadata badges — colored label chips, due date (with overdue/today coloring: red for overdue, yellow for today), and a description indicator icon when description exists.
- **D-03:** Column headers show name + item count + add button — plus icon in header to create a new item directly in that column.
- **D-04:** Light and clean visual style as default — light gray board background (`bg-gray-100`), white cards with subtle shadow (`shadow-sm rounded-lg`), colored label chips. Professional, minimal.
- **D-05:** Both light and dark mode supported — system preference detection as default, with manual toggle button to override. Standard modern approach.
- **D-06:** Predefined label color palette — fixed set of 6-8 colors (red, orange, yellow, green, blue, purple, pink, gray). Consistent, simple, Trello-like.

### Drag-and-Drop Behavior
- **D-07:** Ghost card + drop placeholder during drag — dragged card becomes semi-transparent, a colored line or empty slot appears at the drop target position. Classic Trello feel.
- **D-08:** Optimistic immediate save — drop fires API call immediately. UI updates optimistically via TanStack Query, rolls back on error. Feels instant.

### Inline Editing Experience
- **D-09:** Click card opens centered modal — background board stays visible but dimmed. Modal shows all item fields. Trello pattern.
- **D-10:** Click-to-edit fields in modal — fields display as text, click to toggle into edit mode, save on blur or Enter. Each field edits independently.
- **D-11:** Label editing via dropdown picker — click "Labels" to open a dropdown showing predefined color palette. Toggle to add/remove labels.
- **D-12:** Due date editing via calendar date picker popup — click due date field to open picker. Clear button to remove.
- **D-13:** Item deletion available from detail modal.

### Navigation & App Shell
- **D-14:** Left sidebar with workspace/board tree — collapsible sidebar showing workspaces as expandable sections, boards listed under each. Click to switch board. Linear/Notion style.
- **D-15:** Sidebar is collapsible — toggle button to collapse/expand. Maximizes board space.
- **D-16:** Landing page shows last visited board — redirect to most recently viewed board after login. First login shows workspace list.
- **D-17:** Full CRUD in web — create/rename/delete workspaces, boards, and columns from the web app. Complete parity with CLI. The API supports it all already.

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specs
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — Phase 5 requirements: WEB-01 through WEB-06
- `.planning/ROADMAP.md` — Phase 5 success criteria and dependency chain

### Technology Stack
- `CLAUDE.md` §Recommended Stack — Web stack (Next.js 15, React 19, Tailwind CSS 4, @dnd-kit, TanStack Query 5, nuqs)

### Prior Phase Context
- `.planning/phases/01-foundation-api/01-CONTEXT.md` — API decisions: ID format, response envelope, nested REST routes, cursor pagination
- `.planning/phases/02-authentication-flows/02-CONTEXT.md` — Web auth decisions: cookie-based auth, auth page styling, API envelope format
- `.planning/phases/03-core-kanban-cli/03-CONTEXT.md` — Entity CRUD patterns established in CLI (context system, delete confirmation, output formatting)
- `.planning/phases/04-item-management/04-CONTEXT.md` — Item lifecycle decisions: label replace-all semantics, due date clearing, fractional indexing for reorder

### Existing Web App Code
- `apps/web/src/app/layout.tsx` — Root layout with Inter font, Tailwind globals
- `apps/web/src/app/page.tsx` — Current landing page (placeholder, redirects to login if no token)
- `apps/web/src/lib/api.ts` — `apiPost` helper (needs extension for GET, PATCH, DELETE + auth headers)
- `apps/web/src/lib/auth.ts` — Server actions for cookie management (setAuthCookies, clearAuthCookies, getRefreshToken)
- `apps/web/src/components/` — Existing auth components: AuthCard, FormField, SubmitButton, ErrorAlert, AuthLink
- `apps/web/src/app/auth/` — Auth pages: login, signup, logout, callback

### API Routes (all exist from Phase 1)
- `apps/api/src/routes/workspaces/` — Workspace CRUD
- `apps/api/src/routes/boards/` — Board CRUD (includes default columns on create)
- `apps/api/src/routes/columns/` — Column CRUD + reorder
- `apps/api/src/routes/items/` — Item CRUD + move endpoint

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/src/lib/api.ts` — `apiPost` helper exists but only supports POST. Needs extension for GET/PATCH/DELETE with auth cookie headers for the full app.
- `apps/web/src/lib/auth.ts` — Server actions for httpOnly cookie management. Auth flow is complete.
- `apps/web/src/components/AuthCard.tsx` — Card layout component. May inform the general card/modal pattern.
- `apps/web/src/components/FormField.tsx` — Form field component. Reusable for inline editing fields.
- `apps/web/src/components/ErrorAlert.tsx` — Error display. Reusable for API error handling.
- `packages/shared/src/schemas/` — All Zod schemas for workspaces, boards, columns, items. Can be used for client-side validation.

### Established Patterns
- Next.js App Router with server components (layout.tsx uses async cookies)
- Tailwind CSS for styling (already configured with PostCSS)
- Server actions for auth cookie management (not client-side localStorage)
- API envelope format: `{ data: T, meta: {...} }` for all responses

### Integration Points
- `apps/web/src/app/page.tsx` — Current placeholder, needs to become the board view or redirect to last board
- `apps/web/src/app/layout.tsx` — Root layout needs sidebar, dark mode provider, TanStack Query provider
- New route structure needed: `/workspaces`, `/boards/[boardId]` (or similar)
- API client needs auth-aware fetch with cookie forwarding and auto-refresh

</code_context>

<specifics>
## Specific Ideas

- Trello is the primary UX reference — horizontal scroll, card badges, modal detail view
- Linear/Notion influence for the sidebar navigation pattern
- Cards should feel scannable — title prominent, metadata as small badges below
- Dark mode is not optional — both themes must be supported from the start

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-web-app*
*Context gathered: 2026-03-26*
