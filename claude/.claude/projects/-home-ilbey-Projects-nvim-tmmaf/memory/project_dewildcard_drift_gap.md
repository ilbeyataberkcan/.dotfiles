---
name: project_dewildcard_drift_gap
description: "De-wildcarding froze `superadmin` at one day's permission set; every permission added afterwards silently narrowed it until the seed gained a union-only second pass"
metadata: 
  node_type: memory
  type: project
  originSessionId: 1d3e3eca-24fe-4e36-aa71-fdb12b837372
  modified: 2026-07-29T00:12:05.964Z
---

Expanding a stored `*` grant into explicit permissions **pins that role to the permission set of
the day the seed ran**. Every permission added afterwards silently narrows it — the holder loses
capability with **no signal**, and the coverage test cannot catch it because that test checks the
CODE source of truth (`lib/admin/all-permissions.ts`, which derives correctly from
`Object.values(PAYMENT_PERMISSIONS)`), never the DB rows.

Proved 2026-07-28: `payment:intent:reconcile` shipped, `ALL_PERMISSIONS` grew to 106, and
`superadmin` sat at 105. Re-running `seed-explicit-permissions.ts` reported "nothing to do"
because it was **wildcard-only by design** and no wildcard remained.

**`bootstrap-superadmin` never drifted** — `bootstrapAdmin()` union-merges it against
`ALL_PERMISSIONS` via `reconcileRolePermissions` on every app start (`lib/bootstrap-admin.ts:112`).
That is the pattern; the same helper is used in `seed-storage-roles.ts` and `seed-usermgmt-roles.ts`.

**Fix:** `scripts/seed-explicit-permissions.ts` gained a second, **union-only** pass over a
declared `ALL_PERMISSION_ROLES = ['superadmin']`. Declared, not inferred — once `*` is expanded
the DB can no longer distinguish "meant everything" from "deliberately narrowed". Union-only so a
deliberate grant survives. `bootstrap-superadmin` is deliberately absent (already maintained).

**It now runs UNATTENDED in the deploy seeder chain** (`Dockerfile` seeder stage, with
`--confirm`, beside the role seeds it keeps consistent) — a reconcile whose only failure mode is
"someone forgot to run it" does not belong in a runbook. Union-only, never strips a role, no-op
once converged. **It exits 1 when a guard skips a role**, aborting the deploy before any app
rolls while the previous version keeps serving; that is deliberate — a replacement that would
lose capability wants a human. So no manual step is owed after a release any more.

`superadmin` and `admin` are `is_system = true`, so `updateRole` throws `AuthSystemRoleError` —
which is why this seed writes direct SQL. It is UPDATE-only and never touches `role_assignments`.

Unresolved, flagged not fixed: `cve_auth.role_assignments` holds **duplicate rows** (one user had
`bootstrap-superadmin`, `payment-admin` and `user-admin` twice each). Harmless because grants
union, but some assignment path is not idempotent.

Related: [[project_payments_financial_phases_23_24]], [[reference_cve_auth_authz_model]],
[[project_rbac_admin_access_durability_gap]].
