---
phase: 02-authentication-flows
plan: 02
subsystem: ui
tags: [nextjs, tailwind, react, server-actions, auth]

requires:
  - phase: 01-foundation-api
    provides: Auth API endpoints (signup, login, refresh)
provides:
  - Next.js web app scaffold with Tailwind CSS v4
  - Login, signup, CLI callback, and logout pages
  - Server Action form handlers with Zod validation
  - httpOnly cookie token storage
  - Shared UI components (AuthCard, FormField, SubmitButton, AuthLink, ErrorAlert)
affects: [03-cli-commands, 05-web-dashboard]

tech-stack:
  added: [next@16.2.1, react@19.2.4, tailwindcss@4, @tailwindcss/postcss]
  patterns: [server-actions-for-forms, httponly-cookie-auth, route-handler-for-logout]

key-files:
  created:
    - apps/web/src/app/auth/login/page.tsx
    - apps/web/src/app/auth/login/actions.ts
    - apps/web/src/app/auth/signup/page.tsx
    - apps/web/src/app/auth/signup/actions.ts
    - apps/web/src/app/auth/callback/page.tsx
    - apps/web/src/app/auth/logout/route.ts
    - apps/web/src/lib/api.ts
    - apps/web/src/lib/auth.ts
    - apps/web/src/components/AuthCard.tsx
    - apps/web/src/components/FormField.tsx
    - apps/web/src/components/SubmitButton.tsx
  modified:
    - apps/web/src/app/page.tsx

key-decisions:
  - "Logout uses Route Handler instead of Server Component/Action — cookies can only be modified in Route Handlers or Server Actions invoked by forms in Next.js 16"
  - "Root page checks auth cookie to show welcome vs redirect to login"
  - "Web app runs on port 3001 to avoid conflict with API on port 3000"

patterns-established:
  - "Server Actions for form submissions (login, signup)"
  - "Route Handlers for non-form mutations (logout cookie clearing)"
  - "Shared UI components in src/components/ for auth pages"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

duration: 15min
completed: 2026-03-26
---

# Plan 02-02: Web Auth Pages Summary

**Next.js 16 web app with Tailwind CSS v4 auth pages — login, signup, CLI callback, logout via Route Handler with httpOnly cookie storage**

## Performance

- **Duration:** 15 min (including checkpoint verification)
- **Started:** 2026-03-26T16:30:00Z
- **Completed:** 2026-03-26T17:00:00Z
- **Tasks:** 3
- **Files modified:** 20

## Accomplishments
- Scaffolded Next.js 16 web app with Tailwind CSS v4 and shared component library
- Built login/signup pages with Server Action form handlers and Zod validation
- CLI callback page handles success/error states for browser-based auth flow
- Logout via Route Handler with server-side token revocation and cookie clearing
- E2E tested full auth flow with Playwright (signup -> welcome -> logout -> login)

## Task Commits

1. **Task 1: Scaffold Next.js app, shared components, auth helpers** - `b3cd187` (feat)
2. **Task 2: Auth pages — login, signup, callback, logout** - `fc9fcaf` (feat)
3. **Task 3: Checkpoint verification + fixes** - `8425d59` (fix)

## Files Created/Modified
- `apps/web/src/app/auth/login/page.tsx` - Login form with email/password
- `apps/web/src/app/auth/login/actions.ts` - Login Server Action with Zod validation
- `apps/web/src/app/auth/signup/page.tsx` - Signup form with confirm password
- `apps/web/src/app/auth/signup/actions.ts` - Signup Server Action
- `apps/web/src/app/auth/callback/page.tsx` - CLI auth callback handler
- `apps/web/src/app/auth/logout/route.ts` - Logout Route Handler (cookie clearing)
- `apps/web/src/lib/api.ts` - API client for server-side requests
- `apps/web/src/lib/auth.ts` - Cookie helpers (set, clear, get)
- `apps/web/src/components/AuthCard.tsx` - Centered card layout
- `apps/web/src/components/FormField.tsx` - Label + input with error display
- `apps/web/src/components/SubmitButton.tsx` - Submit with pending state
- `apps/web/src/app/page.tsx` - Root page with auth check

## Decisions Made
- Logout converted from Server Component to Route Handler — Next.js 16 only allows cookie modification in Server Actions (form-invoked) or Route Handlers
- Root page checks for access_token cookie to determine auth state, shows welcome placeholder for logged-in users
- Web dev server fixed to port 3001 to coexist with API on 3000

## Deviations from Plan

### Auto-fixed Issues

**1. Logout cookie error — Server Component cannot modify cookies**
- **Found during:** Task 3 (checkpoint verification)
- **Issue:** Original logout page.tsx was a Server Component calling clearAuthCookies(), which throws in Next.js 16
- **Fix:** Replaced page.tsx with route.ts Route Handler that can modify cookies
- **Files modified:** apps/web/src/app/auth/logout/route.ts (created), page.tsx (deleted)
- **Verification:** Playwright E2E test confirms logout redirects to /auth/login
- **Committed in:** 8425d59

**2. Login redirect loop — root page always redirects to login**
- **Found during:** Task 3 (checkpoint verification)
- **Issue:** Root page unconditionally redirected to /auth/login, so successful login appeared to do nothing
- **Fix:** Added auth cookie check — show welcome if authenticated, redirect to login if not
- **Files modified:** apps/web/src/app/page.tsx
- **Verification:** Playwright E2E test confirms login lands on welcome page
- **Committed in:** 8425d59

---

**Total deviations:** 2 auto-fixed (both blocking runtime errors)
**Impact on plan:** Essential fixes for correct auth flow. No scope creep.

## Issues Encountered
None beyond the deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Web auth pages complete, ready for dashboard development (Phase 5)
- CLI auth commands (Wave 2, Plan 02-03) can now reference callback page at /auth/callback
- API .env file created for local development

---
*Phase: 02-authentication-flows*
*Completed: 2026-03-26*
