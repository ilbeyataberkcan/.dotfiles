---
name: phase7-step-up-compose-pattern
description: "Phase 7 ships cve-auth@1.4.0 composeStepUpPolicies helper + setter overload; every cve-* package exports DEFAULT_<PKG>_STEP_UP_POLICY; hosts compose, never manual-merge."
metadata: 
  node_type: memory
  type: project
  originSessionId: cfbcd8b5-eabe-483f-906e-a60e3f3a475a
---

Phase 7 (cve-user-management integration) ships a cross-package step-up composition pattern that Phase 11 (AUDIT-XPKG) will standardize across all cve-* packages.

**Mechanism:**
- `cve-auth@1.4.0` (additive minor) exports `composeStepUpPolicies(policies: readonly StepUpPolicy[]): StepUpPolicy` + `DuplicateStepUpActionError`.
- `cve-auth@1.4.0` overloads `AuthService.setStepUpPolicy(policy | readonly policy[])`. Array form internally calls `composeStepUpPolicies`.
- Every cve-* package that declares step-up actions exports a `DEFAULT_<PKG>_STEP_UP_POLICY: StepUpPolicy` const. cve-user-management@4.1.0 establishes the pattern.
- Hosts compose via `setStepUpPolicy([hostPolicy, DEFAULT_USERMGMT_STEP_UP_POLICY, DEFAULT_PAYMENT_STEP_UP_POLICY, ...])`. Never manual-merge.

**Conflict semantics:** composeStepUpPolicies THROWS `DuplicateStepUpActionError` when two policies declare the same actionId with conflicting `levelFor` results. Identity-on-overlap (same level) is allowed. Forces explicit resolution at host wiring time.

**Why:** `setStepUpPolicy` is a single-slot setter on AuthService. Phase 7 surfaced that `installDefaultStepUpPolicy: true` on cve-user-management would WIPE the host's existing 8 step-up entries (Phase 3 entries: auth.role.*, pages.*, auth.passkey.revoked). Composition primitive is the only safe path for hosts integrating multiple cve-* packages that each declare step-up needs.

**How to apply:**
- New cve-* package declaring step-up actions: export `DEFAULT_<PKG>_STEP_UP_POLICY` const + (optionally) keep a convenience `install<Pkg>StepUpPolicy()` init flag that uses the same const internally.
- Host wiring code: ALWAYS use `setStepUpPolicy([hostPolicy, ...packagePolicies])` — never manually merge logic in source.
- Phase 11 audit task: verify every cve-* package with step-up needs has exported the DEFAULT const + does NOT bypass composition in its bundled init flag.

Related: [[step-up-friction-guard-not-privilege]] (the security principle that makes composition safe — composition doesn't expand any caller's privileges, only adds friction to actions they're already authorized for).
