# Architecture Research

**Domain:** CLI-first Kanban board with cloud API and web app
**Researched:** 2026-03-25
**Confidence:** HIGH (established patterns from gh CLI, Vercel CLI, Linear CLI, Turborepo monorepos)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Layer                               │
│  ┌──────────────┐                        ┌──────────────┐       │
│  │  CLI (Node)  │                        │  Web (React)  │      │
│  │  kanbambam   │                        │  Next.js App  │      │
│  └──────┬───────┘                        └──────┬────────┘      │
│         │ HTTPS                                 │ HTTPS         │
├─────────┴───────────────────────────────────────┴───────────────┤
│                      API Layer                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  REST API (Node.js)                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │   │
│  │  │  Auth    │  │  Routes  │  │  Middleware│              │   │
│  │  └──────────┘  └────┬─────┘  └──────────┘               │   │
│  │                     │                                     │   │
│  │              ┌──────┴──────┐                              │   │
│  │              │  Services   │                              │   │
│  │              └──────┬──────┘                              │   │
│  └─────────────────────┼────────────────────────────────────┘   │
├─────────────────────────┼───────────────────────────────────────┤
│                      Data Layer                                 │
│  ┌──────────────────────┴───────────────────────────────────┐   │
│  │                   PostgreSQL                              │   │
│  │  Users / Workspaces / Boards / Columns / Items            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

Both CLI and Web are **equal, thin clients** of the same REST API. Neither has privileged access. This is the defining architectural principle -- the API is the product; the clients are views.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **CLI (`packages/cli`)** | Parse commands, authenticate, call API, format terminal output | Commander.js or oclif; thin HTTP client wrapper |
| **API (`packages/api`)** | Business logic, auth, validation, data access | Express or Fastify; layered service architecture |
| **Web (`packages/web`)** | Visual board UI, drag-and-drop, browser auth | Next.js with App Router; API route proxying optional |
| **Shared (`packages/shared`)** | Types, validation schemas, constants, API contract | Zod schemas that define both validation and TypeScript types |

## Recommended Project Structure

### Monorepo Layout (Turborepo)

```
kanbambam/
├── turbo.json                  # Turborepo pipeline config
├── package.json                # Root workspace config
├── tsconfig.base.json          # Shared TS config
├── packages/
│   ├── shared/                 # Shared types, schemas, constants
│   │   ├── src/
│   │   │   ├── schemas/        # Zod schemas (source of truth for types)
│   │   │   │   ├── workspace.ts
│   │   │   │   ├── board.ts
│   │   │   │   ├── column.ts
│   │   │   │   ├── item.ts
│   │   │   │   └── auth.ts
│   │   │   ├── types/          # Inferred types from schemas
│   │   │   │   └── index.ts    # export type Board = z.infer<typeof BoardSchema>
│   │   │   ├── constants/      # Shared constants (limits, defaults)
│   │   │   └── api-contract.ts # Route definitions, request/response shapes
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api/                    # REST API server
│   │   ├── src/
│   │   │   ├── routes/         # Route handlers (thin — delegate to services)
│   │   │   ├── services/       # Business logic layer
│   │   │   ├── db/             # Database access (queries, migrations)
│   │   │   ├── middleware/     # Auth, validation, error handling
│   │   │   └── server.ts       # Entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── cli/                    # CLI application
│   │   ├── src/
│   │   │   ├── commands/       # One file per command group
│   │   │   │   ├── auth.ts     # login, logout, status
│   │   │   │   ├── workspace.ts
│   │   │   │   ├── board.ts
│   │   │   │   ├── column.ts
│   │   │   │   └── item.ts
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts   # HTTP client wrapping fetch/got
│   │   │   │   ├── config.ts       # Local config (~/.kanbambam)
│   │   │   │   ├── auth.ts         # Token storage and refresh
│   │   │   │   └── output.ts       # Table/JSON/plain formatters
│   │   │   └── index.ts        # Entry point, command registration
│   │   ├── bin/
│   │   │   └── kanbambam.js    # Shebang entry (#!/usr/bin/env node)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # Next.js web application
│       ├── src/
│       │   ├── app/            # Next.js App Router pages
│       │   ├── components/     # React components
│       │   │   ├── board/      # Board view, column, card components
│       │   │   └── ui/         # Generic UI primitives
│       │   ├── lib/
│       │   │   ├── api-client.ts   # Browser HTTP client
│       │   │   └── auth.ts         # Session/token management
│       │   └── hooks/          # React hooks for data fetching
│       ├── package.json
│       └── tsconfig.json
│
├── .github/
│   └── workflows/              # CI/CD
└── docker-compose.yml          # Local dev (Postgres)
```

### Structure Rationale

- **`packages/shared/`:** The single most important package. Zod schemas are the source of truth -- they generate TypeScript types AND runtime validation. Both CLI and Web import these. The API validates request bodies against them. This eliminates type drift between clients and server.
- **`packages/api/`:** Routes-Services-DB layered architecture. Routes are thin (parse request, call service, return response). Services contain business logic. DB layer handles queries. This makes testing straightforward -- mock the DB layer, test services directly.
- **`packages/cli/`:** Commands are organized by resource (board, item) not by action (create, list). Each command file exports subcommands. The `api-client.ts` is a thin wrapper that handles auth headers, base URL, and error translation.
- **`packages/web/`:** Standard Next.js App Router. The web app calls the same API as the CLI -- it does NOT use Next.js server actions or API routes for data mutation. This maintains the principle that both clients are equal API consumers.

## Architectural Patterns

### Pattern 1: Shared Schema as Contract (Critical)

**What:** Zod schemas in `packages/shared` define the shape of every entity and every API request/response. TypeScript types are inferred from schemas, never hand-written separately.
**When to use:** Always. This is the foundation of the architecture.
**Trade-offs:** Adds a build step for the shared package. Worth it -- eliminates an entire class of bugs where CLI sends data the API does not expect.

**Example:**
```typescript
// packages/shared/src/schemas/item.ts
import { z } from 'zod';

export const ItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  columnId: z.string().uuid(),
  position: z.number().int().min(0),
  labels: z.array(z.string()).default([]),
  dueDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateItemSchema = ItemSchema.pick({
  title: true,
  description: true,
  columnId: true,
  labels: true,
  dueDate: true,
});

export type Item = z.infer<typeof ItemSchema>;
export type CreateItem = z.infer<typeof CreateItemSchema>;
```

### Pattern 2: Thin CLI Client

**What:** The CLI does zero business logic. It parses args, calls the API, and formats the response. All validation and logic lives in the API.
**When to use:** Always for CLI commands.
**Trade-offs:** CLI requires network access for every operation (no offline mode). This is an explicit design choice per PROJECT.md.

**Example:**
```typescript
// packages/cli/src/commands/item.ts
import { command } from 'commander';
import { apiClient } from '../lib/api-client';
import { formatTable } from '../lib/output';

export const itemCommand = command('item')
  .description('Manage items');

itemCommand
  .command('create')
  .requiredOption('--board <id>', 'Board ID')
  .requiredOption('--column <id>', 'Column ID')
  .requiredOption('--title <title>', 'Item title')
  .option('--description <desc>', 'Description')
  .action(async (opts) => {
    const item = await apiClient.post('/items', {
      columnId: opts.column,
      title: opts.title,
      description: opts.description,
    });
    formatTable([item]);
  });
```

### Pattern 3: Browser-Based CLI Auth (Device Flow)

**What:** CLI opens a browser for login instead of collecting credentials in the terminal. The CLI starts a local HTTP server, redirects the user to the web app's login page with a callback URL, and receives a token when auth completes.
**When to use:** For `kanbambam auth login`.
**Trade-offs:** More complex than username/password prompts, but much more secure. This is the established pattern (GitHub CLI, Vercel CLI, Railway CLI all do this).

**Flow:**
```
1. User runs: kanbambam auth login
2. CLI starts local server on random port (e.g., localhost:9876)
3. CLI opens browser to: https://app.kanbambam.com/cli-auth?port=9876
4. User logs in via web app (or is already logged in)
5. Web app redirects to: http://localhost:9876/callback?token=<jwt>
6. CLI receives token, stores in ~/.kanbambam/config.json
7. CLI shuts down local server
8. CLI prints: "Authenticated as user@example.com"
```

