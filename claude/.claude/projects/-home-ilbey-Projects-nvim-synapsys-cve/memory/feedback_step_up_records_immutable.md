---
name: feedback-step-up-records-immutable
description: Step-up verification rows are immutable audit evidence — no delete/clear/purge paths anywhere in cve-auth or downstream
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 49333fcd-7a6c-47b0-a81b-f4bd421bbd62
---

Never introduce a code path that deletes, clears, or purges step-up verification records. Each row records a privilege-escalation attempt and is part of the audit trail. This is policy — applies workspace-wide, not just to cve-auth.

**Why:** Step-up verifications ARE the forensic record of privilege-escalation behavior. Erasing them destroys evidence that has value during incident response, internal investigations, or external/governmental review. The instinct to "clean up" step-up history when a user is soft-deleted, hard-deleted, deactivated, or recovered is exactly wrong — those are the moments the record matters MOST. If a fix requires direct DB access to remove rows, that's a violation of the facade contract; the correct response is to leave the row, not bypass the seam.

**How to apply:**
- Reviewing or planning ANY step-up-touching code: any `clear*`, `delete*`, `purge*`, `expire*` operation against step-up tables/methods → reject by default. The bias is "always retain."
- `AuthDbDriver` / `AuthDriver` / `AuthService` surfaces must not expose deletion verbs for step-up data. If you see one in a PR, that's a regression of this policy.
- Lifecycle paths (delete/deactivate/recover user) must leave step-up history intact across the lifecycle event. The user record may go; their step-up history stays.
- If cleanup seems unavoidable for technical reasons (e.g., orphaned rows after a user is hard-deleted), use a tombstone / `is_stale` marker — never DELETE.
- The step-up audit MUST carry both `userId` AND `sessionId` per row. "In which session did this attempt occur" is load-bearing forensic information; per-user is not enough.
- Origin: 07.1 verification surfaced `clearStepUpVerifications` as a reachable production bug (BetterAuthDriver threw). User direction was: don't fix the contract — the method shouldn't exist. Removal was folded into Phase 07.1 inline.

Related: [[project_cve_per_package_db_driver_pattern]] (facade contract this policy protects), [[feedback_research_use_case_before_demolition]] (parallel: don't remove infrastructure without understanding what it served — here, the inverse, don't keep deletion paths without understanding what they destroy), [[project_runtime_always_validate]] (security invariants run unconditionally).
