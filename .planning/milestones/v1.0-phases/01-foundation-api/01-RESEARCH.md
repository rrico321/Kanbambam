# Phase 1: Foundation & API - Research

**Researched:** 2026-03-25
**Domain:** Monorepo setup, REST API with Hono + Drizzle + PostgreSQL, JWT auth, fractional indexing
**Confidence:** HIGH

## Summary

This phase establishes the entire project foundation: a pnpm/Turborepo monorepo, a shared Zod schema package, a PostgreSQL database via Neon, and a Hono-based REST API serving full CRUD for the Kanban data model (workspaces, boards, columns, items) with JWT authentication and cursor-based pagination.

The stack is well-documented and has strong community patterns. The "HONC stack" (Hono + ORM/Drizzle + Neon + Cloudflare) is an established pattern with starter templates and tutorials. The key technical decisions are: use `fractional-indexing` (rocicorp) for ordering (not `fraci`, which is incompatible with current Drizzle), Hono's built-in JWT middleware for auth, `@hono/zod-openapi` for type-safe route definitions, and cursor-based pagination using Drizzle's native query builder.

**Primary recommendation:** Follow the hono-open-api-starter pattern (routes/handlers/schemas per feature module) with Drizzle for database access and shared Zod schemas in `packages/shared`. Use `fractional-indexing` v3.2.0 for column/item ordering.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Prefixed nanoid IDs -- every entity gets a 3-letter prefix + underscore + 12 random characters (e.g., `wks_a3bK9xmP2qL1`, `brd_mP2qL1zR4nW8`)
- **D-02:** Prefixes: `wks_` (workspace), `brd_` (board), `col_` (column), `itm_` (item), `usr_` (user)
- **D-03:** IDs only in URLs -- no slugs. Rename doesn't break URLs, no uniqueness constraints on names.
- **D-04:** Envelope format with `data` key. Single: `{ "data": {...}, "meta": { "requestId": "..." } }`. List: `{ "data": [...], "meta": { "total": 42, "cursor": "..." } }`
- **D-05:** Structured error objects: `{ "error": { "code": "ITEM_NOT_FOUND", "message": "Item not found", "details": {...} } }`. Machine-parseable code for CLI, human message for display.
- **D-06:** Nested REST routes following hierarchy: `/api/v1/workspaces/:id/boards`, `/api/v1/boards/:id/columns`, `/api/v1/columns/:id/items`
- **D-07:** Pragmatic REST -- standard CRUD verbs (GET/POST/PATCH/DELETE) plus action endpoints where natural (e.g., `POST /items/:id/move`)
- **D-08:** URL-based versioning: all routes under `/api/v1/` prefix
- **D-09:** Hard delete -- data is permanently removed on delete. No soft-delete, no trash.
- **D-10:** Cursor-based pagination on all list endpoints (`?cursor=abc&limit=20`). Stable with concurrent changes.
- **D-11:** Empty start on signup -- no default workspace or board auto-created.

### Claude's Discretion
- Fractional indexing implementation details (library choice, index format)
- Database schema design (table structure, indexes, constraints)
- JWT token structure and expiry settings
- Hono middleware organization
- Zod schema structure in shared package
- Monorepo workspace configuration

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| API-01 | REST API serving all CRUD operations for workspaces, boards, columns, and items | Hono + @hono/zod-openapi route pattern, Drizzle ORM for DB access, feature-module route organization |
| API-02 | JWT-based authentication for both CLI and web clients | Hono built-in JWT middleware (`hono/jwt`), jose for token creation, argon2 for password hashing |
| API-03 | Fractional indexing for item and column ordering (no reindex on every move) | `fractional-indexing` v3.2.0 by rocicorp -- `generateKeyBetween` and `generateNKeysBetween` |
| API-04 | Pagination on list endpoints | Cursor-based pagination with Drizzle `gt()` + `limit()` + `orderBy()` pattern, opaque base64-encoded cursors |
| AUTH-06 | User session stays active across browser refresh (JWT) | JWT access tokens with refresh token rotation; tokens stored client-side survive refresh |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **TypeScript everywhere** -- CLI, API, Web all TypeScript
- **Hono** for API (not Express, not Fastify)
- **Drizzle ORM** (not Prisma)
- **PostgreSQL** via Neon
- **pnpm** + **Turborepo** for monorepo
- **Zod** for validation shared across all packages
- **jose** for JWT (not jsonwebtoken)
- **Vitest** for testing
- **Biome** for linting/formatting (not ESLint+Prettier)
- **nanoid** for ID generation
- **@t3-oss/env-core** for env var validation (not dotenv)
- **tsup** for bundling Node.js packages

