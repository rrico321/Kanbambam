# Feature Research

**Domain:** CLI-first Kanban board with web GUI
**Researched:** 2026-03-25
**Confidence:** MEDIUM (based on training data knowledge of Trello, Linear, Jira, GitHub Projects, taskwarrior, gh CLI -- no live web search available)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

#### Core Data Model

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Board CRUD | Fundamental unit of organization; every Kanban tool has boards | LOW | CLI: `kanbambam board create/list/show/delete` |
| Column CRUD with ordering | Columns define workflow stages; must be reorderable | LOW | CLI: `kanbambam column add/move/rename/remove` |
| Item CRUD | Cards/items are the atomic unit of work | LOW | CLI: `kanbambam item create/show/edit/delete` |
| Move items between columns | Core Kanban action -- drag in GUI, command in CLI | LOW | CLI: `kanbambam item move <id> --to <column>` |
| Item title and description | Every task tracker has at minimum title + description | LOW | Description supports markdown in web, plain text in CLI |
| Workspace hierarchy | Users expect to group boards; PROJECT.md specifies User > Workspace > Board > Column > Item | LOW | CLI: `kanbambam workspace create/list/switch` |
| Labels/tags on items | Color-coded categorization is universal in Kanban tools | LOW | CLI: `kanbambam item label add/remove`; Web: colored chips |
| Due dates on items | Time-based tracking is baseline expectation | LOW | CLI: `kanbambam item set-due <id> <date>` |
| User authentication | Must log in to access data | MEDIUM | Browser-based OAuth-style flow for CLI (like `gh auth login`) |
| Board view in CLI | Must be able to see the board state at a glance | MEDIUM | Formatted table/columns output in terminal; this IS the CLI experience |

#### CLI UX Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Help text for every command | Developers expect `--help` on all commands | LOW | Use commander.js or oclif built-in help generation |
| Consistent command grammar | `noun verb` or `verb noun` pattern, applied uniformly | LOW | Recommend: `kanbambam <resource> <action> [args] [flags]` like `gh` |
| JSON output mode | AI agents and scripts need parseable output | LOW | `--json` flag on all commands; critical for AI agent consumption |
| Human-readable default output | Terminal users expect formatted, colored output | LOW | Colored, aligned table output by default |
| Error messages with fix suggestions | Modern CLIs tell you what went wrong AND how to fix it | LOW | "Did you mean...?" and "Try: kanbambam board list" |
| Tab completion | Shell completion for commands and arguments | MEDIUM | Ship completion scripts for bash/zsh/fish |
| Aliases and short IDs | Nobody wants to type UUIDs; short numeric IDs or slugs | LOW | Auto-generate short IDs (e.g., `#42`) per board scope |
| Config persistence | Remember auth token, default workspace, output preferences | LOW | `~/.config/kanbambam/config.json` or XDG-compliant path |

#### Web GUI Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Drag-and-drop cards | THE defining Kanban web interaction; Trello made this the standard | MEDIUM | Use dnd-kit or similar React DnD library |
| Board column view | Visual columns with cards stacked vertically | LOW | Standard flexbox/grid layout |
| Card detail modal/panel | Click card to see full details, edit inline | MEDIUM | Side panel or modal with form fields |
| Responsive layout | Works on tablet/laptop screens at minimum | MEDIUM | Not mobile-app quality, but usable on smaller screens |
| Visual label colors | Colored tags on cards for quick scanning | LOW | Standard colored chip components |
| Loading states | Users expect feedback during API calls | LOW | Skeletons or spinners on board load |
| Login/signup flow | Standard email/password web forms | MEDIUM | Standard auth UI with form validation |

### Differentiators (Competitive Advantage)

Features that set Kanbambam apart from Trello/Linear/Jira AND from CLI-only tools like taskwarrior.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| CLI-web parity with real-time sync | The core value prop: same data, two interfaces, instant sync. No other Kanban tool does CLI-first with a real web GUI backed by the same API | LOW (architectural) | Not a feature to build, but a property of the architecture. Both clients hit the same REST API |
| AI-agent-friendly CLI | JSON output, predictable command grammar, scriptable -- designed so AI agents (Cursor, Claude, Copilot) can manage boards | LOW | `--json` output + consistent exit codes + machine-readable errors. The killer use case for CLI-first |
| Interactive TUI board view | Full terminal UI showing the board as columns with cards, navigable with arrow keys | HIGH | Use Ink (React for CLI) or blessed/neo-blessed. This is the "wow" moment in the terminal |
| Bulk operations in CLI | Move multiple items, batch label, bulk archive -- things that are tedious in web GUIs | MEDIUM | `kanbambam item move --filter "label:bug" --to done` |
| Pipe-friendly I/O | Accept input from stdin, output to stdout for Unix pipeline composition | LOW | `echo "Fix login bug" \| kanbambam item create --board main` |
| Board templates | Pre-built column structures (Kanban, Scrum Sprint, Bug Triage) | LOW | Seed data for common workflows |
| Quick-add from CLI | One-liner to add an item without specifying every field | LOW | `kanbambam add "Fix the login bug"` -- infers board from context/config |
| Column WIP limits | Limit how many items can be in a column (core Kanban practice) | LOW | Warn on exceed, block optionally. Surprisingly few tools enforce this well |
| Keyboard shortcuts in web | Power-user web experience matching CLI speed | MEDIUM | `n` for new card, `m` for move, arrow keys to navigate |
| Activity log / history | See what changed, when, by whom (or by which interface) | MEDIUM | Log all mutations with source (CLI vs Web). Useful for debugging sync |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time WebSocket sync between web clients | "I want to see changes instantly" | Massive infrastructure complexity for a v1 single-user product. WebSockets need connection management, reconnection logic, state reconciliation. Single user means you are the only one making changes | Poll on focus/interval for v1. Add WebSockets in v2 when multi-user lands. The CLI-to-web sync is already handled by both hitting the same API |
| Offline/local-first mode | "Work without internet" | Conflict resolution is extremely hard. Two sources of truth = sync hell. PROJECT.md explicitly scopes this out | Cloud API is the single source of truth. CLI fails gracefully with clear error when offline |
| Custom fields on items | "I need a priority field / story points / custom dropdown" | Schema-per-user complexity, migration headaches, UI rendering complexity. Trello took years to ship this well | Use labels for categorization. Add structured custom fields in v2+ only if validated by user demand |
| Gantt charts / timeline view | "I want to see dates on a timeline" | Scope explosion, complex UI, moves away from Kanban simplicity into project management territory | Due dates on items + a simple "overdue" filter. Kanbambam is Kanban, not MS Project |
| File attachments on items | "I want to attach screenshots" | Blob storage, upload UX, preview rendering, storage costs. High complexity for marginal Kanban value | Link to external files (URLs in description). Attachment support can be v2+ |
| Markdown rendering in CLI | "Render my descriptions as rich text in terminal" | Terminal markdown rendering is janky, inconsistent across terminals, adds dependency weight | Show raw markdown in CLI (it reads fine). Web renders markdown properly |
| OAuth social login (Google, GitHub) | "Let me log in with Google" | Each OAuth provider is integration work, callback handling, account linking edge cases | Email/password for v1 (PROJECT.md decision). Add OAuth providers one at a time in v2 |
| Desktop notifications | "Notify me when a due date is approaching" | Requires persistent background process or OS-level integration. CLI tools should not be daemons | Web app can do browser notifications later. CLI is stateless by design |
| Plugin/extension system | "Let me customize with plugins" | Designing a stable plugin API before you know your own API is premature abstraction | Ship a good REST API. Third parties can build on that. Plugin system = v3+ |
| Card comments/discussion | "Let me comment on cards" | Comments imply multi-user, threading, notifications -- all complexity for a single-user v1 | Description field serves as notes for v1. Comments arrive with multi-user in v2 |

## Feature Dependencies

```
[Authentication]
    └──requires──> [User accounts & signup]
                       └──enables──> [Workspace CRUD]
                                        └──enables──> [Board CRUD]
                                                          └──enables──> [Column CRUD]
                                                                            └──enables──> [Item CRUD]
                                                                                             └──enables──> [Labels, Due Dates, Move]

[CLI Board View]
    └──requires──> [Item CRUD]
    └──requires──> [Column CRUD]
    └──requires──> [Human-readable output formatting]

[Interactive TUI]
    └──requires──> [CLI Board View]
    └──requires──> [Item Move]
    └──enhances──> [CLI Board View] (replaces static output with interactive)

[Web Drag-and-Drop]
    └──requires──> [Board CRUD]
    └──requires──> [Item Move API endpoint]

[JSON Output Mode]
    └──enhances──> [Every CLI command] (flag available on all)
    └──enables──> [AI Agent Integration]

[Bulk Operations]
    └──requires──> [Item CRUD]
    └──requires──> [Labels] (for filter-based bulk actions)

[Tab Completion]
    └──requires──> [Command structure finalized]
    └──enhances──> [Every CLI command]

[Column WIP Limits]
    └──requires──> [Column CRUD]
    └──requires──> [Item Move] (enforcement happens on move)

[Activity Log]
    └──requires──> [All mutation endpoints] (middleware/hook on every write)
```

### Dependency Notes

- **All resource CRUD requires Authentication:** No anonymous access; auth is the foundation layer
- **Workspace > Board > Column > Item hierarchy is strictly ordered:** Cannot build Item CRUD without Column CRUD existing first, etc.
- **Interactive TUI requires basic CLI to be stable:** TUI is an enhancement layer on top of working commands
- **Web drag-and-drop requires Item Move API:** The web GUI calls the same move endpoint the CLI does
- **Bulk Operations require Labels:** Filtering by label is the primary way to select items for bulk actions
- **Activity Log is cross-cutting:** Best implemented as API middleware, not per-feature

## MVP Definition

### Launch With (v1)

Minimum viable product -- what's needed to validate "CLI-first Kanban with web GUI" as a concept.

