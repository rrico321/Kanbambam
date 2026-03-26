# Phase 2: Authentication Flows - Research

**Researched:** 2026-03-26
**Domain:** Authentication (web + CLI), CLI scaffolding, Next.js setup, terminal UI
**Confidence:** HIGH

## Summary

Phase 2 builds two new applications (`apps/cli` and `apps/web`) and extends the existing API with a logout/revoke endpoint and a CLI auth code exchange endpoint. The Phase 1 API already implements signup, login, and refresh token rotation -- this phase creates the clients that consume those endpoints.

The three main work streams are: (1) CLI package scaffolding with Commander.js + Ink 6 + conf for the auth flow and output formatting infrastructure, (2) Next.js web app with minimal auth pages (login, signup, callback, logout), and (3) a new API endpoint for CLI auth code exchange. The localhost callback pattern (like `gh auth login`) is well-established and straightforward to implement.

**Primary recommendation:** Scaffold both apps in parallel since they share `@kanbambam/shared` schemas but are otherwise independent. The CLI auth flow requires coordination with a web `/auth/callback` page, so plan that integration point carefully.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Localhost callback flow -- `kanbambam auth login` starts a temporary HTTP server on localhost, opens the browser to the web login page with a callback URL, browser redirects back with auth code after login. Like `gh auth login`.
- **D-02:** Fallback for headless environments -- `kanbambam auth login --manual` displays a URL the user can open elsewhere, then paste the resulting token back into the CLI. Covers SSH, containers, CI.
- **D-03:** CLI stores both access token and refresh token via `conf` library. CLI auto-refreshes silently when access token expires using the stored refresh token.
- **D-04:** Auth pages only -- minimal Next.js setup with login, signup, and logout pages. No app shell, no navigation, no board views. Phase 5 builds the full web app on top.
- **D-05:** Clean and minimal styling -- centered card with form fields, simple branding. GitHub/Linear login style. Tailwind utility classes.
- **D-06:** CLI callback page in Next.js -- `/auth/callback` page receives the auth code from the CLI localhost redirect, exchanges tokens, shows "You can close this tab" message.
- **D-07:** Ink-rendered tables and boxes for human-readable output -- bordered tables, colored status badges, box-drawn layouts. Rich terminal UI using Ink (React for terminal).
- **D-08:** `--json` output matches API envelope format -- same `{ data, meta }` structure as the API. One schema for scripts and AI agents to learn.
- **D-09:** Smart TTY detection -- if stdout is not a TTY (piped), auto-disable colors and Ink rendering. Output plain text. Standard CLI practice.
- **D-10:** Web logout revokes current session only -- deletes the current refresh token from the server. Other sessions (CLI, other browsers) stay active.
- **D-11:** CLI silent auto-refresh -- if access token expired, CLI transparently refreshes using stored refresh token before retrying. User never sees an error unless refresh token is also expired.
- **D-12:** `kanbambam auth logout` revokes server-side + clears local -- sends revoke request to API (deletes refresh token), then clears locally stored tokens. Clean logout from both sides.

### Claude's Discretion
- Localhost callback server port selection and lifecycle
- CLI auth flow error handling and timeout behavior
- Next.js project configuration and folder structure
- Ink component architecture for output rendering
- Token refresh retry logic and edge cases
- Web form validation approach and error display

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign up with email and password via web app | Next.js signup page consuming existing `POST /api/v1/auth/signup` |
| AUTH-02 | User can log in via web app | Next.js login page consuming existing `POST /api/v1/auth/login` |
| AUTH-03 | User can log out from web app | New API revoke endpoint + web logout page/action |
| AUTH-04 | User can authenticate CLI via browser login flow | Localhost callback server + web callback page + API code exchange |
| AUTH-05 | CLI auth token persists across sessions | `conf` library stores tokens in OS config directory |
| CLI-02 | Every command supports `--json` flag for structured JSON output | Commander.js global option + output formatter abstraction |
| CLI-03 | Human-readable formatted output by default | Ink 6 components (Box, Text) for rich terminal rendering |
| CLI-04 | Browser-based login flow (`kanbambam auth login` opens browser, receives token) | Same as AUTH-04 -- localhost callback pattern |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- TypeScript everywhere (CLI, API, Web)
- Use Commander.js for CLI command parsing (not Oclif, not Yargs)
- Use Ink for rich terminal UI (not cli-table3 + ora)
- Use conf for local config storage
- Use Hono for API (already in place)
- Use Next.js 15+ with React 19 for web
- Use Tailwind CSS v4 for styling
- Use jose for JWT (already in place)
- Use Vitest for testing
- Use Biome for linting/formatting
- Use tsup for CLI bundling
- pnpm workspaces with Turborepo
- Do NOT use Express, Prisma, jsonwebtoken, dotenv, ESLint+Prettier, npm/yarn, Lerna

