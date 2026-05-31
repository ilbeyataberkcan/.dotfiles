---
name: step-up-friction-guard-not-privilege
description: "Step-up is a friction guard for sensitive actions, NOT a privilege-distributing mechanism. Permission check ALWAYS runs before step-up; unauthorized callers fail at permission, never reach step-up."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: cfbcd8b5-eabe-483f-906e-a60e3f3a475a
---

Step-up authentication is a friction guard for very sensitive changes (deleting a user, assigning a higher-privileged role than the caller already has, bulk-destructive operations) — NOT a way to grant permissions a caller doesn't already have.

**Why:** A caller without the required permission must fail with `MissingPermissionError` (or cve-auth's typed equivalent) BEFORE step-up is invoked. If step-up is reached, it means the caller IS authorized for the action; step-up is verifying session recency, not granting authorization. Treating step-up as a privilege-distributor would create a security hole where any authenticated user could elevate by completing a step-up challenge.

**How to apply:**
- In any action / route / server-action that gates a sensitive operation: permission check FIRST, step-up SECOND. Reject at permission if missing.
- A successful step-up challenge does NOT acquire any permission the caller did not already have. It only verifies session freshness.
- Audit rows for a step-up event MUST show the caller already had the permission at gate-evaluation time (not "gained it" from step-up).
- Phase 7 hold-the-merge AND-gate includes this principle: any sensitive action that succeeds for an unauthorized caller via step-up is a phase failure regardless of other progress.

Related: [[phase7-step-up-compose-pattern]] (the compose primitive is safe specifically because composition never expands privileges — it only adds friction to actions the caller is already authorized for).
