---
name: project-superadmin-bulk-perms-applied
description: "The test-host superadmin role row has been MANUALLY granted the high-risk USERMGMT bulk perm literals via SQL UPDATE (Phase 07.2-08 pilot). Do NOT re-recommend the SQL or auto-suggest a code-level reconciler — that's the fix that was already rejected in Cont"
metadata: 
  node_type: memory
  type: project
  originSessionId: 3253e619-6844-44bd-8dcd-c868ea74bb6c
---

The test-host's `cve_auth.roles` row for `superadmin` has been manually updated via SQL to include the explicit literal grants needed for high-risk USERMGMT actions under `StrictPermissionResolver({gateHighRiskByDefault: true})`. Specifically, the granted literals include at minimum:

- `*` (covers all low/none-risk perms — strict gate doesn't filter wildcards there)
- `usermgmt:bulk:delete`
- `usermgmt:bulk:roleAssign`

(Per [[feedback_match_scope_to_request]], this was the right scope for the immediate problem — not a new module + reconciler + tests, which was the wrong cont #6 approach and was reverted.)

**Why:** Phase 07.2-08 operator pilot kept hitting `AuthUnauthorizedError` for bulk actions even on the seeded `superadmin` role, because cve-auth's `StrictPermissionResolver` filters wildcard-cover grants for `critical`/`high` permissions and only honors exact literal matches. The wildcard `'*'` alone wasn't enough.

**How to apply:**
- DO NOT re-suggest the SQL command in future turns — it's already applied.
- DO NOT propose adding a `seed-superadmin-permissions.ts` reconciler or modifying `SYSTEM_ROLE_PERMISSIONS.superadmin` to include these literals at the code level. That was the over-engineered Cont #6 approach the user rejected (see [[feedback_match_scope_to_request]] and [[feedback_no_runtime_privilege_inflation]]).
- IF a future operator hits the same `AuthUnauthorizedError` after a fresh DB seed (e.g. someone re-runs `ensureSystemRoles` on a clean DB), the right fix is to re-apply the same SQL UPDATE, not to architect around it.
- The `cve_auth.roles.permissions` column is JSONB; the SQL pattern is `UPDATE cve_auth.roles SET permissions = jsonb_build_array(...) WHERE name = 'superadmin'`.

**Permission key format reminder** (separate but related — see commit `35635360`):
USERMGMT permission keys use `:` separator (`usermgmt:bulk:delete`), not `.` — the `.` format previously in the code was wrong because cve-auth's parser splits on `:` into `resource:action:target`. The fix landed in commit `35635360` in this same pilot cycle.
