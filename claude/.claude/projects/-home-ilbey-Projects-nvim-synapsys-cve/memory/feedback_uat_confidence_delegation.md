---
name: For auto-verifiable UAT, accept own observation when confident; queue revisit when not
description: User delegates UAT confirmation to me for auto-verifiable phases (library/packaging/script work) — pass on confidence, but track a "come back to" list for anything uncertain so it gets re-verified later.
type: feedback
originSessionId: c4dc5d47-fb37-4fa5-80b2-3e4886786826
---
For UAT on auto-verifiable phases (library packaging, scripts, type-only changes, docs-only changes), the user does not want to be the human-in-the-loop for each pass. If I'm confident in the observation, mark pass and move on. If I'm not fully confident (didn't read the file, inferred from a passing test instead of the diff, didn't actually run the script, etc.), mark it `needs_revisit` in the UAT and surface a consolidated list at the end of the session — DO NOT silently pass it.

**Why:** User said during Phase 16 UAT (2026-05-11): "Again if you are confident with the result then you can accept it as reality match. If you are not confident much. Then, make sure we come back to these tests." The intent is to spare the user from rubber-stamping things I've already verified, while keeping an audit trail for things I haven't.

**How to apply:**
1. For each UAT test, do the actual verification (read the file, run the script, run the test). Don't claim "covered by passing test suite" without naming which test inside the suite asserts the behavior.
2. If the verification fully matches expectation → mark pass with the evidence inline (command run, file lines read, test names).
3. If anything is uncertain (didn't fully verify, only spot-checked, the test name doesn't obviously cover the claim) → mark the test `result: needs_revisit` and add a `revisit_reason` field explaining what's missing.
4. At end-of-session, present a "Items to revisit" section listing all needs_revisit tests with their reasons. Suggest concrete next steps (e.g. "re-run when wired into consumer app", "read commit X in detail", "manually trigger deny path against real cve-auth").
5. This rule does NOT override `feedback_library_phase_integration_human_test.md` — deferred human-observable behaviors (production fail-closed, warn-once, onDeny diagnostics) still become required human tests at first integration regardless of my confidence at the library-phase UAT.
