---
name: feedback-match-scope-to-request
description: "When the user asks for a specific operational fix (e.g. \"just update this DB row\"), do exactly that. Don't architect a sustainable code-level generalization unless they ask for one. Match scope to the actual request, not to the most-defensible long-term design."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3253e619-6844-44bd-8dcd-c868ea74bb6c
---

When the user describes a problem and the immediate fix is a single operational step — a SQL UPDATE, a one-line config flip, a manual flag toggle — DO that step. Don't expand it into a code-architecture change.

**Why:**
- The user is the decider on scope. If they wanted a sustainable code-level fix they would have asked for one. Reading scope-expansion into "fix this row" wastes their time and adds maintenance surface they didn't sign up for.
- The most-defensible long-term design is not always the right answer to "make this work right now."
- Over-engineering layers more code that future continuations have to reason about, makes commits harder to review, and burns goodwill.

**How to apply:**
- If the user says "add the permission to the role row in the DB," reach for a SQL UPDATE statement, not a new module + barrel export + reconciler + CI test.
- If the user says "set this flag to true," set the flag, don't add a config slot for it.
- If the user says "rename this," rename it, don't introduce a migration helper.
- When the operational fix is one-shot, write the operational fix. If the systemic fix is genuinely better, say "here's the one-shot you asked for; the sustainable shape would be X — want it?" — and stop after one sentence. Don't preemptively build X.

**Recognition signals (any one of these = stop and reconsider scope):**
- "Just do X" / "All I wanted was X" / "It doesn't make sense" (after a previous attempt)
- Operational verbs: "update," "patch," "set," "fix this row"
- A specific artifact named: "this DB row," "this config value," "this flag"
- The previous response added files, exports, tests, or modules the user didn't request

**What this does NOT mean:**
- Trivial fixes can still warrant a quick regression test or comment. The directive is about the *shape* of the work, not its quality.
- When the user explicitly asks for an architectural change, do an architectural change.
- When the operational fix has obvious side effects (e.g. updating a published shared schema), surface them — but don't rebuild the system to avoid them unilaterally.

**Past incidents to learn from:**
- Phase 07.2 plan 07.2-08 cont #6: user said "update the current super admin role with the high risk permissions explicitly." I dispatched an agent that modified cve-auth's published `SYSTEM_ROLE_PERMISSIONS`, exported a new `USER_MANAGEMENT_HIGH_RISK_LITERALS` constant from cve-user-management, added CI assertion tests, wrote a `seed-superadmin-permissions.ts` warm-boot reconciler, and wired all of it into `lib/auth.ts`. The fit-for-request answer was a single SQL UPDATE on the `cve_auth.roles` row for the superadmin.
