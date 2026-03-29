<p align="center">
  <pre align="center">
 ██╗  ██╗ █████╗ ███╗   ██╗██████╗  █████╗ ███╗   ███╗██████╗  █████╗ ███╗   ███╗
 ██║ ██╔╝██╔══██╗████╗  ██║██╔══██╗██╔══██╗████╗ ████║██╔══██╗██╔══██╗████╗ ████║
 █████╔╝ ███████║██╔██╗ ██║██████╔╝███████║██╔████╔██║██████╔╝███████║██╔████╔██║
 ██╔═██╗ ██╔══██║██║╚██╗██║██╔══██╗██╔══██║██║╚██╔╝██║██╔══██╗██╔══██║██║╚██╔╝██║
 ██║  ██╗██║  ██║██║ ╚████║██████╔╝██║  ██║██║ ╚═╝ ██║██████╔╝██║  ██║██║ ╚═╝ ██║
 ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝
  </pre>
</p>

<p align="center">
  <strong>CLI-first Kanban board management</strong><br>
  One source of truth. Two ways to interact.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/kanbambam"><img src="https://img.shields.io/npm/v/kanbambam?color=22d3ee&label=npm" alt="npm version"></a>
  <a href="https://kanbambam.vercel.app"><img src="https://img.shields.io/badge/web-kanbambam.vercel.app-06b6d4" alt="Web App"></a>
  <a href="https://github.com/rrico321/Kanbambam/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-155e75" alt="License"></a>
</p>

---

Kanbambam is a Kanban board product with a CLI-first design. Manage boards, columns, and items entirely from the terminal — or use the Trello-style web app for a full GUI experience. Both interfaces share the same cloud API, so everything stays in sync.

## Features

- **Full CLI** — create workspaces, boards, columns, and items without leaving the terminal
- **Web GUI** — drag-and-drop Kanban board at [kanbambam.vercel.app](https://kanbambam.vercel.app)
- **Real-time sync** — CLI and web share the same API and database
- **AI agent friendly** — `--json` output and `--force` flags for non-interactive automation
- **Labels, due dates, assignments, descriptions** — everything you need for project management
- **Browser-based auth** — `kanbambam auth login` opens your browser, no passwords in the terminal

## Quick Start

```bash
# Install the CLI
npm install -g kanbambam

# Log in
kanbambam auth login

# Create a workspace and board
kanbambam workspace create "My Project"
kanbambam context set --workspace <id>
kanbambam board create "Sprint 1"
kanbambam context set --board <id>

# Add items
kanbambam item create "Build the thing" --column <id> --description "Make it great"
kanbambam item edit <id> --label backend --label high-priority --due-date 2026-04-01
kanbambam item edit <id> --assigned-to "Alice"

# View your board
kanbambam board view
```

```
=== Backlog (3) ===
  Build the thing [backend, high-priority] 2026-04-01
  Write tests [testing] 2026-04-05
  Deploy to production [devops]
=== In Progress (1) ===
  Design landing page [frontend, design] 2026-04-03
=== Done (1) ===
  Set up CI/CD [devops, done]
```

## Architecture

```
kanbambam/
├── apps/
│   ├── cli/          # CLI tool (npm: kanbambam)
│   ├── api/          # REST API (Hono + Drizzle + PostgreSQL)
│   └── web/          # Web app (Next.js 15 + React 19)
├── packages/
│   └── shared/       # Shared types and Zod schemas
├── docker-compose.yml
├── turbo.json
└── package.json
```

| Component | Stack | Deployment |
|-----------|-------|------------|
| **CLI** | Commander.js, Ink, Chalk | [npm](https://www.npmjs.com/package/kanbambam) |
| **API** | Hono, Drizzle ORM, PostgreSQL (Neon) | [Vercel](https://kanbambam-api.vercel.app) |
| **Web** | Next.js 15, React 19, Tailwind CSS 4, TanStack Query | [Vercel](https://kanbambam.vercel.app) |
| **Shared** | TypeScript, Zod | Internal package |

## Development

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker (for local PostgreSQL)

### Setup

```bash
# Clone the repo
git clone https://github.com/rrico321/Kanbambam.git
cd Kanbambam

# Install dependencies
pnpm install

# Start PostgreSQL
docker compose up -d

# Copy environment variables
cp .env.example apps/api/.env

# Push database schema
pnpm db:push

# Start all apps in dev mode
pnpm dev
```

This starts:
- **API** on `http://localhost:3000`
- **Web** on `http://localhost:3001`

### Environment Variables

The API requires these variables in `apps/api/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | Secret for signing tokens (min 32 chars) | — |
| `JWT_EXPIRY` | Access token lifetime | `15m` |
| `REFRESH_TOKEN_EXPIRY` | Refresh token lifetime | `7d` |
| `PORT` | API server port | `3000` |
| `NODE_ENV` | Environment | `development` |

### Scripts

```bash
pnpm build        # Build all packages
pnpm dev          # Start all apps in dev mode
pnpm test         # Run tests across all packages
pnpm lint         # Lint with Biome
pnpm lint:fix     # Auto-fix lint issues
pnpm format       # Format with Biome
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema to database (dev)
```

## CLI Reference

Full CLI documentation is on the [npm page](https://www.npmjs.com/package/kanbambam). Here's a summary:

```
kanbambam auth login|logout|status       Authentication
kanbambam workspace create|list|rename|delete   Workspaces
kanbambam board create|list|view|rename|delete  Boards
kanbambam column add|rename|reorder|delete      Columns
kanbambam item create|list|show|edit|move|reorder|delete  Items
kanbambam context set|clear              Set active workspace/board
```

Global flags:
- `--json` — machine-readable JSON output
- `--force` — skip confirmation prompts (for scripting and AI agents)

## Data Model

```
User
 └── Workspace (e.g. "Q2 Product Launch")
      └── Board (e.g. "Engineering Sprint 1")
           └── Column (e.g. "In Progress")
                └── Item (title, description, labels, due date, assigned to, position)
```

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

MIT