- [ ] **User auth with browser login flow** -- without auth, nothing works
- [ ] **Workspace/Board/Column/Item full CRUD via CLI** -- the entire data hierarchy, manageable from terminal
- [ ] **Move items between columns (CLI)** -- the core Kanban action
- [ ] **Labels and due dates on items** -- minimum useful metadata
- [ ] **Formatted CLI board view** -- see the board state in terminal (static table output, not TUI)
- [ ] **JSON output on all commands** -- AI agent compatibility from day one
- [ ] **REST API** -- shared backend for both interfaces
- [ ] **Web app with board view and drag-and-drop** -- the "other half" of the value prop
- [ ] **Web card detail editing** -- click to view/edit item details
- [ ] **Short IDs for items** -- usability essential for CLI (`#42` not `uuid-here`)

### Add After Validation (v1.x)

Features to add once the core loop is working and users are trying it.

- [ ] **Tab completion** -- ship once command structure is stable
- [ ] **Quick-add shortcut** -- `kanbambam add "task"` with smart defaults
- [ ] **Board templates** -- reduce friction for new boards
- [ ] **Column WIP limits** -- proper Kanban practice enforcement
- [ ] **Bulk operations** -- power-user CLI productivity
- [ ] **Pipe-friendly stdin** -- Unix composability
- [ ] **Keyboard shortcuts in web** -- power-user web speed
- [ ] **Item archiving** -- keep boards clean without deleting history
- [ ] **Activity log** -- see what changed and when

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Interactive TUI** -- high complexity, validate that CLI users actually want interactive mode vs. one-shot commands
- [ ] **Multi-user / team collaboration** -- PROJECT.md scopes this to v2
- [ ] **Card comments** -- arrives with multi-user
- [ ] **Custom fields** -- only if users demand structured metadata beyond labels
- [ ] **WebSocket real-time sync** -- only valuable with multi-user
- [ ] **OAuth social login** -- convenience, not essential
- [ ] **File attachments** -- link URLs in v1, real attachments in v2+
- [ ] **Search across boards** -- useful at scale, premature for v1
- [ ] **MCP server** -- PROJECT.md explicitly defers this; API exists so MCP wraps it later

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Auth (browser login flow) | HIGH | MEDIUM | P1 |
| Full CRUD hierarchy (CLI) | HIGH | MEDIUM | P1 |
| Item move between columns | HIGH | LOW | P1 |
| Labels and due dates | HIGH | LOW | P1 |
| CLI board view (formatted) | HIGH | MEDIUM | P1 |
| JSON output mode | HIGH | LOW | P1 |
| REST API backend | HIGH | HIGH | P1 |
| Web board + drag-and-drop | HIGH | HIGH | P1 |
| Web card detail panel | HIGH | MEDIUM | P1 |
| Short IDs | MEDIUM | LOW | P1 |
| Tab completion | MEDIUM | LOW | P2 |
| Quick-add shortcut | MEDIUM | LOW | P2 |
| Board templates | MEDIUM | LOW | P2 |
| WIP limits | MEDIUM | LOW | P2 |
| Bulk CLI operations | MEDIUM | MEDIUM | P2 |
| Keyboard shortcuts (web) | MEDIUM | MEDIUM | P2 |
| Activity log | MEDIUM | MEDIUM | P2 |
| Item archiving | MEDIUM | LOW | P2 |
| Interactive TUI | HIGH | HIGH | P3 |
| Multi-user/teams | HIGH | HIGH | P3 |
| Card comments | MEDIUM | MEDIUM | P3 |
| Custom fields | MEDIUM | HIGH | P3 |
| Search across boards | MEDIUM | MEDIUM | P3 |

## Competitor Feature Analysis

| Feature | Trello | Linear | GitHub Projects | Taskwarrior (CLI) | Kanbambam Approach |
|---------|--------|--------|-----------------|-------------------|--------------------|
| Board view | Columns + cards, drag-and-drop | Kanban + list + timeline views | Table + board views | No board view (list only) | CLI: formatted column output + optional TUI. Web: Trello-style drag-and-drop |
| CLI access | None (API only, no official CLI) | None | `gh project` commands exist but limited | CLI-only, no GUI | CLI-first with full CRUD. This is our core differentiator vs Trello/Linear |
| AI agent friendly | No (requires API integration) | No | Partial (gh CLI is scriptable) | Yes (scriptable but arcane syntax) | Yes: JSON output, predictable grammar, designed for agents |
| Labels | Yes, colored | Yes (label system) | Yes (custom fields) | Tags (text only, no color) | Colored labels, CLI and web |
| Due dates | Yes | Yes (cycles, due dates) | Yes (date fields) | Yes (due/scheduled) | Yes, simple due date per item |
| WIP limits | No (Power-Up only) | No | No | No | Yes, built-in. Real Kanban practice |
| Auth | Email + OAuth | Email + OAuth + SSO | GitHub account | None (local files) | Email/password + browser flow for CLI |
| Offline | Limited | No | No | Yes (local files) | No (cloud-first by design) |
| Multi-user | Yes | Yes | Yes | No | v2 (single-user for v1) |
| Pricing | Freemium | Paid (free for small teams) | Free with GitHub | Free (OSS) | TBD -- likely freemium |
| Speed | Moderate (heavy web app) | Fast (optimized) | Slow (GitHub is slow) | Instant (local) | CLI: instant (thin client). Web: fast (focused scope) |

### Competitive Positioning Summary

Kanbambam occupies a unique niche: **the only Kanban tool that is both CLI-native and has a real web GUI**. Trello/Linear have no CLI. Taskwarrior has no GUI. GitHub Projects has a limited CLI. This dual-interface approach is the entire value proposition.

The AI agent angle is the growth lever. As AI-assisted development grows, tools that agents can operate directly (via CLI commands with JSON output) have an inherent advantage over GUI-only tools that require browser automation or API client libraries.

## Sources

- Training data knowledge of: Trello, Linear, Jira, Asana, GitHub Projects, Notion, Taskwarrior, kanban.bash, gh CLI
- Competitor feature pages (from training data, not live-verified)
- CLI UX patterns from: gh (GitHub CLI), railway, vercel, fly.io, supabase CLIs
- Note: Web search was unavailable during this research session. All findings are from training data (cutoff ~early 2025). Confidence is MEDIUM overall; specific feature lists for competitors may have evolved

---
*Feature research for: CLI-first Kanban board with web GUI*
*Researched: 2026-03-25*

# Feature Research

**Domain:** CLI-first Kanban board with web GUI
**Researched:** 2026-03-25
**Confidence:** MEDIUM (based on training data knowledge of Trello, Linear, Jira, GitHub Projects, taskwarrior, gh CLI -- no live web search available)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

#### Core Data Model

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Board CRUD | Fundamental unit of organization; every Kanban tool has boards | LOW | CLI: `kanbambam board create/list/show/delete` |
| Column CRUD with ordering | Columns define workflow stages; must be reorderable | LOW | CLI: `kanbambam column add/move/rename/remove` |
| Item CRUD | Cards/items are the atomic unit of work | LOW | CLI: `kanbambam item create/show/edit/delete` |
| Move items between columns | Core Kanban action -- drag in GUI, command in CLI | LOW | CLI: `kanbambam item move <id> --to <column>` |
| Item title and description | Every task tracker has at minimum title + description | LOW | Description supports markdown in web, plain text in CLI |
| Workspace hierarchy | Users expect to group boards; PROJECT.md specifies User > Workspace > Board > Column > Item | LOW | CLI: `kanbambam workspace create/list/switch` |
| Labels/tags on items | Color-coded categorization is universal in Kanban tools | LOW | CLI: `kanbambam item label add/remove`; Web: colored chips |
| Due dates on items | Time-based tracking is baseline expectation | LOW | CLI: `kanbambam item set-due <id> <date>` |
| User authentication | Must log in to access data | MEDIUM | Browser-based OAuth-style flow for CLI (like `gh auth login`) |
| Board view in CLI | Must be able to see the board state at a glance | MEDIUM | Formatted table/columns output in terminal; this IS the CLI experience |

#### CLI UX Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Help text for every command | Developers expect `--help` on all commands | LOW | Use commander.js or oclif built-in help generation |
| Consistent command grammar | `noun verb` or `verb noun` pattern, applied uniformly | LOW | Recommend: `kanbambam <resource> <action> [args] [flags]` like `gh` |
| JSON output mode | AI agents and scripts need parseable output | LOW | `--json` flag on all commands; critical for AI agent consumption |
| Human-readable default output | Terminal users expect formatted, colored output | LOW | Colored, aligned table output by default |
| Error messages with fix suggestions | Modern CLIs tell you what went wrong AND how to fix it | LOW | "Did you mean...?" and "Try: kanbambam board list" |
| Tab completion | Shell completion for commands and arguments | MEDIUM | Ship completion scripts for bash/zsh/fish |
| Aliases and short IDs | Nobody wants to type UUIDs; short numeric IDs or slugs | LOW | Auto-generate short IDs (e.g., `#42`) per board scope |
| Config persistence | Remember auth token, default workspace, output preferences | LOW | `~/.config/kanbambam/config.json` or XDG-compliant path |

#### Web GUI Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Drag-and-drop cards | THE defining Kanban web interaction; Trello made this the standard | MEDIUM | Use dnd-kit or similar React DnD library |
| Board column view | Visual columns with cards stacked vertically | LOW | Standard flexbox/grid layout |
| Card detail modal/panel | Click card to see full details, edit inline | MEDIUM | Side panel or modal with form fields |
| Responsive layout | Works on tablet/laptop screens at minimum | MEDIUM | Not mobile-app quality, but usable on smaller screens |
| Visual label colors | Colored tags on cards for quick scanning | LOW | Standard colored chip components |
| Loading states | Users expect feedback during API calls | LOW | Skeletons or spinners on board load |
| Login/signup flow | Standard email/password web forms | MEDIUM | Standard auth UI with form validation |

### Differentiators (Competitive Advantage)

