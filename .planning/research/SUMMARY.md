# Project Research Summary

**Project:** Kanbambam CLI
**Domain:** CLI-first Kanban board with cloud REST API and web app (TypeScript full stack)
**Researched:** 2026-03-25
**Confidence:** MEDIUM (training data through early 2025; version numbers need live verification before install)

## Executive Summary

Kanbambam occupies a unique and defensible niche: the only Kanban tool that is both CLI-native and has a real web GUI backed by the same REST API. Trello and Linear have no CLI; Taskwarrior has no GUI; GitHub Projects has a limited CLI. This dual-interface value proposition is not a UI detail — it is an architectural commitment. Both the CLI and web app must be thin, equal clients of a shared REST API. The API is the product; the clients are views. This principle must be established in Phase 1 before any client work begins, because retrofitting it is nearly impossible.

The recommended approach is a Turborepo monorepo with pnpm workspaces containing four packages: `packages/shared` (Zod schemas as the single source of truth for types and API contracts), `apps/cli` (Commander.js + Ink), `apps/api` (Hono + Drizzle ORM + PostgreSQL on Neon), and `apps/web` (Next.js 15 + React 19 + dnd-kit). The shared package is the most critical — Zod schemas generate TypeScript types consumed by all three apps, eliminating type drift between clients and server. The build order must be enforced: shared first, then API, then CLI (to validate the API design), then web.

The key risks are ordering-related: building clients before the API contract is stable, using integer-based item positioning instead of fractional indexing, and neglecting JSON output mode on CLI commands from day one. These three issues have recovery costs rated HIGH in the research, meaning they require data migrations, API versioning, or architectural rewrites if caught late. All three must be addressed in Phase 1 before a line of client code is written.

## Key Findings

### Recommended Stack

A TypeScript-first monorepo with Turborepo orchestration is the clear recommendation for this project. The stack is designed so all three surfaces (CLI, API, web) share a single package for types and validation, making it structurally impossible for the clients to send data the API doesn't expect. Hono replaces Express as the API framework — it is TypeScript-first, lighter, and runs unchanged on Node.js or serverless edge runtimes, keeping deployment options open. Drizzle ORM is the modern alternative to Prisma: no generated client code, zero runtime overhead, SQL-like query API. Neon provides serverless PostgreSQL with branching for development workflows. On the CLI, Commander.js handles command parsing and Ink (React for the terminal) handles rich output. On the web, dnd-kit replaces the deprecated react-beautiful-dnd, and TanStack Query handles server state — no Redux or Zustand needed.

**Core technologies:**
- TypeScript ~5.7: Language across all packages — enables shared types between CLI, API, and web
- Turborepo ^2.x + pnpm ^9.x: Monorepo orchestration — caches builds, enforces dependency graph, best workspace support
- Hono ^4.x: API framework — TypeScript-first, edge-portable, built-in Zod integration via `@hono/zod-validator`
- Drizzle ORM ^0.35+: Database ORM — no runtime overhead, SQL-like API, migrations from schema, modern Prisma alternative
- PostgreSQL 16 on Neon: Database — relational model maps perfectly to the workspace/board/column/item hierarchy
- Zod ^3.23+: Shared validation — define once in `packages/shared`, validate in API requests, CLI responses, and web forms
- Commander.js ^12.x: CLI command parsing — mature, stable, TypeScript-native
- Ink ^5.x: CLI rich output — React for the terminal, enables board view rendering
- Next.js ^15.x + React ^19.x: Web app — App Router with Server Components for initial load, Client Components for drag-and-drop
- @dnd-kit/core ^6.x: Web drag-and-drop — successor to deprecated react-beautiful-dnd
- TanStack Query ^5.x: Web server state — caching, refetching, optimistic updates for drag-and-drop Kanban

**Critical version note:** Ink 5 may not yet support React 19. CLI and web packages should maintain separate React versions in the monorepo — this is valid and expected.

### Expected Features

Kanbambam's value proposition requires both a complete CLI interface and a complete web GUI to land in v1. Either without the other breaks the core premise. The AI agent use case (JSON output, predictable grammar, scriptable) is the primary growth lever and must be built into the CLI from the start, not retrofitted.

