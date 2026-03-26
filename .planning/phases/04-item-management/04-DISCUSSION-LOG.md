# Phase 4: Item Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 04-item-management
**Areas discussed:** Item display & board view, Label system design, Due date UX, Item editing workflow

---

## Item Display & Board View

### Item list format

| Option | Description | Selected |
|--------|-------------|----------|
| Simple table | Bordered table with ID, Title, Labels, Due Date — consistent with Phase 3 | ✓ |
| Mini board view | Columns side-by-side with items stacked — compact Kanban in terminal | |
| Detailed list | One item per block with description preview, labels, due date | |

**User's choice:** Simple table
**Notes:** Consistency with workspace/board/column list commands was the deciding factor.

### Board view command

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, kanbambam board view | Dedicated command showing columns side-by-side with items | ✓ |
| Not in this phase | Defer board view to polish phase or v2 | |
| Simple board summary | Column names with item counts only | |

**User's choice:** Yes, kanbambam board view
**Notes:** User wants the signature Kanban terminal experience in this phase.

### Board view layout

| Option | Description | Selected |
|--------|-------------|----------|
| Side-by-side columns | Classic Kanban layout, columns rendered horizontally | ✓ |
| Vertical stacked columns | Each column as a section with items listed below | |

**User's choice:** Side-by-side columns
**Notes:** Classic Kanban layout selected. Terminal width truncation accepted.

---

## Label System Design

### Label input format

| Option | Description | Selected |
|--------|-------------|----------|
| Free-text tags | Simple strings via --label flag, comma-separated display | ✓ |
| Color:name pairs | Labels with color prefix (red:bug), displayed with terminal colors | |
| Predefined palette | Fixed color set, auto-assigned per board | |

**User's choice:** Free-text tags
**Notes:** Simplest approach, no color mapping needed.

### Label management

| Option | Description | Selected |
|--------|-------------|----------|
| Replace all | --label sets full list each time, matches API PATCH semantics | ✓ |
| Add/remove flags | --add-label and --remove-label for incremental changes | |

**User's choice:** Replace all
**Notes:** Matches API behavior (PATCH with labels array). Simpler implementation.

---

## Due Date UX

### Date format

| Option | Description | Selected |
|--------|-------------|----------|
| ISO date strings | --due-date 2026-04-01, simple and unambiguous | ✓ |
| Natural language | --due-date tomorrow, requires date parsing library | |
| Both ISO and relative | ISO dates plus +3d, +1w shorthand | |

**User's choice:** ISO date strings
**Notes:** No extra dependencies needed.

### Overdue display

| Option | Description | Selected |
|--------|-------------|----------|
| Red due date text | Red when past due, yellow when due today | ✓ |
| No special formatting | Show date as-is | |
| Overdue badge | Add 'OVERDUE' text badge | |

**User's choice:** Red due date text
**Notes:** Subtle visual cue preferred over prominent badge.

---

## Item Editing Workflow

### Description editing

| Option | Description | Selected |
|--------|-------------|----------|
| Inline flag | --description 'text', simple and scriptable | ✓ |
| Open $EDITOR | Opens vim/nano with current description | |
| Stdin pipe | Read from stdin for scripted input | |

**User's choice:** Inline flag
**Notes:** Consistent with label and due date flag patterns.

### Item show command

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, item show | Full detail view: title, description, labels, due date, column, timestamps | ✓ |
| No, just --json | Use item list --json and filter | |

**User's choice:** Yes, item show
**Notes:** Dedicated command for viewing full item details.

---

## Claude's Discretion

- Board view Ink component architecture and terminal width handling
- Item show layout and formatting
- How item edit combines multiple flags in one PATCH call
- Error handling for invalid date formats
- Column resolution for item commands
- Board view plain-text fallback for non-TTY
- Test structure following established mock patterns

## Deferred Ideas

None — discussion stayed within phase scope