Features that set Kanbambam apart from Trello/Linear/Jira AND from CLI-only tools like taskwarrior.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| CLI-web parity with real-time sync | The core value prop: same data, two interfaces, instant sync. No other Kanban tool does CLI-first with a real web GUI backed by the same API | LOW (architectural) | Not a feature to build, but a property of the architecture. Both clients hit the same REST API |
| AI-agent-friendly CLI | JSON output, predictable command grammar, scriptable -- designed so AI agents (Cursor, Claude, Copilot) can manage boards | LOW | `--json` output + consistent exit codes + machine-readable errors. The killer use case for CLI-first |
| Interactive TUI board view | Full terminal UI showing the board as columns with cards, navigable with arrow keys | HIGH | Use Ink (React for CLI) or blessed/neo-blessed. This is the "wow" moment in the terminal |
| Bulk operations in CLI | Move multiple items, batch label, bulk archive -- things that are tedious in web GUIs | MEDIUM | `kanbambam item move --filter "label:bug" --to done` |
| Pipe-friendly I/O | Accept input from stdin, output to stdout for Unix pipeline composition | LOW | `echo "Fix login bug" | kanbambam item create --board main` |
| Board templates | Pre-built column structures (Kanban, Scrum Sprint, Bug Triage) | LOW | Seed data for common workflows |
| Quick-add from CLI | One-liner to add an item without specifying every field | LOW | `kanbambam add "Fix the login bug"` -- infers board from context/config |
| Column WIP limits | Limit how many items can be in a column (core Kanban practice) | LOW | Warn on exceed, block optionally. Surprisingly few tools enforce this well |
| Keyboard shortcuts in web | Power-user web experience matching CLI speed | MEDIUM | `n` for new card, `m` for move, arrow keys to navigate |
| Activity log / history | See what changed, when, by whom (or by which interface) | MEDIUM | Log all mutations with source (CLI vs Web). Useful for debugging sync |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time WebSocket sync between web clients | "I want to see changes instantly" | Massive infrastructure complexity for a v1 single-user product. WebSockets need connection management, reconnection logic, state reconciliation. Single user means you are the only one making changes | Poll on focus/interval for v1. Add WebSockets in v2 when multi-user lands. The CLI-to-web sync is already handled by both hitting the same API |
| Offline/local-first mode | "Work without internet" | Conflict resolution is extremely hard. Two sources of truth = sync hell. PROJECT.md explicitly scopes this out | Cloud API is the single source of truth. CLI fails gracefully with clear error when offline |
| Custom fields on items | "I need a priority field / story points / custom dropdown" | Schema-per-user complexity, migration headaches, UI rendering complexity. Trello took years to ship this well | Use labels for categorization. Add structured custom fields in v2+ only if validated by user demand |
| Gantt charts / timeline view | "I want to see dates on a timeline" | Scope explosion, complex UI, moves away from Kanban simplicity into project management territory | Due dates on items + a simple "overdue" filter. Kanbambam is Kanban, not MS Project |
| File attachments on items | "I want to attach screenshots" | Blob storage, upload UX, preview rendering, storage costs. High complexity for marginal Kanban value | Link to external files (URLs in description). Attachment support can be v2+ |
| Markdown rendering in CLI | "Render my descriptions as rich text in terminal" | Terminal markdown rendering is janky, inconsistent across terminals, adds dependency weight | Show raw markdown in CLI (it reads fine). Web renders markdown properly |
| OAuth social login (Google, GitHub) | "Let me log in with Google" | Each OAuth provider is integration work, callback handling, account linking edge cases | Email/password for v1 (PROJECT.md decision). Add OAuth providers one at a time in v2 |
| Desktop notifications | "Notify me when a due date is approaching" | Requires persistent background process or OS-level integration. CLI tools should not be daemons | Web app can do browser notifications later. CLI is stateless by design |
| Plugin/extension system | "Let me customize with plugins" | Designing a stable plugin API before you know your own API is premature abstraction | Ship a good REST API. Third parties can build on that. Plugin system = v3+ |
| Card comments/discussion | "Let me comment on cards" | Comments imply multi-user, threading, notifications -- all complexity for a single-user v1 | Description field serves as notes for v1. Comments arrive with multi-user in v2 |

## Feature Dependencies

```
[Authentication]
    └──requires──> [User accounts & signup]
                       └──enables──> [Workspace CRUD]
                                        └──enables──> [Board CRUD]
                                                          └──enables──> [Column CRUD]
                                                                            └──enables──> [Item CRUD]
                                                                                             └──enables──> [Labels, Due Dates, Move]

[CLI Board View]
    └──requires──> [Item CRUD]
    └──requires──> [Column CRUD]
    └──requires──> [Human-readable output formatting]

[Interactive TUI]
    └──requires──> [CLI Board View]
    └──requires──> [Item Move]
    └──enhances──> [CLI Board View] (replaces static output with interactive)

[Web Drag-and-Drop]
    └──requires──> [Board CRUD]
    └──requires──> [Item Move API endpoint]

[JSON Output Mode]
    └──enhances──> [Every CLI command] (flag available on all)
    └──enables──> [AI Agent Integration]

[Bulk Operations]
    └──requires──> [Item CRUD]
    └──requires──> [Labels] (for filter-based bulk actions)

[Tab Completion]
    └──requires──> [Command structure finalized]
    └──enhances──> [Every CLI command]

[Column WIP Limits]
    └──requires──> [Column CRUD]
    └──requires──> [Item Move] (enforcement happens on move)

[Activity Log]
    └──requires──> [All mutation endpoints] (middleware/hook on every write)
```

### Dependency Notes

- **All resource CRUD requires Authentication:** No anonymous access; auth is the foundation layer
- **Workspace > Board > Column > Item hierarchy is strictly ordered:** Cannot build Item CRUD without Column CRUD existing first, etc.
- **Interactive TUI requires basic CLI to be stable:** TUI is an enhancement layer on top of working commands
- **Web drag-and-drop requires Item Move API:** The web GUI calls the same move endpoint the CLI does
- **Bulk Operations require Labels:** Filtering by label is the primary way to select items for bulk actions
- **Activity Log is cross-cutting:** Best implemented as API middleware, not per-feature

## MVP Definition

### Launch With (v1)

Minimum viable product -- what's needed to validate "CLI-first Kanban with web GUI" as a concept.

- [ ] **User auth with browser login flow** -- without auth, nothing works
- [ ] **Workspace/Board/Column/Item full CRUD via CLI** -- the entire data hierarchy, manageable from terminal
- [ ] **Move items between columns (CLI)** -- the core Kanban action
- [ ] **Labels and due dates on items** -- minimum useful metadata
- [ ] **Formatted CLI board view** -- see the board state in terminal (static table output, not TUI)
- [ ] **JSON output on all commands** -- AI agent compatibility from day one
- [ ] **REST API** -- shared backend for both interfaces
- [ ] **Web app with board view and drag-and-drop** -- the "other half" of the value prop
- [ ] **Web card detail editing** -- click to view/edit item details
- [ ] **Short IDs for items** -- usability essential for CLI (`#42` not `uuid-here`)

### Add After Validation (v1.x)

Features to add once the core loop is working and users are trying it.

- [ ] **Tab completion** -- ship once command structure is stable
- [ ] **Quick-add shortcut** -- `kanbambam add "task"` with smart defaults
- [ ] **Board templates** -- reduce friction for new boards
- [ ] **Column WIP limits** -- proper Kanban practice enforcement
- [ ] **Bulk operations** -- power-user CLI productivity
- [ ] **Pipe-friendly stdin** -- Unix composability
- [ ] **Keyboard shortcuts in web** -- power-user web speed
- [ ] **Item archiving** -- keep boards clean without deleting history
- [ ] **Activity log** -- see what changed and when

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Interactive TUI** -- high complexity, validate that CLI users actually want interactive mode vs. one-shot commands
- [ ] **Multi-user / team collaboration** -- PROJECT.md scopes this to v2
- [ ] **Card comments** -- arrives with multi-user
- [ ] **Custom fields** -- only if users demand structured metadata beyond labels
- [ ] **WebSocket real-time sync** -- only valuable with multi-user
- [ ] **OAuth social login** -- convenience, not essential
- [ ] **File attachments** -- link URLs in v1, real attachments in v2+
- [ ] **Search across boards** -- useful at scale, premature for v1
- [ ] **MCP server** -- PROJECT.md explicitly defers this; API exists so MCP wraps it later

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Auth (browser login flow) | HIGH | MEDIUM | P1 |
| Full CRUD hierarchy (CLI) | HIGH | MEDIUM | P1 |
| Item move between columns | HIGH | LOW | P1 |
| Labels and due dates | HIGH | LOW | P1 |
| CLI board view (formatted) | HIGH | MEDIUM | P1 |
| JSON output mode | HIGH | LOW | P1 |
| REST API backend | HIGH | HIGH | P1 |
| Web board + drag-and-drop | HIGH | HIGH | P1 |
| Web card detail panel | HIGH | MEDIUM | P1 |
| Short IDs | MEDIUM | LOW | P1 |
| Tab completion | MEDIUM | LOW | P2 |
| Quick-add shortcut | MEDIUM | LOW | P2 |
| Board templates | MEDIUM | LOW | P2 |
| WIP limits | MEDIUM | LOW | P2 |
| Bulk CLI operations | MEDIUM | MEDIUM | P2 |
| Keyboard shortcuts (web) | MEDIUM | MEDIUM | P2 |
| Activity log | MEDIUM | MEDIUM | P2 |
| Item archiving | MEDIUM | LOW | P2 |
| Interactive TUI | HIGH | HIGH | P3 |
| Multi-user/teams | HIGH | HIGH | P3 |
| Card comments | MEDIUM | MEDIUM | P3 |
| Custom fields | MEDIUM | HIGH | P3 |
| Search across boards | MEDIUM | MEDIUM | P3 |

## Competitor Feature Analysis