**Must have (table stakes) — v1:**
- Full CRUD hierarchy via CLI: workspace, board, column, item — the entire data model manageable from terminal
- User auth with browser login flow (`kanbambam auth login` opens browser, like `gh auth login`)
- Move items between columns via CLI — the core Kanban action
- Labels and due dates on items — minimum useful metadata
- Formatted CLI board view — static column/card output, not TUI
- JSON output mode on all CLI commands (`--json` flag) — AI agent compatibility from day one
- Short IDs for items — `#42` style, not UUIDs; usability essential for CLI
- REST API — the shared backend for both interfaces
- Web board view with drag-and-drop — the "other half" of the value prop
- Web card detail editing — click to view/edit item details

**Should have (competitive) — v1.x after validation:**
- Tab completion for bash/zsh/fish — ship once command structure is stable
- Column WIP limits — proper Kanban practice; no competitor does this well
- Quick-add shortcut (`kanbambam add "task"`) — reduces CLI friction
- Bulk CLI operations (`item move --filter "label:bug" --to done`) — power-user productivity
- Pipe-friendly stdin — Unix pipeline composability
- Board templates — pre-built column structures for common workflows
- Activity log — what changed, when, by which interface

**Defer to v2+:**
- Interactive TUI (full terminal Kanban UI with arrow keys) — high complexity; validate users want this vs. one-shot commands
- Multi-user / team collaboration — PROJECT.md explicitly scopes to v2
- WebSocket real-time sync — only valuable once multi-user lands
- Card comments, custom fields, file attachments, OAuth social login
- MCP server — PROJECT.md explicitly defers; the REST API makes it easy to add later

### Architecture Approach

The system follows a strict two-tier client model: both CLI and web app are thin, equal clients of the same REST API. Neither has privileged access, and neither contains business logic. All validation, authorization, and business rules live exclusively in the API. The `packages/shared` Zod schemas are the enforced contract between all surfaces — TypeScript types are inferred from schemas, never hand-written separately. The API uses a layered Route → Service → Repository → Database pattern, making services testable without HTTP and repositories mockable. The web app calls the same REST API endpoints as the CLI — it does NOT use Next.js server actions or API routes for data mutation.

**Major components:**
1. `packages/shared` — Zod schemas as source of truth; inferred TypeScript types; API request/response shapes; shared constants
2. `apps/api` — Hono REST API; Route → Service → Repository → DB layering; JWT auth middleware; ownership authorization on every request
3. `apps/cli` — Commander.js command parsing; thin HTTP client wrapper; output formatting layer (table/JSON/plain); local auth token storage via `conf`
4. `apps/web` — Next.js App Router; Server Components for initial board loads; Client Components for dnd-kit drag-and-drop; TanStack Query for server state

**Key patterns to follow:**
- Shared Zod schemas as contract — never drift types between packages
- Thin CLI client — zero business logic in CLI; all validation in API
- Browser-based CLI auth (device flow) — local callback server receives JWT after browser login
- Flat API URLs — `GET /items?board_id=456` not `/workspaces/123/boards/456/columns/789/items`
- Fractional indexing for item positions — not integers; use `after_item_id` relative positioning on move endpoint
- CLI context system — `kanbambam use workspace "name"` sets active context; stored in `~/.config/kanbambam/context.json`

### Critical Pitfalls

1. **CLI and web diverge into separate products** — Avoid by enforcing the shared Zod contract from Phase 1. No client-specific API routes. Integration tests that run the same operation through both clients and compare state. Warning sign: any PR adding a "web-only" or "cli-only" endpoint.

2. **Integer-based column/item ordering** — Use fractional indexing from day one (`fractional-indexing` npm package). Move endpoint accepts `after_item_id`, not `{ position: 3 }`. This is a HIGH-cost retrofit if missed — requires data migration and breaks all client code.

3. **Hierarchical UX problem in CLI** — Implement a CLI context system (`kanbambam use workspace/board`) from Phase 2 start. API URLs must be flat (max 2 levels deep). Items must have globally unique IDs addressable directly. No command should require more than 2 flags to identify a resource.

4. **Building web app before API is battle-tested** — Build the CLI first. If the API works well for CLI, it works for everything. CLI validates the API is a clean resource API, not a BFF shaped by web rendering needs. Phase ordering: API → CLI → Web.

5. **CLI output that cannot be scripted** — Every command must support `--json` from day one with consistent output shapes matching API field names. Detect non-TTY stdout and automatically switch to machine-readable output. Add `--quiet` flag outputting only the resource ID for scripting.

6. **CLI auth edge cases** — Support three auth methods from day one: browser flow (primary), manual token paste (headless fallback), `KANBAMBAM_TOKEN` env var (CI/automation). Token refresh must be silent — a 401 triggers refresh, not a user-facing error.

## Implications for Roadmap

