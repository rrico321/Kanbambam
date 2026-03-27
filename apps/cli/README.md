# kanbambam

CLI-first Kanban board management. Create and manage boards, columns, and items from your terminal.

Syncs with the [Kanbambam web app](https://kanbambam.vercel.app) — one source of truth, two ways to interact.

## Install

```bash
npm install -g kanbambam
```

Requires Node.js >= 20.

## Quick Start

```bash
# Log in (opens browser)
kanbambam auth login

# List workspaces
kanbambam workspace list

# Set active context so you don't have to pass IDs every time
kanbambam context set --workspace <id>
kanbambam context set --board <id>

# View your board
kanbambam board view
```

## Commands

### Auth

```bash
kanbambam auth login          # Log in via browser
kanbambam auth login --manual # Manual token entry (headless environments)
kanbambam auth logout         # Log out and revoke session
kanbambam auth status         # Show current auth status
```

### Workspaces

```bash
kanbambam workspace create "My Project"
kanbambam workspace list
kanbambam workspace rename <id> --name "New Name"
kanbambam workspace delete <id> [--force]
```

### Boards

```bash
kanbambam board create "Sprint 1"              # Creates with default columns: To Do, In Progress, Done
kanbambam board list
kanbambam board view                           # Kanban view of current board
kanbambam board rename <id> --name "Sprint 2"
kanbambam board delete <id> [--force]
```

### Columns

```bash
kanbambam column add "Code Review"
kanbambam column rename <id> --name "QA"
kanbambam column reorder <id> --position 3
kanbambam column delete <id> [--force]
kanbambam column delete <id> --move-to <column-id>   # Relocate items before deleting
```

### Items

```bash
# Create
kanbambam item create "Fix login bug" --column <id> --description "Tokens not persisting"

# Read
kanbambam item list --column <id>
kanbambam item show <id>

# Update
kanbambam item edit <id> --title "New title"
kanbambam item edit <id> --description "Updated description"
kanbambam item edit <id> --label backend --label high-priority
kanbambam item edit <id> --due-date 2026-04-01
kanbambam item edit <id> --due-date ""           # Clear due date

# Move & reorder
kanbambam item move <id> --to <column-id>
kanbambam item reorder <id> --position 1

# Delete
kanbambam item delete <id> [--force]
```

## Context

Set active workspace and board to avoid passing IDs with every command:

```bash
kanbambam context set --workspace <id>
kanbambam context set --board <id>
kanbambam context set --workspace <id> --board <id>
kanbambam context clear
```

Most commands accept `--workspace` or `--board` flags to override context for a single call.

## JSON Output

Pass `--json` to any command for machine-readable output:

```bash
kanbambam workspace list --json
kanbambam board view --json
kanbambam item show <id> --json
```

All JSON output follows the API envelope format: `{ "data": ..., "meta": ... }`.

## AI Agent Usage

Kanbambam is designed to work with AI coding agents. Use `--json` for structured output and `--force` to skip interactive confirmations:

```bash
# Non-interactive workflow
kanbambam auth login --manual
kanbambam workspace list --json
kanbambam item create "Task from agent" --column <id> --json
kanbambam item delete <id> --force --json
```

## Links

- **Web App:** [kanbambam.vercel.app](https://kanbambam.vercel.app)
- **GitHub:** [github.com/rrico321/Kanbambam](https://github.com/rrico321/Kanbambam)

## License

MIT