| Feature | Trello | Linear | GitHub Projects | Taskwarrior (CLI) | Kanbambam Approach |
|---------|--------|--------|-----------------|-------------------|--------------------|
| Board view | Columns + cards, drag-and-drop | Kanban + list + timeline views | Table + board views | No board view (list only) | CLI: formatted column output + optional TUI. Web: Trello-style drag-and-drop |
| CLI access | None (API only, no official CLI) | None | `gh project` commands exist but limited | CLI-only, no GUI | CLI-first with full CRUD. This is our core differentiator vs Trello/Linear |
| AI agent friendly | No (requires API integration) | No | Partial (gh CLI is scriptable) | Yes (scriptable but arcane syntax) | Yes: JSON output, predictable grammar, designed for agents |
| Labels | Yes, colored | Yes (label system) | Yes (custom fields) | Tags (text only, no color) | Colored labels, CLI and web |
| Due dates | Yes | Yes (cycles, due dates) | Yes (date fields) | Yes (due/scheduled) | Yes, simple due date per item |
| WIP limits | No (Power-Up only) | No | No | No | Yes, built-in. Real Kanban practice |
| Auth | Email + OAuth | Email + OAuth + SSO | GitHub account | None (local files) | Email/password + browser flow for CLI |
| Offline | Limited | No | No | Yes (local files) | No (cloud-first by design) |
| Multi-user | Yes | Yes | Yes | No | v2 (single-user for v1) |
| Speed | Moderate (heavy web app) | Fast (optimized) | Slow (GitHub is slow) | Instant (local) | CLI: instant (thin client). Web: fast (focused scope) |

### Competitive Positioning Summary

Kanbambam occupies a unique niche: **the only Kanban tool that is both CLI-native and has a real web GUI**. Trello/Linear have no CLI. Taskwarrior has no GUI. GitHub Projects has a limited CLI. This dual-interface approach is the entire value proposition.

The AI agent angle is the growth lever. As AI-assisted development grows, tools that agents can operate directly (via CLI commands with JSON output) have an inherent advantage over GUI-only tools that require browser automation or API client libraries.

## Sources

- Training data knowledge of: Trello, Linear, Jira, Asana, GitHub Projects, Notion, Taskwarrior, kanban.bash, gh CLI
- Competitor feature pages (from training data, not live-verified)
- CLI UX patterns from: gh (GitHub CLI), railway, vercel, fly.io, supabase CLIs
- Note: Web search was unavailable during this research session. All findings are from training data (cutoff ~early 2025). Confidence is MEDIUM overall; specific feature lists for competitors may have evolved

---
*Feature research for: CLI-first Kanban board with web GUI*
*Researched: 2026-03-25*

# Feature Research

**Domain:** CLI-first Kanban board with web GUI
**Researched:** 2026-03-25
**Confidence:** MEDIUM (based on training data knowledge of Trello, Linear, Jira, GitHub Projects, taskwarrior, gh CLI -- no live web search available)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

#### Core Data Model

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Board CRUD | Fundamental unit of organization; every Kanban tool has boards | LOW | CLI: `kanbambam board create/list/show/delete` |
| Column CRUD with ordering | Columns define workflow stages; must be reorderable | LOW | CLI: `kanbambam column add/move/rename/remove` |
| Item CRUD | Cards/items are the atomic unit of work | LOW | CLI: `kanbambam item create/show/edit/delete` |
| Move items between columns | Core Kanban action -- drag in GUI, command in CLI | LOW | CLI: `kanbambam item move <id> --to <column>` |
| Item title and description | Every task tracker has at minimum title + description | LOW | Description supports markdown in web, plain text in CLI |
| Workspace hierarchy | Users expect to group boards; PROJECT.md specifies User > Workspace > Board > Column > Item | LOW | CLI: `kanbambam workspace create/list/switch` |
| Labels/tags on items | Color-coded categorization is universal in Kanban tools | LOW | CLI: `kanbambam item label add/remove`; Web: colored chips |
| Due dates on items | Time-based tracking is baseline expectation | LOW | CLI: `kanbambam item set-due <id> <date>` |
| User authentication | Must log in to access data | MEDIUM | Browser-based OAuth-style flow for CLI (like `gh auth login`) |
| Board view in CLI | Must be able to see the board state at a glance | MEDIUM | Formatted table/columns output in terminal; this IS the CLI experience |

#### CLI UX Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Help text for every command | Developers expect `--help` on all commands | LOW | Use commander.js or oclif built-in help generation |
| Consistent command grammar | `noun verb` or `verb noun` pattern, applied uniformly | LOW | Recommend: `kanbambam <resource> <action> [args] [flags]` like `gh` |
| JSON output mode | AI agents and scripts need parseable output | LOW | `--json` flag on all commands; critical for AI agent consumption |
| Human-readable default output | Terminal users expect formatted, colored output | LOW | Colored, aligned table output by default |
| Error messages with fix suggestions | Modern CLIs tell you what went wrong AND how to fix it | LOW | "Did you mean...?" and "Try: kanbambam board list" |
| Tab completion | Shell completion for commands and arguments | MEDIUM | Ship completion scripts for bash/zsh/fish |
| Aliases and short IDs | Nobody wants to type UUIDs; short numeric IDs or slugs | LOW | Auto-generate short IDs (e.g., `#42`) per board scope |
| Config persistence | Remember auth token, default workspace, output preferences | LOW | `~/.config/kanbambam/config.json` or XDG-compliant path |

#### Web GUI Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Drag-and-drop cards | THE defining Kanban web interaction; Trello made this the standard | MEDIUM | Use dnd-kit or similar React DnD library |
| Board column view | Visual columns with cards stacked vertically | LOW | Standard flexbox/grid layout |
| Card detail modal/panel | Click card to see full details, edit inline | MEDIUM | Side panel or modal with form fields |
| Responsive layout | Works on tablet/laptop screens at minimum | MEDIUM | Not mobile-app quality, but usable on smaller screens |
| Visual label colors | Colored tags on cards for quick scanning | LOW | Standard colored chip components |
| Loading states | Users expect feedback during API calls | LOW | Skeletons or spinners on board load |
| Login/signup flow | Standard email/password web forms | MEDIUM | Standard auth UI with form validation |

### Differentiators (Competitive Advantage)

Features that set Kanbambam apart from Trello/Linear/Jira AND from CLI-only tools like taskwarrior.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| CLI-web parity with real-time sync | The core value prop: same data, two interfaces, instant sync. No other Kanban tool does CLI-first with a real web GUI backed by the same API | LOW (architectural) | Not a feature to build, but a property of the architecture. Both clients hit the same REST API |
| AI-agent-friendly CLI | JSON output, predictable command grammar, scriptable -- designed so AI agents (Cursor, Claude, Copilot) can manage boards | LOW | `--json` output + consistent exit codes + machine-readable errors. The killer use case for CLI-first |
| Interactive TUI board view | Full terminal UI showing the board as columns with cards, navigable with arrow keys | HIGH | Use Ink (React for CLI) or blessed/neo-blessed. This is the "wow" moment in the terminal |
| Bulk operations in CLI | Move multiple items, batch label, bulk archive -- things that are tedious in web GUIs | MEDIUM | `kanbambam item move --filter "label:bug" --to done` |
| Pipe-friendly I/O | Accept input from stdin, output to stdout for Unix pipeline composition | LOW | `echo "Fix login bug" \| kanbambam item create --board main` |
| Board templates | Pre-built column structures (Kanban, Scrum Sprint, Bug Triage) | LOW | Seed data for common workflows |
| Quick-add from CLI | One-liner to add an item without specifying every field | LOW | `kanbambam add "Fix the login bug"` -- infers board from context/config |
| Column WIP limits | Limit how many items can be in a column (core Kanban practice) | LOW | Warn on exceed, block optionally. Surprisingly few tools enforce this well |
| Keyboard shortcuts in web | Power-user web experience matching CLI speed | MEDIUM | `n` for new card, `m` for move, arrow keys to navigate |
| Activity log / history | See what changed, when, by whom (or by which interface) | MEDIUM | Log all mutations with source (CLI vs Web). Useful for debugging sync |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time WebSocket sync between web clients | "I want to see changes instantly" | Massive infrastructure complexity for a v1 single-user product. WebSockets need connection management, reconnection logic, state reconciliation. Single user means you are the only one making changes | Poll on focus/interval for v1. Add WebSockets in v2 when multi-user lands. The CLI-to-web sync is already handled by both hitting the same API |
| Offline/local-first mode | "Work without internet" | Conflict resolution is extremely hard. Two sources of truth = sync hell. PROJECT.md explicitly scopes this out | Cloud API is the single source of truth. CLI fails gracefully with clear error when offline |
| Custom fields on items | "I need a priority field / story points / custom dropdown" | Schema-per-user complexity, migration headaches, UI rendering complexity. Trello took years to ship this well | Use labels for categorization. Add structured custom fields in v2+ only if validated by user demand |
| Gantt charts / timeline view | "I want to see dates on a timeline" | Scope explosion, complex UI, moves away from Kanban simplicity into project management territory | Due dates on items + a simple "overdue" filter. Kanbambam is Kanban, not MS Project |
| File attachments on items | "I want to attach screenshots" | Blob storage, upload UX, preview rendering, storage costs. High complexity for marginal Kanban value | Link to external files (URLs in description). Attachment support can be v2+ |
| Markdown rendering in CLI | "Render my descriptions as rich text in terminal" | Terminal markdown rendering is janky, inconsistent across terminals, adds dependency weight | Show raw markdown in CLI (it reads fine). Web renders markdown properly |
| OAuth social login (Google, GitHub) | "Let me log in with Google" | Each OAuth provider is integration work, callback handling, account linking edge cases | Email/password for v1 (PROJECT.md decision). Add OAuth providers one at a time in v2 |
| Desktop notifications | "Notify me when a due date is approaching" | Requires persistent background process or OS-level integration. CLI tools should not be daemons | Web app can do browser notifications later. CLI is stateless by design |
| Plugin/extension system | "Let me customize with plugins" | Designing a stable plugin API before you know your own API is premature abstraction | Ship a good REST API. Third parties can build on that. Plugin system = v3+ |
| Card comments/discussion | "Let me comment on cards" | Comments imply multi-user, threading, notifications -- all complexity for a single-user v1 | Description field serves as notes for v1. Comments arrive with multi-user in v2 |

## Feature Dependencies