### Pattern 4: Layered API Services

**What:** API routes delegate to service functions. Services contain business logic. A separate DB/repository layer handles queries. Routes never touch the database directly.
**When to use:** Always for the API.
**Trade-offs:** Slightly more files than putting everything in routes. Pays off immediately when testing -- services can be tested without HTTP, DB layer can be mocked.

```
Route Handler → Validation (Zod) → Service → Repository → Database
     ↓                                                        ↑
  Response ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

## Data Flow

### CLI Request Flow

```
User types: kanbambam item create --board abc --column def --title "Fix bug"
    ↓
CLI parses args (Commander.js)
    ↓
CLI reads auth token from ~/.kanbambam/config.json
    ↓
CLI sends POST /api/items { columnId, title }
    with Authorization: Bearer <token>
    ↓
API middleware validates JWT → extracts userId
    ↓
API route validates body with Zod (CreateItemSchema)
    ↓
API service checks: does user own this board? Is columnId valid?
    ↓
API repository inserts row into items table
    ↓
API returns 201 { id, title, columnId, position, ... }
    ↓
CLI formats response as table/JSON and prints to stdout
```

### Web App Request Flow

```
User drags card from "To Do" to "In Progress"
    ↓
React component fires onDragEnd handler
    ↓
Optimistic UI update (move card in local state)
    ↓
API client sends PATCH /api/items/:id { columnId: newColumnId, position: newPos }
    with Authorization: Bearer <token> (from cookie/localStorage)
    ↓
API validates, updates, returns 200
    ↓
On success: confirm local state
On failure: revert optimistic update, show error toast
```

### Key Data Flows

1. **Auth flow (CLI):** Browser login -> local callback server -> token stored in `~/.kanbambam/config.json` -> token sent as Bearer header on every request.
2. **Auth flow (Web):** Standard login form -> JWT stored in httpOnly cookie or localStorage -> sent automatically on requests.
3. **CRUD flow (both clients):** Client -> REST API -> Validate -> Service logic -> Database -> Response. Identical path regardless of which client initiated.
4. **Hierarchy traversal:** User selects workspace -> fetches boards -> selects board -> fetches columns with items. The CLI uses flags (`--workspace`, `--board`) or interactive prompts. The web app uses navigation.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Single API server, single Postgres instance. This is the v1 target. No changes needed. |
| 1k-10k users | Add connection pooling (PgBouncer or built-in pool). Add Redis for session cache if JWT refresh becomes a bottleneck. Consider read replicas if read-heavy. |
| 10k-100k users | Horizontal API scaling behind a load balancer. Database indexing becomes critical (composite indexes on userId + workspaceId, boardId + position). CDN for web app static assets. |

### Scaling Priorities

1. **First bottleneck:** Database connections. A Node.js API server with pooling handles thousands of concurrent requests. The database connection limit will be hit first. Fix: connection pooling, then read replicas.
2. **Second bottleneck:** API response time for board views. A board with many columns and items means a heavy query. Fix: eager-load columns + items in a single query with proper indexing, not N+1 queries.

## Anti-Patterns

### Anti-Pattern 1: Web App Bypassing the API

**What people do:** Use Next.js server actions or API routes to query the database directly from the web app, bypassing the shared REST API.
**Why it's wrong:** Creates two sources of truth for business logic. CLI and web diverge. Bugs get fixed in one path but not the other. Authorization logic gets duplicated.
**Do this instead:** The web app calls the same REST API as the CLI. Next.js server components can call the API server-side for SSR, but they still go through the REST API, not directly to the database.

### Anti-Pattern 2: Duplicating Types Instead of Sharing

**What people do:** Define `interface Item { ... }` separately in CLI, API, and web packages.
**Why it's wrong:** Types drift. CLI sends `dueDate` as a string, API expects a Date object, web renders neither correctly. This is the number one source of integration bugs in multi-package TypeScript projects.
**Do this instead:** Single Zod schema in `packages/shared`. All packages import from there. The schema IS the type.

### Anti-Pattern 3: Fat CLI Commands

**What people do:** Put validation logic, business rules, or data transformation in CLI command handlers.
**Why it's wrong:** The CLI becomes a second API. Changes need to be made in two places. The web app does not benefit from CLI-side validation improvements.
**Do this instead:** CLI sends raw user input to the API. API validates and rejects with clear error messages. CLI formats those error messages for the terminal.

### Anti-Pattern 4: Monolithic API File

**What people do:** Put all routes in a single `server.ts` or `routes.ts` file.
**Why it's wrong:** Becomes unmaintainable past ~10 routes. Hard to find things, merge conflicts everywhere.
**Do this instead:** One route file per resource (`items.ts`, `boards.ts`, `columns.ts`). Each route file is registered in `server.ts`. Services in separate files.

### Anti-Pattern 5: Positional Arguments for Everything in CLI

**What people do:** `kanbambam create "Fix bug" board-id column-id` with positional args.
**Why it's wrong:** Unreadable, easy to mix up argument order, terrible for AI agents that need to construct commands programmatically.
**Do this instead:** Use named flags: `kanbambam item create --title "Fix bug" --board abc --column def`. Positional args are fine for the primary identifier only (e.g., `kanbambam board view <board-id>`).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PostgreSQL | Direct connection via query builder (Drizzle or Prisma) | Use migrations from day one. Never manual schema changes. |
| Email (transactional) | API call from auth service for password reset | Defer until needed. Magic link auth can avoid this entirely for v1. |
| CDN (web assets) | Vercel/Netlify handles this automatically for Next.js | No custom setup needed if using standard deployment. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| CLI <-> API | HTTPS REST (JSON) | CLI is a pure HTTP client. No shared runtime code with API. |
| Web <-> API | HTTPS REST (JSON) | Same as CLI. Web may proxy through Next.js for CORS simplicity. |
| Shared <-> All | Build-time import | Shared package is compiled TS. Consumed as a dependency by all three. |
| API <-> Database | Connection pool (TCP) | ORM/query builder in API only. No other package touches the DB. |

## Build Order (Dependencies Between Components)

This is the critical insight for roadmap phasing:

```
1. packages/shared     (no dependencies -- build first)
       ↓
2. packages/api        (depends on shared)
       ↓
3. packages/cli        (depends on shared, needs running API)
   packages/web        (depends on shared, needs running API)
       ↓               (CLI and Web can be built in parallel)
