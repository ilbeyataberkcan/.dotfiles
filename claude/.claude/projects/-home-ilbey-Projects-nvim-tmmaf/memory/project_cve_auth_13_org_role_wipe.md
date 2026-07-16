---
name: project_cve_auth_13_org_role_wipe
description: "cve-auth 10.x→13.0.0 org upgrade physically wiped live role_assignments; one-time, don't run db:push on live"
metadata:
  node_type: memory
  type: project
  originSessionId: 66a49718-fb00-413e-80bc-8c612686ee41
---

Live incident (~2026-07-09): after a deploy that upgraded **cve-auth ~10.x → 13.0.0** (the organization/RBAC-scoping foundation, migration `0031_organizations_foundation`), all pre-existing users LOST their roles except `bootstrap_superadmin` (the only assignment re-granted every deploy, by `seed-bootstrap-admin`).

Root cause = **physical wipe of `cve_auth.role_assignments`**, NOT a resolution regression:
- Host authz is org-agnostic — every `hasPermission(userId, perm)` call OMITS the org arg, and cve-auth 13 treats omitted-org as the fail-open UNION of all assignments incl. global `org_id IS NULL` (`service.js:1388`). So surviving rows WOULD still grant. They didn't → rows were gone. Re-granting fixes it and sticks (proves resolution works).
- The automated deploy path is clean/non-destructive: `migrate-bootstrap.ts` (CREATE SCHEMA IF NOT EXISTS only) → `drizzle-kit migrate` (`0031` ALTERs role_assignments in place: drop composite PK, add `uuid id` PK, org-scoped partial unique indexes) → idempotent union seeders. `roles` table created once at `0000`, never dropped.
- Likely wipe vector: a MANUAL `drizzle-kit push` (`db:push`) against live during the 10→13 jump — push is destructive on the composite-PK→uuid-id change (drops/recreates). Deploys correctly use `db:migrate`.

**Won't recur on normal deploys.** Guard: NEVER run `db:push` (`bunx drizzle-kit push`) against live — it reconciles by dropping on drift. See [[feedback_never_reset_db]], [[tmmaf_drizzle_migration_ops]].

Fix/cleanup: re-grant affected users (host unions all, so a fresh assignment resolves). Find who's missing by listing current `cve_auth.role_assignments` (join roles+users) and comparing to expected staff; audit reconstruction possible via `cve_auth.authorization_logs` (permission-check decisions) if the set is large. Operator fixed the 2 they spotted. Related: [[reference_cve_auth_authz_model]], [[project_rbac_admin_access_durability_gap]], [[project_cve_auth_version_drift]] (was 10.1.2/10.1.3 — now 13.0.0).
