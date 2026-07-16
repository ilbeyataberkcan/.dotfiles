---
name: project_test_host_active_context_wiring
description: cve-test-host now has the cve-auth org substrate wired + an active-context E2E surface + headless smoke
metadata:
  node_type: memory
  type: project
  originSessionId: 92b3695c-f574-470b-9045-eb41374e5a7d
---

apps/cve-test-host wires ORG-04 active-context end-to-end (done 2026-07-02, unpublished):
- `lib/auth.ts`: `authHostPolicy.organization = { enabled:true, multiTenancy:true, teams off, immediate invites }`; mounts `buildOrganizationPlugin(resolveAuthHostPolicy(authHostPolicy))` before `nextCookies()`; maps organization/member/invitation into the drizzleAdapter schema.
- `lib/db/schema/auth.ts`: re-exports organization/member/invitation. Migration **0014** creates them (member has `deleted_at` + `member_deleted_at_idx`) and folds in the pending Phase-2 `role_assignments` composite-PK→uuid-PK restructure the host DB hadn't caught up to.
- UI surface `app/test/active-context/` (admin-gated, useActionState result display); headless `scripts/smoke-active-context.ts` (`bun run smoke:active-context`) — 13/13 vs real PG.

**Gotchas for future host work here:**
- This host is passkey-first → `AuthService.signUpEmail` is gated OFF (`AUTH_METHOD_DISABLED`). Seed users via `inviteMember` (immediate mode = creates skeleton user + member + grant) for a NEW email; use `addMember({userId,...})` to add an EXISTING user to another org (inviteMember always creates → duplicate-email error on reuse).
- Dev DB is Docker PG on **:5432** (`bun run db:up`; container `cve_test_host_pg`); `db:generate`/`db:migrate` auto-load `.env.local` via bun. `member.id`/`organization.id` are text but `role_assignments.organization_id` is uuid — casts needed in raw SQL joins.
- The integration surfaced a real package gap (now fixed): `listOrganizationsForUser` was driver-only; added as a public `AuthService` passthrough (the host org-selector read). See [[project_milestone_planid_collision_safe_resume]], [[project_execute_phase_worktrees_off_and_env_bridge]].
