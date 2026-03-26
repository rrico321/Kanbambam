# Phase 3: Core Kanban CLI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 03-core-kanban-cli
**Areas discussed:** Command structure, Context system, Output formatting, Column deletion UX

---

## Command Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Resource subcommands | kanbambam workspace/board/column <action> — groups by entity | ✓ |
| Short aliases + full commands | ws/bd/col aliases for power users | |
| Flat action-first | kanbambam create workspace — action comes first | |

**User's choice:** Resource subcommands
**Notes:** Consistent with existing `kanbambam auth` pattern.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Name as positional, ID as positional | Create takes name positional, rename/delete take ID positional | ✓ |
| Everything as flags | All via --name, --id flags | |

**User's choice:** Positional arguments for names and IDs
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm with --force to skip | Prompts "Are you sure?" by default, --force/-f skips | ✓ |
| No confirmation, just delete | Immediate hard delete | |
| You decide | Claude's discretion | |

**User's choice:** Confirm with --force to skip
**Notes:** None

---

## Context System

| Option | Description | Selected |
|--------|-------------|----------|
| Implicit from context, explicit overrides | Commands use context automatically, flags override | ✓ |
| Always require explicit flags | Context for display only | |
| Interactive prompt when missing | Prompt to pick from list | |

**User's choice:** Implicit context with explicit overrides
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, auto-set parent | Setting board also sets workspace | ✓ |
| No, independent | Must set both separately | |
| You decide | Claude's discretion | |

**User's choice:** Auto-set parent workspace when setting board
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Show active context with names | Display workspace/board names + IDs | ✓ |
| You decide | Claude's discretion | |

**User's choice:** Show active context with names and IDs
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Persist across sessions | Store in conf, survives terminal close | ✓ |
| Session-only (env var) | Lost when shell closes | |
| You decide | Claude's discretion | |

**User's choice:** Persist across sessions via conf
**Notes:** Same storage mechanism as auth tokens.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Store name alongside ID | Cache both in conf, fast display | ✓ |
| Fetch name from API each time | Always accurate but adds latency | |
| You decide | Claude's discretion | |

**User's choice:** Store name alongside ID in conf
**Notes:** Acceptable if name goes stale after rename elsewhere.

---

## Output Formatting

| Option | Description | Selected |
|--------|-------------|----------|
| Clean table with Ink | Bordered table with Box + Text components | ✓ |
| Compact list (no borders) | Simple aligned text, ls-style | |
| You decide | Claude's discretion | |

**User's choice:** Clean table with Ink (initially chose compact, then revisited and chose bordered table)
**Notes:** User asked to go back to this question and changed their selection.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Short confirmation with entity details | One-line success with name and ID, green text | ✓ |
| Verbose with details block | Multi-line showing all fields | |
| You decide | Claude's discretion | |

**User's choice:** Short confirmation with entity details
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Helpful hint message | Dim message with create command suggestion | ✓ |
| Just empty output | Nothing or count only | |
| You decide | Claude's discretion | |

**User's choice:** Helpful hint message for empty states
**Notes:** None

---

## Column Deletion UX

| Option | Description | Selected |
|--------|-------------|----------|
| Require --move-to or delete items | Require --move-to col_xxx OR --force to delete items | ✓ |
| Always prompt interactively | Ask user to pick target column | |
| Auto-move to first column | Move items to first remaining column | |

**User's choice:** Require --move-to or --force
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Numeric position | --position N (1-based index) | ✓ |
| Relative (--before/--after) | Move relative to another column | |
| You decide | Claude's discretion | |

**User's choice:** Numeric position for column reordering
**Notes:** None

---

## Claude's Discretion

- Ink component architecture for tables and output rendering
- Error display format and error code handling
- API client helper methods for CRUD operations
- Command registration and lazy loading patterns
- Test structure and mocking approach
- Fractional indexing translation from position N

## Deferred Ideas

None — discussion stayed within phase scope
