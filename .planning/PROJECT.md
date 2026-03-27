# Kanbambam

## What This Is

A CLI-first Kanban board product with a Trello-style web GUI. Users manage workspaces, boards, columns, and items through terminal commands or a drag-and-drop web interface — both backed by the same cloud REST API. Designed for humans and AI agents alike.

## Core Value

Kanban board management from the command line that stays perfectly in sync with a polished web GUI — one source of truth, two ways to interact.

## Current State

**Shipped:** v1.0 MVP (2026-03-27)
**Codebase:** ~120K LOC TypeScript across 3 apps (API, CLI, Web) and 1 shared package
**Tech stack:** Hono API, Commander.js + Ink CLI, Next.js + TanStack Query + @dnd-kit web app, Drizzle + PostgreSQL (Neon)

What's working:
- 21-endpoint REST API with JWT auth, fractional indexing, cursor pagination
- Full CLI with 20+ commands, context system, `--json` output
- Web app with drag-and-drop board view, inline editing modal, workspace navigation
- Browser-based auth flow shared between CLI and web

## Requirements

### Validated

- ✓ REST API CRUD for all entities — v1.0
- ✓ JWT auth with dual mode (Bearer + httpOnly cookies) — v1.0
- ✓ Fractional indexing for ordering — v1.0
- ✓ Cursor pagination — v1.0
- ✓ Web signup/login/logout — v1.0
- ✓ CLI browser auth flow with token persistence — v1.0
- ✓ Full CLI CRUD (workspace, board, column, item) — v1.0
- ✓ CLI context system (set, view, clear) — v1.0
- ✓ `--json` flag and human-readable output — v1.0
- ✓ Items with labels, due dates, descriptions — v1.0
- ✓ Trello-style board view with drag-and-drop — v1.0
- ✓ Inline editing modal — v1.0
- ✓ Workspace/board navigation — v1.0
- ✓ CLI-web sync (same API, same data) — v1.0

### Active

(None — next milestone requirements TBD via `/gsd:new-milestone`)

### Out of Scope

- MCP server — CLI-only for v1, MCP can layer on later since the API exists
- Team collaboration / workspace sharing — v1 is single-user, v2 adds teams
- Mobile app — web-first, responsive design sufficient
- Offline/local-first mode — cloud API is the single source of truth
- OAuth social login — email/password + browser login flow for now
- Real-time WebSockets — polling or refresh sufficient; adds significant complexity
- File attachments — storage infrastructure adds scope
- Notifications — no collaboration means no notification triggers

## Constraints

- **Tech stack**: TypeScript everywhere — CLI (Node.js), API (Node.js), Web (React/Next.js)
- **Auth**: Browser-based login flow for CLI, standard session/JWT for web
- **Data model**: User → Workspaces → Boards → Columns → Items
- **Hosting**: Vercel (web + API), Neon (PostgreSQL)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI-first, GUI second | Target AI-assisted workflows and developer audience | ✓ Good — both CLI and web fully functional |
| TypeScript full stack | One language for CLI, API, and web — shared types and contracts | ✓ Good — Zod schemas shared across packages |
| Cloud API as single source of truth | Both CLI and web are equal API clients, no sync conflicts | ✓ Good — both clients use same REST API |
| Browser login flow for CLI auth | Familiar UX (like GitHub CLI), avoids plaintext credentials | ✓ Good — browser callback flow works |
| Dual auth: Bearer + cookies | CLI uses Authorization header, web uses httpOnly cookies | ✓ Good — API accepts both via hono/jwt |
| Single-user for v1 | Reduce complexity, add team collaboration in v2 | ✓ Good — shipped faster |
| Hono over Express | TypeScript-first, lighter, modern middleware | ✓ Good — clean DX, fast |
| Drizzle over Prisma | TypeScript-native, no generated client, faster cold starts | ✓ Good — schema-as-code worked well |
| @dnd-kit for drag-and-drop | Replaced deprecated react-beautiful-dnd | ✓ Good — works with React 19 |
| Fractional indexing for ordering | Avoids O(n) reindex on every move | ✓ Good — clean move operations |
| Composition pattern for modals | ItemModal assembles sub-components with shared hooks | ✓ Good — extensible |
| Mock component tree in tests | Prevent breakage from child component hook additions | ⚠️ Revisit — may over-mock |

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
*Last updated: 2026-03-27 after v1.0 milestone*