## Standard Stack

### Core (Phase 1 packages)

| Library | Verified Version | Purpose | Why Standard |
|---------|-----------------|---------|--------------|
| TypeScript | 6.0.2 | Language | Project constraint |
| pnpm | 10.33.0 | Package manager | Project constraint. NOT currently installed -- must install first |
| Turborepo | 2.8.20 | Build orchestration | Project constraint |
| Hono | 4.12.9 | HTTP framework | Project constraint. TypeScript-first, built-in JWT/CORS middleware |
| @hono/node-server | 1.19.11 | Node.js adapter for Hono | Required to run Hono on Node.js |
| @hono/zod-openapi | 1.2.3 | OpenAPI route definitions | Type-safe routes with auto-generated OpenAPI docs |
| @hono/zod-validator | 0.7.6 | Request validation | Zod-based request validation middleware for Hono |
| Drizzle ORM | 0.45.1 | Database ORM | Project constraint. TypeScript-first SQL builder |
| Drizzle Kit | 0.31.10 | Migration tooling | Schema-driven migration generation |
| drizzle-zod | 0.8.3 | Drizzle-to-Zod bridge | Generate Zod schemas from Drizzle table definitions |
| @neondatabase/serverless | 1.0.2 | Neon PostgreSQL driver | Serverless-compatible Postgres driver for Neon |
| Zod | 4.3.6 | Validation | Project constraint. Shared schemas across all packages |
| jose | 6.2.2 | JWT creation/verification | Project constraint. ESM-native JWT library |
| nanoid | 5.1.7 | ID generation | Prefixed IDs per D-01/D-02 |
| fractional-indexing | 3.2.0 | Ordering | Fractional index keys for column/item ordering |
| argon2 | 0.44.0 | Password hashing | Secure password hashing for auth |
| @t3-oss/env-core | 0.13.11 | Env var validation | Project constraint. Type-safe env vars |

### Development Tools (Phase 1)

| Tool | Verified Version | Purpose |
|------|-----------------|---------|
| Vitest | 4.1.1 | Testing |
| Biome | 2.4.9 | Linting and formatting |
| tsup | 8.5.1 | Bundling CLI and API packages |
| tsx | 4.21.0 | TypeScript execution in dev |

### Important Version Notes

- **Zod 4.x is now current** (4.3.6). The CLAUDE.md references ^3.23+ but Zod 4 is the latest. Verify `@hono/zod-openapi` and `drizzle-zod` compatibility with Zod 4 before installing. If incompatible, pin Zod to 3.x.
- **TypeScript 6.0.2** is current (CLAUDE.md says ~5.7). Use latest unless compatibility issues arise.
- **fraci** (Drizzle-integrated fractional indexing) requires `drizzle-orm >= 0.30.0 < 0.45.0` but current Drizzle is 0.45.1 -- **incompatible**. Use `fractional-indexing` instead.

**Installation:**
```bash
# Install pnpm first (not currently on this machine)
corepack enable && corepack prepare pnpm@latest --activate

# Or via npm
npm install -g pnpm
```

## Architecture Patterns

