---
name: project_actions_surface_must_wire_permission_resolver
description: Any cve-user-management actions surface obtained outside createUsersListRoute (e.g. modal/flow dispatchers) runs UNGATED unless it independently wires permissionResolver — the route-level gate does not travel with the actions object.
metadata: 
  node_type: memory
  type: project
  originSessionId: 64c2c498-e111-4146-b63c-7ba3f060fd01
---

In cve-user-management, RBAC permission enforcement lives in TWO places that must stay in sync:
- `route-actions.ts` `assertPermission()` — gates the in-package `createUsersListRoute` server-action shims.
- `factory.ts` `assertPermission()` (added Phase 07.4 secure-phase) — gates `createUser`/`bulkCreateUsers` inside the actions object itself, BEFORE step-up.

Both read the SAME optional `permissionResolver` slot. The trap: an actions surface built via `buildUserManagementActions(...)` (or `getUserManagementActions()` on a host) **without** passing `permissionResolver` runs with NO `user:create`/`role:assign` check — only whatever coarse gate (e.g. `admin:access`) + step-up friction the caller happens to have. The Create-User modal hit exactly this: it dispatches through `submitFlowAction → getUserManagementActions()`, bypassing `route-actions` entirely, and that factory was built without the resolver. Result was a real EoP gap (T-07.4-12/13) that the standard code-review missed.

**Invariant for future phases:** any NEW dispatch path (modal, flow, job, API route) that obtains a cve-user-management actions object MUST wire `permissionResolver` (host: `USERMGMT_PERMISSION_RESOLVER`; package: thread `policy.permissionResolver` into `buildUserManagementActions`). `admin-module-factory.ts` now threads it for the admin-module path. **Permission ALWAYS precedes step-up** ([[feedback_step_up_friction_guard_not_privilege]] / `step-up-friction-guard-not-privilege`) — `requireStepUpForAction` checks step-up LEVEL only, never RBAC permission.

**Deferred:** the role gate is BINARY `role:assign`, NOT a rank ceiling. cve-auth has no role-hierarchy/rank concept, so "cannot grant a role above your own rank" needs net-new hierarchy infra — a future cve-auth feature, tracked in 07.4-SECURITY.md (T-07.4-13). Surface this if a phase proposes role-hierarchy or privilege-tiering.

Related: [[project_admin_access_tiers]] (tier-4 action permissions), [[feedback_ui_gates_server_side_only]], [[feedback_never_work_around_root_cause]] (fix was package-level so all hosts inherit the gate, not a host-only patch).
