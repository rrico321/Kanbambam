---
phase: 4
slug: item-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (already configured) |
| **Config file** | `apps/cli/vitest.config.ts` |
| **Quick run command** | `cd apps/cli && pnpm vitest run --reporter=verbose` |
| **Full suite command** | `cd apps/cli && pnpm vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/cli && pnpm vitest run --reporter=verbose`
- **After every plan wave:** Run `cd apps/cli && pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | ITEM-01 | unit | `cd apps/cli && pnpm vitest run src/commands/item/__tests__/create.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | ITEM-02 | unit | `cd apps/cli && pnpm vitest run src/commands/item/__tests__/edit.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | ITEM-03 | unit | `cd apps/cli && pnpm vitest run src/commands/item/__tests__/move.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | ITEM-04 | unit | `cd apps/cli && pnpm vitest run src/commands/item/__tests__/reorder.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-01-05 | 01 | 1 | ITEM-05 | unit | `cd apps/cli && pnpm vitest run src/commands/item/__tests__/delete.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-01-06 | 01 | 1 | ITEM-06 | unit | `cd apps/cli && pnpm vitest run src/commands/item/__tests__/edit.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-01-07 | 01 | 1 | ITEM-07 | unit | `cd apps/cli && pnpm vitest run src/commands/item/__tests__/edit.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-01-08 | 01 | 1 | ITEM-08 | unit | `cd apps/cli && pnpm vitest run src/commands/item/__tests__/edit.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/cli/src/commands/item/__tests__/create.test.ts` — stubs for ITEM-01
- [ ] `apps/cli/src/commands/item/__tests__/list.test.ts` — stubs for item listing
- [ ] `apps/cli/src/commands/item/__tests__/show.test.ts` — stubs for item show
- [ ] `apps/cli/src/commands/item/__tests__/edit.test.ts` — stubs for ITEM-02, ITEM-06, ITEM-07, ITEM-08
- [ ] `apps/cli/src/commands/item/__tests__/move.test.ts` — stubs for ITEM-03
- [ ] `apps/cli/src/commands/item/__tests__/reorder.test.ts` — stubs for ITEM-04
- [ ] `apps/cli/src/commands/item/__tests__/delete.test.ts` — stubs for ITEM-05
- [ ] `apps/cli/src/commands/board/__tests__/view.test.ts` — stubs for board view

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Board view horizontal layout renders correctly | D-02 | Visual layout depends on terminal width | Run `kanbambam board view` in 80+ col terminal, verify columns display side-by-side |
| Due date color flagging | D-06 | Color output requires visual inspection | Create items with past, today, and future due dates; verify red/yellow coloring |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