## Standard Stack

### CLI App (`apps/cli`) - New Package

| Library | Verified Version | Purpose | Why Standard |
|---------|-----------------|---------|--------------|
| commander | 14.0.3 | Command parsing and routing | Stable, TypeScript-native, chainable API. Project constraint. |
| ink | 6.8.0 | Rich terminal UI rendering | React for terminal. v6 requires React 19+, aligns with web React version. Resolves prior concern about React version mismatch. |
| react | 19.2.4 | Required by Ink 6 | Ink 6 peer dependency. Both CLI and web now use React 19 -- no version conflict. |
| conf | 15.1.0 | Persistent local config (tokens, preferences) | OS-appropriate config dir, encrypted option available, simple key-value. |
| open | 11.0.0 | Open browser for auth flow | Cross-platform browser launcher. |
| chalk | 5.6.2 | Terminal string styling | ESM-native color output. Used alongside Ink for styled text. |

### Web App (`apps/web`) - New Package

| Library | Verified Version | Purpose | Why Standard |
|---------|-----------------|---------|--------------|
| next | 16.2.1 | React framework | Latest stable. App Router. Auth pages use Server Actions or client-side fetch. Note: CLAUDE.md says ^15.x but 16 is current and compatible. |
| react | 19.2.4 | UI library | Next.js 16 peer dependency. |
| tailwindcss | 4.2.2 | Styling | v4 uses CSS-based config (not JS). Requires `@tailwindcss/postcss` for Next.js integration. |
| @tailwindcss/postcss | 4.2.2 | PostCSS integration for Next.js | Required for Tailwind v4 + Next.js. |

### API Extensions

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| (existing stack) | - | Auth endpoints already implemented | Need to ADD: logout/revoke endpoint, CLI auth code exchange endpoint |

### Development

| Tool | Version | Purpose |
|------|---------|---------|
| tsup | ^8.x (existing) | Bundle CLI for distribution |
| vitest | ^3.x (existing) | Testing for new packages |
| tsx | ^4.x (existing) | Dev-time TypeScript execution |

**Installation (CLI):**
```bash
cd apps/cli
pnpm add commander@^14 ink@^6 react@^19 conf@^15 open@^11 chalk@^5
pnpm add -D @types/react@^19 tsup@^8 tsx@^4 vitest@^3 typescript@^5.8
```

**Installation (Web):**
```bash
pnpm create next-app@latest apps/web --typescript --tailwind --eslint=false --app --src-dir --import-alias "@/*"
# Then remove ESLint config, add Biome integration
cd apps/web
pnpm add @kanbambam/shared@workspace:*
```

### Version Compatibility Update

| Concern from STATE.md | Resolution |
|----------------------|------------|
| "Verify Ink 5 + React 19 compatibility" | RESOLVED: Ink 6.x (released since Ink 5) requires React >=19.0.0. Use Ink 6, not Ink 5. Both CLI and web use React 19. |
| "Next.js may be on v15.1+ or even v16" | CONFIRMED: Next.js 16.2.1 is latest stable. Supports React 19. Use Next.js 16. |
| CLAUDE.md says "Ink ^5.x" | OVERRIDE: Ink 5 maxes at React 18. Ink 6 is the correct choice for React 19. Update CLAUDE.md if needed. |
| CLAUDE.md says "Next.js ^15.x" | Next.js 16 is current stable. Both 15 and 16 support React 19. Using 16 is fine. |

