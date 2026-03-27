---
status: resolved
phase: 05-web-app
source: [05-VERIFICATION.md]
started: 2026-03-27T02:14:00Z
updated: 2026-03-27T02:39:00Z
---

## Current Test

All tests complete.

## Tests

### 1. Drag and Drop Across Columns
expected: Card moves immediately (optimistic), is visible in the new column, and after a page refresh the card remains in the new column (persisted to API)
result: passed — dragged "Fix login bug" from To Do to In Progress via pointer events; card moved instantly, count updated, persisted after reload

### 2. Card Click-to-Edit Modal
expected: Modal opens with title, description, labels, and due date fields. Each field is click-to-edit. Changes save on blur or Enter. Modal closes on Escape or overlay click.
result: passed — clicked card, modal opened with all fields (title, description, labels, due date, delete). Title edited from "Add dark mode" to "Implement dark mode toggle" via click-to-edit, saved with Enter (PATCH 200), persisted after reload. Escape closes modal.

### 3. Dark Mode Toggle
expected: App switches between light and dark themes without hydration flash or layout shift
result: passed — toggled to dark mode, full dark theme applied (dark background, light text, styled cards), no layout shift, toggle icon changed to sun

### 4. CLI-to-Web Sync (WEB-06)
expected: Change made via CLI is immediately visible in web app after refresh, confirming single API source of truth
result: passed — created item via API ("Added via API (CLI sim)"), refreshed web app, item appeared in To Do column with correct count

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Bugs Found During Testing

1. **Auth integration gap** (fixed): API JWT middleware only checked Authorization header, not cookies. Web app stored JWT in httpOnly cookie but never sent auth header. Fixed by adding `cookie: 'access_token'` to hono/jwt and adding Next.js proxy route for token refresh.
2. **Infinite render loop** (fixed): `useBoardData` created new `{}` reference on every render for empty states, causing infinite re-render in `useOptimisticMove`. Fixed with stable module-level constants and `useMemo`.

## Gaps