Based on combined research, the phase ordering is dictated by a hard dependency chain: the shared contract and API must exist before either client can be built, and the CLI should validate the API before the web app is layered on top.

### Phase 1: Foundation — Monorepo + Shared Contract + API Core

**Rationale:** Everything depends on this phase. The shared Zod schemas and API contract cannot be retrofitted. The data model decisions made here (fractional indexing, flat URL structure, UUID IDs, pagination on all list endpoints) have HIGH recovery cost if deferred. No client code should be written until the API is validated against the contract.

**Delivers:** Working monorepo with Turborepo + pnpm, `packages/shared` Zod schemas for all entities, Hono REST API with complete CRUD for the workspace/board/column/item hierarchy, JWT auth system with refresh tokens, ownership authorization middleware, cursor-based pagination on all list endpoints, fractional indexing on item/column positions, OpenAPI spec generated from Zod schemas, Docker Compose for local Postgres.

**Addresses (from FEATURES.md):** REST API backbone, user auth system, workspace/board/column/item data model.

**Avoids (from PITFALLS.md):** CLI/web divergence (contract established first), integer ordering (fractional indexing from schema day one), guessable IDs (UUIDs from schema day one), no pagination (cursor pagination built in), no authorization beyond auth (ownership middleware required).

**Research flag:** Standard well-documented patterns. Hono + Drizzle + Zod integration is documented. No phase research needed.

### Phase 2: CLI — Full Command Set + Auth + Output Layer

**Rationale:** Build the CLI before the web app. If the API is clean enough for a CLI, it is clean enough for a web app. The CLI acts as the API's first real consumer and stress-tests the contract. Problems discovered here (endpoints too complex, missing fields, bad error messages) are cheap to fix before the web app is built on top.

**Delivers:** All CLI commands for full CRUD hierarchy (`workspace`, `board`, `column`, `item`), browser-based auth login flow with headless fallback and `KANBAMBAM_TOKEN` env var support, output formatting layer (table + JSON + plain, TTY detection), CLI context system (`kanbambam use workspace/board`), short ID display (`#42` style), `--json` flag on every command, `--quiet` flag, formatted board view (static column/card output), error messages with fix suggestions.

**Addresses (from FEATURES.md):** Full CRUD hierarchy via CLI, auth browser login flow, move items between columns (CLI), labels and due dates, formatted CLI board view, JSON output mode, short IDs.

**Avoids (from PITFALLS.md):** CLI output not scriptable (output layer built as infrastructure first), hierarchical UX problems (context system + flat IDs), auth edge cases (headless fallback + env var support).

**Research flag:** Commander.js and Ink have established patterns. Browser-based auth device flow is well-documented (model after `gh auth login`). No phase research needed.

### Phase 3: Web App — Board View + Drag-and-Drop + Auth

**Rationale:** The web app is built last, after the API has been proven by the CLI. This ensures the API is a general-purpose resource API, not a BFF shaped by web rendering needs. The web app is a consumer of the same API the CLI uses — no shortcuts via Next.js server actions or direct DB access.

**Delivers:** Next.js App Router web app, login/signup UI, board column view with cards, drag-and-drop card reordering (dnd-kit), card detail modal/panel for view and edit, visual label colors, loading states and empty states for new users, web auth (JWT in httpOnly cookie), TanStack Query for server state and optimistic updates on drag-and-drop.

**Addresses (from FEATURES.md):** Web board view + drag-and-drop, web card detail editing, login/signup flow, visual label colors, loading states.

**Avoids (from PITFALLS.md):** Web app bypassing API (explicit constraint: no Next.js server actions for data mutation), API shaped by web rendering needs (API already proven by CLI before this phase).

**Research flag:** dnd-kit accessibility patterns and TanStack Query optimistic updates for Kanban drag-and-drop may warrant a research pass. The integration between dnd-kit and fractional indexing positions needs careful design.

### Phase 4: Polish + Power Features

**Rationale:** Once the core loop (CLI + API + Web) is working and validated, add the v1.x features that increase power-user utility without expanding the data model significantly.

**Delivers:** Tab completion for bash/zsh/fish, column WIP limits with enforcement on item move, `kanbambam add "task"` quick-add shortcut, board templates (pre-built column structures), pipe-friendly stdin, keyboard shortcuts in web, item archiving, activity log (API middleware on all mutations).

**Addresses (from FEATURES.md):** All v1.x "Add After Validation" features from the feature prioritization matrix.

**Research flag:** Tab completion shell scripts have established patterns. No phase research needed.