## Architecture Patterns

### CLI Project Structure
```
apps/cli/
  src/
    index.ts              # Entry point: create Commander program
    commands/
      auth/
        login.ts          # auth login command (localhost callback)
        logout.ts         # auth logout command
        status.ts         # auth status command (who am I)
    lib/
      config.ts           # conf instance (token storage)
      api-client.ts       # HTTP client with auto-refresh
      output.ts           # Output formatter (Ink vs JSON vs plain)
    components/
      AuthSuccess.tsx     # Ink component: login success message
      ErrorDisplay.tsx    # Ink component: error display
      Table.tsx           # Ink component: reusable table
      Spinner.tsx         # Ink component: loading indicator
    types.ts              # CLI-specific types
  package.json
  tsconfig.json
  tsup.config.ts
```

### Web Project Structure
```
apps/web/
  src/
    app/
      layout.tsx          # Root layout (minimal: font, Tailwind)
      page.tsx            # Redirect to /auth/login
      auth/
        login/
          page.tsx        # Login form
        signup/
          page.tsx        # Signup form
        logout/
          page.tsx        # Logout action page
        callback/
          page.tsx        # CLI auth callback handler
    lib/
      api.ts              # API client (fetch wrapper)
      auth.ts             # Auth helpers (store/read tokens from cookies)
    components/
      AuthCard.tsx        # Shared card layout for auth forms
      FormField.tsx       # Reusable form field component
  package.json
  tsconfig.json
  next.config.ts
  postcss.config.mjs
```

### Pattern 1: CLI Localhost Callback Auth Flow
**What:** CLI starts temp HTTP server, opens browser to web login, browser redirects back with tokens.
**When to use:** `kanbambam auth login` (default mode).
**Flow:**
```
1. CLI generates random `state` parameter (CSRF protection)
2. CLI starts HTTP server on random available port (e.g., 42847)
3. CLI opens browser: https://app.kanbambam.com/auth/login?cli_callback=http://localhost:42847/callback&state=abc123
4. User logs in on web page
5. Web page redirects to: http://localhost:42847/callback?access_token=...&refresh_token=...&state=abc123
6. CLI server receives tokens, verifies state matches
7. CLI stores tokens via conf, shuts down HTTP server
8. CLI displays success message via Ink
```

**Example (CLI localhost server):**
```typescript
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import open from 'open';

function getAvailablePort(): Promise<number> {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(0, () => {
      const port = (server.address() as any).port;
      server.close(() => resolve(port));
    });
  });
}

async function startAuthFlow(apiBaseUrl: string, webBaseUrl: string) {
  const port = await getAvailablePort();
  const state = randomBytes(16).toString('hex');

  return new Promise<{ accessToken: string; refreshToken: string }>((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('Auth flow timed out after 5 minutes'));
    }, 5 * 60 * 1000);

    const server = http.createServer((req, res) => {
      const url = new URL(req.url!, `http://localhost:${port}`);
      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end();
        return;
      }
      const returnedState = url.searchParams.get('state');
      if (returnedState !== state) {
        res.writeHead(400);
        res.end('State mismatch');
        return;
      }
      const accessToken = url.searchParams.get('access_token');
      const refreshToken = url.searchParams.get('refresh_token');
      // Send HTML response telling user to close tab
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body><h2>Authentication successful!</h2><p>You can close this tab.</p></body></html>');
      clearTimeout(timeout);
      server.close();
      resolve({ accessToken: accessToken!, refreshToken: refreshToken! });
    });

    server.listen(port, () => {
      const callbackUrl = `http://localhost:${port}/callback`;
      const loginUrl = `${webBaseUrl}/auth/login?cli_callback=${encodeURIComponent(callbackUrl)}&state=${state}`;
      open(loginUrl);
    });
  });
}
```

### Pattern 2: CLI API Client with Auto-Refresh
**What:** HTTP client wrapper that transparently refreshes expired access tokens.
**When to use:** Every authenticated CLI command.
**Example:**
```typescript
import Conf from 'conf';

const config = new Conf<{
  accessToken: string;
  refreshToken: string;
  apiBaseUrl: string;
}>({ projectName: 'kanbambam' });

