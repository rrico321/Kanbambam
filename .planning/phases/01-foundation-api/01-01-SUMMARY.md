---
phase: 01-foundation-api
plan: 01
subsystem: infra
tags: [pnpm, turborepo, biome, drizzle, zod, postgresql, monorepo, typescript]

# Dependency graph
requires: []
provides:
  - pnpm/Turborepo monorepo with apps/* and packages/* workspace layout
  - "@kanbambam/shared" package exporting Zod schemas and inferred types for all entities
  - Drizzle schema with 6 tables (users, refreshTokens, workspaces, boards, columns, items)
  - Docker Compose for local PostgreSQL 16
  - Base TypeScript config with strict mode and bundler resolution
  - Biome linting and formatting config
  - Environment variable validation with @t3-oss/env-core
affects: [01-02, 01-03, 01-04, 02-01, 02-02, 03-01, 05-01]

# Tech tracking
tech-stack:
  added: [pnpm, turborepo, biome, typescript, zod, drizzle-orm, drizzle-kit, hono, jose, argon2, nanoid, fractional-indexing, "@t3-oss/env-core", "@hono/zod-openapi", "@hono/zod-validator", "@neondatabase/serverless", tsx, tsup, vitest]
  patterns: [pnpm-workspaces, turborepo-task-pipeline, zod-schema-first-validation, drizzle-pg-schema, env-validation]

key-files:
  created:
    - package.json
    - pnpm-workspace.yaml
    - turbo.json
    - biome.json
    - docker-compose.yml
    - .env.example
    - .gitignore
    - tsconfig.base.json
    - packages/shared/package.json
    - packages/shared/tsconfig.json
    - packages/shared/src/index.ts
    - packages/shared/src/schemas/common.ts
    - packages/shared/src/schemas/user.ts
    - packages/shared/src/schemas/workspace.ts
    - packages/shared/src/schemas/board.ts
    - packages/shared/src/schemas/column.ts
    - packages/shared/src/schemas/item.ts
    - packages/shared/src/types/index.ts
    - apps/api/package.json
    - apps/api/tsconfig.json
    - apps/api/drizzle.config.ts
    - apps/api/src/db/schema.ts
    - apps/api/src/env.ts
    - apps/api/src/index.ts
  modified: []

key-decisions:
  - "Biome 2.4.9 migrated config format (organizeImports moved to assist.actions.source)"
  - "Added files.includes to biome.json to scope linting to apps/ and packages/ only"
  - "Used onlyBuiltDependencies in pnpm-workspace.yaml for argon2 and esbuild native builds"
  - "Removed deprecated version key from docker-compose.yml"

patterns-established:
  - "Monorepo layout: apps/* for deployable services, packages/* for shared libraries"
  - "Shared Zod schemas define API contract once, consumed by all packages"
  - "Drizzle schema uses text IDs with prefixed nanoid convention (usr_, wks_, brd_, col_, itm_)"
  - "Position columns stored as text for fractional indexing"
  - "Cascading deletes on all parent-child foreign keys"
  - "Environment validation at startup via @t3-oss/env-core with Zod schemas"

requirements-completed: [API-01, API-03]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 1 Plan 1: Monorepo + Shared Schemas + DB Schema Summary

**pnpm/Turborepo monorepo with shared Zod schema package and Drizzle PostgreSQL schema for all 6 tables**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-26T03:52:42Z
- **Completed:** 2026-03-26T03:57:00Z
- **Tasks:** 2
- **Files modified:** 24

## Accomplishments
- Monorepo initialized with pnpm workspaces, Turborepo build pipeline, and Biome linting/formatting
- Shared package (@kanbambam/shared) exporting Zod schemas for user, workspace, board, column, item entities plus common envelope/pagination/error schemas
- API package with Drizzle schema defining all 6 tables (users, refreshTokens, workspaces, boards, columns, items) with cascading deletes, position columns as text for fractional indexing, and appropriate indexes
- Docker Compose for local PostgreSQL 16 development
- Environment variable validation with @t3-oss/env-core

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize monorepo with pnpm, Turborepo, Biome, and Docker Compose** - `9aea088` (chore)
2. **Task 2: Create shared package with Zod schemas and types, plus API database schema** - `39604d3` (feat)

## Files Created/Modified
- `package.json` - Root monorepo config with turbo/biome scripts
- `pnpm-workspace.yaml` - Workspace layout (apps/*, packages/*) with build approvals
- `turbo.json` - Build/dev/test/lint task pipeline
- `biome.json` - Linting and formatting (v2.4.9, tabs, single quotes)
- `docker-compose.yml` - PostgreSQL 16 for local dev
- `.env.example` - Environment variable template
- `.gitignore` - Standard Node.js ignores
- `tsconfig.base.json` - Shared TypeScript config (strict, ES2022, bundler)
- `packages/shared/src/schemas/common.ts` - Envelope, pagination, error response schemas
- `packages/shared/src/schemas/user.ts` - User, CreateUser, Login, AuthTokens schemas
- `packages/shared/src/schemas/workspace.ts` - Workspace CRUD schemas
- `packages/shared/src/schemas/board.ts` - Board CRUD schemas
- `packages/shared/src/schemas/column.ts` - Column CRUD schemas with position
- `packages/shared/src/schemas/item.ts` - Item CRUD schemas with move, labels, due date
- `packages/shared/src/types/index.ts` - Inferred TypeScript types from all Zod schemas
- `packages/shared/src/index.ts` - Barrel export for all schemas and types
- `apps/api/src/db/schema.ts` - Drizzle table definitions (6 tables, cascading deletes, indexes)
- `apps/api/src/env.ts` - @t3-oss/env-core validation for DATABASE_URL, JWT_SECRET, etc.
- `apps/api/drizzle.config.ts` - Drizzle Kit migration configuration

## Decisions Made
- Biome 2.4.9 uses different config format than 2.0.0; migrated via `biome migrate`
- Added `files.includes` to biome.json to scope linting to project code only (exclude .planning/, .claude/)
- Used `onlyBuiltDependencies` in pnpm-workspace.yaml for argon2 and esbuild native compilation
- Removed deprecated `version` key from docker-compose.yml (modern Docker Compose does not need it)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Biome 2.4.9 config migration**
- **Found during:** Task 1 (biome check verification)
- **Issue:** Plan specified Biome schema 2.0.0, but installed version is 2.4.9 with incompatible config format (organizeImports key moved, ignore key renamed)
- **Fix:** Ran `biome migrate --write` to update schema and key names. Added `files.includes` to replace removed `ignore` key.
- **Files modified:** biome.json
- **Verification:** `pnpm biome check .` passes with no config errors
- **Committed in:** 39604d3 (Task 2 commit)

**2. [Rule 3 - Blocking] pnpm onlyBuiltDependencies for argon2/esbuild**
- **Found during:** Task 2 (pnpm install)
- **Issue:** pnpm v10 blocks native build scripts by default; argon2 and esbuild need compilation
- **Fix:** Added `onlyBuiltDependencies: [argon2, esbuild]` to pnpm-workspace.yaml
- **Files modified:** pnpm-workspace.yaml
- **Verification:** `pnpm install` completes without warnings
- **Committed in:** 39604d3 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for tooling to work. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Known Stubs
- `apps/api/src/index.ts` - Placeholder entry point that only re-exports env. Will be implemented in plan 01-02 (Hono server setup).

## Next Phase Readiness
- Monorepo structure ready for all subsequent plans
- Shared schemas available for import in API route handlers (plan 01-02, 01-03)
- Drizzle schema ready for migration and CRUD implementation (plan 01-02)
- Docker Compose ready for local database (run `docker compose up -d` before plan 01-02)

## Self-Check: PASSED

All 12 key files verified present. Both task commits (9aea088, 39604d3) verified in git log.

---
*Phase: 01-foundation-api*
*Completed: 2026-03-25*
