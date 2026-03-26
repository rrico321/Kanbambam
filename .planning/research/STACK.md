# Stack Research

**Domain:** CLI-first Kanban board with cloud API and web app (TypeScript full stack)
**Researched:** 2026-03-25
**Confidence:** MEDIUM (versions based on training data through early 2025; verify with `npm view <pkg> version` before installing)

## Recommended Stack

### Monorepo Structure

Use **Turborepo** with **pnpm workspaces**. Three packages: `packages/shared` (types, validation, API contracts), `apps/cli`, `apps/api`, `apps/web`. This is the standard approach for TypeScript full-stack projects because it enables shared types/validation between all three surfaces with zero duplication.

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | ~5.7 | Language across all packages | Project constraint. Enables shared types between CLI, API, and web. |
| Node.js | >=20 LTS | Runtime for CLI and API | LTS with native ESM, fetch API, stable test runner. v20 is the current LTS line. |
| pnpm | ^9.x | Package manager | Fastest installs, strict dependency resolution, best monorepo workspace support. npm hoists incorrectly; yarn is fine but pnpm won. |
| Turborepo | ^2.x | Monorepo build orchestration | Caches builds across packages, handles dependency graph. Simpler than Nx for this scale. |

### CLI (`apps/cli`)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Commander.js | ^12.x | Command parsing and routing | The standard Node.js CLI framework. Mature, TypeScript-native, zero magic. Oclif is overkill for a product CLI (it's for building CLI frameworks). |
| Ink | ^5.x | Rich terminal UI (tables, spinners, colors) | React for the terminal. Enables beautiful output for board views. The project already uses React on web, so same mental model. |
| conf | ^13.x | Local config storage (auth tokens, defaults) | Stores JWT tokens and user preferences in OS-appropriate config dir. Simple key-value, no custom file management. |
| open | ^10.x | Open browser for auth flow | Opens default browser for the `gh auth login`-style OAuth flow. Cross-platform. |
| chalk | ^5.x | Terminal string styling | Color output for labels, statuses, warnings. ESM-native. |

### API (`apps/api`)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Hono | ^4.x | HTTP framework | Lightweight, TypeScript-first, type-safe routing. Faster and more modern than Express. Built-in middleware for CORS, JWT, validation. Runs on Node.js, Cloudflare Workers, Bun -- keeps deployment options open. |
| Drizzle ORM | ^0.35+ | Database ORM and query builder | TypeScript-first, SQL-like API, zero runtime overhead. Generates migrations from schema. Prisma has heavier runtime and slower cold starts; Drizzle is the modern choice for type-safe SQL. |
| PostgreSQL | 16 | Primary database | The industry standard relational DB for structured data. The workspace/board/column/item hierarchy maps perfectly to relational schema with foreign keys and ordering. |
| Zod | ^3.23+ | Runtime validation and API contracts | Define once, validate everywhere. Shared between CLI (response parsing), API (request validation), and web (form validation). Hono has first-class Zod integration via `@hono/zod-validator`. |
| jose | ^5.x | JWT handling | Lightweight JWT library for token creation/verification. No native dependencies, ESM-native. Better than jsonwebtoken which is CJS-only. |
| @hono/zod-openapi | ^0.16+ | OpenAPI spec generation from Zod schemas | Auto-generates OpenAPI docs from your Zod validators. Single source of truth for API contracts. |

### Web App (`apps/web`)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | ^15.x | React framework | App Router is stable. Server Components for initial board loads, Client Components for drag-and-drop interactivity. API routes not needed (separate API server), so Next.js is purely the frontend. |
| React | ^19.x | UI library | Project constraint (Next.js 15 uses React 19). Server Components for data fetching, useOptimistic for instant card moves. |
| Tailwind CSS | ^4.x | Styling | Utility-first CSS. Fast iteration, consistent design, no CSS-in-JS runtime cost. v4 has significant performance improvements. |
| @dnd-kit/core | ^6.x | Drag and drop | The successor to react-beautiful-dnd (deprecated). Accessible, performant, supports Kanban-style column/card dragging. Best React DnD library available. |
| TanStack Query | ^5.x | Server state management | Caches API responses, handles refetching, optimistic updates. Perfect for keeping the web app in sync with the API. No need for Redux or Zustand -- server state is the app state. |
| nuqs | ^2.x | URL search params state | Type-safe URL state for board filters, views. Keeps UI state in the URL where it belongs. |

### Shared Package (`packages/shared`)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Zod | ^3.23+ | Shared validation schemas | Define item/board/column schemas once. API validates requests, CLI validates responses, web validates forms. |
| TypeScript | ~5.7 | Shared type definitions | Exported interfaces consumed by all three apps. Change once, type errors everywhere. |