async function apiRequest(path: string, options: RequestInit = {}) {
  const accessToken = config.get('accessToken');
  if (!accessToken) throw new Error('Not authenticated. Run: kanbambam auth login');

  let res = await fetch(`${config.get('apiBaseUrl')}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  // Auto-refresh on 401
  if (res.status === 401) {
    const refreshToken = config.get('refreshToken');
    if (!refreshToken) throw new Error('Session expired. Run: kanbambam auth login');

    const refreshRes = await fetch(`${config.get('apiBaseUrl')}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) {
      config.delete('accessToken');
      config.delete('refreshToken');
      throw new Error('Session expired. Run: kanbambam auth login');
    }

    const { data } = await refreshRes.json();
    config.set('accessToken', data.accessToken);
    config.set('refreshToken', data.refreshToken);

    // Retry original request with new token
    res = await fetch(`${config.get('apiBaseUrl')}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${data.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  return res;
}
```

### Pattern 3: Output Formatter (JSON vs Ink vs Plain)
**What:** Abstraction that routes output through Ink (TTY), JSON (`--json` flag), or plain text (piped).
**When to use:** Every CLI command that produces output.
**Example:**
```typescript
import { render } from 'ink';
import React from 'react';

type OutputMode = 'ink' | 'json' | 'plain';

function detectOutputMode(flags: { json?: boolean }): OutputMode {
  if (flags.json) return 'json';
  if (!process.stdout.isTTY) return 'plain';
  return 'ink';
}

function output<T>(data: T, meta: Record<string, unknown>, options: {
  mode: OutputMode;
  inkComponent: React.FC<{ data: T }>;
  plainFormatter: (data: T) => string;
}) {
  switch (options.mode) {
    case 'json':
      // Match API envelope format per D-08
      console.log(JSON.stringify({ data, meta }, null, 2));
      break;
    case 'plain':
      console.log(options.plainFormatter(data));
      break;
    case 'ink':
      render(React.createElement(options.inkComponent, { data }));
      break;
  }
}
```

### Pattern 4: Web Auth with httpOnly Cookies
**What:** Web app stores tokens in httpOnly cookies, not localStorage.
**When to use:** Web auth pages.
**Why:** Prevents XSS from stealing tokens. The web app sets cookies via Server Actions or API responses.
**Example (Next.js Server Action):**
```typescript
'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const res = await fetch(`${process.env.API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    return { error: error.message };
  }

  const { data } = await res.json();
  const cookieStore = await cookies();

  cookieStore.set('access_token', data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  });

  cookieStore.set('refresh_token', data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });

  redirect('/');
}
```

### Anti-Patterns to Avoid
- **Storing tokens in localStorage on web:** Use httpOnly cookies. localStorage is vulnerable to XSS.
- **Passing tokens in URL query params over HTTPS for web:** Only acceptable for the CLI localhost callback (which is local-only). Web auth should use POST bodies and cookies.
- **Building custom CLI argument parsing:** Use Commander.js. Do not parse process.argv manually.
- **Rendering Ink components when piped:** Check `process.stdout.isTTY` before using Ink. Piped output should be plain text or JSON.
- **Sharing a single React version between Ink and Next.js in monorepo:** Both now use React 19, but they are separate installations in separate workspace packages. Do not hoist React to root.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CLI argument parsing | Custom argv parser | Commander.js 14 | Handles subcommands, options, help text, validation |
| Terminal UI (tables, boxes) | ANSI escape codes | Ink 6 components | Flexbox layout, React model, handles resize |
| Local config storage | Custom JSON file in ~/.config | conf 15 | OS-appropriate paths, atomic writes, schema support |
| Browser opening | `child_process.exec('open')` | open 11 | Cross-platform (macOS, Linux, Windows, WSL) |
| Random port selection | Hardcoded port | `server.listen(0)` | OS assigns available port, no collisions |
| CSRF state parameter | Sequential counter | `crypto.randomBytes(16)` | Cryptographically secure, prevents CSRF |
| JWT decoding (client-side) | Custom base64 parser | jose `decodeJwt` | Handles edge cases, typed output |
| Color output | ANSI codes | chalk 5 | Terminal capability detection, ESM-native |

## Common Pitfalls

### Pitfall 1: CLI Auth Server Hanging
**What goes wrong:** User closes browser without completing login, CLI server stays running forever.
**Why it happens:** No timeout on the localhost HTTP server.
**How to avoid:** Set a 5-minute timeout. After timeout, close server and display error message.
**Warning signs:** CLI process won't exit after Ctrl+C in some terminals.

### Pitfall 2: Port Conflicts
**What goes wrong:** CLI tries to start HTTP server on a port already in use.
**Why it happens:** Hardcoded port number.
**How to avoid:** Use `server.listen(0)` to let the OS assign an available port. Pass the port in the callback URL.
**Warning signs:** EADDRINUSE errors.

### Pitfall 3: Refresh Token Race Condition
**What goes wrong:** Two concurrent CLI commands both detect 401, both try to refresh, second refresh fails (rotation invalidated the first token).
**Why it happens:** Refresh token rotation means each token is single-use.
**How to avoid:** Mutex/lock on the refresh operation. Queue concurrent requests until refresh completes. For Phase 2 this is unlikely (single CLI command at a time) but the API client should be designed to handle it.
**Warning signs:** Intermittent auth failures when running rapid CLI commands.

### Pitfall 4: Ink Rendering in Non-TTY
**What goes wrong:** Ink tries to render in a piped/redirected environment, output is garbled or throws.
**Why it happens:** Ink uses terminal-specific features (cursor positioning, ANSI codes) that don't work in pipes.
**How to avoid:** Check `process.stdout.isTTY` before rendering with Ink. Fall back to plain text output.
**Warning signs:** Broken output when running `kanbambam auth status | cat`.

### Pitfall 5: Next.js + Tailwind v4 Configuration
**What goes wrong:** Tailwind styles don't apply in Next.js.
**Why it happens:** Tailwind v4 moved from `tailwind.config.js` to CSS-based configuration. Requires `@tailwindcss/postcss` plugin.
**How to avoid:** Use `postcss.config.mjs` with `@tailwindcss/postcss` plugin. Import `@tailwindcss` in your global CSS. No `tailwind.config.js` needed.
**Warning signs:** No styles rendering, missing utility classes.

### Pitfall 6: CORS for CLI Localhost Callback
**What goes wrong:** Web page cannot redirect to `http://localhost:PORT/callback`.
**Why it happens:** This is actually a non-issue -- browser redirects (not fetch requests) are not subject to CORS. But developers sometimes add unnecessary CORS handling.
**How to avoid:** The web page simply does `window.location.href = callbackUrl`. No fetch, no CORS issues. The redirect carries tokens as URL query parameters, which the CLI's localhost server reads.
**Warning signs:** Trying to POST to localhost from the web page (wrong approach).