4. Integration         (CLI + Web both talking to same API)
```

**Build order rationale:**
- **Shared first** because it defines the data model and API contract. Everything else depends on it.
- **API second** because both clients need an API to talk to. You cannot test CLI or Web without a running API.
- **CLI third** because it is the "first" product (CLI-first). It also validates the API design -- if the CLI feels awkward, the API routes are wrong. Fix the API before building the web app.
- **Web in parallel or fourth** because it consumes the same API the CLI already validated. The drag-and-drop board UI is the most complex frontend work but does not block CLI delivery.

## Sources

- GitHub CLI (gh) architecture: Go monorepo, thin CLI client pattern, browser-based auth flow. The gold standard for CLI-first developer tools.
- Vercel CLI: Node.js CLI calling Vercel API. Uses device auth flow similar to what Kanbambam needs.
- Turborepo: Standard tool for TypeScript monorepos with multiple packages. Used by Vercel, numerous open-source projects.
- Linear CLI: TypeScript CLI consuming a GraphQL API, but the thin-client pattern applies equally to REST.
- Commander.js: Most popular Node.js CLI framework. Simpler than oclif for a focused product.

**Confidence note:** These are well-established, battle-tested patterns. The monorepo-with-shared-types approach is the standard for TypeScript projects with multiple deployment targets. The browser auth flow is used by every major CLI tool. HIGH confidence across the board. No web search was available to verify latest versions, but these architectural patterns are stable and unlikely to have changed.

---
*Architecture research for: CLI-first Kanban board (Kanbambam)*
*Researched: 2026-03-25*

# Architecture Research

**Domain:** CLI-first Kanban board with cloud API and web app
**Researched:** 2026-03-25
**Confidence:** HIGH (established patterns from gh CLI, Vercel CLI, Linear CLI, Turborepo monorepos)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Layer                               │
│  ┌──────────────┐                        ┌──────────────┐       │
│  │  CLI (Node)  │                        │  Web (React)  │      │
│  │  kanbambam   │                        │  Next.js App  │      │
│  └──────┬───────┘                        └──────┬────────┘      │
│         │ HTTPS                                 │ HTTPS         │
├─────────┴───────────────────────────────────────┴───────────────┤
│                      API Layer                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  REST API (Node.js)                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │   │
│  │  │  Auth    │  │  Routes  │  │  Middleware│              │   │
│  │  └──────────┘  └────┬─────┘  └──────────┘               │   │
│  │                     │                                     │   │
│  │              ┌──────┴──────┐                              │   │
│  │              │  Services   │                              │   │
│  │              └──────┬──────┘                              │   │
│  └─────────────────────┼────────────────────────────────────┘   │
├─────────────────────────┼───────────────────────────────────────┤
│                      Data Layer                                 │
│  ┌──────────────────────┴───────────────────────────────────┐   │
│  │                   PostgreSQL                              │   │
│  │  Users / Workspaces / Boards / Columns / Items            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

Both CLI and Web are **equal, thin clients** of the same REST API. Neither has privileged access. This is the defining architectural principle -- the API is the product; the clients are views.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **CLI (`packages/cli`)** | Parse commands, authenticate, call API, format terminal output | Commander.js or oclif; thin HTTP client wrapper |
| **API (`packages/api`)** | Business logic, auth, validation, data access | Express or Fastify; layered service architecture |
| **Web (`packages/web`)** | Visual board UI, drag-and-drop, browser auth | Next.js with App Router; API route proxying optional |
| **Shared (`packages/shared`)** | Types, validation schemas, constants, API contract | Zod schemas that define both validation and TypeScript types |

## Recommended Project Structure

### Monorepo Layout (Turborepo)

```
kanbambam/
├── turbo.json                  # Turborepo pipeline config
├── package.json                # Root workspace config
├── tsconfig.base.json          # Shared TS config
├── packages/
│   ├── shared/                 # Shared types, schemas, constants
│   │   ├── src/
│   │   │   ├── schemas/        # Zod schemas (source of truth for types)
│   │   │   │   ├── workspace.ts
│   │   │   │   ├── board.ts
│   │   │   │   ├── column.ts
│   │   │   │   ├── item.ts
│   │   │   │   └── auth.ts
│   │   │   ├── types/          # Inferred types from schemas
│   │   │   │   └── index.ts    # export type Board = z.infer<typeof BoardSchema>
│   │   │   ├── constants/      # Shared constants (limits, defaults)
│   │   │   └── api-contract.ts # Route definitions, request/response shapes
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api/                    # REST API server
│   │   ├── src/
│   │   │   ├── routes/         # Route handlers (thin -- delegate to services)
│   │   │   ├── services/       # Business logic layer
│   │   │   ├── db/             # Database access (queries, migrations)
│   │   │   ├── middleware/     # Auth, validation, error handling
│   │   │   └── server.ts       # Entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── cli/                    # CLI application
│   │   ├── src/
│   │   │   ├── commands/       # One file per command group
│   │   │   │   ├── auth.ts     # login, logout, status
│   │   │   │   ├── workspace.ts
│   │   │   │   ├── board.ts
│   │   │   │   ├── column.ts
│   │   │   │   └── item.ts
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts   # HTTP client wrapping fetch/got
│   │   │   │   ├── config.ts       # Local config (~/.kanbambam)
│   │   │   │   ├── auth.ts         # Token storage and refresh
│   │   │   │   └── output.ts       # Table/JSON/plain formatters
│   │   │   └── index.ts        # Entry point, command registration
│   │   ├── bin/
│   │   │   └── kanbambam.js    # Shebang entry (#!/usr/bin/env node)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # Next.js web application
│       ├── src/
│       │   ├── app/            # Next.js App Router pages
│       │   ├── components/     # React components
│       │   │   ├── board/      # Board view, column, card components
│       │   │   └── ui/         # Generic UI primitives
│       │   ├── lib/
│       │   │   ├── api-client.ts   # Browser HTTP client
│       │   │   └── auth.ts         # Session/token management
│       │   └── hooks/          # React hooks for data fetching
│       ├── package.json
│       └── tsconfig.json
│
├── .github/
│   └── workflows/              # CI/CD
└── docker-compose.yml          # Local dev (Postgres)
```

### Structure Rationale

- **`packages/shared/`:** The single most important package. Zod schemas are the source of truth -- they generate TypeScript types AND runtime validation. Both CLI and Web import these. The API validates request bodies against them. This eliminates type drift between clients and server.
- **`packages/api/`:** Routes-Services-DB layered architecture. Routes are thin (parse request, call service, return response). Services contain business logic. DB layer handles queries. This makes testing straightforward -- mock the DB layer, test services directly.
- **`packages/cli/`:** Commands are organized by resource (board, item) not by action (create, list). Each command file exports subcommands. The `api-client.ts` is a thin wrapper that handles auth headers, base URL, and error translation.
- **`packages/web/`:** Standard Next.js App Router. The web app calls the same API as the CLI -- it does NOT use Next.js server actions or API routes for data mutation. This maintains the principle that both clients are equal API consumers.

## Architectural Patterns

### Pattern 1: Shared Schema as Contract (Critical)

**What:** Zod schemas in `packages/shared` define the shape of every entity and every API request/response. TypeScript types are inferred from schemas, never hand-written separately.
**When to use:** Always. This is the foundation of the architecture.
**Trade-offs:** Adds a build step for the shared package. Worth it -- eliminates an entire class of bugs where CLI sends data the API does not expect.

**Example:**
```typescript
// packages/shared/src/schemas/item.ts
import { z } from 'zod';

export const ItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  columnId: z.string().uuid(),
  position: z.number().int().min(0),
  labels: z.array(z.string()).default([]),
  dueDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateItemSchema = ItemSchema.pick({
  title: true,
  description: true,
  columnId: true,
  labels: true,
  dueDate: true,
});

export type Item = z.infer<typeof ItemSchema>;
export type CreateItem = z.infer<typeof CreateItemSchema>;
```

### Pattern 2: Thin CLI Client

**What:** The CLI does zero business logic. It parses args, calls the API, and formats the response. All validation and logic lives in the API.
**When to use:** Always for CLI commands.
**Trade-offs:** CLI requires network access for every operation (no offline mode). This is an explicit design choice per PROJECT.md.

**Example:**
```typescript
// packages/cli/src/commands/item.ts
import { command } from 'commander';
import { apiClient } from '../lib/api-client';
import { formatTable } from '../lib/output';

export const itemCommand = command('item')
  .description('Manage items');

itemCommand
  .command('create')
  .requiredOption('--board <id>', 'Board ID')
  .requiredOption('--column <id>', 'Column ID')
  .requiredOption('--title <title>', 'Item title')
  .option('--description <desc>', 'Description')
  .action(async (opts) => {
    const item = await apiClient.post('/items', {
      columnId: opts.column,
      title: opts.title,
      description: opts.description,
    });
    formatTable([item]);
  });
