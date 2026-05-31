---
name: cve-auth-internal-adapter
description: "BA exposes findUserByEmail/findUserById/listUsers via auth.$context.internalAdapter without the admin plugin — cve-auth does NOT need or want BA's admin plugin"
metadata: 
  node_type: memory
  type: project
  originSessionId: c71b8f93-4f73-4f51-911a-8222346f6dc5
---

`betterAuth(config)` instances expose `auth.$context: Promise<AuthContext>`. The context's `internalAdapter` is BA's own data layer — the same one BA's plugins (incl. admin) use internally. Confirmed in BA 1.6.11: `dist/db/internal-adapter.mjs` exports `listUsers`, `findUserByEmail`, `findUserById`, `createUser`, `updateUser`, `listSessions`, `createSession`, `findSession`, etc.

**BA's admin plugin is REJECTED for cve-auth use:**
- Adds `role`/`banned`/`banReason`/`banExpires` columns to the user table — cve-auth has its own RBAC (26 named permissions, hierarchical roles) and its own soft-delete model
- Adds `/admin/*` HTTP endpoints — cve-auth has its own admin routes via cve-user-management + cve-admin extensions
- Adds flat-string role enforcement — incompatible with cve-auth's permission registry

`BetterAuthDriver` therefore uses `auth.$context.then(ctx => ctx.internalAdapter)` directly for admin-style operations: listUsers, findUserByEmail, findUserById. For mutations exposed via `auth.api.*` (sign-in, sign-out, magic-link, email-verify, password-reset, sessions, accounts, passkeys), the driver uses the api surface so BA's hooks + rate limits + validation fire normally.

**How to apply:**
- Never propose installing BA's `admin` plugin in any cve-test-host or cve-auth code.
- BetterAuthDriver constructor takes `{db, tables, connection, betterAuthInstance}` — the BA instance gives access to `$context.internalAdapter` for reads and `api.*` for mutations.
- Same pattern works for any future driver: expose the provider's own internal data layer + high-level API.
