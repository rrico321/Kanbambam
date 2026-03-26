# Requirements: Kanbambam

**Defined:** 2026-03-25
**Core Value:** Kanban board management from the command line that stays perfectly in sync with a polished web GUI

## v1 Requirements

### Workspaces

- [ ] **WKSP-01**: User can create a workspace with a name
- [ ] **WKSP-02**: User can list all their workspaces
- [ ] **WKSP-03**: User can rename a workspace
- [ ] **WKSP-04**: User can delete a workspace (and all its boards)

### Boards

- [ ] **BORD-01**: User can create a board within a workspace
- [ ] **BORD-02**: User can list all boards in a workspace
- [ ] **BORD-03**: User can rename a board
- [ ] **BORD-04**: User can delete a board (and all its columns/items)
- [ ] **BORD-05**: New boards are created with default columns (To Do, In Progress, Done)

### Columns

- [ ] **COLM-01**: User can add a column to a board
- [ ] **COLM-02**: User can rename a column
- [ ] **COLM-03**: User can reorder columns within a board
- [ ] **COLM-04**: User can delete a column (moves items to a target column or deletes them)

### Items

- [ ] **ITEM-01**: User can create an item in a column with a title
- [ ] **ITEM-02**: User can add/edit a description on an item
- [ ] **ITEM-03**: User can move an item to a different column
- [ ] **ITEM-04**: User can reorder items within a column
- [ ] **ITEM-05**: User can delete an item
- [ ] **ITEM-06**: User can add labels/tags to an item (with color)
- [ ] **ITEM-07**: User can set a due date on an item
- [ ] **ITEM-08**: User can remove labels and due dates from an item

### CLI

- [ ] **CLI-01**: All entity operations available as CLI commands (workspace, board, column, item CRUD)
- [ ] **CLI-02**: Every command supports `--json` flag for structured JSON output (AI-friendly)
- [ ] **CLI-03**: Human-readable formatted output by default
- [ ] **CLI-04**: Browser-based login flow (`kanbambam auth login` opens browser, receives token)
- [ ] **CLI-05**: User can set active workspace/board context to avoid repeating IDs
- [ ] **CLI-06**: User can view current context (`kanbambam context`)
- [ ] **CLI-07**: User can clear context (`kanbambam context clear`)

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password via web app
- [ ] **AUTH-02**: User can log in via web app
- [ ] **AUTH-03**: User can log out from web app
- [ ] **AUTH-04**: User can authenticate CLI via browser login flow
- [ ] **AUTH-05**: CLI auth token persists across sessions
- [ ] **AUTH-06**: User session stays active across browser refresh (JWT)

### Web App

- [ ] **WEB-01**: Trello-style board view with columns displayed side by side
- [ ] **WEB-02**: Drag-and-drop items between columns
- [ ] **WEB-03**: Drag-and-drop to reorder items within a column
- [ ] **WEB-04**: Inline editing of item title, description, labels, and due date
- [ ] **WEB-05**: Navigate between workspaces and boards
- [ ] **WEB-06**: Board view reflects all changes made via CLI (same API, same data)

### API

- [ ] **API-01**: REST API serving all CRUD operations for workspaces, boards, columns, and items
- [ ] **API-02**: JWT-based authentication for both CLI and web clients
- [ ] **API-03**: Fractional indexing for item and column ordering (no reindex on every move)
- [ ] **API-04**: Pagination on list endpoints

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
| (populated by roadmap) | | |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 0
- Unmapped: 30 ⚠️

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after initial definition*