```

### Pattern 3: Browser-Based CLI Auth (Device Flow)

**What:** CLI opens a browser for login instead of collecting credentials in the terminal. The CLI starts a local HTTP server, redirects the user to the web app's login page with a callback URL, and receives a token when auth completes.
**When to use:** For `kanbambam auth login`.
**Trade-offs:** More complex than username/password prompts, but much more secure. This is the established pattern (GitHub CLI, Vercel CLI, Railway CLI all do this).

**Flow:**
```
1. User runs: kanbambam auth login
2. CLI starts local server on random port (e.g., localhost:9876)
3. CLI opens browser to: https://app.kanbambam.com/cli-auth?port=9876
4. User logs in via web app (or is already logged in)
5. Web app redirects to: http://localhost:9876/callback?token=<jwt>
6. CLI receives token, stores in ~/.kanbambam/config.json
7. CLI shuts down local server
8. CLI prints: "Authenticated as user@example.com"
```

### Pattern 4: Layered API Services

**What:** API routes delegate to service functions. Services contain business logic. A separate DB/repository layer handles queries. Routes never touch the database directly.
**When to use:** Always for the API.
**Trade-offs:** Slightly more files than putting everything in routes. Pays off immediately when testing -- services can be tested without HTTP, DB layer can be mocked.

```
Route Handler -> Validation (Zod) -> Service -> Repository -> Database
     |                                                          ^
  Response <----------------------------------------------------+
```

## Data Flow

### CLI Request Flow

```
User types: kanbambam item create --board abc --column def --title "Fix bug"
    |
CLI parses args (Commander.js)
    |
CLI reads auth token from ~/.kanbambam/config.json
    |
CLI sends POST /api/items { columnId, title }
    with Authorization: Bearer <token>
    |
API middleware validates JWT -> extracts userId
    |
API route validates body with Zod (CreateItemSchema)
    |
API service checks: does user own this board? Is columnId valid?
    |
API repository inserts row into items table
    |
API returns 201 { id, title, columnId, position, ... }
    |
CLI formats response as table/JSON and prints to stdout
```

### Web App Request Flow

```
User drags card from "To Do" to "In Progress"
    |
React component fires onDragEnd handler
    |
Optimistic UI update (move card in local state)
    |
API client sends PATCH /api/items/:id { columnId: newColumnId, position: newPos }
    with Authorization: Bearer <token> (from cookie/localStorage)
    |
API validates, updates, returns 200
    |
On success: confirm local state
On failure: revert optimistic update, show error toast
```

### Key Data Flows

1. **Auth flow (CLI):** Browser login -> local callback server -> token stored in `~/.kanbambam/config.json` -> token sent as Bearer header on every request.
2. **Auth flow (Web):** Standard login form -> JWT stored in httpOnly cookie or localStorage -> sent automatically on requests.
3. **CRUD flow (both clients):** Client -> REST API -> Validate -> Service logic -> Database -> Response. Identical path regardless of which client initiated.
4. **Hierarchy traversal:** User selects workspace -> fetches boards -> selects board -> fetches columns with items. The CLI uses flags (`--workspace`, `--board`) or interactive prompts. The web app uses navigation.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Single API server, single Postgres instance. This is the v1 target. No changes needed. |
| 1k-10k users | Add connection pooling (PgBouncer or built-in pool). Add Redis for session cache if JWT refresh becomes a bottleneck. Consider read replicas if read-heavy. |
| 10k-100k users | Horizontal API scaling behind a load balancer. Database indexing becomes critical (composite indexes on userId + workspaceId, boardId + position). CDN for web app static assets. |

### Scaling Priorities

1. **First bottleneck:** Database connections. A Node.js API server with pooling handles thousands of concurrent requests. The database connection limit will be hit first. Fix: connection pooling, then read replicas.
2. **Second bottleneck:** API response time for board views. A board with many columns and items means a heavy query. Fix: eager-load columns + items in a single query with proper indexing, not N+1 queries.

## Anti-Patterns

### Anti-Pattern 1: Web App Bypassing the API

**What people do:** Use Next.js server actions or API routes to query the database directly from the web app, bypassing the shared REST API.
**Why it's wrong:** Creates two sources of truth for business logic. CLI and web diverge. Bugs get fixed in one path but not the other. Authorization logic gets duplicated.
**Do this instead:** The web app calls the same REST API as the CLI. Next.js server components can call the API server-side for SSR, but they still go through the REST API, not directly to the database.

### Anti-Pattern 2: Duplicating Types Instead of Sharing

**What people do:** Define `interface Item { ... }` separately in CLI, API, and web packages.
**Why it's wrong:** Types drift. CLI sends `dueDate` as a string, API expects a Date object, web renders neither correctly. This is the number one source of integration bugs in multi-package TypeScript projects.
**Do this instead:** Single Zod schema in `packages/shared`. All packages import from there. The schema IS the type.

### Anti-Pattern 3: Fat CLI Commands

**What people do:** Put validation logic, business rules, or data transformation in CLI command handlers.
**Why it's wrong:** The CLI becomes a second API. Changes need to be made in two places. The web app does not benefit from CLI-side validation improvements.
**Do this instead:** CLI sends raw user input to the API. API validates and rejects with clear error messages. CLI formats those error messages for the terminal.

### Anti-Pattern 4: Monolithic API File

**What people do:** Put all routes in a single `server.ts` or `routes.ts` file.
**Why it's wrong:** Becomes unmaintainable past ~10 routes. Hard to find things, merge conflicts everywhere.
**Do this instead:** One route file per resource (`items.ts`, `boards.ts`, `columns.ts`). Each route file is registered in `server.ts`. Services in separate files.

### Anti-Pattern 5: Positional Arguments for Everything in CLI

**What people do:** `kanbambam create "Fix bug" board-id column-id` with positional args.
**Why it's wrong:** Unreadable, easy to mix up argument order, terrible for AI agents that need to construct commands programmatically.
**Do this instead:** Use named flags: `kanbambam item create --title "Fix bug" --board abc --column def`. Positional args are fine for the primary identifier only (e.g., `kanbambam board view <board-id>`).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PostgreSQL | Direct connection via query builder (Drizzle or Prisma) | Use migrations from day one. Never manual schema changes. |
| Email (transactional) | API call from auth service for password reset | Defer until needed. Magic link auth can avoid this entirely for v1. |
| CDN (web assets) | Vercel/Netlify handles this automatically for Next.js | No custom setup needed if using standard deployment. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| CLI <-> API | HTTPS REST (JSON) | CLI is a pure HTTP client. No shared runtime code with API. |
| Web <-> API | HTTPS REST (JSON) | Same as CLI. Web may proxy through Next.js for CORS simplicity. |
| Shared <-> All | Build-time import | Shared package is compiled TS. Consumed as a dependency by all three. |
| API <-> Database | Connection pool (TCP) | ORM/query builder in API only. No other package touches the DB. |

## Build Order (Dependencies Between Components)

This is the critical insight for roadmap phasing:

```
1. packages/shared     (no dependencies -- build first)
       |
2. packages/api        (depends on shared)
       |
3. packages/cli        (depends on shared, needs running API)
   packages/web        (depends on shared, needs running API)
       |               (CLI and Web can be built in parallel)
