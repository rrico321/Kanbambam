---
phase: 5
slug: web-app
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `apps/web/vitest.config.ts` (Wave 0 creates if missing) |
| **Quick run command** | `pnpm --filter @kanbambam/web test` |
| **Full suite command** | `pnpm --filter @kanbambam/web test --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @kanbambam/web test`
- **After every plan wave:** Run `pnpm --filter @kanbambam/web test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | WEB-04 | unit | `pnpm --filter @kanbambam/web test` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | WEB-01 | unit | `pnpm --filter @kanbambam/web test` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | WEB-01 | unit | `pnpm --filter @kanbambam/web test` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | WEB-02 | integration | `pnpm --filter @kanbambam/web test` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | WEB-03 | unit | `pnpm --filter @kanbambam/web test` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 2 | WEB-05 | integration | `pnpm --filter @kanbambam/web test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/vitest.config.ts` — vitest configuration for Next.js app
- [ ] `apps/web/src/__tests__/` — test directory structure
- [ ] Testing library setup: `@testing-library/react`, `@testing-library/jest-dom`

*Task IDs and specific test files will be refined by planner based on plan structure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop item between columns | WEB-02 | @dnd-kit interactions require real browser DOM events | Open board view, drag card from one column to another, verify API call fires and card moves |
| Dark mode toggle | WEB-06 | Visual appearance requires browser rendering | Toggle dark mode, verify all components render correctly in both themes |
| Responsive board scroll | WEB-01 | Horizontal scroll behavior requires viewport testing | Resize browser, verify columns scroll horizontally on narrow viewports |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
