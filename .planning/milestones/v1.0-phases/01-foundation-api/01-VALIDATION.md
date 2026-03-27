---
phase: 1
slug: foundation-api
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.1 |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `pnpm --filter api test` |
| **Full suite command** | `pnpm turbo test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter api test --run`
- **After every plan wave:** Run `pnpm turbo test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | API-01 | integration | `pnpm --filter api test -- --run routes/` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | API-02 | integration | `pnpm --filter api test -- --run middleware/auth` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | API-03 | unit | `pnpm --filter api test -- --run lib/fractional-index` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | API-04 | unit + integration | `pnpm --filter api test -- --run lib/pagination` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | AUTH-06 | integration | `pnpm --filter api test -- --run routes/auth` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/vitest.config.ts` — Vitest configuration
- [ ] `apps/api/src/test-helpers/` — DB setup/teardown, test JWT generator, Hono test client
- [ ] Framework install: `pnpm add -D vitest @vitest/coverage-v8 --filter api`
- [ ] Docker Compose for test database or Neon branch for testing

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| JWT survives browser refresh | AUTH-06 | Requires browser context | 1. Login via API 2. Store tokens 3. Simulate refresh with refresh token endpoint |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