4. Integration         (CLI + Web both talking to same API)
```

**Build order rationale:**
- **Shared first** because it defines the data model and API contract. Everything else depends on it.
- **API second** because both clients need an API to talk to. You cannot test CLI or Web without a running API.
- **CLI third** because it is the "first" product (CLI-first). It also validates the API design -- if the CLI feels awkward, the API routes are wrong. Fix the API before building the web app.
- **Web in parallel or fourth** because it consumes the same API the CLI already validated. The drag-and-drop board UI is the most complex frontend work but does not block CLI delivery.

## Sources

- GitHub CLI (gh) architecture: Go monorepo, thin CLI client pattern, browser-based auth flow. The gold standard for CLI-first developer tools.
- Vercel CLI: Node.js CLI calling Vercel API. Uses device auth flow similar to what Kanbambam needs.
- Turborepo: Standard tool for TypeScript monorepos with multiple packages. Used by Vercel, numerous open-source projects.
- Linear CLI: TypeScript CLI consuming a GraphQL API, but the thin-client pattern applies equally to REST.
- Commander.js: Most popular Node.js CLI framework. Simpler than oclif for a focused product.

**Confidence note:** These are well-established, battle-tested patterns. The monorepo-with-shared-types approach is the standard for TypeScript projects with multiple deployment targets. The browser auth flow is used by every major CLI tool. HIGH confidence across the board. No web search was available to verify latest versions, but these architectural patterns are stable and unlikely to have changed.

---
*Architecture research for: CLI-first Kanban board (Kanbambam)*
*Researched: 2026-03-25*

# Architecture Research

**Domain:** CLI-first Kanban board with cloud API and web app
**Researched:** 2026-03-25
**Confidence:** HIGH (established patterns from gh CLI, Vercel CLI, Linear CLI, Turborepo monorepos)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Layer                               │
│  ┌──────────────┐                        ┌──────────────┐       │
│  │  CLI (Node)  │                        │  Web (React)  │      │
│  │  kanbambam   │                        │  Next.js App  │      │
│  └──────┬───────┘                        └──────┬────────┘      │
│         │ HTTPS                                 │ HTTPS         │
├─────────┴───────────────────────────────────────┴───────────────┤
│                      API Layer                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  REST API (Node.js)                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │   │
│  │  │  Auth    │  │  Routes  │  │  Middleware│              │   │
│  │  └──────────┘  └────┬─────┘  └──────────┘               │   │
│  │                     │                                     │   │
│  │              ┌──────┴──────┐                              │   │
│  │              │  Services   │                              │   │
│  │              └──────┬──────┘                              │   │
│  └─────────────────────┼────────────────────────────────────┘   │
├─────────────────────────┼───────────────────────────────────────┤
│                      Data Layer                                 │
│  ┌──────────────────────┴───────────────────────────────────┐   │
│  │                   PostgreSQL                              │   │
│  │  Users / Workspaces / Boards / Columns / Items            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

Both CLI and Web are **equal, thin clients** of the same REST API. Neither has privileged access. This is the defining architectural principle -- the API is the product; the clients are views.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **CLI (`packages/cli`)** | Parse commands, authenticate, call API, format terminal output | Commander.js or oclif; thin HTTP client wrapper |
| **API (`packages/api`)** | Business logic, auth, validation, data access | Express or Fastify; layered service architecture |
| **Web (`packages/web`)** | Visual board UI, drag-and-drop, browser auth | Next.js with App Router; API route proxying optional |
| **Shared (`packages/shared`)** | Types, validation schemas, constants, API contract | Zod schemas that define both validation and TypeScript types |

## Recommended Project Structure

### Monorepo Layout (Turborepo)

```
kanbambam/
├── turbo.json                  # Turborepo pipeline config
├── package.json                # Root workspace config
├── tsconfig.base.json          # Shared TS config
├── packages/
│   ├── shared/                 # Shared types, schemas, constants
│   │   ├── src/
│   │   │   ├── schemas/        # Zod schemas (source of truth for types)
│   │   │   │   ├── workspace.ts
│   │   │   │   ├── board.ts
│   │   │   │   ├── column.ts
│   │   │   │   ├── item.ts
│   │   │   │   └── auth.ts
│   │   │   ├── types/          # Inferred types from schemas
│   │   │   │   └── index.ts    # export type Board = z.infer<typeof BoardSchema>
│   │   │   ├── constants/      # Shared constants (limits, defaults)
│   │   │   └── api-contract.ts # Route definitions, request/response shapes
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api/                    # REST API server
│   │   ├── src/
│   │   │   ├── routes/         # Route handlers (thin — delegate to services)
│   │   │   ├── services/       # Business logic layer
│   │   │   ├── db/             # Database access (queries, migrations)
│   │   │   ├── middleware/     # Auth, validation, error handling
│   │   │   └── server.ts       # Entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── cli/                    # CLI application
│   │   ├── src/
│   │   │   ├── commands/       # One file per command group
│   │   │   │   ├── auth.ts     # login, logout, status
│   │   │   │   ├── workspace.ts
│   │   │   │   ├── board.ts
│   │   │   │   ├── column.ts
│   │   │   │   └── item.ts
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts   # HTTP client wrapping fetch/got
│   │   │   │   ├── config.ts       # Local config (~/.kanbambam)
│   │   │   │   ├── auth.ts         # Token storage and refresh
│   │   │   │   └── output.ts       # Table/JSON/plain formatters
│   │   │   └── index.ts        # Entry point, command registration
│   │   ├── bin/
│   │   │   └── kanbambam.js    # Shebang entry (#!/usr/bin/env node)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # Next.js web application
│       ├── src/
│       │   ├── app/            # Next.js App Router pages
│       │   ├── components/     # React components
│       │   │   ├── board/      # Board view, column, card components
│       │   │   └── ui/         # Generic UI primitives
│       │   ├── lib/
│       │   │   ├── api-client.ts   # Browser HTTP client
│       │   │   └── auth.ts         # Session/token management
│       │   └── hooks/          # React hooks for data fetching
│       ├── package.json
│       └── tsconfig.json
│
├── .github/
│   └── workflows/              # CI/CD
└── docker-compose.yml          # Local dev (Postgres)
```

### Structure Rationale

- **`packages/shared/`:** The single most important package. Zod schemas are the source of truth -- they generate TypeScript types AND runtime validation. Both CLI and Web import these. The API validates request bodies against them. This eliminates type drift between clients and server.
- **`packages/api/`:** Routes-Services-DB layered architecture. Routes are thin (parse request, call service, return response). Services contain business logic. DB layer handles queries. This makes testing straightforward -- mock the DB layer, test services directly.
- **`packages/cli/`:** Commands are organized by resource (board, item) not by action (create, list). Each command file exports subcommands. The `api-client.ts` is a thin wrapper that handles auth headers, base URL, and error translation.
- **`packages/web/`:** Standard Next.js App Router. The web app calls the same API as the CLI -- it does NOT use Next.js server actions or API routes for data mutation. This maintains the principle that both clients are equal API consumers.

## Architectural Patterns

### Pattern 1: Shared Schema as Contract (Critical)

**What:** Zod schemas in `packages/shared` define the shape of every entity and every API request/response. TypeScript types are inferred from schemas, never hand-written separately.
**When to use:** Always. This is the foundation of the architecture.
**Trade-offs:** Adds a build step for the shared package. Worth it -- eliminates an entire class of bugs where CLI sends data the API does not expect.

**Example:**
```typescript
// packages/shared/src/schemas/item.ts
import { z } from 'zod';

export const ItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  columnId: z.string().uuid(),
  position: z.number().int().min(0),
  labels: z.array(z.string()).default([]),
  dueDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateItemSchema = ItemSchema.pick({
  title: true,
  description: true,
  columnId: true,
  labels: true,
  dueDate: true,
});

export type Item = z.infer<typeof ItemSchema>;
export type CreateItem = z.infer<typeof CreateItemSchema>;
```

### Pattern 2: Thin CLI Client

**What:** The CLI does zero business logic. It parses args, calls the API, and formats the response. All validation and logic lives in the API.
**When to use:** Always for CLI commands.
**Trade-offs:** CLI requires network access for every operation (no offline mode). This is an explicit design choice per PROJECT.md.

**Example:**
```typescript
// packages/cli/src/commands/item.ts
import { command } from 'commander';
import { apiClient } from '../lib/api-client';
import { formatTable } from '../lib/output';

export const itemCommand = command('item')
  .description('Manage items');

itemCommand
  .command('create')
  .requiredOption('--board <id>', 'Board ID')
  .requiredOption('--column <id>', 'Column ID')
  .requiredOption('--title <title>', 'Item title')
  .option('--description <desc>', 'Description')
  .action(async (opts) => {
    const item = await apiClient.post('/items', {
      columnId: opts.column,
      title: opts.title,
      description: opts.description,
    });
    formatTable([item]);
  });
```

### Pattern 3: Browser-Based CLI Auth (Device Flow)

**What:** CLI opens a browser for login instead of collecting credentials in the terminal. The CLI starts a local HTTP server, redirects the user to the web app's login page with a callback URL, and receives a token when auth completes.
**When to use:** For `kanbambam auth login`.
**Trade-offs:** More complex than username/password prompts, but much more secure. This is the established pattern (GitHub CLI, Vercel CLI, Railway CLI all do this).

**Flow:**
```
1. User runs: kanbambam auth login
2. CLI starts local server on random port (e.g., localhost:9876)
3. CLI opens browser to: https://app.kanbambam.com/cli-auth?port=9876
4. User logs in via web app (or is already logged in)
5. Web app redirects to: http://localhost:9876/callback?token=<jwt>
6. CLI receives token, stores in ~/.kanbambam/config.json
7. CLI shuts down local server
8. CLI prints: "Authenticated as user@example.com"
```

### Pattern 4: Layered API Services

**What:** API routes delegate to service functions. Services contain business logic. A separate DB/repository layer handles queries. Routes never touch the database directly.
**When to use:** Always for the API.
**Trade-offs:** Slightly more files than putting everything in routes. Pays off immediately when testing -- services can be tested without HTTP, DB layer can be mocked.

```
Route Handler → Validation (Zod) → Service → Repository → Database
     ↓                                                        ↑
  Response ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

