---
name: reference_cve_auth_authz_model
description: "cve-auth authz is grant-based (role.permissions union + string match), NEVER reads PermissionRegistry; registry = display + riskLevel only; wildcards DEPRECATED (operator); host must client-mirror permission catalogs for the role dialog"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 588b29ea-5025-4924-9988-5d73df26ca3d
---

Verified in cve-auth 10.1.6 source (`services/auth/`):

- **Authorization is grant-based, registry-independent.** `authService.hasPermission(userId,key)` = `getUserRoles(userId)` → `userHasPermission(roles,key)` (`permissions.js`) = string/wildcard match against the UNION of each role's `permissions` array. It does **not** consult `PermissionRegistry`. A permission "exists" the moment its string is in a role's `permissions` (written server-side); registration is NOT a prerequisite and can never be the authority. (This is why the bootstrap-superadmin held `event:*` before the catalog was registered — bootstrap GRANTED them onto the role.)
- **`PermissionRegistry` is display + risk metadata only** (`permission-registry.js`): a per-bundle singleton Map of `key → {label,description,category,riskLevel}`. Used by the role create/edit dialog (lists `getAll`/`getByCategory`) and step-up notification routing (`getByRiskLevel`). NOT an authz gate.
- **`riskLevel` DOES feed one security path:** `StrictPermissionResolver` (`strict-permission-resolver.js`) with `gateHighRiskByDefault` filters ALL wildcard-cover grants out before matching a high/critical-risk permission — so a high-risk key is satisfiable only by an EXACT literal grant. An UNregistered key has `riskLevel===undefined` → treated low-risk → a wildcard would cover it. So registering high-risk keys (publish/delete/status) with `riskLevel:'high'` is defensive, not cosmetic. (TMMAF event gates use plain `hasPermission`, NOT the strict resolver — see [[project_event_permissions_hardening]].)
- **Client-mirror requirement:** the role dialog reads the CLIENT registry singleton; server-only packages (cve-storage, and our host event keys) never reach the client bundle (the `fs`-poison constraint, [[project_client_bundle_server_import_poison]]), so the host must register a client-safe catalog mirror (`lib/storage/storage-permission-catalog.ts`, `lib/admin/event-permission-catalog.ts`) at an always-mounted admin client module (`app/admin/admin-step-up-dialog-mount.tsx`). Keys must stay verbatim-equal to the constants.
- **Wildcard grants are DEPRECATED (operator decision, 2026-06-23):** no longer accepted; operator will purge remaining traces. New gates must never depend on `*`/`resource:*` cover. Bootstrap already excludes bare `*` from ALL_PERMISSIONS.
- **Client is never trusted for authz:** server gates the action (requireEventPermission, fail-closed) AND omits the component server-side (RSC `can*` booleans → ungranted action markup never sent) AND 404s the route. Three layers, all server-side.