### Recommended Monorepo Structure
```
kanbambam/
  apps/
    api/
      src/
        index.ts              # @hono/node-server entry point
        app.ts                # Hono app setup, middleware, route mounting
        env.ts                # @t3-oss/env-core config
        db/
          index.ts            # Drizzle client instance
          schema.ts           # All Drizzle table definitions
          migrations/         # Generated SQL migrations
        middleware/
          auth.ts             # JWT verification middleware
          error-handler.ts    # Global error handling
        routes/
          workspaces/
            workspaces.routes.ts    # OpenAPI route definitions
            workspaces.handlers.ts  # Request handlers
            workspaces.test.ts      # Tests
          boards/
            boards.routes.ts
            boards.handlers.ts
            boards.test.ts
          columns/
            columns.routes.ts
            columns.handlers.ts
            columns.test.ts
          items/
            items.routes.ts
            items.handlers.ts
            items.test.ts
          auth/
            auth.routes.ts
            auth.handlers.ts
            auth.test.ts
        lib/
          pagination.ts       # Cursor encode/decode helpers
          id.ts               # Prefixed nanoid generators
          fractional-index.ts # Fractional indexing helpers
      drizzle.config.ts       # Drizzle Kit config
      tsconfig.json
      package.json
  packages/
    shared/
      src/
        schemas/              # Zod schemas for all entities
          workspace.ts
          board.ts
          column.ts
          item.ts
          user.ts
          common.ts           # Pagination, envelope, error schemas
        types/                # Inferred TypeScript types
          index.ts
        index.ts              # Package entry point
      tsconfig.json
      package.json
  turbo.json
  pnpm-workspace.yaml
  biome.json
  docker-compose.yml          # Local PostgreSQL for dev
  package.json                # Root workspace config
```

### Pattern 1: OpenAPI Route Definitions with @hono/zod-openapi

**What:** Define routes as OpenAPI specs with Zod schemas for request/response validation
**When to use:** Every API endpoint

```typescript
// Source: https://hono.dev/examples/zod-openapi
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from '@hono/zod-openapi'

// Define param schema with OpenAPI metadata
const WorkspaceParamsSchema = z.object({
  id: z.string().min(16).openapi({
    param: { name: 'id', in: 'path' },
    example: 'wks_a3bK9xmP2qL1',
  }),
})

// Define the route
const getWorkspaceRoute = createRoute({
  method: 'get',
  path: '/api/v1/workspaces/{id}',
  request: { params: WorkspaceParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: WorkspaceResponseSchema } },
      description: 'Retrieve workspace',
    },
    404: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Workspace not found',
    },
  },
})

// Register route with handler
app.openapi(getWorkspaceRoute, async (c) => {
  const { id } = c.req.valid('param')
  // ... handler logic
  return c.json({ data: workspace, meta: { requestId: c.get('requestId') } })
})
```

### Pattern 2: Prefixed Nanoid Generation

**What:** Generate entity IDs with type-specific prefixes per D-01/D-02
**When to use:** Every entity creation

```typescript
// lib/id.ts
import { nanoid } from 'nanoid'

const PREFIXES = {
  workspace: 'wks',
  board: 'brd',
  column: 'col',
  item: 'itm',
  user: 'usr',
} as const

type EntityType = keyof typeof PREFIXES

export function generateId(type: EntityType): string {
  return `${PREFIXES[type]}_${nanoid(12)}`
}
```

### Pattern 3: Cursor-Based Pagination

**What:** Encode/decode opaque cursors for stable pagination per D-10
**When to use:** All list endpoints

```typescript
// lib/pagination.ts
export function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64url')
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64url').toString()
}

// In a handler:
import { gt, asc } from 'drizzle-orm'

async function listWorkspaces(userId: string, cursor?: string, limit = 20) {
  const decodedCursor = cursor ? decodeCursor(cursor) : undefined

  const results = await db
    .select()
    .from(workspaces)
    .where(and(
      eq(workspaces.userId, userId),
      decodedCursor ? gt(workspaces.id, decodedCursor) : undefined,
    ))
    .orderBy(asc(workspaces.id))
    .limit(limit + 1) // Fetch one extra to detect next page

  const hasMore = results.length > limit
  const items = hasMore ? results.slice(0, limit) : results
  const nextCursor = hasMore ? encodeCursor(items[items.length - 1].id) : null

  return {
    data: items,
    meta: {
      total: await getCount(workspaces, userId),
      cursor: nextCursor,
    },
  }
}
```