## Data Flow

### CLI Request Flow

```
User types: kanbambam item create --board abc --column def --title "Fix bug"
    ↓
CLI parses args (Commander.js)
    ↓
CLI reads auth token from ~/.kanbambam/config.json
    ↓
CLI sends POST /api/items { columnId, title }
    with Authorization: Bearer <token>
    ↓
API middleware validates JWT → extracts userId
    ↓
API route validates body with Zod (CreateItemSchema)
    ↓
API service checks: does user own this board? Is columnId valid?
    ↓
API repository inserts row into items table
    ↓
API returns 201 { id, title, columnId, position, ... }
    ↓
CLI formats response as table/JSON and prints to stdout
```

### Web App Request Flow

```
User drags card from "To Do" to "In Progress"
    ↓
React component fires onDragEnd handler
    ↓
Optimistic UI update (move card in local state)
    ↓
API client sends PATCH /api/items/:id { columnId: newColumnId, position: newPos }
    with Authorization: Bearer <token> (from cookie/localStorage)
    ↓
API validates, updates, returns 200
    ↓
On success: confirm local state
On failure: revert optimistic update, show error toast
```

### Key Data Flows

1. **Auth flow (CLI):** Browser login -> local callback server -> token stored in `~/.kanbambam/config.json` -> token sent as Bearer header on every request.
2. **Auth flow (Web):** Standard login form -> JWT stored in httpOnly cookie or localStorage -> sent automatically on requests.
3. **CRUD flow (both clients):** Client -> REST API -> Validate -> Service logic -> Database -> Response. Identical path regardless of which client initiated.
4. **Hierarchy traversal:** User selects workspace -> fetches boards -> selects board -> fetches columns with items. The CLI uses flags (`--workspace`, `--board`) or interactive prompts. The web app uses navigation.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Single API server, single Postgres instance. This is the v1 target. No changes needed. |
| 1k-10k users | Add connection pooling (PgBouncer or built-in pool). Add Redis for session cache if JWT refresh becomes a bottleneck. Consider read replicas if read-heavy. |
| 10k-100k users | Horizontal API scaling behind a load balancer. Database indexing becomes critical (composite indexes on userId + workspaceId, boardId + position). CDN for web app static assets. |

### Scaling Priorities

1. **First bottleneck:** Database connections. A Node.js API server with pooling handles thousands of concurrent requests. The database connection limit will be hit first. Fix: connection pooling, then read replicas.
2. **Second bottleneck:** API response time for board views. A board with many columns and items means a heavy query. Fix: eager-load columns + items in a single query with proper indexing, not N+1 queries.

## Anti-Patterns

### Anti-Pattern 1: Web App Bypassing the API

**What people do:** Use Next.js server actions or API routes to query the database directly from the web app, bypassing the shared REST API.
**Why it's wrong:** Creates two sources of truth for business logic. CLI and web diverge. Bugs get fixed in one path but not the other. Authorization logic gets duplicated.
**Do this instead:** The web app calls the same REST API as the CLI. Next.js server components can call the API server-side for SSR, but they still go through the REST API, not directly to the database.

### Anti-Pattern 2: Duplicating Types Instead of Sharing

**What people do:** Define `interface Item { ... }` separately in CLI, API, and web packages.
**Why it's wrong:** Types drift. CLI sends `dueDate` as a string, API expects a Date object, web renders neither correctly. This is the number one source of integration bugs in multi-package TypeScript projects.
**Do this instead:** Single Zod schema in `packages/shared`. All packages import from there. The schema IS the type.

### Anti-Pattern 3: Fat CLI Commands

**What people do:** Put validation logic, business rules, or data transformation in CLI command handlers.
**Why it's wrong:** The CLI becomes a second API. Changes need to be made in two places. The web app does not benefit from CLI-side validation improvements.
**Do this instead:** CLI sends raw user input to the API. API validates and rejects with clear error messages. CLI formats those error messages for the terminal.

### Anti-Pattern 4: Monolithic API File

**What people do:** Put all routes in a single `server.ts` or `routes.ts` file.
**Why it's wrong:** Becomes unmaintainable past ~10 routes. Hard to find things, merge conflicts everywhere.
**Do this instead:** One route file per resource (`items.ts`, `boards.ts`, `columns.ts`). Each route file is registered in `server.ts`. Services in separate files.

### Anti-Pattern 5: Positional Arguments for Everything in CLI

**What people do:** `kanbambam create "Fix bug" board-id column-id` with positional args.
**Why it's wrong:** Unreadable, easy to mix up argument order, terrible for AI agents that need to construct commands programmatically.
**Do this instead:** Use named flags: `kanbambam item create --title "Fix bug" --board abc --column def`. Positional args are fine for the primary identifier only (e.g., `kanbambam board view <board-id>`).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PostgreSQL | Direct connection via query builder (Drizzle or Prisma) | Use migrations from day one. Never manual schema changes. |
| Email (transactional) | API call from auth service for password reset | Defer until needed. Magic link auth can avoid this entirely for v1. |
| CDN (web assets) | Vercel/Netlify handles this automatically for Next.js | No custom setup needed if using standard deployment. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| CLI <-> API | HTTPS REST (JSON) | CLI is a pure HTTP client. No shared runtime code with API. |
| Web <-> API | HTTPS REST (JSON) | Same as CLI. Web may proxy through Next.js for CORS simplicity. |
| Shared <-> All | Build-time import | Shared package is compiled TS. Consumed as a dependency by all three. |
| API <-> Database | Connection pool (TCP) | ORM/query builder in API only. No other package touches the DB. |

## Build Order (Dependencies Between Components)

This is the critical insight for roadmap phasing:

```
1. packages/shared     (no dependencies -- build first)
       ↓
2. packages/api        (depends on shared)
       ↓
3. packages/cli        (depends on shared, needs running API)
   packages/web        (depends on shared, needs running API)
       ↓               (CLI and Web can be built in parallel)
4. Integration         (CLI + Web both talking to same API)
```

**Build order rationale:**
- **Shared first** because it defines the data model and API contract. Everything else depends on it.
- **API second** because both clients need an API to talk to. You cannot test CLI or Web without a running API.
- **CLI third** because it is the "first" product (CLI-first). It also validates the API design -- if the CLI feels awkward, the API routes are wrong. Fix the API before building the web app.
- **Web in parallel or fourth** because it consumes the same API the CLI already validated. The drag-and-drop board UI is the most complex frontend work but does not block CLI delivery.

## Sources

- GitHub CLI (gh) architecture: Go monorepo, thin CLI client pattern, browser-based auth flow. The gold standard for CLI-first developer tools.
- Vercel CLI: Node.js CLI calling Vercel API. Uses device auth flow similar to what Kanbambam needs.
- Turborepo: Standard tool for TypeScript monorepos with multiple packages. Used by Vercel, numerous open-source projects.
- Linear CLI: TypeScript CLI consuming a GraphQL API, but the thin-client pattern applies equally to REST.
- Commander.js: Most popular Node.js CLI framework. Simpler than oclif for a focused product.

**Confidence note:** These are well-established, battle-tested patterns. The monorepo-with-shared-types approach is the standard for TypeScript projects with multiple deployment targets. The browser auth flow is used by every major CLI tool. HIGH confidence across the board. No web search was available to verify latest versions, but these architectural patterns are stable and unlikely to have changed.

---
*Architecture research for: CLI-first Kanban board (Kanbambam)*
*Researched: 2026-03-25*

