---
name: project_cve_auth_test_fixtures_handroll_ddl
description: cve-auth DB-test fixtures hand-roll DDL in 3 files; tables-factory.ts schema changes do NOT auto-propagate to tests
metadata:
  node_type: memory
  type: project
  originSessionId: dda67466-5e30-47e2-96dc-d4a2b50716f9
---

cve-auth's DB-backed tests do NOT derive their schema from `packages/auth/src/db/drizzle/tables-factory.ts`. Three fixtures hand-roll `CREATE TABLE` DDL independently:
- `packages/auth/src/drivers/better-auth/__tests__/setup-ba-fixture.ts`
- `packages/auth/src/__tests__/db/drizzle/setup-pglite.ts`
- `packages/auth/src/drivers/rbac-drizzle/__tests__/setup-pglite.ts`

**Why:** A schema change to `tables-factory.ts` (e.g. Phase 2 CR-01: `role_assignments` composite PK → `id` PK + partial unique indexes; `organization.metadata` → jsonb) silently does NOT reach the test fixtures. The suite stays green against the OLD schema, masking the defect — exactly how the original `(userId, roleId)` PK bug shipped with passing tests.

**How to apply:** Any cve-auth `tables-factory.ts` schema edit MUST mirror into all THREE fixtures, or the regression test runs against stale DDL. Grep `PRIMARY KEY`/`CREATE TABLE` across the three fixture files before declaring a schema fix proven. Host-side migration is a separate, documented deferral (T-02-01c) — see [[project_org_rbac_milestone_design]].