### Database and Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Neon | - | Serverless PostgreSQL | Serverless Postgres with branching, generous free tier, instant provisioning. Better DX than managing RDS. Drizzle has first-class Neon support. |
| Drizzle Kit | ^0.27+ | Migration tooling | Generates SQL migrations from Drizzle schema changes. Push for dev, migrate for prod. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @hono/zod-validator | ^0.4+ | Request validation middleware | Every API endpoint that accepts input |
| drizzle-zod | ^0.5+ | Generate Zod schemas from Drizzle tables | Bridge between DB schema and API validation |
| nanoid | ^5.x | Short unique IDs | Generate human-friendly IDs for boards, items (e.g., `brd_abc123`) |
| date-fns | ^3.x | Date formatting and manipulation | Due date handling, relative time display |
| bcrypt (or argon2) | latest | Password hashing | User signup/login (email+password auth) |
| tsx | ^4.x | TypeScript execution | Run TS files directly during development without build step |
| @t3-oss/env-core | ^0.11+ | Environment variable validation | Type-safe env vars with Zod schemas, catches missing config at startup |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | Unit and integration testing | Fast, native TypeScript/ESM support, compatible with Jest API. Use across all packages. |
| Biome | Linting and formatting | Single tool replaces ESLint + Prettier. Faster (Rust-based), zero config needed. Opinionated defaults are good. |
| tsup | CLI and API bundling | esbuild-based bundler for Node.js packages. Produces clean ESM output. Not needed for Next.js (it has its own bundler). |
| GitHub Actions | CI/CD | Standard for open-source and small teams. Run tests, lint, build across all packages. |
| Docker Compose | Local development | Run PostgreSQL locally without installing it. One `docker compose up` for the database. |

## Installation

```bash
# Initialize monorepo
pnpm init
pnpm add -Dw turborepo typescript

# Shared package
cd packages/shared
pnpm add zod

# CLI app
cd apps/cli
pnpm add commander ink react chalk conf open
pnpm add -D @types/react tsup tsx

# API app
cd apps/api
pnpm add hono @hono/node-server @hono/zod-validator @hono/zod-openapi drizzle-orm postgres zod jose nanoid bcrypt @t3-oss/env-core
pnpm add -D drizzle-kit @types/bcrypt tsx

# Web app
cd apps/web
pnpm add next react react-dom @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @tanstack/react-query nuqs date-fns
pnpm add -D tailwindcss @types/react @types/react-dom

# Dev tools (workspace root)
cd /
pnpm add -Dw vitest @biomejs/biome
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Hono | Express.js | Never for new projects. Express 5 took years and Hono is better in every way for TypeScript APIs. |
| Hono | Fastify | If you need the plugin ecosystem or extreme throughput. Fastify is solid but Hono's TypeScript DX is superior. |
| Drizzle ORM | Prisma | If your team already knows Prisma well. Prisma's runtime is heavier and cold starts are slower, but its migration system is more mature. |
| Commander.js | Oclif | If building a CLI framework for others to extend. Overkill for a product CLI -- too much boilerplate and convention. |
| Commander.js | Yargs | Yargs works fine but Commander's TypeScript types and chainable API are cleaner. Yargs shines for complex argument parsing. |
| Ink | cli-table3 + ora | If you want minimal dependencies and don't need interactive UI. Ink is heavier but produces far better output for Kanban board display. |
| Neon | Supabase | If you also want auth, storage, and realtime built in. Supabase bundles more but Neon is better as a pure Postgres provider -- we want to own our API layer. |
| Neon | Railway/Render Postgres | If you prefer traditional managed Postgres. Neon's serverless model and branching are better for development workflow. |
| Biome | ESLint + Prettier | If you need specific ESLint plugins not yet in Biome. Biome covers 95% of cases faster. |
| TanStack Query | SWR | SWR is lighter but TanStack Query has better mutation handling and optimistic update support, which is critical for drag-and-drop Kanban. |
| @dnd-kit | react-beautiful-dnd | Never. react-beautiful-dnd is deprecated by Atlassian. @dnd-kit is the community standard replacement. |
| Next.js | Vite + React Router | If you don't need SSR. But for a public-facing web app, Next.js gives you SSR, image optimization, and better SEO with less work. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Express.js | Stale ecosystem, poor TypeScript support, no built-in middleware for modern patterns | Hono |
| Prisma | Heavy runtime (~4MB), slow cold starts, generates client code, schema language is not TypeScript | Drizzle ORM |
| react-beautiful-dnd | Officially deprecated by Atlassian, no maintenance | @dnd-kit |
| Redux / Zustand | This app's state is server state (boards, items). Client state management libraries add unnecessary complexity | TanStack Query |
| Mongoose / MongoDB | The data model is deeply relational (workspace > board > column > item with ordering). Document DBs make ordering and cross-entity queries painful | PostgreSQL + Drizzle |
| jsonwebtoken | CommonJS-only, no ESM support, large dependency tree | jose |
| dotenv | Manual and error-prone. Does not validate env vars or provide types | @t3-oss/env-core with Zod |
| ESLint + Prettier (separately) | Two tools, complex config, slow. Biome does both faster with zero config | Biome |
| npm / yarn | npm has hoisting issues in monorepos. yarn is fine but pnpm is faster and stricter | pnpm |
| Lerna | Deprecated in spirit. Turborepo and Nx replaced it. Lerna is maintenance mode at best | Turborepo |

## Stack Patterns by Variant

**If deploying API to serverless (Cloudflare Workers, Vercel Edge):**
- Hono runs natively on all edge runtimes -- no code changes needed
- Use Neon's serverless driver (`@neondatabase/serverless`) instead of `postgres` package
- Because Hono was designed for this, unlike Express which needs adapters

**If deploying API to long-running server (Railway, Fly.io, VPS):**
- Use `@hono/node-server` for the Node.js adapter
- Use standard `postgres` package for connection pooling
- Because long-running servers can maintain persistent DB connections

**If adding real-time features later (v2 collaboration):**
- Add Hono WebSocket support or a separate WebSocket server
- Consider Neon's logical replication or Postgres LISTEN/NOTIFY for change detection
- TanStack Query already supports real-time refetching via `refetchInterval` or WebSocket integration

**If the web app grows complex (many views, settings pages):**
- Add Zustand for truly client-side state (theme, sidebar open/close, preferences)
- Keep server state in TanStack Query
- Because mixing server and client state in one store is an anti-pattern

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15 | React 19 | Next.js 15 requires React 19. Do not use React 18 with Next.js 15. |
| Ink 5 | React 18 | Ink uses its own React renderer. It may not yet support React 19 -- verify before installing. CLI and web have separate React versions which is fine in a monorepo. |
| Drizzle ORM | drizzle-kit (same minor) | Keep drizzle-orm and drizzle-kit versions in sync. Breaking changes between mismatched versions. |
| Hono 4 | @hono/node-server 1.x | Use `@hono/node-server` for running Hono on Node.js. Compatible with Hono v4. |
| Tailwind CSS 4 | Next.js 15 | Tailwind v4 changed its configuration system (CSS-based, not JS config). Verify Next.js 15 compatibility as the integration may require `@tailwindcss/postcss`. |
| TanStack Query 5 | React 19 | TanStack Query v5 supports React 19 including Suspense integration. |

## Confidence Notes

| Area | Confidence | Notes |
|------|------------|-------|
| Hono as API framework | MEDIUM | Strong community momentum as of early 2025. Could not verify latest v4 features due to tool access restrictions. Verify current stable version. |
| Drizzle ORM | MEDIUM | Rapidly evolving (pre-1.0). API surface may have changed. Verify latest version and any breaking changes. |
| Next.js 15 + React 19 | MEDIUM | Both were stable as of late 2024. Next.js may be on v15.1+ or even v16 by now. Verify current version. |
| Commander.js for CLI | HIGH | Extremely stable, slow-moving library. v12 is almost certainly still current. |
| Tailwind CSS 4 | MEDIUM | v4 was released early 2025 with major config changes. Verify migration guide and Next.js integration status. |
| @dnd-kit | MEDIUM | Standard recommendation but verify v6 stability. The library had some maintainer activity concerns in late 2024. |
| Ink 5 + React compatibility | LOW | Ink's React version may lag behind. This needs verification at install time. Worst case: Ink 4 with React 18 in the CLI package (separate from web). |
| Neon serverless Postgres | MEDIUM | Growing rapidly but verify pricing and free tier limits for the project's expected usage. |

## IMPORTANT: Version Verification Required

All version numbers in this document are based on training data through early 2025. Before running any `pnpm add` commands, verify current versions:

```bash
# Quick version check for all recommended packages
for pkg in typescript next react hono drizzle-orm commander ink zod tailwindcss @dnd-kit/core @tanstack/react-query vitest @biomejs/biome; do
  echo "$pkg: $(npm view $pkg version)"
