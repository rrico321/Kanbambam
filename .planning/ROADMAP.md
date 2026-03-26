# Roadmap: Kanbambam

## Overview

Kanbambam delivers CLI-first Kanban board management backed by a cloud API, with a Trello-style web GUI as the second interface. The build order follows a strict dependency chain: shared contract and API first, then authentication, then CLI as the API's first real consumer, then full entity CRUD through the CLI, and finally the web app layered on top of a battle-tested API.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & API** - Monorepo, shared Zod schemas, database, REST API with full CRUD and JWT auth
- [x] **Phase 2: Authentication Flows** - User signup/login via web, browser-based CLI auth, session persistence (completed 2026-03-26)
- [ ] **Phase 3: Core Kanban CLI** - Workspace, board, and column CRUD via CLI commands with context system
- [ ] **Phase 4: Item Management** - Full item lifecycle via CLI (create, edit, move, labels, due dates)
- [ ] **Phase 5: Web App** - Trello-style board view with drag-and-drop, inline editing, and workspace navigation

## Phase Details

### Phase 1: Foundation & API
**Goal**: A working REST API serves the complete Kanban data model with authentication, and any HTTP client can perform all CRUD operations
**Depends on**: Nothing (first phase)
**Requirements**: API-01, API-02, API-03, API-04, AUTH-06
**Success Criteria** (what must be TRUE):
  1. An HTTP request can create, read, update, and delete workspaces, boards, columns, and items through the REST API
  2. API responses use fractional indexing for column and item ordering (not integer positions)
  3. List endpoints return paginated results
  4. A valid JWT is required for all data endpoints, and requests without one are rejected with 401
  5. The monorepo builds successfully with shared Zod schemas consumed by the API package
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Monorepo setup, shared Zod schemas, Drizzle database schema, dev tooling
- [x] 01-02-PLAN.md — Test infrastructure, API server core, auth middleware, auth routes (signup/login/refresh), lib helpers
- [x] 01-03-PLAN.md — Workspace and board CRUD routes with pagination
- [x] 01-04-PLAN.md — Column and item CRUD routes with fractional indexing and move endpoint

### Phase 2: Authentication Flows
**Goal**: Users can create accounts, log in through the web and CLI, and stay authenticated across sessions on both interfaces
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, CLI-02, CLI-03, CLI-04
**Success Criteria** (what must be TRUE):
  1. User can sign up with email/password and log in via a web form
  2. User can log out from the web app and their session is invalidated
  3. Running `kanbambam auth login` opens a browser window, and after completing login the CLI receives and stores a token
  4. CLI auth token persists across terminal sessions -- closing and reopening the terminal does not require re-authentication
  5. CLI commands support `--json` flag for structured output and display human-readable formatted output by default
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md — API logout endpoint, CLI package scaffold, token config, API client with auto-refresh, output formatter
- [x] 02-02-PLAN.md — Next.js web app scaffold with auth pages (login, signup, callback, logout)
- [x] 02-03-PLAN.md — CLI auth commands (login with browser callback, logout, status)
- [x] 02-04-PLAN.md — Gap closure: wire Ink rendering, fix status test, update requirements tracking

### Phase 3: Core Kanban CLI
**Goal**: Users can manage their complete workspace/board/column hierarchy entirely from the terminal
**Depends on**: Phase 2
**Requirements**: WKSP-01, WKSP-02, WKSP-03, WKSP-04, BORD-01, BORD-02, BORD-03, BORD-04, BORD-05, COLM-01, COLM-02, COLM-03, COLM-04, CLI-01, CLI-05, CLI-06, CLI-07
**Success Criteria** (what must be TRUE):
  1. User can create, list, rename, and delete workspaces via CLI commands
  2. User can create, list, rename, and delete boards via CLI commands, and new boards come with default columns (To Do, In Progress, Done)
  3. User can add, rename, reorder, and delete columns via CLI commands, with item handling on column deletion
  4. User can set an active workspace and board context so subsequent commands do not require repeating IDs
  5. User can view and clear the current context via `kanbambam context` and `kanbambam context clear`
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Item Management
**Goal**: Users can manage the full lifecycle of Kanban items from the terminal -- creating, editing, moving, labeling, and scheduling
**Depends on**: Phase 3
**Requirements**: ITEM-01, ITEM-02, ITEM-03, ITEM-04, ITEM-05, ITEM-06, ITEM-07, ITEM-08
**Success Criteria** (what must be TRUE):
  1. User can create an item in a column with a title and later add or edit its description
  2. User can move an item to a different column and reorder items within a column
  3. User can add colored labels/tags to an item and set a due date
  4. User can remove labels and due dates from an item
  5. User can delete an item
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Web App
**Goal**: Users can interact with their Kanban boards through a polished Trello-style web interface that reflects all data managed via CLI
**Depends on**: Phase 4
**Requirements**: WEB-01, WEB-02, WEB-03, WEB-04, WEB-05, WEB-06
**Success Criteria** (what must be TRUE):
  1. User sees a board view with columns displayed side by side and cards within each column
  2. User can drag and drop items between columns and reorder items within a column
  3. User can click on a card to view and inline-edit its title, description, labels, and due date
  4. User can navigate between workspaces and boards
  5. Changes made via CLI are immediately visible in the web app on refresh (same API, same data)
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & API | 4/4 | In Progress|  |
| 2. Authentication Flows | 4/4 | Complete   | 2026-03-26 |
| 3. Core Kanban CLI | 0/3 | Not started | - |
| 4. Item Management | 0/3 | Not started | - |
| 5. Web App | 0/3 | Not started | - |
