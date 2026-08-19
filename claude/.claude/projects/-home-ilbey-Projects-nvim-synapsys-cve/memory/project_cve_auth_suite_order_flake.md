---
name: project-cve-auth-suite-order-flake
description: "cve-auth's full-package suite intermittently reports 2 file-level FAILs with 0 assertion failures — an order/worker-contention flake, not a regression"
metadata: 
  node_type: memory
  type: project
  originSessionId: ba4420e4-0691-4c10-a9bc-6b5de5bbd7fb
  modified: 2026-07-28T23:22:16.658Z
---

Running `bun run test` across the workspace occasionally reports `Test Files 2 failed | 81 passed`
in `@synapsys-integrated/cve-auth` while the assertion line reads `Tests 1061 passed | 0 failed`.
Observed offenders: `src/drivers/better-auth/__tests__/enforce-pre-session-create.test.ts` and
`src/drivers/better-auth/__tests__/driver-password-ops.test.ts` (both "against real BA (WS-B3)").
Both pass in isolation, and the package goes 83/83 on a plain re-run.

**Why:** file-level failure with zero failed assertions means a suite-level hook blew up, not a
test. cve-auth's permission setup uses a one-shot latch and sibling suites in the same worker
share that global state — see [[project-cve-auth-test-fixtures-handroll-ddl]] for the related
fixture-DDL fragility in the same package.

**How to apply:** during a GSD regression gate, do not report this as a cross-phase regression
without two checks: (1) re-run the package suite, (2) confirm the phase actually touched files
under `packages/auth`. If assertion failures are 0 and the phase touched only another package,
it is this flake. A real regression shows a non-zero failed-assertion count.
Verified 2026-07-29 during phase 06 (cve-articles template registry) — see
[[feedback-verify-code-not-just-tests]] for why the counts matter more than the FAIL banner.