done
```

## Sources

- Training data knowledge through early 2025 (MEDIUM confidence)
- Could not access Context7, npm registry, WebSearch, or official docs due to tool restrictions
- All version numbers should be independently verified before use

---
*Stack research for: CLI-first Kanban board (TypeScript full stack)*
*Researched: 2026-03-25*

# Stack Research

**Domain:** CLI-first Kanban board with cloud API and web app (TypeScript full stack)
**Researched:** 2026-03-25
**Confidence:** MEDIUM (versions based on training data through early 2025; verify with `npm view <pkg> version` before installing)

## Recommended Stack

### Monorepo Structure

Use **Turborepo** with **pnpm workspaces**. Three packages: `packages/shared` (types, validation, API contracts), `apps/cli`, `apps/api`, `apps/web`. This is the standard approach for TypeScript full-stack projects because it enables shared types/validation between all three surfaces with zero duplication.

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | ~5.7 | Language across all packages | Project constraint. Enables shared types between CLI, API, and web. |
| Node.js | >=20 LTS | Runtime for CLI and API | LTS with native ESM, fetch API, stable test runner. v20 is the current LTS line. |
| pnpm | ^9.x | Package manager | Fastest installs, strict dependency resolution, best monorepo workspace support. npm hoists incorrectly; yarn is fine but pnpm won. |
| Turborepo | ^2.x | Monorepo build orchestration | Caches builds across packages, handles dependency graph. Simpler than Nx for this scale. |

### CLI (`apps/cli`)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Commander.js | ^12.x | Command parsing and routing | The standard Node.js CLI framework. Mature, TypeScript-native, zero magic. Oclif is overkill for a product CLI (it's for building CLI frameworks). |
| Ink | ^5.x | Rich terminal UI (tables, spinners, colors) | React for the terminal. Enables beautiful output for board views. The project already uses React on web, so same mental model. |
| conf | ^13.x | Local config storage (auth tokens, defaults) | Stores JWT tokens and user preferences in OS-appropriate config dir. Simple key-value, no custom file management. |
| open | ^10.x | Open browser for auth flow | Opens default browser for the `gh auth login`-style OAuth flow. Cross-platform. |
| chalk | ^5.x | Terminal string styling | Color output for labels, statuses, warnings. ESM-native. |

### API (`apps/api`)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Hono | ^4.x | HTTP framework | Lightweight, TypeScript-first, type-safe routing. Faster and more modern than Express. Built-in middleware for CORS, JWT, validation. Runs on Node.js, Cloudflare Workers, Bun -- keeps deployment options open. |
| Drizzle ORM | ^0.35+ | Database ORM and query builder | TypeScript-first, SQL-like API, zero runtime overhead. Generates migrations from schema. Prisma has heavier runtime and slower cold starts; Drizzle is the modern choice for type-safe SQL. |
| PostgreSQL | 16 | Primary database | The industry standard relational DB for structured data. The workspace/board/column/item hierarchy maps perfectly to relational schema with foreign keys and ordering. |
| Zod | ^3.23+ | Runtime validation and API contracts | Define once, validate everywhere. Shared between CLI (response parsing), API (request validation), and web (form validation). Hono has first-class Zod integration via `@hono/zod-validator`. |
| jose | ^5.x | JWT handling | Lightweight JWT library for token creation/verification. No native dependencies, ESM-native. Better than jsonwebtoken which is CJS-only. |
| @hono/zod-openapi | ^0.16+ | OpenAPI spec generation from Zod schemas | Auto-generates OpenAPI docs from your Zod validators. Single source of truth for API contracts. |

### Web App (`apps/web`)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | ^15.x | React framework | App Router is stable. Server Components for initial board loads, Client Components for drag-and-drop interactivity. API routes not needed (separate API server), so Next.js is purely the frontend. |
| React | ^19.x | UI library | Project constraint (Next.js 15 uses React 19). Server Components for data fetching, useOptimistic for instant card moves. |
| Tailwind CSS | ^4.x | Styling | Utility-first CSS. Fast iteration, consistent design, no CSS-in-JS runtime cost. v4 has significant performance improvements. |
| @dnd-kit/core | ^6.x | Drag and drop | The successor to react-beautiful-dnd (deprecated). Accessible, performant, supports Kanban-style column/card dragging. Best React DnD library available. |
| TanStack Query | ^5.x | Server state management | Caches API responses, handles refetching, optimistic updates. Perfect for keeping the web app in sync with the API. No need for Redux or Zustand -- server state is the app state. |
| nuqs | ^2.x | URL search params state | Type-safe URL state for board filters, views. Keeps UI state in the URL where it belongs. |

### Shared Package (`packages/shared`)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Zod | ^3.23+ | Shared validation schemas | Define item/board/column schemas once. API validates requests, CLI validates responses, web validates forms. |
| TypeScript | ~5.7 | Shared type definitions | Exported interfaces consumed by all three apps. Change once, type errors everywhere. |

### Database and Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Neon | - | Serverless PostgreSQL | Serverless Postgres with branching, generous free tier, instant provisioning. Better DX than managing RDS. Drizzle has first-class Neon support. |
| Drizzle Kit | ^0.27+ | Migration tooling | Generates SQL migrations from Drizzle schema changes. Push for dev, migrate for prod. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @hono/zod-validator | ^0.4+ | Request validation middleware | Every API endpoint that accepts input |
| drizzle-zod | ^0.5+ | Generate Zod schemas from Drizzle tables | Bridge between DB schema and API validation |
| nanoid | ^5.x | Short unique IDs | Generate human-friendly IDs for boards, items (e.g., `brd_abc123`) |
| date-fns | ^3.x | Date formatting and manipulation | Due date handling, relative time display |
| bcrypt (or argon2) | latest | Password hashing | User signup/login (email+password auth) |
| tsx | ^4.x | TypeScript execution | Run TS files directly during development without build step |
| @t3-oss/env-core | ^0.11+ | Environment variable validation | Type-safe env vars with Zod schemas, catches missing config at startup |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | Unit and integration testing | Fast, native TypeScript/ESM support, compatible with Jest API. Use across all packages. |
| Biome | Linting and formatting | Single tool replaces ESLint + Prettier. Faster (Rust-based), zero config needed. Opinionated defaults are good. |
| tsup | CLI and API bundling | esbuild-based bundler for Node.js packages. Produces clean ESM output. Not needed for Next.js (it has its own bundler). |
| GitHub Actions | CI/CD | Standard for open-source and small teams. Run tests, lint, build across all packages. |
| Docker Compose | Local development | Run PostgreSQL locally without installing it. One `docker compose up` for the database. |

## Installation

```bash
# Initialize monorepo
pnpm init
pnpm add -Dw turborepo typescript