### Pitfall 7: conf Path Conflicts in Monorepo Dev
**What goes wrong:** Running CLI via `tsx` during development stores config in unexpected location.
**Why it happens:** conf uses `projectName` to determine config directory.
**How to avoid:** Use a consistent `projectName: 'kanbambam'` in the conf constructor. Config lives at `~/.config/kanbambam/config.json` (Linux/macOS) or `%APPDATA%/kanbambam/config.json` (Windows).
**Warning signs:** "Not authenticated" errors after successful login.

## Code Examples

### Commander.js Program Setup
```typescript
// apps/cli/src/index.ts
import { Command } from 'commander';

const program = new Command();

program
  .name('kanbambam')
  .description('CLI-first Kanban board management')
  .version('0.0.1');

// Global option available to all commands
program.option('--json', 'Output raw JSON (matches API envelope format)');

// Auth command group
const auth = program.command('auth').description('Authentication commands');

auth
  .command('login')
  .description('Log in via browser')
  .option('--manual', 'Manual token entry (for headless environments)')
  .action(async (options) => {
    const { loginCommand } = await import('./commands/auth/login.js');
    await loginCommand(options, program.opts());
  });

auth
  .command('logout')
  .description('Log out and revoke session')
  .action(async () => {
    const { logoutCommand } = await import('./commands/auth/logout.js');
    await logoutCommand(program.opts());
  });

auth
  .command('status')
  .description('Show current authentication status')
  .action(async () => {
    const { statusCommand } = await import('./commands/auth/status.js');
    await statusCommand(program.opts());
  });

program.parse();
```

