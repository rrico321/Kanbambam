---
phase: 3
slug: core-kanban-cli
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | `apps/cli/vitest.config.ts` |
| **Quick run command** | `pnpm --filter @kanbambam/cli test` |
| **Full suite command** | `pnpm --filter @kanbambam/cli test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @kanbambam/cli test`
- **After every plan wave:** Run `pnpm --filter @kanbambam/cli test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | WKSP-01 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/workspace/__tests__/create.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | WKSP-02 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/workspace/__tests__/list.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | WKSP-03 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/workspace/__tests__/rename.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | WKSP-04 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/workspace/__tests__/delete.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | BORD-01 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/board/__tests__/create.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | BORD-02 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/board/__tests__/list.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 1 | BORD-03 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/board/__tests__/rename.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 1 | BORD-04 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/board/__tests__/delete.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-05 | 02 | 1 | BORD-05 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/board/__tests__/create.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | COLM-01 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/column/__tests__/add.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 2 | COLM-02 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/column/__tests__/rename.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-03 | 03 | 2 | COLM-03 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/column/__tests__/reorder.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-04 | 03 | 2 | COLM-04 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/column/__tests__/delete.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-01 | 03 | 2 | CLI-05 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/context/__tests__/set.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-02 | 03 | 2 | CLI-06 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/context/__tests__/show.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-03 | 03 | 2 | CLI-07 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/context/__tests__/clear.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-04 | 03 | 2 | CLI-01 | unit | `pnpm --filter @kanbambam/cli exec vitest run src/commands/context/__tests__/set.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/commands/workspace/__tests__/create.test.ts` — stubs for WKSP-01
- [ ] `src/commands/workspace/__tests__/list.test.ts` — stubs for WKSP-02
- [ ] `src/commands/workspace/__tests__/rename.test.ts` — stubs for WKSP-03
- [ ] `src/commands/workspace/__tests__/delete.test.ts` — stubs for WKSP-04
- [ ] `src/commands/board/__tests__/create.test.ts` — stubs for BORD-01, BORD-05
- [ ] `src/commands/board/__tests__/list.test.ts` — stubs for BORD-02
- [ ] `src/commands/board/__tests__/rename.test.ts` — stubs for BORD-03
- [ ] `src/commands/board/__tests__/delete.test.ts` — stubs for BORD-04
- [ ] `src/commands/column/__tests__/add.test.ts` — stubs for COLM-01
- [ ] `src/commands/column/__tests__/rename.test.ts` — stubs for COLM-02
- [ ] `src/commands/column/__tests__/reorder.test.ts` — stubs for COLM-03
- [ ] `src/commands/column/__tests__/delete.test.ts` — stubs for COLM-04
- [ ] `src/commands/context/__tests__/set.test.ts` — stubs for CLI-05
- [ ] `src/commands/context/__tests__/show.test.ts` — stubs for CLI-06
- [ ] `src/commands/context/__tests__/clear.test.ts` — stubs for CLI-07
- [ ] Shared test fixtures: mock API response factories for workspace/board/column envelopes

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Delete confirmation prompt displays correctly | WKSP-04, BORD-04 | readline prompt interaction requires TTY | Run `kanbambam workspace delete <id>` and verify "Are you sure?" prompt appears |
| Ink table renders bordered layout in TTY | WKSP-02, BORD-02 | Visual terminal rendering not capturable in unit tests | Run `kanbambam workspace list` in a real terminal and verify bordered table |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