# Shared package
cd packages/shared
pnpm add zod

# CLI app
cd apps/cli
pnpm add commander ink react chalk conf open
pnpm add -D @types/react tsup tsx

# API app
cd apps/api
pnpm add hono @hono/node-server @hono/zod-validator @hono/zod-openapi drizzle-orm postgres zod jose nanoid bcrypt @t3-oss/env-core
pnpm add -D drizzle-kit @types/bcrypt tsx

# Web app
cd apps/web
pnpm add next react react-dom @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @tanstack/react-query nuqs date-fns
pnpm add -D tailwindcss @types/react @types/react-dom

# Dev tools (workspace root)
cd /
pnpm add -Dw vitest @biomejs/biome
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Hono | Express.js | Never for new projects. Express 5 took years and Hono is better in every way for TypeScript APIs. |
| Hono | Fastify | If you need the plugin ecosystem or extreme throughput. Fastify is solid but Hono's TypeScript DX is superior. |
| Drizzle ORM | Prisma | If your team already knows Prisma well. Prisma's runtime is heavier and cold starts are slower, but its migration system is more mature. |
| Commander.js | Oclif | If building a CLI framework for others to extend. Overkill for a product CLI -- too much boilerplate and convention. |
| Commander.js | Yargs | Yargs works fine but Commander's TypeScript types and chainable API are cleaner. Yargs shines for complex argument parsing. |
| Ink | cli-table3 + ora | If you want minimal dependencies and don't need interactive UI. Ink is heavier but produces far better output for Kanban board display. |
| Neon | Supabase | If you also want auth, storage, and realtime built in. Supabase bundles more but Neon is better as a pure Postgres provider -- we want to own our API layer. |
| Neon | Railway/Render Postgres | If you prefer traditional managed Postgres. Neon's serverless model and branching are better for development workflow. |
| Biome | ESLint + Prettier | If you need specific ESLint plugins not yet in Biome. Biome covers 95% of cases faster. |
| TanStack Query | SWR | SWR is lighter but TanStack Query has better mutation handling and optimistic update support, which is critical for drag-and-drop Kanban. |
| @dnd-kit | react-beautiful-dnd | Never. react-beautiful-dnd is deprecated by Atlassian. @dnd-kit is the community standard replacement. |
| Next.js | Vite + React Router | If you don't need SSR. But for a public-facing web app, Next.js gives you SSR, image optimization, and better SEO with less work. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Express.js | Stale ecosystem, poor TypeScript support, no built-in middleware for modern patterns | Hono |
| Prisma | Heavy runtime (~4MB), slow cold starts, generates client code, schema language is not TypeScript | Drizzle ORM |
| react-beautiful-dnd | Officially deprecated by Atlassian, no maintenance | @dnd-kit |
| Redux / Zustand | This app's state is server state (boards, items). Client state management libraries add unnecessary complexity | TanStack Query |
| Mongoose / MongoDB | The data model is deeply relational (workspace > board > column > item with ordering). Document DBs make ordering and cross-entity queries painful | PostgreSQL + Drizzle |
| jsonwebtoken | CommonJS-only, no ESM support, large dependency tree | jose |
| dotenv | Manual and error-prone. Does not validate env vars or provide types | @t3-oss/env-core with Zod |
| ESLint + Prettier (separately) | Two tools, complex config, slow. Biome does both faster with zero config | Biome |
| npm / yarn | npm has hoisting issues in monorepos. yarn is fine but pnpm is faster and stricter | pnpm |
| Lerna | Deprecated in spirit. Turborepo and Nx replaced it. Lerna is maintenance mode at best | Turborepo |

