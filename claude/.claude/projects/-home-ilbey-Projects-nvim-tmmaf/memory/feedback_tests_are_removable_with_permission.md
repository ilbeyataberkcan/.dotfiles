---
name: feedback-tests-are-removable-with-permission
description: "A test that blocks a deliberate removal may itself be deleted — ask first, then delete; never contort the code to keep a test green."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c9ecb3db-7f27-414c-98d9-f67c0e4214c6
  modified: 2026-07-29T18:46:18.730Z
---

When there is a good reason to remove something and doing so breaks a test, **removing the test
is a legitimate option** — consult the user and get permission first, then delete it.

**Why:** tests encode yesterday's intent. When a phase deliberately removes the behaviour a test
pins, the test is stale evidence, not a constraint. The dangerous failure mode is the opposite
one: an agent preserves a red test by restoring the very code the phase set out to delete, and
the removal silently never happens. Stated 2026-07-29 while planning phase 25.1, where dropping
a `lower(name) === 'ferdi'` sentinel broke a test asserting it — the path of least resistance
would have reinstated the string comparison and failed the phase's own acceptance criterion.

**How to apply:**
- Before deleting, check whether the test can be **retargeted** instead — same invariant, new
  mechanism (there, `clubId === FERDI_CLUB_ID` in place of the name comparison). Retarget beats
  delete when the invariant still matters; delete when the behaviour itself is gone.
- Either way, surface it and ask — do not delete unasked, and do not quietly weaken an assertion
  to make it pass.
- Never reshape production code purely to keep a test green.
- Pairs with [[feedback_fix_all_severity_findings]] and [[feedback_fix_properly_system_wide]]:
  fix at the root cause, including in the test suite.
