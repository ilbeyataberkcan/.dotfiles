---
name: project_cve_auth_revokesessions_patch
description: Local bun patch on cve-auth fixes a revokeSessions bug; upstream it to the package
metadata: 
  node_type: memory
  type: project
  originSessionId: 3e18aa7b-9fa0-4b8f-8fa2-da7e3a0936de
---

`@synapsys-integrated/cve-auth@10.0.0` has a bug in the Better Auth driver's
`revokeSessions` (`dist/drivers/better-auth/driver.js`): it calls
`ia.deleteSessions(userId)` (expects an array of session tokens → `where token IN`)
instead of `ia.deleteUserSessions(userId)` (`where userId =`). Any string userId
trips Better Auth's `Value must be an array` (BetterAuthError).

`invalidateAllSessions` runs on **every** `assignRole`/`unassignRole`, so this
broke the admin bootstrap, both role-seed scripts, and runtime admin role
assignment — system-wide, not just bootstrap.

Carried as a committed `bun patch` (`patches/@synapsys-integrated%2Fcve-auth@10.0.0.patch`,
recorded in package.json `patchedDependencies` + bun.lock; applied on
`bun install --frozen-lockfile`, incl. Docker).

**Why:** root-cause fix the user chose over an app-only workaround.
**How to apply:** the real fix belongs in the cve-auth repo — upstream
`deleteSessions`→`deleteUserSessions` and bump the version, then drop this patch.
A `bun update` of cve-auth before that happens will conflict with / drop the patch.
Related: bootstrap is also session-free now (autoSignIn off). See [[project_registration_flow_is_signup]].