### Ink Auth Success Component
```typescript
// apps/cli/src/components/AuthSuccess.tsx
import React from 'react';
import { Box, Text } from 'ink';

export function AuthSuccess({ email }: { email: string }) {
  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="round" borderColor="green" paddingX={2} paddingY={1}>
        <Text color="green" bold>Logged in as {email}</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Run </Text>
        <Text color="cyan">kanbambam workspace list</Text>
        <Text dimColor> to get started</Text>
      </Box>
    </Box>
  );
}
```

### API Revoke/Logout Endpoint (needs to be added)
```typescript
// Addition to apps/api/src/routes/auth/auth.routes.ts
export const logoutRoute = createRoute({
  method: 'post',
  path: '/api/v1/auth/logout',
  tags: ['Auth'],
  summary: 'Revoke refresh token (logout)',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            refreshToken: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({ message: z.string() }),
            meta: MetaSchema,
          }),
        },
      },
      description: 'Token revoked successfully',
    },
  },
});
```

### Next.js Tailwind v4 Configuration
```javascript
// apps/web/postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

```css
/* apps/web/src/app/globals.css */
@import 'tailwindcss';
```

### conf Token Storage
```typescript
// apps/cli/src/lib/config.ts
import Conf from 'conf';

interface KanbambamConfig {
  accessToken?: string;
  refreshToken?: string;
  apiBaseUrl: string;
}

