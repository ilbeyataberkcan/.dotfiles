---
name: project_org_rbac_milestone_design
description: Org/multi-tenancy/RBAC milestone for cve-auth — 6 decisions LOCKED by user 2026-06-29; needs proper GSD milestone + /gsd-spec per phase
metadata:
  node_type: memory
  type: project
  originSessionId: 7ab48296-e363-4d40-a209-854d54aa9cf7
---

cve-auth org/multi-tenancy/RBAC milestone (scopes the "authoritative org-scoped RBAC" the storage scoping plan deferred). **Placement (locked):** org MEMBERSHIP→AuthDriver (BA-delegated); org-scoped AUTHORIZATION→sovereign cve-auth core + RbacDriver. No 4th driver. Substrate already exists (`RoleAssignment.organizationId`, `listRoleAssignmentsByUserIdAndOrg`, `ActorContext.organizationId`, AuthDriver member methods) — mostly threading.

**Two hard constraints (code-verified):** (1) org-scoping happens at actor BUILD time via `getUserRoles(userId, orgId)`→`createInternalOperatorContext`, NOT in the sync no-driver `StrictPermissionResolver.check()`. (2) headerless membership reads use `auth.$context.adapter`/`internalAdapter`, NOT session-cookie-scoped `auth.api.*` (addMember is the server-direct exception).

**6 decisions LOCKED by user 2026-06-29:**
1. NO platform-global role. Every role is either ORG-scoped or USER-scoped (self data/profile). There is ALWAYS ≥1 org (the app's owning org). `null`-org RoleAssignment = USER-scoped (acting as self), not global-admin.
2. Adopt Better Auth ORGANIZATION plugin via BetterAuthDriver, behind the AuthDriver interface, toggled by a CONSTRUCTION POLICY object. Real BA membership (not role-presence-only).
3. Active-context = URL-resolved AND user-SELECTABLE ("act as self | org A | org B" selector). cve-auth provides the selection mechanism; host originates the URL signal. "self" = user-scoped (unifies #1).
4. create-user flow creates ONLY the User entry. Host-defined ACCOUNT-TYPE creation is a SEPARATE future optional step — do NOT mix into this milestone. ("accounts"/account-types are a HOST concept; cve-auth owns User/Org/Membership/roles only.)
5. Multi-TENANCY (multiple orgs + user-select) is POLICY-GATED at construction — not every app needs it. But the single owning org always exists.
6. Teams: implement dynamic teams wrapping BA's teams sub-feature behind our drivers/services + audit, policy-gated. (Feasibility/cost being verified.)

**Cross-cutting (user-reaffirmed):** packages are USAGE-AGNOSTIC — tmmaf (athlete/referee/club/federation) is illustrative ONLY, never put that naming/features in code. This is a PROPER implementation milestone — user will NOT proceed without `/gsd-spec` per phase. Use ultracode workflows + graphify + ponytail throughout.

Mental model the user gave (agnostic distillation): User = the person; User has host-defined ACCOUNTS (host concern); some accounts map to a cve-auth Organization (tenant); User↔Org via BA membership; active-context selection spans self + associated orgs.

**Resolved design (workflow w4ihjaag3, both reviews sound-with-fixes):** BA `member` table = membership EXISTENCE (BA-owned); `role_assignments` = sovereign org-scoped role-grant OVERLAY keyed (userId, orgId|null, roleName); they join at actor BUILD time. Active-context on `ActorContext.organizationId` (undefined=self/user-scoped | uuid=acting-as-org); resolver = verify-membership(headerless) → load org-scoped roles via `getUserRoles(userId, verifiedOrgId)` → stamp. Strict NO cross-scope union (self never inherits org, org never inherits self). Policy surface TRIMMED to decision-locked toggles only (private-by-default): `organization: { enabled, multiTenancy, teams: { enabled } }` — ponytail cut 7 speculative BA passthrough knobs. cve-auth `buildOrganizationPlugin(policy)` returns the configured `organization({...})` the host spreads into betterAuth; driver gates ops at entry like `password.enabled`.

**5 BA-mechanics corrections (code-verified, MUST honor):**
1. BA `member.role` is MANDATORY — write a fixed placeholder ('member') on create; cve-auth NEVER reads it (role authority = `role_assignments` only), else it becomes shadow RBAC.
2. Only `addMember` is headerless/server-safe. `updateMemberRole`/`removeMember` are session-cookie + BA-access-control gated → do member mutations via generic `auth.$context.adapter` writes on the 'member' model, NOT `auth.api.*`.
3. `internalAdapter` does NOT expose org/member/team tables (only user/session/account/verification) — all headerless org/member/team reads use `auth.$context.adapter` generic model queries. Refines [[project_cve_auth_internal_adapter]].
4. Removing `OrganizationAccountRow` is a BREAKING public-API change (exported index.ts:103 + Zod sibling webauthn-schemas.ts:197) → drop export + schema, major bump.
5. `updateMemberRole` hardcodes `organizationId: null` (driver.ts:2229) = now-active bug, must take the member's org. P1 also fixes the rbac-drizzle test naming the null result 'globalScoped' (driver.test.ts:170).
Teams confirmed NOT a third role scope (teamMember has no role column; team-mgmt perms are org-scoped at build time).

**4 phases for /gsd-spec:** P1 Scoped role resolution (kill union; pure RBAC, no BA; security-critical; independently shippable — IS the storage milestone's authoritative-org fix) → P2 Org plugin behind policy + real BA membership (dep P1) → P3 Active-context selection mechanism (dep P1,P2) → P4 Teams thin passthrough (dep P2; last, default teams.enabled=false, the clean cut-line if scope slips). Owning-org bootstrap (cve-auth-owned vs host-owned) = P2 spec decision.

Relates to [[project_cve_auth_redesign_locked_arch]], [[project_cve_auth_internal_adapter]], [[feedback_extend_authdriver_delegate_to_ba]], [[feedback_auth_driver_first_design]], [[feedback_no_provider_type_reexports]], [[project_host_policy_at_construction_pattern]], [[feedback_avoid_large_askuserquestion_blocks]].