```
[Authentication]
    └──requires──> [User accounts & signup]
                       └──enables──> [Workspace CRUD]
                                        └──enables──> [Board CRUD]
                                                          └──enables──> [Column CRUD]
                                                                            └──enables──> [Item CRUD]
                                                                                             └──enables──> [Labels, Due Dates, Move]

[CLI Board View]
    └──requires──> [Item CRUD]
    └──requires──> [Column CRUD]
    └──requires──> [Human-readable output formatting]

[Interactive TUI]
    └──requires──> [CLI Board View]
    └──requires──> [Item Move]
    └──enhances──> [CLI Board View] (replaces static output with interactive)

[Web Drag-and-Drop]
    └──requires──> [Board CRUD]
    └──requires──> [Item Move API endpoint]

[JSON Output Mode]
    └──enhances──> [Every CLI command] (flag available on all)
    └──enables──> [AI Agent Integration]

[Bulk Operations]
    └──requires──> [Item CRUD]
    └──requires──> [Labels] (for filter-based bulk actions)

[Tab Completion]
    └──requires──> [Command structure finalized]
    └──enhances──> [Every CLI command]

[Column WIP Limits]
    └──requires──> [Column CRUD]
    └──requires──> [Item Move] (enforcement happens on move)

[Activity Log]
    └──requires──> [All mutation endpoints] (middleware/hook on every write)
```

### Dependency Notes

- **All resource CRUD requires Authentication:** No anonymous access; auth is the foundation layer
- **Workspace > Board > Column > Item hierarchy is strictly ordered:** Cannot build Item CRUD without Column CRUD existing first, etc.
- **Interactive TUI requires basic CLI to be stable:** TUI is an enhancement layer on top of working commands
- **Web drag-and-drop requires Item Move API:** The web GUI calls the same move endpoint the CLI does
- **Bulk Operations require Labels:** Filtering by label is the primary way to select items for bulk actions
- **Activity Log is cross-cutting:** Best implemented as API middleware, not per-feature

## MVP Definition

### Launch With (v1)

Minimum viable product -- what's needed to validate "CLI-first Kanban with web GUI" as a concept.

- [ ] **User auth with browser login flow** -- without auth, nothing works
- [ ] **Workspace/Board/Column/Item full CRUD via CLI** -- the entire data hierarchy, manageable from terminal
- [ ] **Move items between columns (CLI)** -- the core Kanban action
- [ ] **Labels and due dates on items** -- minimum useful metadata
- [ ] **Formatted CLI board view** -- see the board state in terminal (static table output, not TUI)
- [ ] **JSON output on all commands** -- AI agent compatibility from day one
- [ ] **REST API** -- shared backend for both interfaces
- [ ] **Web app with board view and drag-and-drop** -- the "other half" of the value prop
- [ ] **Web card detail editing** -- click to view/edit item details
- [ ] **Short IDs for items** -- usability essential for CLI (`#42` not `uuid-here`)

### Add After Validation (v1.x)

Features to add once the core loop is working and users are trying it.

- [ ] **Tab completion** -- ship once command structure is stable
- [ ] **Quick-add shortcut** -- `kanbambam add "task"` with smart defaults
- [ ] **Board templates** -- reduce friction for new boards
- [ ] **Column WIP limits** -- proper Kanban practice enforcement
- [ ] **Bulk operations** -- power-user CLI productivity
- [ ] **Pipe-friendly stdin** -- Unix composability
- [ ] **Keyboard shortcuts in web** -- power-user web speed
- [ ] **Item archiving** -- keep boards clean without deleting history
- [ ] **Activity log** -- see what changed and when

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Interactive TUI** -- high complexity, validate that CLI users actually want interactive mode vs. one-shot commands
- [ ] **Multi-user / team collaboration** -- PROJECT.md scopes this to v2
- [ ] **Card comments** -- arrives with multi-user
- [ ] **Custom fields** -- only if users demand structured metadata beyond labels
- [ ] **WebSocket real-time sync** -- only valuable with multi-user
- [ ] **OAuth social login** -- convenience, not essential
- [ ] **File attachments** -- link URLs in v1, real attachments in v2+
- [ ] **Search across boards** -- useful at scale, premature for v1
- [ ] **MCP server** -- PROJECT.md explicitly defers this; API exists so MCP wraps it later

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Auth (browser login flow) | HIGH | MEDIUM | P1 |
| Full CRUD hierarchy (CLI) | HIGH | MEDIUM | P1 |
| Item move between columns | HIGH | LOW | P1 |
| Labels and due dates | HIGH | LOW | P1 |
| CLI board view (formatted) | HIGH | MEDIUM | P1 |
| JSON output mode | HIGH | LOW | P1 |
| REST API backend | HIGH | HIGH | P1 |
| Web board + drag-and-drop | HIGH | HIGH | P1 |
| Web card detail panel | HIGH | MEDIUM | P1 |
| Short IDs | MEDIUM | LOW | P1 |
| Tab completion | MEDIUM | LOW | P2 |
| Quick-add shortcut | MEDIUM | LOW | P2 |
| Board templates | MEDIUM | LOW | P2 |
| WIP limits | MEDIUM | LOW | P2 |
| Bulk CLI operations | MEDIUM | MEDIUM | P2 |
| Keyboard shortcuts (web) | MEDIUM | MEDIUM | P2 |
| Activity log | MEDIUM | MEDIUM | P2 |
| Item archiving | MEDIUM | LOW | P2 |
| Interactive TUI | HIGH | HIGH | P3 |
| Multi-user/teams | HIGH | HIGH | P3 |
| Card comments | MEDIUM | MEDIUM | P3 |
| Custom fields | MEDIUM | HIGH | P3 |
| Search across boards | MEDIUM | MEDIUM | P3 |

## Competitor Feature Analysis

| Feature | Trello | Linear | GitHub Projects | Taskwarrior (CLI) | Kanbambam Approach |
|---------|--------|--------|-----------------|-------------------|--------------------|
| Board view | Columns + cards, drag-and-drop | Kanban + list + timeline views | Table + board views | No board view (list only) | CLI: formatted column output + optional TUI. Web: Trello-style drag-and-drop |
| CLI access | None (API only, no official CLI) | None | `gh project` commands exist but limited | CLI-only, no GUI | CLI-first with full CRUD. This is our core differentiator vs Trello/Linear |
| AI agent friendly | No (requires API integration) | No | Partial (gh CLI is scriptable) | Yes (scriptable but arcane syntax) | Yes: JSON output, predictable grammar, designed for agents |
| Labels | Yes, colored | Yes (label system) | Yes (custom fields) | Tags (text only, no color) | Colored labels, CLI and web |
| Due dates | Yes | Yes (cycles, due dates) | Yes (date fields) | Yes (due/scheduled) | Yes, simple due date per item |
| WIP limits | No (Power-Up only) | No | No | No | Yes, built-in. Real Kanban practice |
| Auth | Email + OAuth | Email + OAuth + SSO | GitHub account | None (local files) | Email/password + browser flow for CLI |
| Offline | Limited | No | No | Yes (local files) | No (cloud-first by design) |
| Multi-user | Yes | Yes | Yes | No | v2 (single-user for v1) |
| Pricing | Freemium | Paid (free for small teams) | Free with GitHub | Free (OSS) | TBD -- likely freemium |
| Speed | Moderate (heavy web app) | Fast (optimized) | Slow (GitHub is slow) | Instant (local) | CLI: instant (thin client). Web: fast (focused scope) |

### Competitive Positioning Summary

Kanbambam occupies a unique niche: **the only Kanban tool that is both CLI-native and has a real web GUI**. Trello/Linear have no CLI. Taskwarrior has no GUI. GitHub Projects has a limited CLI. This dual-interface approach is the entire value proposition.

The AI agent angle is the growth lever. As AI-assisted development grows, tools that agents can operate directly (via CLI commands with JSON output) have an inherent advantage over GUI-only tools that require browser automation or API client libraries.

## Sources

- Training data knowledge of: Trello, Linear, Jira, Asana, GitHub Projects, Notion, Taskwarrior, kanban.bash, gh CLI
- Competitor feature pages (from training data, not live-verified)
- CLI UX patterns from: gh (GitHub CLI), railway, vercel, fly.io, supabase CLIs
- Note: Web search was unavailable during this research session. All findings are from training data (cutoff ~early 2025). Confidence is MEDIUM overall; specific feature lists for competitors may have evolved

---
*Feature research for: CLI-first Kanban board with web GUI*
*Researched: 2026-03-25*

# Feature Research

**Domain:** CLI-first Kanban board with web GUI
**Researched:** 2026-03-25
**Confidence:** MEDIUM (based on training data knowledge of Trello, Linear, Jira, GitHub Projects, taskwarrior, gh CLI -- no live web search available)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

#### Core Data Model

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Board CRUD | Fundamental unit of organization; every Kanban tool has boards | LOW | CLI: `kanbambam board create/list/show/delete` |
| Column CRUD with ordering | Columns define workflow stages; must be reorderable | LOW | CLI: `kanbambam column add/move/rename/remove` |
| Item CRUD | Cards/items are the atomic unit of work | LOW | CLI: `kanbambam item create/show/edit/delete` |
| Move items between columns | Core Kanban action -- drag in GUI, command in CLI | LOW | CLI: `kanbambam item move <id> --to <column>` |
| Item title and description | Every task tracker has at minimum title + description | LOW | Description supports markdown in web, plain text in CLI |
| Workspace hierarchy | Users expect to group boards; PROJECT.md specifies User > Workspace > Board > Column > Item | LOW | CLI: `kanbambam workspace create/list/switch` |
| Labels/tags on items | Color-coded categorization is universal in Kanban tools | LOW | CLI: `kanbambam item label add/remove`; Web: colored chips |
| Due dates on items | Time-based tracking is baseline expectation | LOW | CLI: `kanbambam item set-due <id> <date>` |
| User authentication | Must log in to access data | MEDIUM | Browser-based OAuth-style flow for CLI (like `gh auth login`) |
| Board view in CLI | Must be able to see the board state at a glance | MEDIUM | Formatted table/columns output in terminal; this IS the CLI experience |

