---
name: project-step-up-hierarchical-policy
description: "Step-up auth uses hierarchical levels, not per-action. Higher levels subsume lower. Level taxonomy is a per-host POLICY CONFIGURATION at startup, declared as a UNION so packages and host-apps can extend with custom levels."
metadata: 
  node_type: memory
  type: project
  originSessionId: 3253e619-6844-44bd-8dcd-c868ea74bb6c
---

Step-up authentication in CVE is **level-hierarchical**, not per-action.

**Why:** A user can't take actions they lack permissions for (the permission check fires first per [[feedback_step_up_friction_guard_not_privilege]]). Step-up is friction proportional to risk. Higher-risk actions sit at higher levels; a fresh step-up at level N counts as a valid step-up for any level < N (subsumption). This matches NIST AAL hierarchies and how Auth0 / AWS Cognito / Okta model assurance levels — not per-action transaction signing.

**How to apply:**

- The level taxonomy is **per-host policy configuration** at app startup, like other CVE policy slots. Host wires it via `setStepUpPolicy(...)` or similar.
- The level TYPE is a **discriminated/extensible union** so packages (`cve-user-management`, future `cve-billing`, etc.) and host-apps can contribute custom levels for their own action surfaces. Don't hard-code the closed `'admin' | 'general' | 'purchase'` triple as the only legal taxonomy.
- Hierarchy semantics: a fresh `level=delete-user` step-up implicitly satisfies a `level=edit-user-role` requirement if the host's policy declares delete > edit. Hierarchy is declared in the policy, not inferred from the level name.
- A successful step-up still adds **zero new privileges** ([[feedback_step_up_friction_guard_not_privilege]]). It only proves "user is still at the keyboard and explicitly acknowledged this risk tier."
- For ambiguous self-action UX (lower own role / delete own account / remove own OAuth account), research industry standards first per [[feedback_research_industry_pattern_before_inventing]] — NIST 800-63B AAL guidance, OWASP ASVS, mainstream IdP (Auth0/Cognito/Okta/Clerk) defaults — before inventing.