## Stack Patterns by Variant

**If deploying API to serverless (Cloudflare Workers, Vercel Edge):**
- Hono runs natively on all edge runtimes -- no code changes needed
- Use Neon's serverless driver (`@neondatabase/serverless`) instead of `postgres` package
- Because Hono was designed for this, unlike Express which needs adapters

**If deploying API to long-running server (Railway, Fly.io, VPS):**
- Use `@hono/node-server` for the Node.js adapter
- Use standard `postgres` package for connection pooling
- Because long-running servers can maintain persistent DB connections

**If adding real-time features later (v2 collaboration):**
- Add Hono WebSocket support or a separate WebSocket server
- Consider Neon's logical replication or Postgres LISTEN/NOTIFY for change detection
- TanStack Query already supports real-time refetching via `refetchInterval` or WebSocket integration

**If the web app grows complex (many views, settings pages):**
- Add Zustand for truly client-side state (theme, sidebar open/close, preferences)
- Keep server state in TanStack Query
- Because mixing server and client state in one store is an anti-pattern

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15 | React 19 | Next.js 15 requires React 19. Do not use React 18 with Next.js 15. |
| Ink 5 | React 18 | Ink uses its own React renderer. It may not yet support React 19 -- verify before installing. CLI and web have separate React versions which is fine in a monorepo. |
| Drizzle ORM | drizzle-kit (same minor) | Keep drizzle-orm and drizzle-kit versions in sync. Breaking changes between mismatched versions. |
| Hono 4 | @hono/node-server 1.x | Use `@hono/node-server` for running Hono on Node.js. Compatible with Hono v4. |
| Tailwind CSS 4 | Next.js 15 | Tailwind v4 changed its configuration system (CSS-based, not JS config). Verify Next.js 15 compatibility as the integration may require `@tailwindcss/postcss`. |
| TanStack Query 5 | React 19 | TanStack Query v5 supports React 19 including Suspense integration. |

## Confidence Notes