#### CLI UX Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Help text for every command | Developers expect `--help` on all commands | LOW | Use commander.js or oclif built-in help generation |
| Consistent command grammar | `noun verb` or `verb noun` pattern, applied uniformly | LOW | Recommend: `kanbambam <resource> <action> [args] [flags]` like `gh` |
| JSON output mode | AI agents and scripts need parseable output | LOW | `--json` flag on all commands; critical for AI agent consumption |
| Human-readable default output | Terminal users expect formatted, colored output | LOW | Colored, aligned table output by default |
| Error messages with fix suggestions | Modern CLIs tell you what went wrong AND how to fix it | LOW | "Did you mean...?" and "Try: kanbambam board list" |
| Tab completion | Shell completion for commands and arguments | MEDIUM | Ship completion scripts for bash/zsh/fish |
| Aliases and short IDs | Nobody wants to type UUIDs; short numeric IDs or slugs | LOW | Auto-generate short IDs (e.g., `#42`) per board scope |
| Config persistence | Remember auth token, default workspace, output preferences | LOW | `~/.config/kanbambam/config.json` or XDG-compliant path |

#### Web GUI Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Drag-and-drop cards | THE defining Kanban web interaction; Trello made this the standard | MEDIUM | Use dnd-kit or similar React DnD library |
| Board column view | Visual columns with cards stacked vertically | LOW | Standard flexbox/grid layout |
| Card detail modal/panel | Click card to see full details, edit inline | MEDIUM | Side panel or modal with form fields |
| Responsive layout | Works on tablet/laptop screens at minimum | MEDIUM | Not mobile-app quality, but usable on smaller screens |
| Visual label colors | Colored tags on cards for quick scanning | LOW | Standard colored chip components |
| Loading states | Users expect feedback during API calls | LOW | Skeletons or spinners on board load |
| Login/signup flow | Standard email/password web forms | MEDIUM | Standard auth UI with form validation |

### Differentiators (Competitive Advantage)

Features that set Kanbambam apart from Trello/Linear/Jira AND from CLI-only tools like taskwarrior.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| CLI-web parity with real-time sync | The core value prop: same data, two interfaces, instant sync. No other Kanban tool does CLI-first with a real web GUI backed by the same API | LOW (architectural) | Not a feature to build, but a property of the architecture. Both clients hit the same REST API |
| AI-agent-friendly CLI | JSON output, predictable command grammar, scriptable -- designed so AI agents (Cursor, Claude, Copilot) can manage boards | LOW | `--json` output + consistent exit codes + machine-readable errors. The killer use case for CLI-first |
| Interactive TUI board view | Full terminal UI showing the board as columns with cards, navigable with arrow keys | HIGH | Use Ink (React for CLI) or blessed/neo-blessed. This is the "wow" moment in the terminal |
| Bulk operations in CLI | Move multiple items, batch label, bulk archive -- things that are tedious in web GUIs | MEDIUM | `kanbambam item move --filter "label:bug" --to done` |
| Pipe-friendly I/O | Accept input from stdin, output to stdout for Unix pipeline composition | LOW | `echo "Fix login bug" | kanbambam item create --board main` |
| Board templates | Pre-built column structures (Kanban, Scrum Sprint, Bug Triage) | LOW | Seed data for common workflows |
| Quick-add from CLI | One-liner to add an item without specifying every field | LOW | `kanbambam add "Fix the login bug"` -- infers board from context/config |
| Column WIP limits | Limit how many items can be in a column (core Kanban practice) | LOW | Warn on exceed, block optionally. Surprisingly few tools enforce this well |
| Keyboard shortcuts in web | Power-user web experience matching CLI speed | MEDIUM | `n` for new card, `m` for move, arrow keys to navigate |
| Activity log / history | See what changed, when, by whom (or by which interface) | MEDIUM | Log all mutations with source (CLI vs Web). Useful for debugging sync |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time WebSocket sync between web clients | "I want to see changes instantly" | Massive infrastructure complexity for a v1 single-user product. WebSockets need connection management, reconnection logic, state reconciliation. Single user means you are the only one making changes | Poll on focus/interval for v1. Add WebSockets in v2 when multi-user lands. The CLI-to-web sync is already handled by both hitting the same API |
| Offline/local-first mode | "Work without internet" | Conflict resolution is extremely hard. Two sources of truth = sync hell. PROJECT.md explicitly scopes this out | Cloud API is the single source of truth. CLI fails gracefully with clear error when offline |
| Custom fields on items | "I need a priority field / story points / custom dropdown" | Schema-per-user complexity, migration headaches, UI rendering complexity. Trello took years to ship this well | Use labels for categorization. Add structured custom fields in v2+ only if validated by user demand |
| Gantt charts / timeline view | "I want to see dates on a timeline" | Scope explosion, complex UI, moves away from Kanban simplicity into project management territory | Due dates on items + a simple "overdue" filter. Kanbambam is Kanban, not MS Project |
| File attachments on items | "I want to attach screenshots" | Blob storage, upload UX, preview rendering, storage costs. High complexity for marginal Kanban value | Link to external files (URLs in description). Attachment support can be v2+ |
| Markdown rendering in CLI | "Render my descriptions as rich text in terminal" | Terminal markdown rendering is janky, inconsistent across terminals, adds dependency weight | Show raw markdown in CLI (it reads fine). Web renders markdown properly |
| OAuth social login (Google, GitHub) | "Let me log in with Google" | Each OAuth provider is integration work, callback handling, account linking edge cases | Email/password for v1 (PROJECT.md decision). Add OAuth providers one at a time in v2 |
| Desktop notifications | "Notify me when a due date is approaching" | Requires persistent background process or OS-level integration. CLI tools should not be daemons | Web app can do browser notifications later. CLI is stateless by design |
| Plugin/extension system | "Let me customize with plugins" | Designing a stable plugin API before you know your own API is premature abstraction | Ship a good REST API. Third parties can build on that. Plugin system = v3+ |
| Card comments/discussion | "Let me comment on cards" | Comments imply multi-user, threading, notifications -- all complexity for a single-user v1 | Description field serves as notes for v1. Comments arrive with multi-user in v2 |

## Feature Dependencies

```
[Authentication]
    └──requires──> [User accounts & signup]
                       └──enables──> [Workspace CRUD]
                                        └──enables──> [Board CRUD]
                                                          └──enables──> [Column CRUD]
                                                                            └──enables──> [Item CRUD]
                                                                                             └──enables──> [Labels, Due Dates, Move]

[CLI Board View]
    └──requires──> [Item CRUD]
    └──requires──> [Column CRUD]
    └──requires──> [Human-readable output formatting]

[Interactive TUI]
    └──requires──> [CLI Board View]
    └──requires──> [Item Move]
    └──enhances──> [CLI Board View] (replaces static output with interactive)

[Web Drag-and-Drop]
    └──requires──> [Board CRUD]
    └──requires──> [Item Move API endpoint]

[JSON Output Mode]
    └──enhances──> [Every CLI command] (flag available on all)
    └──enables──> [AI Agent Integration]

[Bulk Operations]
    └──requires──> [Item CRUD]
    └──requires──> [Labels] (for filter-based bulk actions)

[Tab Completion]
    └──requires──> [Command structure finalized]
    └──enhances──> [Every CLI command]

[Column WIP Limits]
    └──requires──> [Column CRUD]
    └──requires──> [Item Move] (enforcement happens on move)

[Activity Log]
    └──requires──> [All mutation endpoints] (middleware/hook on every write)
```

### Dependency Notes

- **All resource CRUD requires Authentication:** No anonymous access; auth is the foundation layer
- **Workspace > Board > Column > Item hierarchy is strictly ordered:** Cannot build Item CRUD without Column CRUD existing first, etc.
- **Interactive TUI requires basic CLI to be stable:** TUI is an enhancement layer on top of working commands
- **Web drag-and-drop requires Item Move API:** The web GUI calls the same move endpoint the CLI does
- **Bulk Operations require Labels:** Filtering by label is the primary way to select items for bulk actions
- **Activity Log is cross-cutting:** Best implemented as API middleware, not per-feature

## MVP Definition

### Launch With (v1)

Minimum viable product -- what's needed to validate "CLI-first Kanban with web GUI" as a concept.

- [ ] **User auth with browser login flow** -- without auth, nothing works
- [ ] **Workspace/Board/Column/Item full CRUD via CLI** -- the entire data hierarchy, manageable from terminal
- [ ] **Move items between columns (CLI)** -- the core Kanban action
- [ ] **Labels and due dates on items** -- minimum useful metadata
- [ ] **Formatted CLI board view** -- see the board state in terminal (static table output, not TUI)
- [ ] **JSON output on all commands** -- AI agent compatibility from day one
- [ ] **REST API** -- shared backend for both interfaces
- [ ] **Web app with board view and drag-and-drop** -- the "other half" of the value prop
- [ ] **Web card detail editing** -- click to view/edit item details
- [ ] **Short IDs for items** -- usability essential for CLI (`#42` not `uuid-here`)

### Add After Validation (v1.x)

Features to add once the core loop is working and users are trying it.

