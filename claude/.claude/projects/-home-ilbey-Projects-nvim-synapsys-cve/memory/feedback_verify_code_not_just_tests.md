---
name: feedback_verify_code_not_just_tests
description: "Don't trust test pass/fail as the verification signal — read the implementation code to confirm correctness"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a65a6213-617b-45d2-b9be-08606745920b
---

Green tests are necessary but NOT sufficient evidence of correctness. When an executor (or my own change) reports tests passing, read the actual source the tests exercise and confirm the implementation is genuinely right — don't conclude "done" from a passing suite alone. Equally, when tests fail, read the codebase to find what's actually wrong rather than chasing the failure output.

**Why:** Proven concretely in Phase 07.5 — the 07.5-06 CR-01 fix wrapped guard-read+write in `driver.transaction()` and ALL its tests passed (a `txSpy` confirmed the transaction fired and the write landed inside it), yet the implementation was still incomplete: the guard read was an unlocked `SELECT` (no `FOR UPDATE`) under READ COMMITTED, so a terminal-state TOCTOU survived. A green suite masked a real security gap. Also the vacuous-override trap: swapping a guard to a new read method silently makes old reject-case test overrides no-ops → false green. Related: [[project_cve_core_build_typechecks_tests]] (typecheck green ≠ build green), [[feedback_never_work_around_root_cause]].

**How to apply:** After any executor reports success, spot-read the changed implementation (not just the SUMMARY/test output) for the load-bearing property. For security/concurrency claims especially, trace the actual DB calls / isolation / lock semantics in the driver, not the mock. Treat "tests pass" as a prompt to verify the code, not a substitute for it.