| Area | Confidence | Notes |
|------|------------|-------|
| Hono as API framework | MEDIUM | Strong community momentum as of early 2025. Could not verify latest v4 features due to tool access restrictions. Verify current stable version. |
| Drizzle ORM | MEDIUM | Rapidly evolving (pre-1.0). API surface may have changed. Verify latest version and any breaking changes. |
| Next.js 15 + React 19 | MEDIUM | Both were stable as of late 2024. Next.js may be on v15.1+ or even v16 by now. Verify current version. |
| Commander.js for CLI | HIGH | Extremely stable, slow-moving library. v12 is almost certainly still current. |
| Tailwind CSS 4 | MEDIUM | v4 was released early 2025 with major config changes. Verify migration guide and Next.js integration status. |
| @dnd-kit | MEDIUM | Standard recommendation but verify v6 stability. The library had some maintainer activity concerns in late 2024. |
| Ink 5 + React compatibility | LOW | Ink's React version may lag behind. This needs verification at install time. Worst case: Ink 4 with React 18 in the CLI package (separate from web). |
| Neon serverless Postgres | MEDIUM | Growing rapidly but verify pricing and free tier limits for the project's expected usage. |

## IMPORTANT: Version Verification Required

All version numbers in this document are based on training data through early 2025. Before running any `pnpm add` commands, verify current versions:

```bash
# Quick version check for all recommended packages
for pkg in typescript next react hono drizzle-orm commander ink zod tailwindcss @dnd-kit/core @tanstack/react-query vitest @biomejs/biome; do
  echo "$pkg: $(npm view $pkg version)"
done
```

## Sources

- Training data knowledge through early 2025 (MEDIUM confidence)
- Could not access Context7, npm registry, WebSearch, or official docs due to tool restrictions
- All version numbers should be independently verified before use

---
*Stack research for: CLI-first Kanban board (TypeScript full stack)*
*Researched: 2026-03-25*

# Stack Research

**Domain:** CLI-first Kanban board with cloud API and web app (TypeScript full stack)
**Researched:** 2026-03-25
**Confidence:** MEDIUM (versions based on training data through early 2025; verify with `npm view <pkg> version` before installing)

## Recommended Stack

### Monorepo Structure

Use **Turborepo** with **pnpm workspaces**. Three packages: `packages/shared` (types, validation, API contracts), `apps/cli`, `apps/api`, `apps/web`. This is the standard approach for TypeScript full-stack projects because it enables shared types/validation between all three surfaces with zero duplication.

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | ~5.7 | Language across all packages | Project constraint. Enables shared types between CLI, API, and web. |
| Node.js | >=20 LTS | Runtime for CLI and API | LTS with native ESM, fetch API, stable test runner. v20 is the current LTS line. |
| pnpm | ^9.x | Package manager | Fastest installs, strict dependency resolution, best monorepo workspace support. npm hoists incorrectly; yarn is fine but pnpm won. |
| Turborepo | ^2.x | Monorepo build orchestration | Caches builds across packages, handles dependency graph. Simpler than Nx for this scale. |

### CLI (`apps/cli`)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Commander.js | ^12.x | Command parsing and routing | The standard Node.js CLI framework. Mature, TypeScript-native, zero magic. Oclif is overkill for a product CLI (it is for building CLI frameworks). |
| Ink | ^5.x | Rich terminal UI (tables, spinners, colors) | React for the terminal. Enables beautiful output for board views. The project already uses React on web, so same mental model. |
| conf | ^13.x | Local config storage (auth tokens, defaults) | Stores JWT tokens and user preferences in OS-appropriate config dir. Simple key-value, no custom file management. |
| open | ^10.x | Open browser for auth flow | Opens default browser for the `gh auth login`-style OAuth flow. Cross-platform. |
| chalk | ^5.x | Terminal string styling | Color output for labels, statuses, warnings. ESM-native. |

### API (`apps/api`)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Hono | ^4.x | HTTP framework | Lightweight, TypeScript-first, type-safe routing. Faster and more modern than Express. Built-in middleware for CORS, JWT, validation. Runs on Node.js, Cloudflare Workers, Bun -- keeps deployment options open. |
| Drizzle ORM | ^0.35+ | Database ORM and query builder | TypeScript-first, SQL-like API, zero runtime overhead. Generates migrations from schema. Prisma has heavier runtime and slower cold starts; Drizzle is the modern choice for type-safe SQL. |
| PostgreSQL | 16 | Primary database | The industry standard relational DB for structured data. The workspace/board/column/item hierarchy maps perfectly to relational schema with foreign keys and ordering. |
| Zod | ^3.23+ | Runtime validation and API contracts | Define once, validate everywhere. Shared between CLI (response parsing), API (request validation), and web (form validation). Hono has first-class Zod integration via `@hono/zod-validator`. |
| jose | ^5.x | JWT handling | Lightweight JWT library for token creation/verification. No native dependencies, ESM-native. Better than jsonwebtoken which is CJS-only. |
| @hono/zod-openapi | ^0.16+ | OpenAPI spec generation from Zod schemas | Auto-generates OpenAPI docs from your Zod validators. Single source of truth for API contracts. |