### Phase Ordering Rationale

- Phase 1 must precede all others: the shared contract and data model are nearly impossible to retrofit. INTEGER ordering → fractional indexing is a HIGH-cost migration.
- Phase 2 (CLI) must precede Phase 3 (Web): CLI validates the API is clean and resource-oriented, not a web BFF. This is the most important ordering constraint in the research.
- Phase 3 can be partially parallelized with Phase 4: web app and polish features have few shared dependencies, but Phase 3 should reach basic functionality before Phase 4 work begins.
- The interactive TUI (Ink-based interactive board navigation) is a v2+ feature — it requires the CLI to be stable and user demand to be validated first.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (dnd-kit + fractional indexing integration):** The interaction between dnd-kit's drag end position calculations and the fractional indexing position scheme needs a concrete implementation plan. The `@dnd-kit/sortable` API produces array-index-based positions; converting those to fractional keys requires a defined algorithm.
- **Phase 3 (Tailwind CSS v4 + Next.js 15 compatibility):** Tailwind v4 changed its configuration system (CSS-based, not JS config). The integration with Next.js 15 may require `@tailwindcss/postcss` and the setup is different from v3. Verify before starting web phase.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Hono + Drizzle + Zod + PostgreSQL stack is well-documented. Turborepo monorepo setup is standard. JWT auth with refresh tokens is established.
- **Phase 2:** Commander.js + Ink CLI patterns are well-documented. Browser-based auth device flow is modeled directly after `gh auth login`, which has extensive documentation.
- **Phase 4:** Tab completion, WIP limits, and bulk operations are incremental additions to established CLI patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core technology choices are well-reasoned with clear alternatives analysis. Version numbers based on training data through early 2025 — all versions must be verified with `npm view <pkg> version` before installation. Ink 5 + React 19 compatibility is flagged LOW and needs manual verification at install time. |
| Features | MEDIUM | Based on training data knowledge of Trello, Linear, Jira, GitHub Projects, Taskwarrior, gh CLI. No live competitor verification. Feature analysis is thorough and well-structured. The competitive positioning (CLI-first with web GUI) is clearly defensible. |
| Architecture | HIGH | Based on established patterns from gh CLI, Vercel CLI, Linear, and Turborepo monorepos. The thin-client model, shared Zod contract, and layered API service pattern are all battle-tested. Architecture research is the most reliable of the four files. |
| Pitfalls | MEDIUM | Derived from training data knowledge of real CLI tools and Kanban products. The pitfalls are well-reasoned with clear recovery cost assessments. The fractional indexing recommendation and CLI/web divergence warning are particularly well-substantiated. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Ink 5 + React 19 compatibility:** Must verify at install time. Worst case: use Ink 4 with React 18 in the CLI package (separate from web's React 19). This is valid in a monorepo. Plan for this contingency.
- **dnd-kit v6 maintainer activity:** Research noted some maintainer activity concerns in late 2024. Verify current project health and latest version before committing to it for Phase 3.
- **Tailwind CSS v4 + Next.js 15 integration:** Verify `@tailwindcss/postcss` setup and any known issues before starting Phase 3.
- **Neon free tier limits:** Verify current pricing and free tier connection/storage limits match the project's expected v1 usage before committing to Neon as the database provider.
- **fractional-indexing npm package:** Research recommends this package but does not verify its current maintenance status. Verify or consider implementing a simple lexicographic ordering algorithm directly.

## Sources

### Primary (HIGH confidence)
- Architecture patterns modeled on gh CLI (GitHub CLI), Vercel CLI, Railway CLI, Linear — established production CLIs with documented architecture
- Turborepo monorepo patterns — official documentation patterns
- Hono + Drizzle + Zod integration — documented in respective library docs

### Secondary (MEDIUM confidence)
- Training data knowledge of Trello, Linear, Jira, GitHub Projects, Taskwarrior feature sets — no live verification
- npm package ecosystem (Commander.js, Ink, TanStack Query, dnd-kit) — training data through early 2025
- CLI UX patterns from vercel, fly.io, supabase, railway CLIs — training data

### Tertiary (LOW confidence)
- Specific version numbers for all packages — must be verified with `npm view <pkg> version` before use
- Ink 5 + React 19 compatibility — flagged as LOW; verify at install time
- dnd-kit v6 project health — flagged concern from late 2024; verify current status
- Neon pricing/free tier limits — must verify current pricing page before committing

---
*Research completed: 2026-03-25*
*Ready for roadmap: yes*
