---
phase: 2
slug: authentication-flows
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^3.x |
| **Config file** | `apps/api/vitest.config.ts` (exists), `apps/cli/vitest.config.ts` (Wave 0), `apps/web/vitest.config.ts` (Wave 0) |
| **Quick run command** | `pnpm --filter @kanbambam/cli test -- --run && pnpm --filter @kanbambam/api test -- --run` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @kanbambam/cli test -- --run && pnpm --filter @kanbambam/api test -- --run`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-04, CLI-04 | integration | `pnpm --filter @kanbambam/cli test -- --run` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | AUTH-05 | unit | `pnpm --filter @kanbambam/cli test -- --run` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | AUTH-01 | integration | `pnpm --filter @kanbambam/web test -- --run` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | AUTH-02 | integration | `pnpm --filter @kanbambam/web test -- --run` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | AUTH-03 | integration | `pnpm --filter @kanbambam/api test -- --run` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 1 | CLI-02 | unit | `pnpm --filter @kanbambam/cli test -- --run` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 1 | CLI-03 | unit | `pnpm --filter @kanbambam/cli test -- --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/cli/vitest.config.ts` — CLI test configuration
- [ ] `apps/cli/src/commands/auth/__tests__/login.test.ts` — stubs for AUTH-04, CLI-04
- [ ] `apps/cli/src/commands/auth/__tests__/logout.test.ts` — stubs for AUTH-03 (CLI side)
- [ ] `apps/cli/src/lib/__tests__/output.test.ts` — stubs for CLI-02, CLI-03
- [ ] `apps/cli/src/lib/__tests__/config.test.ts` — stubs for AUTH-05
- [ ] `apps/api/src/routes/auth/auth.test.ts` — add logout endpoint test stub
- [ ] `apps/web/vitest.config.ts` — Web test configuration

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Browser opens on `kanbambam auth login` | AUTH-04 | Requires actual browser launch | Run `kanbambam auth login` in terminal, verify browser opens to login page |
| TTY detection disables Ink rendering | CLI-03 | Requires piped stdout | Run `kanbambam auth status \| cat`, verify plain text output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