### Pattern 4: Fractional Indexing for Ordering

**What:** Use string-based fractional indices for column and item ordering per API-03
**When to use:** Creating/reordering columns and items

```typescript
// lib/fractional-index.ts
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'

// Append item to end of list
export function appendPosition(lastPosition: string | null): string {
  return generateKeyBetween(lastPosition, null)
}

// Insert between two items
export function insertBetween(before: string | null, after: string | null): string {
  return generateKeyBetween(before, after)
}

// Generate positions for N new items (e.g., default columns)
export function generatePositions(count: number, after?: string | null): string[] {
  return generateNKeysBetween(after ?? null, null, count)
}
```

**Database column:** Store as `text` type, sort with native string comparison (`ORDER BY position ASC`). PostgreSQL's default text comparison is binary/case-sensitive, which matches the library's requirements.

### Pattern 5: JWT Auth Middleware

**What:** Protect all data routes with JWT verification
**When to use:** Applied to `/api/v1/*` routes (except auth endpoints)

```typescript
// middleware/auth.ts
import { jwt } from 'hono/jwt'
import type { JwtVariables } from 'hono/jwt'

type Variables = JwtVariables

// Apply to all protected routes
app.use('/api/v1/workspaces/*', jwt({ secret: env.JWT_SECRET }))
app.use('/api/v1/boards/*', jwt({ secret: env.JWT_SECRET }))
app.use('/api/v1/columns/*', jwt({ secret: env.JWT_SECRET }))
app.use('/api/v1/items/*', jwt({ secret: env.JWT_SECRET }))

// In handlers, get user from token
app.get('/api/v1/workspaces', (c) => {
  const payload = c.get('jwtPayload')
  const userId = payload.sub // usr_xxxxxxxxxxxx
  // ... query workspaces for this user
})
```

### Pattern 6: Drizzle Schema with Relations

**What:** Define the Kanban data model in Drizzle with proper foreign keys and cascading deletes
**When to use:** Database schema definition

```typescript
// db/schema.ts
import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: text('id').primaryKey(), // usr_xxxxxxxxxxxx
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(), // wks_xxxxxxxxxxxx
  name: text('name').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('workspaces_user_id_idx').on(t.userId),
])

export const boards = pgTable('boards', {
  id: text('id').primaryKey(), // brd_xxxxxxxxxxxx
  name: text('name').notNull(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('boards_workspace_id_idx').on(t.workspaceId),
])

export const columns = pgTable('columns', {
  id: text('id').primaryKey(), // col_xxxxxxxxxxxx
  name: text('name').notNull(),
  position: text('position').notNull(), // fractional index
  boardId: text('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('columns_board_id_position_idx').on(t.boardId, t.position),
])

export const items = pgTable('items', {
  id: text('id').primaryKey(), // itm_xxxxxxxxxxxx
  title: text('title').notNull(),
  description: text('description'),
  position: text('position').notNull(), // fractional index
  columnId: text('column_id').notNull().references(() => columns.id, { onDelete: 'cascade' }),
  dueDate: timestamp('due_date'),
  labels: text('labels').array(), // simple string array for v1
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('items_column_id_position_idx').on(t.columnId, t.position),
])
```