### Web App (`apps/web`)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | ^15.x | React framework | App Router is stable. Server Components for initial board loads, Client Components for drag-and-drop interactivity. API routes not needed (separate API server), so Next.js is purely the frontend. |
| React | ^19.x | UI library | Project constraint (Next.js 15 uses React 19). Server Components for data fetching, useOptimistic for instant card moves. |
| Tailwind CSS | ^4.x | Styling | Utility-first CSS. Fast iteration, consistent design, no CSS-in-JS runtime cost. v4 has significant performance improvements. |
| @dnd-kit/core | ^6.x | Drag and drop | The successor to react-beautiful-dnd (deprecated). Accessible, performant, supports Kanban-style column/card dragging. Best React DnD library available. |
| TanStack Query | ^5.x | Server state management | Caches API responses, handles refetching, optimistic updates. Perfect for keeping the web app in sync with the API. No need for Redux or Zustand -- server state is the app state. |
| nuqs | ^2.x | URL search params state | Type-safe URL state for board filters, views. Keeps UI state in the URL where it belongs. |

### Shared Package (`packages/shared`)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Zod | ^3.23+ | Shared validation schemas | Define item/board/column schemas once. API validates requests, CLI validates responses, web validates forms. |
| TypeScript | ~5.7 | Shared type definitions | Exported interfaces consumed by all three apps. Change once, type errors everywhere. |

### Database and Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Neon | - | Serverless PostgreSQL | Serverless Postgres with branching, generous free tier, instant provisioning. Better DX than managing RDS. Drizzle has first-class Neon support. |
| Drizzle Kit | ^0.27+ | Migration tooling | Generates SQL migrations from Drizzle schema changes. Push for dev, migrate for prod. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @hono/zod-validator | ^0.4+ | Request validation middleware | Every API endpoint that accepts input |
| drizzle-zod | ^0.5+ | Generate Zod schemas from Drizzle tables | Bridge between DB schema and API validation |
| nanoid | ^5.x | Short unique IDs | Generate human-friendly IDs for boards, items (e.g., `brd_abc123`) |
| date-fns | ^3.x | Date formatting and manipulation | Due date handling, relative time display |
| bcrypt (or argon2) | latest | Password hashing | User signup/login (email+password auth) |
| tsx | ^4.x | TypeScript execution | Run TS files directly during development without build step |
| @t3-oss/env-core | ^0.11+ | Environment variable validation | Type-safe env vars with Zod schemas, catches missing config at startup |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | Unit and integration testing | Fast, native TypeScript/ESM support, compatible with Jest API. Use across all packages. |
| Biome | Linting and formatting | Single tool replaces ESLint + Prettier. Faster (Rust-based), zero config needed. Opinionated defaults are good. |
| tsup | CLI and API bundling | esbuild-based bundler for Node.js packages. Produces clean ESM output. Not needed for Next.js (it has its own bundler). |
| GitHub Actions | CI/CD | Standard for open-source and small teams. Run tests, lint, build across all packages. |
| Docker Compose | Local development | Run PostgreSQL locally without installing it. One `docker compose up` for the database. |

## Installation

