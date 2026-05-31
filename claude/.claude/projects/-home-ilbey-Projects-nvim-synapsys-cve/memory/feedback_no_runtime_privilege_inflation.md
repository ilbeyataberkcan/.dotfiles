---
name: feedback-no-runtime-privilege-inflation
description: "Privilege grants must come from deliberate, code-reviewable declarations. Never expand a role's permission set by querying a runtime registry at seed/boot time — that turns \"what perms exist\" into \"what perms are granted\" and creates a transitive-trust vulnerability where any loaded package can grow privileged roles silently."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3253e619-6844-44bd-8dcd-c868ea74bb6c
---

Privilege grants on roles (especially `superadmin` / equivalents) MUST be declared as explicit literal lists in source code. Do NOT compute them at runtime by reflecting over a registry (`PermissionRegistry.getByRiskLevel`, plugin manifests, etc.).

**Why:**
- **Supply-chain risk.** A malicious or compromised dependency that registers a `riskLevel: 'critical'` permission would automatically gain access via the auto-expanded role — without anyone in the project explicitly approving that grant.
- **Implicit trust.** Runtime reflection means "what's loaded" becomes "what's granted." That's a transitive trust the security model never authorized.
- **Drift / nondeterminism.** Effective grants vary with load order, plugin presence, conditional imports. Two environments running the "same" config can end up with different superadmin scopes.
- **No audit trail.** A code review of `git diff` won't surface a role expansion that happened because a transitive dep registered a new perm.

**How to apply:**
- `SYSTEM_ROLE_PERMISSIONS` (and any equivalent role definition) carries hardcoded literal permission identifiers. When a new critical/high permission is registered by any package, adding it to a privileged role is a separate, deliberate code change — a reviewable line in `types.ts` or its sibling.
- The maintenance cost (touch a literal list when registering a new high-risk perm) IS the security boundary. Don't optimize it away.
- Acceptable: A test that fails CI when a registered critical/high perm is NOT in the superadmin literal list. The test surfaces the missing grant as a build break, forcing a deliberate update. Lazy *runtime* expansion is the failure mode — lazy *test-time* assertion is fine.

**Applies to (not exhaustive):**
- System role permission grants
- Default policy expansions (e.g. default step-up levels)
- Audit hook subscriptions, notification fan-out lists
- Any "every X automatically gets Y" derivation that flows privilege.

**Counter-example (what NOT to do):**
```ts
// BAD — runtime reflection expands superadmin silently
const SUPERADMIN_GRANTS = [
  '*',
  ...PermissionRegistry.getByRiskLevel('high').map(p => p.id),
  ...PermissionRegistry.getByRiskLevel('critical').map(p => p.id),
];
```

**Right pattern:**
```ts
// GOOD — explicit literal list; review tracks every grant addition
export const SYSTEM_ROLE_PERMISSIONS = {
  superadmin: [
    CORE_PERMISSIONS.ALL,
    // High-risk literals (per PermissionRegistry riskLevel)
    CORE_PERMISSIONS.USER_DELETE,
    CORE_PERMISSIONS.ROLE_ASSIGN,
    CORE_PERMISSIONS.ROLE_DELETE,
    CORE_PERMISSIONS.PASSKEY_MANAGE,
    // Cross-package critical/high literals
    USER_MANAGEMENT_PERMISSIONS.BULK_DELETE,
    USER_MANAGEMENT_PERMISSIONS.BULK_ROLE_ASSIGN,
    // ... etc.
  ],
} as const;
```
