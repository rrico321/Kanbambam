# Phase 5: Web App - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 05-web-app
**Areas discussed:** Board layout & card design, Drag-and-drop behavior, Inline editing experience, Navigation & app shell

---

## Board Layout & Card Design

### Column Layout
| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal scroll | Fixed-width columns, board scrolls horizontally. Classic Trello. | ✓ |
| Responsive columns | Columns shrink/wrap on small screens. More mobile-friendly. | |
| You decide | Claude picks best approach | |

**User's choice:** Horizontal scroll
**Notes:** None

### Card Information Density
| Option | Description | Selected |
|--------|-------------|----------|
| Title + metadata badges | Title, colored label chips, due date with overdue color, description indicator | ✓ |
| Title only, minimal | Just title on each card | |
| Title + full preview | Title, description snippet, all labels, due date, timestamps | |

**User's choice:** Title + metadata badges
**Notes:** None

### Card Badges Detail
| Option | Description | Selected |
|--------|-------------|----------|
| Labels + due date + description icon | Small indicator when description exists, colored chips, due date coloring | ✓ |
| Labels + due date only | Skip description indicator | |
| You decide | Claude picks based on Trello patterns | |

**User's choice:** Labels + due date + description icon
**Notes:** None

### Column Headers
| Option | Description | Selected |
|--------|-------------|----------|
| Name + item count + add button | Column name, count badge, plus icon for new item | ✓ |
| Name only, add from modal | Clean headers, adding items via separate flow | |
| You decide | Claude picks standard pattern | |

**User's choice:** Name + item count + add button
**Notes:** None

### Visual Style
| Option | Description | Selected |
|--------|-------------|----------|
| Light and clean | Light gray background, white cards, subtle shadow | ✓ |
| Dark mode default | Dark background, dark cards | |
| You decide | Claude picks based on existing setup | |

**User's choice:** Light and clean
**Notes:** User specified "both Light and Dark mode" — wants both themes, not just light.

### Label Colors
| Option | Description | Selected |
|--------|-------------|----------|
| Predefined palette | Fixed 6-8 colors (red, orange, yellow, green, blue, purple, pink, gray) | ✓ |
| Free text labels, auto-colored | Labels auto-get colors by hash | |
| You decide | Claude picks | |

**User's choice:** Predefined palette
**Notes:** None

### Dark Mode Approach
| Option | Description | Selected |
|--------|-------------|----------|
| System preference + manual toggle | Default follows OS, toggle to override | ✓ |
| Manual toggle only | Starts light, click to switch | |
| System preference only | No toggle, always matches OS | |

**User's choice:** System preference + manual toggle
**Notes:** None

---

## Drag-and-Drop Behavior

### Drag Visual Feedback
| Option | Description | Selected |
|--------|-------------|----------|
| Ghost card + drop placeholder | Semi-transparent drag, colored line at drop target | ✓ |
| Card lifts with shadow | Larger shadow, other cards animate to make space | |
| You decide | Claude picks best @dnd-kit approach | |

**User's choice:** Ghost card + drop placeholder
**Notes:** None

### Save Timing
| Option | Description | Selected |
|--------|-------------|----------|
| Optimistic immediate save | Drop fires API immediately, rollback on error | ✓ |
| Debounced save | Save after delay, coalescing rapid moves | |
| You decide | Claude picks based on TanStack Query patterns | |

**User's choice:** Optimistic immediate save
**Notes:** None

---

## Inline Editing Experience

### Edit Access Pattern
| Option | Description | Selected |
|--------|-------------|----------|
| Click opens modal/dialog | Centered modal, dimmed background, all fields editable | ✓ |
| Side panel slides in | Right-side panel, board stays visible | |
| Inline expand in column | Card expands in-place | |

**User's choice:** Click opens modal/dialog
**Notes:** None

### Field Editing
| Option | Description | Selected |
|--------|-------------|----------|
| Click-to-edit fields | Fields display as text, click to edit, save on blur/Enter | ✓ |
| Always-editable form | All fields always in edit mode, explicit save button | |
| You decide | Claude picks | |

**User's choice:** Click-to-edit fields
**Notes:** None

### Label Editing
| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown picker from predefined palette | Click Labels to open dropdown with colors, toggle add/remove | ✓ |
| Type to add, click to remove | Free-text input, auto-colored from palette | |
| You decide | Claude picks | |

**User's choice:** Dropdown picker from predefined palette
**Notes:** None

### Due Date Editing
| Option | Description | Selected |
|--------|-------------|----------|
| Date picker popup | Calendar popup, clear button to remove | ✓ |
| Text input with format hint | Type YYYY-MM-DD directly | |
| You decide | Claude picks | |

**User's choice:** Date picker popup
**Notes:** None

---

## Navigation & App Shell

### Navigation Pattern
| Option | Description | Selected |
|--------|-------------|----------|
| Left sidebar with workspace/board tree | Collapsible, workspaces as sections, boards listed. Linear/Notion style. | ✓ |
| Top nav with dropdown | Workspace dropdown in header, board tabs below | |
| You decide | Claude picks | |

**User's choice:** Left sidebar with workspace/board tree
**Notes:** None

### Landing Page
| Option | Description | Selected |
|--------|-------------|----------|
| Last visited board | Redirect to most recent board, first login shows workspace list | ✓ |
| Workspace overview / dashboard | Show all workspaces with boards listed | |
| You decide | Claude picks | |

**User's choice:** Last visited board
**Notes:** None

### Web CRUD Scope
| Option | Description | Selected |
|--------|-------------|----------|
| Full CRUD in web | Create/rename/delete all entities from web. Full CLI parity. | ✓ |
| Read + item edit only | Web is read-only for structure, CLI for CRUD | |
| You decide | Claude picks | |

**User's choice:** Full CRUD in web
**Notes:** None

### Sidebar Collapsibility
| Option | Description | Selected |
|--------|-------------|----------|
| Collapsible with toggle | Toggle button to collapse/expand sidebar | ✓ |
| Always visible | Sidebar always shown | |
| You decide | Claude picks | |

**User's choice:** Collapsible with toggle
**Notes:** None

---

## Claude's Discretion

- @dnd-kit configuration and sensor setup
- TanStack Query cache strategy for optimistic updates
- Component architecture and file organization
- Date picker library selection
- Dark mode implementation approach
- Sidebar state persistence
- URL structure for routes
- Empty state designs
- Error handling and toast notifications
- Loading skeleton patterns

## Deferred Ideas

None — discussion stayed within phase scope