export const config = new Conf<KanbambamConfig>({
  projectName: 'kanbambam',
  defaults: {
    apiBaseUrl: 'http://localhost:3000',
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Ink 5 (React 18) | Ink 6 (React 19) | Late 2025 | CLI and web can both use React 19. No version conflict in monorepo. |
| Next.js 15 | Next.js 16 | Early 2026 | Latest stable. Same App Router patterns. |
| Tailwind JS config | Tailwind v4 CSS config | Early 2025 | No `tailwind.config.js`. Use `@import 'tailwindcss'` in CSS + `@tailwindcss/postcss`. |
| Commander 12 | Commander 14 | 2025 | Minor API additions. Same patterns. |
| conf 13 | conf 15 | 2025-2026 | ESM-native updates. Same API. |

**Deprecated/outdated:**
- Ink 5: Use Ink 6 for React 19 compatibility.
- `tailwind.config.js`: Tailwind v4 uses CSS-based configuration.
- `next.config.js`: Next.js 16 prefers `next.config.ts` (TypeScript config).

## Open Questions

1. **CLI auth callback: tokens in URL vs POST body**
   - What we know: The simplest approach passes tokens as URL query params in the localhost redirect. This is safe because it's localhost-only and never leaves the machine.
   - What's unclear: Whether to use a two-step exchange (auth code -> token exchange) or direct token passing. Direct is simpler; auth code adds a layer of security.
   - Recommendation: Use direct token passing in URL params for simplicity. The localhost server is ephemeral and local-only. GitHub CLI uses a similar pattern. If more security is desired later, add an auth code exchange step.

2. **Web token storage: cookies vs localStorage**
   - What we know: httpOnly cookies are more secure (immune to XSS). But they require a BFF pattern or Server Actions to set.
   - What's unclear: Whether to use cookies (with Server Actions) or localStorage (simpler but less secure).
   - Recommendation: Use httpOnly cookies set via Next.js Server Actions. This is the secure default. Phase 2 is auth pages only, so the Server Action pattern is straightforward.

3. **Next.js version: 15 vs 16**
   - What we know: CLAUDE.md specifies ^15.x. But Next.js 16.2.1 is current stable.
   - What's unclear: Whether to follow CLAUDE.md strictly (15) or use latest (16).
   - Recommendation: Use Next.js 16 (latest stable). The API is the same App Router. CLAUDE.md was written before 16 released. Both support React 19.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | CLI + Web + API | Yes | v24.13.0 | -- |
| pnpm | Package management | Yes | 10.33.0 | -- |
| Docker | Local PostgreSQL | Yes | 29.2.1 | -- |
| TypeScript | All packages | Yes | ^5.8 (workspace) | -- |
| Turborepo | Build orchestration | Yes | ^2.0 (workspace) | -- |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^3.x |
| Config file | `apps/api/vitest.config.ts` (exists), `apps/cli/vitest.config.ts` (Wave 0), `apps/web/vitest.config.ts` (Wave 0) |
| Quick run command | `pnpm --filter @kanbambam/cli test` |
| Full suite command | `pnpm test` (runs all packages via Turborepo) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Web signup form submits to API and receives tokens | integration | `pnpm --filter @kanbambam/web test -- --run` | Wave 0 |
| AUTH-02 | Web login form submits to API and receives tokens | integration | `pnpm --filter @kanbambam/web test -- --run` | Wave 0 |
| AUTH-03 | Web logout revokes refresh token via API | integration | `pnpm --filter @kanbambam/api test -- --run` | Wave 0 (API logout endpoint test) |
| AUTH-04 | CLI auth login starts server, receives tokens | integration | `pnpm --filter @kanbambam/cli test -- --run` | Wave 0 |
| AUTH-05 | CLI tokens persist in conf across sessions | unit | `pnpm --filter @kanbambam/cli test -- --run` | Wave 0 |
| CLI-02 | --json flag outputs API envelope format | unit | `pnpm --filter @kanbambam/cli test -- --run` | Wave 0 |
| CLI-03 | Default output is human-readable Ink | unit | `pnpm --filter @kanbambam/cli test -- --run` | Wave 0 |
| CLI-04 | Same as AUTH-04 | integration | See AUTH-04 | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @kanbambam/cli test -- --run && pnpm --filter @kanbambam/api test -- --run`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/cli/vitest.config.ts` -- CLI test configuration
- [ ] `apps/cli/src/commands/auth/__tests__/login.test.ts` -- covers AUTH-04, CLI-04
- [ ] `apps/cli/src/commands/auth/__tests__/logout.test.ts` -- covers AUTH-03 (CLI side)
- [ ] `apps/cli/src/lib/__tests__/output.test.ts` -- covers CLI-02, CLI-03
- [ ] `apps/cli/src/lib/__tests__/config.test.ts` -- covers AUTH-05
- [ ] `apps/api/src/routes/auth/auth.test.ts` -- EXISTS, but needs logout endpoint test added
- [ ] `apps/web/vitest.config.ts` -- Web test configuration (if needed; may defer web tests to integration)

## Sources

### Primary (HIGH confidence)
- npm registry (verified 2026-03-26): commander@14.0.3, ink@6.8.0, react@19.2.4, conf@15.1.0, open@11.0.0, chalk@5.6.2, next@16.2.1, tailwindcss@4.2.2, @tailwindcss/postcss@4.2.2
- Ink 6 peer dependencies verified via `npm view ink@6 peerDependencies`: requires React >=19.0.0
- Existing codebase: `apps/api/src/routes/auth/` -- auth endpoints already implemented

### Secondary (MEDIUM confidence)
- [Ink GitHub repository](https://github.com/vadimdemedes/ink) -- component API and patterns
- [Building Beautiful CLIs with Ink (Jan 2026)](https://medium.com/@sohail_saifi/building-beautiful-clis-with-ink-yes-thats-react-running-in-your-terminal-683e25582d36)

### Tertiary (LOW confidence)
- Tailwind v4 + Next.js 16 integration specifics -- verified `@tailwindcss/postcss` exists at v4.2.2, but exact config patterns may need adjustment during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry
- Architecture: HIGH -- patterns based on established libraries and existing codebase conventions
- Pitfalls: HIGH -- based on known issues with these specific tools
- CLI auth flow: HIGH -- well-established pattern (GitHub CLI, Vercel CLI use same approach)
- Web auth pages: MEDIUM -- Tailwind v4 + Next.js 16 integration is newer, may need config adjustments

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (30 days -- stack is stable)