### Anti-Patterns to Avoid
- **Integer positions for ordering:** Requires reindexing all siblings on every insert/move. Use fractional indexing instead.
- **Offset-based pagination:** Skips/duplicates rows during concurrent writes. Use cursor-based per D-10.
- **Storing JWTs in the database:** Defeats the purpose of stateless tokens. Store only refresh tokens if implementing rotation.
- **One giant schema file:** Split by entity but keep all tables in one directory for Drizzle Kit migration generation.
- **Importing Hono's JWT helpers for token creation:** Hono's JWT middleware is for verification only. Use `jose` for creating tokens (signing).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fractional ordering | Custom float/integer position system | `fractional-indexing` v3.2.0 | Handles edge cases (beginning, end, between identical positions), variable-length encoding, mathematically proven ordering |
| JWT creation/verification | Custom crypto code | `jose` for creation, `hono/jwt` middleware for verification | Timing-safe comparison, proper algorithm handling, claim validation |
| Password hashing | bcrypt/scrypt wrapper | `argon2` v0.44.0 | Winner of Password Hashing Competition, memory-hard, configurable |
| ID generation | UUID or custom random | `nanoid` v5.1.7 with prefix wrapper | URL-safe, shorter than UUID, configurable alphabet/length |
| Request validation | Manual validation in handlers | `@hono/zod-openapi` route definitions | Validates automatically, generates OpenAPI docs, type-safe responses |
| Env var loading | Manual process.env access | `@t3-oss/env-core` with Zod schemas | Type-safe, fails at startup if missing, no runtime surprises |
| Database migrations | Manual SQL files | Drizzle Kit (`drizzle-kit generate` / `drizzle-kit migrate`) | Schema-driven, diffable, reversible |

**Key insight:** This stack was chosen precisely because these libraries compose well together. Hono + Zod OpenAPI + Drizzle + drizzle-zod forms a type-safe pipeline from database to API response with zero gaps.

## Common Pitfalls

### Pitfall 1: Zod 4 vs Zod 3 Compatibility
**What goes wrong:** Installing Zod 4 (current latest) when ecosystem packages expect Zod 3
**Why it happens:** Zod 4 was recently released (4.3.6 current), but `@hono/zod-openapi`, `drizzle-zod`, and `@t3-oss/env-core` may require Zod 3.x
**How to avoid:** Check peer dependencies before installing. If any package requires Zod 3, pin to `zod@^3.24` across the monorepo. Test imports before proceeding.
**Warning signs:** Type errors in Zod schema definitions, "cannot find module" errors from middleware packages

### Pitfall 2: Fractional Index Collisions
**What goes wrong:** Two concurrent insertions at the same position produce identical fractional indices
**Why it happens:** `fractional-indexing` is deterministic -- same inputs produce same outputs
**How to avoid:** Add a unique constraint on `(parent_id, position)` in the database. On collision (unique constraint violation), re-read adjacent positions and regenerate. For single-user v1, this is extremely unlikely but the constraint should exist for safety.
**Warning signs:** Duplicate key errors on insert

### Pitfall 3: Drizzle Kit Version Mismatch
**What goes wrong:** Migration generation fails or produces incorrect SQL
**Why it happens:** `drizzle-orm` and `drizzle-kit` versions drift apart
**How to avoid:** Always install both together: `pnpm add drizzle-orm@latest drizzle-kit@latest`
**Warning signs:** "Schema not found" errors, unexpected migration diffs

### Pitfall 4: Missing Cascade on Foreign Keys
**What goes wrong:** Deleting a workspace leaves orphaned boards, columns, items
**Why it happens:** Forgetting `onDelete: 'cascade'` on foreign key references
**How to avoid:** Every child table must have `onDelete: 'cascade'` on its parent reference. D-09 mandates hard delete, so cascades are essential.
**Warning signs:** Foreign key constraint violations on delete

### Pitfall 5: Case-Sensitive Fractional Index Sorting
**What goes wrong:** Items appear in wrong order
**Why it happens:** Using `localeCompare()` or case-insensitive collation for sorting fractional index strings
**How to avoid:** Use PostgreSQL's default `text` comparison (binary/case-sensitive) which matches `fractional-indexing`'s expected sort behavior. In application code, use native `<`/`>` comparison, never `localeCompare()`.
**Warning signs:** Items with uppercase keys appearing before lowercase ones unexpectedly

### Pitfall 6: Circular Import Between Shared Package and API
**What goes wrong:** Build fails or produces runtime errors
**Why it happens:** API imports from shared, but shared imports something from API
**How to avoid:** Shared package is pure schemas/types with zero dependencies on app packages. One-way dependency only: `apps/api` -> `packages/shared`, never the reverse.
**Warning signs:** "Cannot resolve module" during build, circular dependency warnings from Turborepo

