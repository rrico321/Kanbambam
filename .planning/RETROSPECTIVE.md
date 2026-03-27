# Retrospective

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-27
**Phases:** 5 | **Plans:** 21

### What Was Built

- Monorepo with shared Zod schemas and Drizzle PostgreSQL database
- Hono REST API with 21 endpoints, JWT auth, fractional indexing, cursor pagination
- CLI with 20+ commands, context system, `--json` output, Ink rendering
- Next.js web app with drag-and-drop board view, inline editing modal, sidebar navigation
- Browser-based auth flow shared between CLI and web clients

### What Worked

- API-first build order: building the API before CLI/web meant both clients had a stable foundation
- Shared Zod schemas: define once, validate in API and web — prevented contract drift
- Phase structure: 5 phases with clear dependency chain kept work focused and sequential
- Fractional indexing: clean move operations without O(n) reindexing
- TanStack Query: server state management made web app data fetching straightforward

### What Was Inefficient

- ROADMAP.md phase status tracking fell out of sync (some phases showed "In Progress" when complete)
- CLI doesn't actually import @kanbambam/shared — types were hand-duplicated, creating drift risk
- Nyquist validation was set up but never completed across any phase
- Some phase summaries listed accomplishments per-plan rather than per-phase, making extraction verbose

### Patterns Established

- Dual auth pattern: Bearer header (CLI) + httpOnly cookie (web) accepted by same middleware
- Output formatter: JSON/Ink/plain modes driven by `--json` flag and TTY detection
- Context system: active workspace/board stored in conf, resolved automatically by commands
- Composition modals: sub-components with shared mutation hooks for extensibility
- Component tree mocking: mock at component boundaries in tests to prevent cascading hook failures

### Key Lessons

- Build the API first and let clients consume it — catches design issues early
- Fractional indexing is worth the upfront cost for any ordering-heavy application
- Browser callback auth (localhost server → redirect) works well for CLI tools
- Gap closure plans are valuable — dedicated plans to fix test regressions and orphaned references

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 5 |
| Plans | 21 |
| Requirements | 44 |
| Timeline (days) | 2 |
| LOC (TypeScript) | ~120K |
| Files | 274 |

---
*Updated: 2026-03-27*
