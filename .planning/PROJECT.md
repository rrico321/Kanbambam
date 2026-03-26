# Kanbambam

## What This Is

A CLI-first Kanban board product. Users manage boards, columns, and cards entirely through terminal commands — designed to be used by humans and AI agents alike. A Trello-style web app provides a full GUI experience, with both interfaces backed by the same cloud API.

## Core Value

Kanban board management from the command line that stays perfectly in sync with a polished web GUI — one source of truth, two ways to interact.

## Requirements

### Validated

- [x] Cloud API backend serving both CLI and web app — Validated in Phase 1: Foundation & API
- [x] Workspace → Board → Column → Item hierarchy — Validated in Phase 1: Foundation & API
- [x] Browser-based login flow for CLI authentication (like `gh auth login`) — Validated in Phase 2: Authentication Flows
- [x] User signup and account management — Validated in Phase 2: Authentication Flows

### Active

- [ ] Trello-style drag-and-drop web app
- [ ] Real-time sync between CLI and web app (same API, same data)

### Validated in Phase 4: Item Management

- [x] CLI with full Kanban CRUD (workspaces, boards, columns, items)
- [x] Items with title, description, labels/tags, and due dates
- [x] Move items between columns via CLI

### Out of Scope

- MCP server — CLI-only for v1, MCP can layer on later since the API exists
- Team collaboration / workspace sharing — v1 is single-user, v2 adds teams
- Mobile app — web-first, responsive design sufficient for v1
- Offline/local-first mode — cloud API is the single source of truth
- OAuth social login — email/password + browser login flow for v1

## Context

- CLI-first tools are trending, especially in AI-assisted developer workflows. AI agents can run CLI commands directly in terminal sessions without needing special protocols.
- The CLI is a thin client: it authenticates, makes HTTP calls to the cloud API, and formats responses for the terminal.
- TypeScript across the full stack (CLI, API, web app) enables shared types, validation, and API contracts.
- The architecture is: CLI → REST API → Database ← Web App. Both clients are equal consumers of the same API.
- The name is "Kanbambam" — playful, memorable, and instantly communicates it's a Kanban tool.

## Constraints

- **Tech stack**: TypeScript everywhere — CLI (Node.js), API (Node.js), Web (React/Next.js)
- **Auth**: Browser-based login flow for CLI, standard session/JWT for web
- **Data model**: User → Workspaces → Boards → Columns → Items
- **Hosting**: Cloud-based API and database (specific provider TBD during research)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI-first, GUI second | Target AI-assisted workflows and developer audience | — Pending |
| TypeScript full stack | One language for CLI, API, and web — shared types and contracts | — Pending |
| Cloud API as single source of truth | Both CLI and web are equal API clients, no sync conflicts | — Pending |
| Browser login flow for CLI auth | Familiar UX (like GitHub CLI), avoids plaintext credentials | — Pending |
| Single-user for v1 | Reduce complexity, add team collaboration in v2 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-26 after Phase 2 completion*
