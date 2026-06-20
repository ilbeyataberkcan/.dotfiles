---
name: project-superadmin-bulk-perms-applied
description: "The test-host superadmin role row has been MANUALLY granted the high-risk USERMGMT bulk perm literals via SQL UPDATE (Phase 07.2-08 pilot). Do NOT re-recommend the SQL or auto-suggest a code-level reconciler — that's the fix that was already rejected in Cont"
metadata: 
  node_type: memory
  type: project
  originSessionId: 3253e619-6844-44bd-8dcd-c868ea74bb6c
---

The test-host's `cve_auth.roles` row for `superadmin` has been manually updated via SQL to include the explicit literal grants needed for high-risk USERMGMT actions under `StrictPermissionResolver({gateHighRiskByDefault: true})`. Current granted literal set (expanded 2026-05-31, user-authorized via AskUserQuestion "Grant explicit literals (keep gate)"):

- `*` (covers all low/none-risk perms — strict gate doesn't filter wildcards there)
- `role:assign` (single role assign AND unassign — both detail-page + list gate on `role:assign`; registered `high` risk so `*` is stripped)
- `role:delete`
- `user:delete`
- `usermgmt:bulk:delete`
- `usermgmt:bulk:roleAssign`

The 2026-05-31 trigger: assigning a role from BOTH the users list and the user-detail page threw `AuthUnauthorizedError: requires "role:assign"` at `route-actions.ts:115` (`assertPermission` → `permissionResolver.check`). `role:assign` is `high` risk in `permission-registry.ts:231`, so the superadmin's `*` was gated out.

(Per [[feedback_match_scope_to_request]], this was the right scope for the immediate problem — not a new module + reconciler + tests, which was the wrong cont #6 approach and was reverted.)

**Why:** Phase 07.2-08 operator pilot kept hitting `AuthUnauthorizedError` for bulk actions even on the seeded `superadmin` role, because cve-auth's `StrictPermissionResolver` filters wildcard-cover grants for `critical`/`high` permissions and only honors exact literal matches. The wildcard `'*'` alone wasn't enough.

**User's deliberate stance (confirmed 2026-05-31):** DB-only is the CORRECT and intended approach — NOT a gap to fix. The user will NOT allow any user to hold a `superadmin` role or `*` permission in production (too risky); the grant exists ONLY so the test-host operator can exercise every high-risk surface during UAT, and will be removed before prod. Do NOT propose a persistent superadmin seed, a code-level default, or "harden this for prod" — the ephemerality IS the design. Re-apply the SQL only if a re-seed wipes it mid-UAT.

**How to apply:**
- DO NOT re-suggest the SQL command in future turns — it's already applied.
- DO NOT propose adding a `seed-superadmin-permissions.ts` reconciler or modifying `SYSTEM_ROLE_PERMISSIONS.superadmin` to include these literals at the code level. That was the over-engineered Cont #6 approach the user rejected (see [[feedback_match_scope_to_request]] and [[feedback_no_runtime_privilege_inflation]]).
- IF a future operator hits the same `AuthUnauthorizedError` after a fresh DB seed (e.g. someone re-runs `ensureSystemRoles` on a clean DB), the right fix is to re-apply the same SQL UPDATE, not to architect around it.
- The `cve_auth.roles.permissions` column is JSONB. Use an APPEND-and-dedupe pattern (preserves `*` + any prior grants) rather than replacing the array: `UPDATE cve_auth.roles SET permissions = (SELECT jsonb_agg(DISTINCT p) FROM jsonb_array_elements(permissions || '["role:assign","role:delete","user:delete","usermgmt:bulk:delete","usermgmt:bulk:roleAssign"]'::jsonb) AS p) WHERE name = 'superadmin';`
- Running this SQL is a privilege grant — the Claude Code auto-mode classifier WILL deny it unless the user has explicitly authorized THIS grant in-conversation. Get explicit authorization first (or have the user run it), then re-attempt.
- No dev restart needed: actor roles reload per request via `resolveCurrentActor → getUserWithRoles`; a page refresh picks up the new perms.

**Permission key format reminder** (separate but related — see commit `35635360`):
USERMGMT permission keys use `:` separator (`usermgmt:bulk:delete`), not `.` — the `.` format previously in the code was wrong because cve-auth's parser splits on `:` into `resource:action:target`. The fix landed in commit `35635360` in this same pilot cycle.
