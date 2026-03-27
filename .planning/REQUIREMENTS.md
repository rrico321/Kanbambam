# Requirements: Kanbambam

**Defined:** 2026-03-25
**Core Value:** Kanban board management from the command line that stays perfectly in sync with a polished web GUI

## v1 Requirements

### Workspaces

- [x] **WKSP-01**: User can create a workspace with a name
- [x] **WKSP-02**: User can list all their workspaces
- [x] **WKSP-03**: User can rename a workspace
- [x] **WKSP-04**: User can delete a workspace (and all its boards)

### Boards

- [x] **BORD-01**: User can create a board within a workspace
- [x] **BORD-02**: User can list all boards in a workspace
- [x] **BORD-03**: User can rename a board
- [x] **BORD-04**: User can delete a board (and all its columns/items)
- [x] **BORD-05**: New boards are created with default columns (To Do, In Progress, Done)

### Columns

- [x] **COLM-01**: User can add a column to a board
- [x] **COLM-02**: User can rename a column
- [x] **COLM-03**: User can reorder columns within a board
- [x] **COLM-04**: User can delete a column (moves items to a target column or deletes them)

### Items

- [x] **ITEM-01**: User can create an item in a column with a title
- [x] **ITEM-02**: User can add/edit a description on an item
- [x] **ITEM-03**: User can move an item to a different column
- [x] **ITEM-04**: User can reorder items within a column
- [x] **ITEM-05**: User can delete an item
- [x] **ITEM-06**: User can add labels/tags to an item (with color)
- [x] **ITEM-07**: User can set a due date on an item
- [x] **ITEM-08**: User can remove labels and due dates from an item

### CLI

- [ ] **CLI-01**: All entity operations available as CLI commands (workspace, board, column, item CRUD)
- [x] **CLI-02**: Every command supports `--json` flag for structured JSON output (AI-friendly)
- [x] **CLI-03**: Human-readable formatted output by default
- [x] **CLI-04**: Browser-based login flow (`kanbambam auth login` opens browser, receives token)
- [x] **CLI-05**: User can set active workspace/board context to avoid repeating IDs
- [x] **CLI-06**: User can view current context (`kanbambam context`)
- [x] **CLI-07**: User can clear context (`kanbambam context clear`)

### Authentication

- [x] **AUTH-01**: User can sign up with email and password via web app
- [x] **AUTH-02**: User can log in via web app
- [x] **AUTH-03**: User can log out from web app
- [x] **AUTH-04**: User can authenticate CLI via browser login flow
- [x] **AUTH-05**: CLI auth token persists across sessions
- [x] **AUTH-06**: User session stays active across browser refresh (JWT)

### Web App

- [x] **WEB-01**: Trello-style board view with columns displayed side by side
- [x] **WEB-02**: Drag-and-drop items between columns
- [x] **WEB-03**: Drag-and-drop to reorder items within a column
- [ ] **WEB-04**: Inline editing of item title, description, labels, and due date
- [x] **WEB-05**: Navigate between workspaces and boards
- [x] **WEB-06**: Board view reflects all changes made via CLI (same API, same data)

### API

- [x] **API-01**: REST API serving all CRUD operations for workspaces, boards, columns, and items
- [x] **API-02**: JWT-based authentication for both CLI and web clients
- [x] **API-03**: Fractional indexing for item and column ordering (no reindex on every move)
- [x] **API-04**: Pagination on list endpoints

## v2 Requirements

### Collaboration

- **COLLAB-01**: User can invite others to a workspace
- **COLLAB-02**: Shared workspace members can view and edit boards
- **COLLAB-03**: Activity log shows who changed what

### Advanced CLI

- **ACLI-01**: Tab/shell completion for commands and entity names
- **ACLI-02**: Interactive TUI mode with Ink-based board visualization
- **ACLI-03**: Bulk operations (move multiple items, batch label)
- **ACLI-04**: Pipe support for composing commands

### Advanced Web

- **AWEB-01**: Real-time updates via WebSockets
- **AWEB-02**: Keyboard shortcuts for power users
- **AWEB-03**: Search and filter across boards
- **AWEB-04**: Board templates (Kanban, Sprint, Custom)

### Items Enhanced

- **ITME-01**: Checklists/subtasks within items
- **ITME-02**: File attachments on items
- **ITME-03**: WIP limits per column
- **ITME-04**: Item comments

## Out of Scope

| Feature | Reason |
|---------|--------|
| MCP server | CLI-only for v1; API exists so MCP can layer on later |
| Mobile app | Web-first, responsive design sufficient for v1 |
| OAuth social login | Email/password sufficient for v1, adds complexity |
| Offline/local mode | Cloud API is single source of truth |
| Real-time WebSockets | Polling or refresh sufficient for v1; adds significant complexity |
| Team collaboration | Single-user for v1, reduces auth/permission complexity |
| File attachments | Storage infrastructure adds scope; defer to v2 |
| Notifications | No collaboration in v1 means no notification triggers |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 1 | Complete |
| API-02 | Phase 1 | Complete |
| API-03 | Phase 1 | Complete |
| API-04 | Phase 1 | Complete |
| AUTH-06 | Phase 1 | Complete |
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| AUTH-04 | Phase 2 | Complete |
| AUTH-05 | Phase 2 | Complete |
| CLI-02 | Phase 2 | Complete |
| CLI-03 | Phase 2 | Complete |
| CLI-04 | Phase 2 | Complete |
| WKSP-01 | Phase 3 | Complete |
| WKSP-02 | Phase 3 | Complete |
| WKSP-03 | Phase 3 | Complete |
| WKSP-04 | Phase 3 | Complete |
| BORD-01 | Phase 3 | Complete |
| BORD-02 | Phase 3 | Complete |
| BORD-03 | Phase 3 | Complete |
| BORD-04 | Phase 3 | Complete |
| BORD-05 | Phase 3 | Complete |
| COLM-01 | Phase 3 | Complete |
| COLM-02 | Phase 3 | Complete |
| COLM-03 | Phase 3 | Complete |
| COLM-04 | Phase 3 | Complete |
| CLI-01 | Phase 3 | Pending |
| CLI-05 | Phase 3 | Complete |
| CLI-06 | Phase 3 | Complete |
| CLI-07 | Phase 3 | Complete |
| ITEM-01 | Phase 4 | Complete |
| ITEM-02 | Phase 4 | Complete |
| ITEM-03 | Phase 4 | Complete |
| ITEM-04 | Phase 4 | Complete |
| ITEM-05 | Phase 4 | Complete |
| ITEM-06 | Phase 4 | Complete |
| ITEM-07 | Phase 4 | Complete |
| ITEM-08 | Phase 4 | Complete |
| WEB-01 | Phase 5 | Complete |
| WEB-02 | Phase 5 | Complete |
| WEB-03 | Phase 5 | Complete |
| WEB-04 | Phase 5 | Pending |
| WEB-05 | Phase 5 | Complete |
| WEB-06 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after roadmap creation*