- [ ] **Tab completion** -- ship once command structure is stable
- [ ] **Quick-add shortcut** -- `kanbambam add "task"` with smart defaults
- [ ] **Board templates** -- reduce friction for new boards
- [ ] **Column WIP limits** -- proper Kanban practice enforcement
- [ ] **Bulk operations** -- power-user CLI productivity
- [ ] **Pipe-friendly stdin** -- Unix composability
- [ ] **Keyboard shortcuts in web** -- power-user web speed
- [ ] **Item archiving** -- keep boards clean without deleting history
- [ ] **Activity log** -- see what changed and when

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Interactive TUI** -- high complexity, validate that CLI users actually want interactive mode vs. one-shot commands
- [ ] **Multi-user / team collaboration** -- PROJECT.md scopes this to v2
- [ ] **Card comments** -- arrives with multi-user
- [ ] **Custom fields** -- only if users demand structured metadata beyond labels
- [ ] **WebSocket real-time sync** -- only valuable with multi-user
- [ ] **OAuth social login** -- convenience, not essential
- [ ] **File attachments** -- link URLs in v1, real attachments in v2+
- [ ] **Search across boards** -- useful at scale, premature for v1
- [ ] **MCP server** -- PROJECT.md explicitly defers this; API exists so MCP wraps it later

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Auth (browser login flow) | HIGH | MEDIUM | P1 |
| Full CRUD hierarchy (CLI) | HIGH | MEDIUM | P1 |
| Item move between columns | HIGH | LOW | P1 |
| Labels and due dates | HIGH | LOW | P1 |
| CLI board view (formatted) | HIGH | MEDIUM | P1 |
| JSON output mode | HIGH | LOW | P1 |
| REST API backend | HIGH | HIGH | P1 |
| Web board + drag-and-drop | HIGH | HIGH | P1 |
| Web card detail panel | HIGH | MEDIUM | P1 |
| Short IDs | MEDIUM | LOW | P1 |
| Tab completion | MEDIUM | LOW | P2 |
| Quick-add shortcut | MEDIUM | LOW | P2 |
| Board templates | MEDIUM | LOW | P2 |
| WIP limits | MEDIUM | LOW | P2 |
| Bulk CLI operations | MEDIUM | MEDIUM | P2 |
| Keyboard shortcuts (web) | MEDIUM | MEDIUM | P2 |
| Activity log | MEDIUM | MEDIUM | P2 |
| Item archiving | MEDIUM | LOW | P2 |
| Interactive TUI | HIGH | HIGH | P3 |
| Multi-user/teams | HIGH | HIGH | P3 |
| Card comments | MEDIUM | MEDIUM | P3 |
| Custom fields | MEDIUM | HIGH | P3 |
| Search across boards | MEDIUM | MEDIUM | P3 |

## Competitor Feature Analysis

| Feature | Trello | Linear | GitHub Projects | Taskwarrior (CLI) | Kanbambam Approach |
|---------|--------|--------|-----------------|-------------------|--------------------|
| Board view | Columns + cards, drag-and-drop | Kanban + list + timeline views | Table + board views | No board view (list only) | CLI: formatted column output + optional TUI. Web: Trello-style drag-and-drop |
| CLI access | None (API only, no official CLI) | None | `gh project` commands exist but limited | CLI-only, no GUI | CLI-first with full CRUD. This is our core differentiator vs Trello/Linear |
| AI agent friendly | No (requires API integration) | No | Partial (gh CLI is scriptable) | Yes (scriptable but arcane syntax) | Yes: JSON output, predictable grammar, designed for agents |
| Labels | Yes, colored | Yes (label system) | Yes (custom fields) | Tags (text only, no color) | Colored labels, CLI and web |
| Due dates | Yes | Yes (cycles, due dates) | Yes (date fields) | Yes (due/scheduled) | Yes, simple due date per item |
| WIP limits | No (Power-Up only) | No | No | No | Yes, built-in. Real Kanban practice |
| Auth | Email + OAuth | Email + OAuth + SSO | GitHub account | None (local files) | Email/password + browser flow for CLI |
| Offline | Limited | No | No | Yes (local files) | No (cloud-first by design) |
| Multi-user | Yes | Yes | Yes | No | v2 (single-user for v1) |
| Speed | Moderate (heavy web app) | Fast (optimized) | Slow (GitHub is slow) | Instant (local) | CLI: instant (thin client). Web: fast (focused scope) |

### Competitive Positioning Summary

Kanbambam occupies a unique niche: **the only Kanban tool that is both CLI-native and has a real web GUI**. Trello/Linear have no CLI. Taskwarrior has no GUI. GitHub Projects has a limited CLI. This dual-interface approach is the entire value proposition.

The AI agent angle is the growth lever. As AI-assisted development grows, tools that agents can operate directly (via CLI commands with JSON output) have an inherent advantage over GUI-only tools that require browser automation or API client libraries.

## Sources

- Training data knowledge of: Trello, Linear, Jira, Asana, GitHub Projects, Notion, Taskwarrior, kanban.bash, gh CLI
- Competitor feature pages (from training data, not live-verified)
- CLI UX patterns from: gh (GitHub CLI), railway, vercel, fly.io, supabase CLIs
- Note: Web search was unavailable during this research session. All findings are from training data (cutoff ~early 2025). Confidence is MEDIUM overall; specific feature lists for competitors may have evolved

---
*Feature research for: CLI-first Kanban board with web GUI*
*Researched: 2026-03-25*

# Feature Research

**Domain:** CLI-first Kanban board with web GUI
**Researched:** 2026-03-25
**Confidence:** MEDIUM (based on training data knowledge of Trello, Linear, Jira, GitHub Projects, taskwarrior, gh CLI -- no live web search available)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

#### Core Data Model

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Board CRUD | Fundamental unit of organization; every Kanban tool has boards | LOW | CLI: `kanbambam board create/list/show/delete` |
| Column CRUD with ordering | Columns define workflow stages; must be reorderable | LOW | CLI: `kanbambam column add/move/rename/remove` |
| Item CRUD | Cards/items are the atomic unit of work | LOW | CLI: `kanbambam item create/show/edit/delete` |
| Move items between columns | Core Kanban action -- drag in GUI, command in CLI | LOW | CLI: `kanbambam item move <id> --to <column>` |
| Item title and description | Every task tracker has at minimum title + description | LOW | Description supports markdown in web, plain text in CLI |
| Workspace hierarchy | Users expect to group boards; PROJECT.md specifies User > Workspace > Board > Column > Item | LOW | CLI: `kanbambam workspace create/list/switch` |
| Labels/tags on items | Color-coded categorization is universal in Kanban tools | LOW | CLI: `kanbambam item label add/remove`; Web: colored chips |
| Due dates on items | Time-based tracking is baseline expectation | LOW | CLI: `kanbambam item set-due <id> <date>` |
| User authentication | Must log in to access data | MEDIUM | Browser-based OAuth-style flow for CLI (like `gh auth login`) |
| Board view in CLI | Must be able to see the board state at a glance | MEDIUM | Formatted table/columns output in terminal; this IS the CLI experience |

#### CLI UX Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Help text for every command | Developers expect `--help` on all commands | LOW | Use commander.js or oclif built-in help generation |
| Consistent command grammar | `noun verb` or `verb noun` pattern, applied uniformly | LOW | Recommend: `kanbambam <resource> <action> [args] [flags]` like `gh` |
| JSON output mode | AI agents and scripts need parseable output | LOW | `--json` flag on all commands; critical for AI agent consumption |
| Human-readable default output | Terminal users expect formatted, colored output | LOW | Colored, aligned table output by default |
| Error messages with fix suggestions | Modern CLIs tell you what went wrong AND how to fix it | LOW | "Did you mean...?" and "Try: kanbambam board list" |
| Tab completion | Shell completion for commands and arguments | MEDIUM | Ship completion scripts for bash/zsh/fish |
| Aliases and short IDs | Nobody wants to type UUIDs; short numeric IDs or slugs | LOW | Auto-generate short IDs (e.g., `#42`) per board scope |
| Config persistence | Remember auth token, default workspace, output preferences | LOW | `~/.config/kanbambam/config.json` or XDG-compliant path |

#### Web GUI Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Drag-and-drop cards | THE defining Kanban web interaction; Trello made this the standard | MEDIUM | Use dnd-kit or similar React DnD library |
| Board column view | Visual columns with cards stacked vertically | LOW | Standard flexbox/grid layout |
| Card detail modal/panel | Click card to see full details, edit inline | MEDIUM | Side panel or modal with form fields |
| Responsive layout | Works on tablet/laptop screens at minimum | MEDIUM | Not mobile-app quality, but usable on smaller screens |
| Visual label colors | Colored tags on cards for quick scanning | LOW | Standard colored chip components |
| Loading states | Users expect feedback during API calls | LOW | Skeletons or spinners on board load |
| Login/signup flow | Standard email/password web forms | MEDIUM | Standard auth UI with form validation |

### Differentiators (Competitive Advantage)

Features that set Kanbambam apart from Trello/Linear/Jira AND from CLI-only tools like taskwarrior.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| CLI-web parity with real-time sync | The core value prop: same data, two interfaces, instant sync. No other Kanban tool does CLI-first with a real web GUI backed by the same API | LOW (architectural) | Not a feature to build, but a property of the architecture. Both clients hit the same REST API |
| AI-agent-friendly CLI | JSON output, predictable command grammar, scriptable -- designed so AI agents (Cursor, Claude, Copilot) can manage boards | LOW | `--json` output + consistent exit codes + machine-readable errors. The killer use case for CLI-first |
| Interactive TUI board view | Full terminal UI showing the board as columns with cards, navigable with arrow keys | HIGH | Use Ink (React for CLI) or blessed/neo-blessed. This is the "wow" moment in the terminal |
| Bulk operations in CLI | Move multiple items, batch label, bulk archive -- things that are tedious in web GUIs | MEDIUM | `kanbambam item move --filter "label:bug" --to done` |
| Pipe-friendly I/O | Accept input from stdin, output to stdout for Unix pipeline composition | LOW | `echo "Fix login bug" | kanbambam item create --board main` |
| Board templates | Pre-built column structures (Kanban, Scrum Sprint, Bug Triage) | LOW | Seed data for common workflows |
| Quick-add from CLI | One-liner to add an item without specifying every field | LOW | `kanbambam add "Fix the login bug"` -- infers board from context/config |
| Column WIP limits | Limit how many items can be in a column (core Kanban practice) | LOW | Warn on exceed, block optionally. Surprisingly few tools enforce this well |
| Keyboard shortcuts in web | Power-user web experience matching CLI speed | MEDIUM | `n` for new card, `m` for move, arrow keys to navigate |
| Activity log / history | See what changed, when, by whom (or by which interface) | MEDIUM | Log all mutations with source (CLI vs Web). Useful for debugging sync |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time WebSocket sync between web clients | "I want to see changes instantly" | Massive infrastructure complexity for a v1 single-user product. WebSockets need connection management, reconnection logic, state reconciliation. Single user means you are the only one making changes | Poll on focus/interval for v1. Add WebSockets in v2 when multi-user lands. The CLI-to-web sync is already handled by both hitting the same API |
| Offline/local-first mode | "Work without internet" | Conflict resolution is extremely hard. Two sources of truth = sync hell. PROJECT.md explicitly scopes this out | Cloud API is the single source of truth. CLI fails gracefully with clear error when offline |
| Custom fields on items | "I need a priority field / story points / custom dropdown" | Schema-per-user complexity, migration headaches, UI rendering complexity. Trello took years to ship this well | Use labels for categorization. Add structured custom fields in v2+ only if validated by user demand |
| Gantt charts / timeline view | "I want to see dates on a timeline" | Scope explosion, complex UI, moves away from Kanban simplicity into project management territory | Due dates on items + a simple "overdue" filter. Kanbambam is Kanban, not MS Project |
| File attachments on items | "I want to attach screenshots" | Blob storage, upload UX, preview rendering, storage costs. High complexity for marginal Kanban value | Link to external files (URLs in description). Attachment support can be v2+ |
| Markdown rendering in CLI | "Render my descriptions as rich text in terminal" | Terminal markdown rendering is janky, inconsistent across terminals, adds dependency weight | Show raw markdown in CLI (it reads fine). Web renders markdown properly |
| OAuth social login (Google, GitHub) | "Let me log in with Google" | Each OAuth provider is integration work, callback handling, account linking edge cases | Email/password for v1 (PROJECT.md decision). Add OAuth providers one at a time in v2 |
| Desktop notifications | "Notify me when a due date is approaching" | Requires persistent background process or OS-level integration. CLI tools should not be daemons | Web app can do browser notifications later. CLI is stateless by design |
| Plugin/extension system | "Let me customize with plugins" | Designing a stable plugin API before you know your own API is premature abstraction | Ship a good REST API. Third parties can build on that. Plugin system = v3+ |
| Card comments/discussion | "Let me comment on cards" | Comments imply multi-user, threading, notifications -- all complexity for a single-user v1 | Description field serves as notes for v1. Comments arrive with multi-user in v2 |