### Pitfall 7: Neon Cold Start on Free Tier
**What goes wrong:** First request after idle period takes 3-5 seconds
**Why it happens:** Neon scales to zero after 5 minutes of inactivity on the free tier
**How to avoid:** This is expected behavior for development. For tests, use a local PostgreSQL via Docker Compose. In production, upgrade to a paid plan or accept the cold start.
**Warning signs:** Intermittent timeout errors in integration tests

## Code Examples

### Complete Route Module Example

```typescript
// routes/workspaces/workspaces.routes.ts
// Source: Pattern derived from https://github.com/w3cj/hono-open-api-starter
import { createRoute, z } from '@hono/zod-openapi'
import { WorkspaceSchema, CreateWorkspaceSchema } from '@kanbambam/shared'

export const listWorkspacesRoute = createRoute({
  method: 'get',
  path: '/api/v1/workspaces',
  request: {
    query: z.object({
      cursor: z.string().optional(),
      limit: z.coerce.number().min(1).max(100).default(20),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(WorkspaceSchema),
            meta: z.object({
              total: z.number(),
              cursor: z.string().nullable(),
            }),
          }),
        },
      },
      description: 'List of workspaces',
    },
  },
})

export const createWorkspaceRoute = createRoute({
  method: 'post',
  path: '/api/v1/workspaces',
  request: {
    body: {
      content: {
        'application/json': { schema: CreateWorkspaceSchema },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: z.object({
            data: WorkspaceSchema,
            meta: z.object({ requestId: z.string() }),
          }),
        },
      },
      description: 'Created workspace',
    },
  },
})
```

### Drizzle Client Setup with Neon

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'
import { env } from '../env'

const sql = neon(env.DATABASE_URL)
export const db = drizzle(sql, { schema })
```

### Environment Validation

```typescript
// env.ts
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRY: z.string().default('15m'),
    REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  runtimeEnv: process.env,
})
```

### Error Handler Middleware

```typescript
// middleware/error-handler.ts
import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HTTPException) {
    return c.json({
      error: {
        code: err.message,
        message: err.message,
        details: {},
      },
    }, err.status)
  }

  console.error(err)
  return c.json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: {},
    },
  }, 500)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Express.js | Hono v4 | 2024-2025 | TypeScript-first, built-in middleware, multi-runtime |
| Prisma | Drizzle ORM 0.45 | 2024-2025 | No code generation, SQL-like API, lighter runtime |
| jsonwebtoken | jose v6 | 2024 | ESM-native, no native deps |
| Zod 3 | Zod 4 (4.3.6) | 2025 | Performance improvements, new API features -- but check ecosystem compatibility |
| Integer positions | Fractional indexing | N/A (pattern) | No reindex, concurrent-safe ordering |
| Offset pagination | Cursor pagination | N/A (pattern) | Stable results, no skip/duplicate |

**Deprecated/outdated:**
- `drizzle-zod` with Zod 4 may need the latest version -- verify compatibility
- TypeScript 5.7 in CLAUDE.md is outdated; 6.0.2 is current

## Open Questions

1. **Zod 3 vs Zod 4 ecosystem compatibility**
   - What we know: Zod 4.3.6 is latest; Hono and Drizzle ecosystem packages historically target Zod 3
   - What's unclear: Whether `@hono/zod-openapi@1.2.3`, `drizzle-zod@0.8.3`, and `@t3-oss/env-core@0.13.11` work with Zod 4
   - Recommendation: Test with Zod 4 first. If any package fails, pin to `zod@^3.24`. This should be Wave 0 validation.

2. **Neon driver choice: HTTP vs WebSocket**
   - What we know: `@neondatabase/serverless` supports both HTTP (`neon()`) and WebSocket (`Pool`) modes
   - What's unclear: Whether HTTP mode has connection limits that affect development
   - Recommendation: Use HTTP mode (`neon()`) for simplicity in v1. WebSocket/pooling only needed for high concurrency.