```bash
# Initialize monorepo
pnpm init
pnpm add -Dw turborepo typescript

# Shared package
cd packages/shared
pnpm add zod

# CLI app
cd apps/cli
pnpm add commander ink react chalk conf open
pnpm add -D @types/react tsup tsx

# API app
cd apps/api
pnpm add hono @hono/node-server @hono/zod-validator @hono/zod-openapi drizzle-orm postgres zod jose nanoid bcrypt @t3-oss/env-core
pnpm add -D drizzle-kit @types/bcrypt tsx

# Web app
cd apps/web
pnpm add next react react-dom @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @tanstack/react-query nuqs date-fns
pnpm add -D tailwindcss @types/react @types/react-dom

# Dev tools (workspace root)
pnpm add -Dw vitest @biomejs/biome
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Hono | Express.js | Never for new projects. Express 5 took years and Hono is better in every way for TypeScript APIs. |
| Hono | Fastify | If you need the plugin ecosystem or extreme throughput. Fastify is solid but Hono's TypeScript DX is superior. |
| Drizzle ORM | Prisma | If your team already knows Prisma well. Prisma's runtime is heavier and cold starts are slower, but its migration system is more mature. |
| Commander.js | Oclif | If building a CLI framework for others to extend. Overkill for a product CLI -- too much boilerplate and convention. |
| Commander.js | Yargs | Yargs works fine but Commander's TypeScript types and chainable API are cleaner. Yargs shines for complex argument parsing. |
| Ink | cli-table3 + ora | If you want minimal dependencies and don't need interactive UI. Ink is heavier but produces far better output for Kanban board display. |
| Neon | Supabase | If you also want auth, storage, and realtime built in. Supabase bundles more but Neon is better as a pure Postgres provider -- we want to own our API layer. |
| Neon | Railway/Render Postgres | If you prefer traditional managed Postgres. Neon's serverless model and branching are better for development workflow. |
| Biome | ESLint + Prettier | If you need specific ESLint plugins not yet in Biome. Biome covers 95% of cases faster. |
| TanStack Query | SWR | SWR is lighter but TanStack Query has better mutation handling and optimistic update support, which is critical for drag-and-drop Kanban. |
| @dnd-kit | react-beautiful-dnd | Never. react-beautiful-dnd is deprecated by Atlassian. @dnd-kit is the community standard replacement. |
| Next.js | Vite + React Router | If you don't need SSR. But for a public-facing web app, Next.js gives you SSR, image optimization, and better SEO with less work. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Express.js | Stale ecosystem, poor TypeScript support, no built-in middleware for modern patterns | Hono |
| Prisma | Heavy runtime (~4MB), slow cold starts, generates client code, schema language is not TypeScript | Drizzle ORM |
| react-beautiful-dnd | Officially deprecated by Atlassian, no maintenance | @dnd-kit |
| Redux / Zustand | This app's state is server state (boards, items). Client state management libraries add unnecessary complexity | TanStack Query |
| Mongoose / MongoDB | The data model is deeply relational (workspace > board > column > item with ordering). Document DBs make ordering and cross-entity queries painful | PostgreSQL + Drizzle |
| jsonwebtoken | CommonJS-only, no ESM support, large dependency tree | jose |
| dotenv | Manual and error-prone. Does not validate env vars or provide types | @t3-oss/env-core with Zod |
| ESLint + Prettier (separately) | Two tools, complex config, slow. Biome does both faster with zero config | Biome |
| npm / yarn | npm has hoisting issues in monorepos. yarn is fine but pnpm is faster and stricter | pnpm |
| Lerna | Deprecated in spirit. Turborepo and Nx replaced it. Lerna is maintenance mode at best | Turborepo |

## Stack Patterns by Variant

**If deploying API to serverless (Cloudflare Workers, Vercel Edge):**
- Hono runs natively on all edge runtimes -- no code changes needed
- Use Neon's serverless driver (`@neondatabase/serverless`) instead of `postgres` package
- Because Hono was designed for this, unlike Express which needs adapters

**If deploying API to long-running server (Railway, Fly.io, VPS):**
- Use `@hono/node-server` for the Node.js adapter
- Use standard `postgres` package for connection pooling
- Because long-running servers can maintain persistent DB connections

**If adding real-time features later (v2 collaboration):**
- Add Hono WebSocket support or a separate WebSocket server
- Consider Neon's logical replication or Postgres LISTEN/NOTIFY for change detection
- TanStack Query already supports real-time refetching via `refetchInterval` or WebSocket integration

**If the web app grows complex (many views, settings pages):**
- Add Zustand for truly client-side state (theme, sidebar open/close, preferences)
- Keep server state in TanStack Query
- Because mixing server and client state in one store is an anti-pattern

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15 | React 19 | Next.js 15 requires React 19. Do not use React 18 with Next.js 15. |
| Ink 5 | React 18 | Ink uses its own React renderer. It may not yet support React 19 -- verify before installing. CLI and web have separate React versions which is fine in a monorepo. |
| Drizzle ORM | drizzle-kit (same minor) | Keep drizzle-orm and drizzle-kit versions in sync. Breaking changes between mismatched versions. |
| Hono 4 | @hono/node-server 1.x | Use `@hono/node-server` for running Hono on Node.js. Compatible with Hono v4. |
| Tailwind CSS 4 | Next.js 15 | Tailwind v4 changed its configuration system (CSS-based, not JS config). Verify Next.js 15 compatibility as the integration may require `@tailwindcss/postcss`. |
| TanStack Query 5 | React 19 | TanStack Query v5 supports React 19 including Suspense integration. |

## Confidence Notes

| Area | Confidence | Notes |
|------|------------|-------|
| Hono as API framework | MEDIUM | Strong community momentum as of early 2025. Could not verify latest v4 features due to tool access restrictions. Verify current stable version. |
| Drizzle ORM | MEDIUM | Rapidly evolving (pre-1.0). API surface may have changed. Verify latest version and any breaking changes. |
| Next.js 15 + React 19 | MEDIUM | Both were stable as of late 2024. Next.js may be on v15.1+ or even v16 by now. Verify current version. |
| Commander.js for CLI | HIGH | Extremely stable, slow-moving library. v12 is almost certainly still current. |
| Tailwind CSS 4 | MEDIUM | v4 was released early 2025 with major config changes. Verify migration guide and Next.js integration status. |
| @dnd-kit | MEDIUM | Standard recommendation but verify v6 stability. The library had some maintainer activity concerns in late 2024. |
| Ink 5 + React compatibility | LOW | Ink's React version may lag behind. This needs verification at install time. Worst case: Ink 4 with React 18 in the CLI package (separate from web). |
| Neon serverless Postgres | MEDIUM | Growing rapidly but verify pricing and free tier limits for the project's expected usage. |

## IMPORTANT: Version Verification Required

All version numbers in this document are based on training data through early 2025. Before running any `pnpm add` commands, verify current versions:

```bash
# Quick version check for all recommended packages
for pkg in typescript next react hono drizzle-orm commander ink zod tailwindcss @dnd-kit/core @tanstack/react-query vitest @biomejs/biome; do
  echo "$pkg: $(npm view $pkg version)"
done
```

## Sources

- Training data knowledge through early 2025 (MEDIUM confidence)
- Could not access Context7, npm registry, WebSearch, or official docs due to tool restrictions
- All version numbers should be independently verified before use

---
*Stack research for: CLI-first Kanban board (TypeScript full stack)*
*Researched: 2026-03-25*

