---
name: tmmaf-test-baseline-needs-docker
description: baseline re-measured 30.08.2026 — 3 failed FILES / 1 failed test on a clean tree; plus ~4 more files that fail ONLY under full-suite parallelism
metadata: 
  node_type: memory
  type: project
  originSessionId: 1ee0e5ef-e85e-4023-85b5-e5b366d28e9d
  modified: 2026-08-30T09:24:32.321Z
---

`bun run test` on tmmaf is never fully green. Baseline re-measured on a clean tree
(`git stash`) on 30.08.2026:

- **3 failed FILES / 1 failed test** are genuinely pre-existing:
  - `lib/__tests__/confirm-registrations-fanout.test.ts` — file-level failure, 0 failed tests
  - `lib/admin/category-reassign-panel-ux.test.ts` — 1 failed test ("the mode stays 'hybrid'")
  - `lib/admin/__tests__/invoice-idempotency.db.test.ts` — needs Docker
- **~4 more files fail only in the full run** and pass in isolation
  (`category-edit-timeline`, `payment-gate-actor`, `registration-step-data-club-region`,
  `summary-pricing-timeline`). Treat these as parallel-run flakiness, not regressions.

**Why:** judging your own change against "all green" gives a false regression signal, and
the full-run-only failures make the failing set look different on every run.

**How to apply:** read the **file** column, not the test count. Before blaming your change,
re-run the suspect files in isolation — and if they still fail, `git stash` and re-run to
confirm they fail on a clean tree too. Needs `tmmaf_pg` + `tmmaf_mailpit` up
(`bun run db:up`, `bun run mail:up`) or ~25 more env-dependent tests fail.
See [[tmmaf-fresh-db-migrate-order]].
Run `db:up` from the main checkout, never a worktree — see [[project_worktree_docker_compose_volume_trap]].