# Architecture Research

**Domain:** CLI-first Kanban board with cloud API and web app
**Researched:** 2026-03-25
**Confidence:** HIGH (established patterns from gh CLI, Vercel CLI, Linear CLI, Turborepo monorepos)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Layer                               │
│  ┌──────────────┐                        ┌──────────────┐       │
│  │  CLI (Node)  │                        │  Web (React)  │      │
│  │  kanbambam   │                        │  Next.js App  │      │
│  └──────┬───────┘                        └──────┬────────┘      │
│         │ HTTPS                                 │ HTTPS         │
├─────────┴───────────────────────────────────────┴───────────────┤
│                      API Layer                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  REST API (Node.js)                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │   │
│  │  │  Auth    │  │  Routes  │  │  Middleware│              │   │
│  │  └──────────┘  └────┬─────┘  └──────────┘               │   │
│  │                     │                                     │   │
│  │              ┌──────┴──────┐                              │   │
│  │              │  Services   │                              │   │
│  │              └──────┬──────┘                              │   │
│  └─────────────────────┼────────────────────────────────────┘   │
├─────────────────────────┼───────────────────────────────────────┤
│                      Data Layer                                 │
│  ┌──────────────────────┴───────────────────────────────────┐   │
│  │                   PostgreSQL                              │   │
│  │  Users / Workspaces / Boards / Columns / Items            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

Both CLI and Web are **equal, thin clients** of the same REST API. Neither has privileged access. This is the defining architectural principle -- the API is the product; the clients are views.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **CLI (`packages/cli`)** | Parse commands, authenticate, call API, format terminal output | Commander.js or oclif; thin HTTP client wrapper |
| **API (`packages/api`)** | Business logic, auth, validation, data access | Express or Fastify; layered service architecture |
| **Web (`packages/web`)** | Visual board UI, drag-and-drop, browser auth | Next.js with App Router; API route proxying optional |
| **Shared (`packages/shared`)** | Types, validation schemas, constants, API contract | Zod schemas that define both validation and TypeScript types |

## Recommended Project Structure

### Monorepo Layout (Turborepo)

```
kanbambam/
├── turbo.json                  # Turborepo pipeline config
├── package.json                # Root workspace config
├── tsconfig.base.json          # Shared TS config
├── packages/
│   ├── shared/                 # Shared types, schemas, constants
│   │   ├── src/
│   │   │   ├── schemas/        # Zod schemas (source of truth for types)
│   │   │   │   ├── workspace.ts
│   │   │   │   ├── board.ts
│   │   │   │   ├── column.ts
│   │   │   │   ├── item.ts
│   │   │   │   └── auth.ts
│   │   │   ├── types/          # Inferred types from schemas
│   │   │   │   └── index.ts    # export type Board = z.infer<typeof BoardSchema>
│   │   │   ├── constants/      # Shared constants (limits, defaults)
│   │   │   └── api-contract.ts # Route definitions, request/response shapes
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api/                    # REST API server
│   │   ├── src/
│   │   │   ├── routes/         # Route handlers (thin -- delegate to services)
│   │   │   ├── services/       # Business logic layer
│   │   │   ├── db/             # Database access (queries, migrations)
│   │   │   ├── middleware/     # Auth, validation, error handling
│   │   │   └── server.ts       # Entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── cli/                    # CLI application
│   │   ├── src/
│   │   │   ├── commands/       # One file per command group
│   │   │   │   ├── auth.ts     # login, logout, status
│   │   │   │   ├── workspace.ts
│   │   │   │   ├── board.ts
│   │   │   │   ├── column.ts
│   │   │   │   └── item.ts
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts   # HTTP client wrapping fetch/got
│   │   │   │   ├── config.ts       # Local config (~/.kanbambam)
│   │   │   │   ├── auth.ts         # Token storage and refresh
│   │   │   │   └── output.ts       # Table/JSON/plain formatters
│   │   │   └── index.ts        # Entry point, command registration
│   │   ├── bin/
│   │   │   └── kanbambam.js    # Shebang entry (#!/usr/bin/env node)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # Next.js web application
│       ├── src/
│       │   ├── app/            # Next.js App Router pages
│       │   ├── components/     # React components
│       │   │   ├── board/      # Board view, column, card components
│       │   │   └── ui/         # Generic UI primitives
│       │   ├── lib/
│       │   │   ├── api-client.ts   # Browser HTTP client
│       │   │   └── auth.ts         # Session/token management
│       │   └── hooks/          # React hooks for data fetching
│       ├── package.json
│       └── tsconfig.json
│
├── .github/
│   └── workflows/              # CI/CD
└── docker-compose.yml          # Local dev (Postgres)
```

### Structure Rationale

- **`packages/shared/`:** The single most important package. Zod schemas are the source of truth -- they generate TypeScript types AND runtime validation. Both CLI and Web import these. The API validates request bodies against them. This eliminates type drift between clients and server.
- **`packages/api/`:** Routes-Services-DB layered architecture. Routes are thin (parse request, call service, return response). Services contain business logic. DB layer handles queries. This makes testing straightforward -- mock the DB layer, test services directly.
- **`packages/cli/`:** Commands are organized by resource (board, item) not by action (create, list). Each command file exports subcommands. The `api-client.ts` is a thin wrapper that handles auth headers, base URL, and error translation.
- **`packages/web/`:** Standard Next.js App Router. The web app calls the same API as the CLI -- it does NOT use Next.js server actions or API routes for data mutation. This maintains the principle that both clients are equal API consumers.

## Architectural Patterns

### Pattern 1: Shared Schema as Contract (Critical)

**What:** Zod schemas in `packages/shared` define the shape of every entity and every API request/response. TypeScript types are inferred from schemas, never hand-written separately.
**When to use:** Always. This is the foundation of the architecture.
**Trade-offs:** Adds a build step for the shared package. Worth it -- eliminates an entire class of bugs where CLI sends data the API does not expect.

**Example:**
```typescript
// packages/shared/src/schemas/item.ts
import { z } from 'zod';

export const ItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  columnId: z.string().uuid(),
  position: z.number().int().min(0),
  labels: z.array(z.string()).default([]),
  dueDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateItemSchema = ItemSchema.pick({
  title: true,
  description: true,
  columnId: true,
  labels: true,
  dueDate: true,
});

export type Item = z.infer<typeof ItemSchema>;
export type CreateItem = z.infer<typeof CreateItemSchema>;
```

### Pattern 2: Thin CLI Client

**What:** The CLI does zero business logic. It parses args, calls the API, and formats the response. All validation and logic lives in the API.
**When to use:** Always for CLI commands.
**Trade-offs:** CLI requires network access for every operation (no offline mode). This is an explicit design choice per PROJECT.md.

**Example:**
```typescript
// packages/cli/src/commands/item.ts
import { command } from 'commander';
import { apiClient } from '../lib/api-client';
import { formatTable } from '../lib/output';

export const itemCommand = command('item')
  .description('Manage items');

itemCommand
  .command('create')
  .requiredOption('--board <id>', 'Board ID')
  .requiredOption('--column <id>', 'Column ID')
  .requiredOption('--title <title>', 'Item title')
  .option('--description <desc>', 'Description')
  .action(async (opts) => {
    const item = await apiClient.post('/items', {
      columnId: opts.column,
      title: opts.title,
      description: opts.description,
    });
    formatTable([item]);
  });
```

### Pattern 3: Browser-Based CLI Auth (Device Flow)

**What:** CLI opens a browser for login instead of collecting credentials in the terminal. The CLI starts a local HTTP server, redirects the user to the web app's login page with a callback URL, and receives a token when auth completes.
**When to use:** For `kanbambam auth login`.
**Trade-offs:** More complex than username/password prompts, but much more secure. This is the established pattern (GitHub CLI, Vercel CLI, Railway CLI all do this).