## Feature Dependencies

```
[Authentication]
    └──requires──> [User accounts & signup]
                       └──enables──> [Workspace CRUD]
                                        └──enables──> [Board CRUD]
                                                          └──enables──> [Column CRUD]
                                                                            └──enables──> [Item CRUD]
                                                                                             └──enables──> [Labels, Due Dates, Move]

[CLI Board View]
    └──requires──> [Item CRUD]
    └──requires──> [Column CRUD]
    └──requires──> [Human-readable output formatting]

[Interactive TUI]
    └──requires──> [CLI Board View]
    └──requires──> [Item Move]
    └──enhances──> [CLI Board View] (replaces static output with interactive)

[Web Drag-and-Drop]
    └──requires──> [Board CRUD]
    └──requires──> [Item Move API endpoint]

[JSON Output Mode]
    └──enhances──> [Every CLI command] (flag available on all)
    └──enables──> [AI Agent Integration]

[Bulk Operations]
    └──requires──> [Item CRUD]
    └──requires──> [Labels] (for filter-based bulk actions)

[Tab Completion]
    └──requires──> [Command structure finalized]
    └──enhances──> [Every CLI command]

[Column WIP Limits]
    └──requires──> [Column CRUD]
    └──requires──> [Item Move] (enforcement happens on move)

[Activity Log]
    └──requires──> [All mutation endpoints] (middleware/hook on every write)
```

### Dependency Notes

- **All resource CRUD requires Authentication:** No anonymous access; auth is the foundation layer
- **Workspace > Board > Column > Item hierarchy is strictly ordered:** Cannot build Item CRUD without Column CRUD existing first, etc.
- **Interactive TUI requires basic CLI to be stable:** TUI is an enhancement layer on top of working commands
- **Web drag-and-drop requires Item Move API:** The web GUI calls the same move endpoint the CLI does
- **Bulk Operations require Labels:** Filtering by label is the primary way to select items for bulk actions
- **Activity Log is cross-cutting:** Best implemented as API middleware, not per-feature

## MVP Definition

### Launch With (v1)

Minimum viable product -- what's needed to validate "CLI-first Kanban with web GUI" as a concept.

- [ ] **User auth with browser login flow** -- without auth, nothing works
- [ ] **Workspace/Board/Column/Item full CRUD via CLI** -- the entire data hierarchy, manageable from terminal
- [ ] **Move items between columns (CLI)** -- the core Kanban action
- [ ] **Labels and due dates on items** -- minimum useful metadata
- [ ] **Formatted CLI board view** -- see the board state in terminal (static table output, not TUI)
- [ ] **JSON output on all commands** -- AI agent compatibility from day one
- [ ] **REST API** -- shared backend for both interfaces
- [ ] **Web app with board view and drag-and-drop** -- the "other half" of the value prop
- [ ] **Web card detail editing** -- click to view/edit item details
- [ ] **Short IDs for items** -- usability essential for CLI (`#42` not `uuid-here`)

### Add After Validation (v1.x)

Features to add once the core loop is working and users are trying it.

- [ ] **Tab completion** -- ship once command structure is stable
- [ ] **Quick-add shortcut** -- `kanbambam add "task"` with smart defaults
- [ ] **Board templates** -- reduce friction for new boards
- [ ] **Column WIP limits** -- proper Kanban practice enforcement
- [ ] **Bulk operations** -- power-user CLI productivity
- [ ] **Pipe-friendly stdin** -- Unix composability
- [ ] **Keyboard shortcuts in web** -- power-user web speed
- [ ] **Item archiving** -- keep boards clean without deleting history
- [ ] **Activity log** -- see what changed and when

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Interactive TUI** -- high complexity, validate that CLI users actually want interactive mode vs. one-shot commands
- [ ] **Multi-user / team collaboration** -- PROJECT.md scopes this to v2
- [ ] **Card comments** -- arrives with multi-user
- [ ] **Custom fields** -- only if users demand structured metadata beyond labels
- [ ] **WebSocket real-time sync** -- only valuable with multi-user
- [ ] **OAuth social login** -- convenience, not essential
- [ ] **File attachments** -- link URLs in v1, real attachments in v2+
- [ ] **Search across boards** -- useful at scale, premature for v1
- [ ] **MCP server** -- PROJECT.md explicitly defers this; API exists so MCP wraps it later

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Auth (browser login flow) | HIGH | MEDIUM | P1 |
| Full CRUD hierarchy (CLI) | HIGH | MEDIUM | P1 |
| Item move between columns | HIGH | LOW | P1 |
| Labels and due dates | HIGH | LOW | P1 |
| CLI board view (formatted) | HIGH | MEDIUM | P1 |
| JSON output mode | HIGH | LOW | P1 |
| REST API backend | HIGH | HIGH | P1 |
| Web board + drag-and-drop | HIGH | HIGH | P1 |
| Web card detail panel | HIGH | MEDIUM | P1 |
| Short IDs | MEDIUM | LOW | P1 |
| Tab completion | MEDIUM | LOW | P2 |
| Quick-add shortcut | MEDIUM | LOW | P2 |
| Board templates | MEDIUM | LOW | P2 |
| WIP limits | MEDIUM | LOW | P2 |
| Bulk CLI operations | MEDIUM | MEDIUM | P2 |
| Keyboard shortcuts (web) | MEDIUM | MEDIUM | P2 |
| Activity log | MEDIUM | MEDIUM | P2 |
| Item archiving | MEDIUM | LOW | P2 |
| Interactive TUI | HIGH | HIGH | P3 |
| Multi-user/teams | HIGH | HIGH | P3 |
| Card comments | MEDIUM | MEDIUM | P3 |
| Custom fields | MEDIUM | HIGH | P3 |
| Search across boards | MEDIUM | MEDIUM | P3 |

## Competitor Feature Analysis

| Feature | Trello | Linear | GitHub Projects | Taskwarrior (CLI) | Kanbambam Approach |
|---------|--------|--------|-----------------|-------------------|--------------------|
| Board view | Columns + cards, drag-and-drop | Kanban + list + timeline views | Table + board views | No board view (list only) | CLI: formatted column output + optional TUI. Web: Trello-style drag-and-drop |
| CLI access | None (API only, no official CLI) | None | `gh project` commands exist but limited | CLI-only, no GUI | CLI-first with full CRUD. This is our core differentiator vs Trello/Linear |
| AI agent friendly | No (requires API integration) | No | Partial (gh CLI is scriptable) | Yes (scriptable but arcane syntax) | Yes: JSON output, predictable grammar, designed for agents |
| Labels | Yes, colored | Yes (label system) | Yes (custom fields) | Tags (text only, no color) | Colored labels, CLI and web |
| Due dates | Yes | Yes (cycles, due dates) | Yes (date fields) | Yes (due/scheduled) | Yes, simple due date per item |
| WIP limits | No (Power-Up only) | No | No | No | Yes, built-in. Real Kanban practice |
| Auth | Email + OAuth | Email + OAuth + SSO | GitHub account | None (local files) | Email/password + browser flow for CLI |
| Offline | Limited | No | No | Yes (local files) | No (cloud-first by design) |
| Multi-user | Yes | Yes | Yes | No | v2 (single-user for v1) |
| Speed | Moderate (heavy web app) | Fast (optimized) | Slow (GitHub is slow) | Instant (local) | CLI: instant (thin client). Web: fast (focused scope) |

### Competitive Positioning Summary

Kanbambam occupies a unique niche: **the only Kanban tool that is both CLI-native and has a real web GUI**. Trello/Linear have no CLI. Taskwarrior has no GUI. GitHub Projects has a limited CLI. This dual-interface approach is the entire value proposition.

The AI agent angle is the growth lever. As AI-assisted development grows, tools that agents can operate directly (via CLI commands with JSON output) have an inherent advantage over GUI-only tools that require browser automation or API client libraries.

## Sources

- Training data knowledge of: Trello, Linear, Jira, Asana, GitHub Projects, Notion, Taskwarrior, kanban.bash, gh CLI
- Competitor feature pages (from training data, not live-verified)
- CLI UX patterns from: gh (GitHub CLI), railway, vercel, fly.io, supabase CLIs
- Note: Web search was unavailable during this research session. All findings are from training data (cutoff ~early 2025). Confidence is MEDIUM overall; specific feature lists for competitors may have evolved

---
*Feature research for: CLI-first Kanban board with web GUI*
*Researched: 2026-03-25*