3. **Refresh token strategy**
   - What we know: AUTH-06 requires sessions surviving browser refresh. Short-lived JWTs need refresh mechanism.
   - What's unclear: Whether to implement refresh tokens in Phase 1 or use longer-lived tokens
   - Recommendation: Implement refresh token rotation in Phase 1. Store refresh tokens in DB, issue short-lived access tokens (15min) + long-lived refresh tokens (7 days). This is the auth endpoint the CLI will also need in Phase 2.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes | v24.13.0 | -- |
| pnpm | Package management | **No** | -- | Install via `corepack enable && corepack prepare pnpm@latest --activate` or `npm i -g pnpm` |
| Docker | Local PostgreSQL | Yes | 29.2.1 | Use Neon cloud DB directly (no local DB) |
| PostgreSQL (psql) | DB client | Yes | 18.1 | Use Drizzle Studio for DB inspection |
| Turborepo | Build orchestration | No (not global) | -- | Installed as devDependency via pnpm, run via `pnpm turbo` |

**Missing dependencies with no fallback:**
- pnpm must be installed before any work can begin (blocks all package installation)

**Missing dependencies with fallback:**
- Turborepo runs as a local dependency (no global install needed)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 |
| Config file | None -- Wave 0 must create `vitest.config.ts` in `apps/api` |
| Quick run command | `pnpm --filter api test` |
| Full suite command | `pnpm turbo test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-01 | CRUD for workspaces, boards, columns, items | integration | `pnpm --filter api test -- --run routes/` | Wave 0 |
| API-02 | JWT auth rejects unauthenticated requests | integration | `pnpm --filter api test -- --run middleware/auth` | Wave 0 |
| API-03 | Fractional indexing generates correct positions | unit | `pnpm --filter api test -- --run lib/fractional-index` | Wave 0 |
| API-04 | Cursor pagination returns correct pages | unit + integration | `pnpm --filter api test -- --run lib/pagination` | Wave 0 |
| AUTH-06 | JWT tokens survive browser refresh | integration | `pnpm --filter api test -- --run routes/auth` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter api test --run`
- **Per wave merge:** `pnpm turbo test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/vitest.config.ts` -- Vitest configuration
- [ ] `apps/api/src/test-helpers/` -- DB setup/teardown, test JWT generator, Hono test client
- [ ] Framework install: `pnpm add -D vitest @vitest/coverage-v8 --filter api`
- [ ] Docker Compose for test database or Neon branch for testing

## Sources

### Primary (HIGH confidence)
- npm registry -- all package versions verified via `npm view` (2026-03-25)
- [Hono JWT Middleware docs](https://hono.dev/docs/middleware/builtin/jwt) -- auth pattern
- [Hono Zod OpenAPI docs](https://hono.dev/examples/zod-openapi) -- route definition pattern
- [Drizzle cursor-based pagination guide](https://orm.drizzle.team/docs/guides/cursor-based-pagination) -- pagination pattern
- [rocicorp/fractional-indexing README](https://github.com/rocicorp/fractional-indexing/blob/main/README.md) -- API and usage

### Secondary (MEDIUM confidence)
- [hono-open-api-starter](https://github.com/w3cj/hono-open-api-starter) -- project structure pattern
- [Neon pricing](https://neon.com/pricing) -- free tier: 100 CU-hours/month, 0.5 GB storage, scale-to-zero at 5min
- [fraci GitHub](https://github.com/SegaraRai/fraci) -- evaluated but incompatible with Drizzle 0.45.1

### Tertiary (LOW confidence)
- Zod 4 compatibility with ecosystem -- needs validation at install time

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry
- Architecture: HIGH -- patterns sourced from official docs and established starter templates
- Pitfalls: HIGH -- based on documented issues and version compatibility checks
- Fractional indexing: HIGH -- library API verified from official README
- Zod 4 compatibility: LOW -- must test at install time

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (30 days -- stack is stable, Drizzle moves fast so recheck if delayed)