**Flow:**
```
1. User runs: kanbambam auth login
2. CLI starts local server on random port (e.g., localhost:9876)
3. CLI opens browser to: https://app.kanbambam.com/cli-auth?port=9876
4. User logs in via web app (or is already logged in)
5. Web app redirects to: http://localhost:9876/callback?token=<jwt>
6. CLI receives token, stores in ~/.kanbambam/config.json
7. CLI shuts down local server
8. CLI prints: "Authenticated as user@example.com"
```

### Pattern 4: Layered API Services

**What:** API routes delegate to service functions. Services contain business logic. A separate DB/repository layer handles queries. Routes never touch the database directly.
**When to use:** Always for the API.
**Trade-offs:** Slightly more files than putting everything in routes. Pays off immediately when testing -- services can be tested without HTTP, DB layer can be mocked.

```
Route Handler -> Validation (Zod) -> Service -> Repository -> Database
     |                                                          ^
  Response <----------------------------------------------------+
```

## Data Flow

### CLI Request Flow

```
User types: kanbambam item create --board abc --column def --title "Fix bug"
    |
CLI parses args (Commander.js)
    |
CLI reads auth token from ~/.kanbambam/config.json
    |
CLI sends POST /api/items { columnId, title }
    with Authorization: Bearer <token>
    |
API middleware validates JWT -> extracts userId
    |
API route validates body with Zod (CreateItemSchema)
    |
API service checks: does user own this board? Is columnId valid?
    |
API repository inserts row into items table
    |
API returns 201 { id, title, columnId, position, ... }
    |
CLI formats response as table/JSON and prints to stdout
```

### Web App Request Flow

```
User drags card from "To Do" to "In Progress"
    |
React component fires onDragEnd handler
    |
Optimistic UI update (move card in local state)
    |
API client sends PATCH /api/items/:id { columnId: newColumnId, position: newPos }
    with Authorization: Bearer <token> (from cookie/localStorage)
    |
API validates, updates, returns 200
    |
On success: confirm local state
On failure: revert optimistic update, show error toast
```

### Key Data Flows

1. **Auth flow (CLI):** Browser login -> local callback server -> token stored in `~/.kanbambam/config.json` -> token sent as Bearer header on every request.
2. **Auth flow (Web):** Standard login form -> JWT stored in httpOnly cookie or localStorage -> sent automatically on requests.
3. **CRUD flow (both clients):** Client -> REST API -> Validate -> Service logic -> Database -> Response. Identical path regardless of which client initiated.
4. **Hierarchy traversal:** User selects workspace -> fetches boards -> selects board -> fetches columns with items. The CLI uses flags (`--workspace`, `--board`) or interactive prompts. The web app uses navigation.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Single API server, single Postgres instance. This is the v1 target. No changes needed. |
| 1k-10k users | Add connection pooling (PgBouncer or built-in pool). Add Redis for session cache if JWT refresh becomes a bottleneck. Consider read replicas if read-heavy. |
| 10k-100k users | Horizontal API scaling behind a load balancer. Database indexing becomes critical (composite indexes on userId + workspaceId, boardId + position). CDN for web app static assets. |

### Scaling Priorities

1. **First bottleneck:** Database connections. A Node.js API server with pooling handles thousands of concurrent requests. The database connection limit will be hit first. Fix: connection pooling, then read replicas.
2. **Second bottleneck:** API response time for board views. A board with many columns and items means a heavy query. Fix: eager-load columns + items in a single query with proper indexing, not N+1 queries.

## Anti-Patterns

### Anti-Pattern 1: Web App Bypassing the API

**What people do:** Use Next.js server actions or API routes to query the database directly from the web app, bypassing the shared REST API.
**Why it's wrong:** Creates two sources of truth for business logic. CLI and web diverge. Bugs get fixed in one path but not the other. Authorization logic gets duplicated.
**Do this instead:** The web app calls the same REST API as the CLI. Next.js server components can call the API server-side for SSR, but they still go through the REST API, not directly to the database.

### Anti-Pattern 2: Duplicating Types Instead of Sharing

**What people do:** Define `interface Item { ... }` separately in CLI, API, and web packages.
**Why it's wrong:** Types drift. CLI sends `dueDate` as a string, API expects a Date object, web renders neither correctly. This is the number one source of integration bugs in multi-package TypeScript projects.
**Do this instead:** Single Zod schema in `packages/shared`. All packages import from there. The schema IS the type.

### Anti-Pattern 3: Fat CLI Commands

**What people do:** Put validation logic, business rules, or data transformation in CLI command handlers.
**Why it's wrong:** The CLI becomes a second API. Changes need to be made in two places. The web app does not benefit from CLI-side validation improvements.
**Do this instead:** CLI sends raw user input to the API. API validates and rejects with clear error messages. CLI formats those error messages for the terminal.

### Anti-Pattern 4: Monolithic API File

**What people do:** Put all routes in a single `server.ts` or `routes.ts` file.
**Why it's wrong:** Becomes unmaintainable past ~10 routes. Hard to find things, merge conflicts everywhere.
**Do this instead:** One route file per resource (`items.ts`, `boards.ts`, `columns.ts`). Each route file is registered in `server.ts`. Services in separate files.

### Anti-Pattern 5: Positional Arguments for Everything in CLI

**What people do:** `kanbambam create "Fix bug" board-id column-id` with positional args.
**Why it's wrong:** Unreadable, easy to mix up argument order, terrible for AI agents that need to construct commands programmatically.
**Do this instead:** Use named flags: `kanbambam item create --title "Fix bug" --board abc --column def`. Positional args are fine for the primary identifier only (e.g., `kanbambam board view <board-id>`).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PostgreSQL | Direct connection via query builder (Drizzle or Prisma) | Use migrations from day one. Never manual schema changes. |
| Email (transactional) | API call from auth service for password reset | Defer until needed. Magic link auth can avoid this entirely for v1. |
| CDN (web assets) | Vercel/Netlify handles this automatically for Next.js | No custom setup needed if using standard deployment. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| CLI <-> API | HTTPS REST (JSON) | CLI is a pure HTTP client. No shared runtime code with API. |
| Web <-> API | HTTPS REST (JSON) | Same as CLI. Web may proxy through Next.js for CORS simplicity. |
| Shared <-> All | Build-time import | Shared package is compiled TS. Consumed as a dependency by all three. |
| API <-> Database | Connection pool (TCP) | ORM/query builder in API only. No other package touches the DB. |

## Build Order (Dependencies Between Components)

This is the critical insight for roadmap phasing:

```
1. packages/shared     (no dependencies -- build first)
       |
2. packages/api        (depends on shared)
       |
3. packages/cli        (depends on shared, needs running API)
   packages/web        (depends on shared, needs running API)
       |               (CLI and Web can be built in parallel)
4. Integration         (CLI + Web both talking to same API)
```

**Build order rationale:**
- **Shared first** because it defines the data model and API contract. Everything else depends on it.
- **API second** because both clients need an API to talk to. You cannot test CLI or Web without a running API.
- **CLI third** because it is the "first" product (CLI-first). It also validates the API design -- if the CLI feels awkward, the API routes are wrong. Fix the API before building the web app.
- **Web in parallel or fourth** because it consumes the same API the CLI already validated. The drag-and-drop board UI is the most complex frontend work but does not block CLI delivery.

## Sources

- GitHub CLI (gh) architecture: Go monorepo, thin CLI client pattern, browser-based auth flow. The gold standard for CLI-first developer tools.
- Vercel CLI: Node.js CLI calling Vercel API. Uses device auth flow similar to what Kanbambam needs.
- Turborepo: Standard tool for TypeScript monorepos with multiple packages. Used by Vercel, numerous open-source projects.
- Linear CLI: TypeScript CLI consuming a GraphQL API, but the thin-client pattern applies equally to REST.
- Commander.js: Most popular Node.js CLI framework. Simpler than oclif for a focused product.

**Confidence note:** These are well-established, battle-tested patterns. The monorepo-with-shared-types approach is the standard for TypeScript projects with multiple deployment targets. The browser auth flow is used by every major CLI tool. HIGH confidence across the board. No web search was available to verify latest versions, but these architectural patterns are stable and unlikely to have changed.

---
*Architecture research for: CLI-first Kanban board (Kanbambam)*
*Researched: 2026-03-25*

