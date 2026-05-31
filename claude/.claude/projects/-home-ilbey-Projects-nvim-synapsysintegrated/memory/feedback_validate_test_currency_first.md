---
name: validate test currency before debugging failures
description: Before treating a failing test as a real regression worth fixing, check whether the test expectations are stale against current package/component versions. Skip the dive if currency is in doubt.
type: feedback
originSessionId: 7ba8787a-6d64-4c6f-803a-7c0427fb4542
---
When a test fails — especially in a sibling/linked package or against a UI shape that has evolved — treat the failure as **possibly stale** before opening it as a debugging task. Many tests in this workspace pin DOM roles, accessible names, or props that may have legitimately changed in newer package versions; debugging them as if they were real regressions wastes effort.

**Why:** User explicitly flagged this on 2026-04-26 during Phase 9 verify:release capture. Two `createStudioPageRoute` tests in `../synapsys-cve/packages/extensions/studio/src/routes/__tests__/` failed looking for `role="heading"` / `name="Studio"`. User said: "many of the tests are expecting a different versions of packages. They might be completely out-dated. Therefore, please consider if those test are still valid before giving ANY effort to solve the problems they are pointing to. This precaution would save us our precious resources".

**How to apply:**
1. When verify:release / test suites surface a failure, before proposing a fix, ask: is this test pinned to a package shape that has since changed?
2. Heuristics for "likely stale": failure is in a sibling/linked repo, error is `Unable to find an accessible element` / `getByRole` / `getByText` (DOM-shape pins), or the failing assertion is a brittle selector against a refactor target.
3. Default disposition for likely-stale failures during verification phases: classify as **deferred** (Phase 1 six-class taxonomy) with a "test currency review pending" note. Do NOT spawn debug subagents or attempt fixes inline.
4. If the test surface is in *this* repo and clearly pins current behavior (e.g. `package.json` byte-exact lock tests, claim-sweep), the heuristic does NOT apply — those are real regressions to fix.
5. Surface the question explicitly to the user when ambiguous: "this looks like it may be stale; should I attempt currency triage or defer it?".

**Critical refinement (2026-04-27, during Phase 10 discuss):** Distinguish *stale tests against newer packages* (legitimate deferral) from *stale host against newer packages* (NOT deferral — fix the host). Before classifying a sibling-repo test failure as "test currency", check the host's package pins:
- If the host pins package version `X` but the sibling repo is at `X+1`, the failure may be the host running against an older runtime than the test was written for. That's a host-alignment gap, not a test-currency gap — and labeling it "deferred" would be cope, not honesty.
- Verify with `grep '@synapsys-integrated/cve-' package.json` and `cat ../synapsys-cve/packages/*/package.json | grep version` before invoking this rule.
- The user pushed back when I applied this rule too eagerly to Phase 9 verify:release findings: "I have been struggling with this for a while. If the problem was really caused by this version mismatch, it means I lost time and money just to identify it." The cost of missing this distinction is higher than the cost of one extra check.
