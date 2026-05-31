---
name: cve-auth-redesign-locked-arch
description: "cve-auth post-redesign architecture locked 2026-05-21 — 3 drivers (AuthDriver/RbacDriver/AuditDriver) with \"varies-by-impl → driver, uniform → cve-auth core\" decomposition rule"
metadata: 
  node_type: memory
  type: project
  originSessionId: c71b8f93-4f73-4f51-911a-8222346f6dc5
---

User-locked architecture for the cve-auth redesign (after Phase 23 paused 2026-05-21):

**Decomposition rule:**
- A piece of functionality lives in a Driver contract **IF** it varies by implementation across auth providers (BA, Supabase, custom).
- Otherwise it's baked into cve-auth core (no driver method).

**Exactly 3 drivers — do NOT propose more:**

1. **`AuthDriver`** (operation-shaped, all auth-flow ops):
   - sign-in/sign-up/sign-out, sessions, accounts, magic-link, email-verify, password-reset
   - **passkey ceremony** (NOT a separate WebAuthnDriver)
   - **step-up verification** (NOT a separate StepUpDriver)
   - skeleton user creation (used by invite flow)
   - soft-delete user mutation
   - Subpath: `/better-auth` → `BetterAuthDriver` delegates to `betterAuth.api.*`, uses `@simplewebauthn/server` library as fallback inside the driver where BA doesn't expose primitives

2. **`RbacDriver`**:
   - role CRUD, role assignment storage, permission resolution storage
   - Subpath: `/rbac/drizzle` → `DrizzleRbacDriver`

3. **`AuditDriver`**:
   - audit event persistence + query (cve_auth.authorization_logs)
   - Subpath: `/audit/drizzle` → `DrizzleAuditDriver`

**Baked into cve-auth core (no driver):**
- Permission registry (the 26 named permissions, their semantics)
- Invite token generation + redemption tracking (token table managed by cve-auth itself, not a driver — invite skeleton-user creation delegates through `AuthDriver.createSkeletonUser`)
- Step-up POLICY interpretation (intervals, action mapping); only the verification mechanism varies
- Soft-delete RETENTION semantics (which records to clean and when)
- ActorContext factory, audit-hook fan-out, marker-cookie issue/verify
- AuthService API shape

**Critical: do NOT propose** `StepUpDriver`, `InviteDriver`, `WebAuthnDriver`, `PasskeyApprovalDriver`. These were rejected.

**BA's admin plugin is REQUIRED** by BetterAuthDriver (provides adminListUsers / adminGetUser / adminUpdateUser / adminRemoveUser / adminListUserSessions / adminRevokeUserSessions). Pending D-RD-01 acceptance.

**How to apply:**
- When planning the redesign phase, the driver count is fixed at 3. Any operation surfaced during planning gets categorized via the decomposition rule.
- WebAuthn methods on `AuthDriver` use `@simplewebauthn/server` as the fallback library inside `BetterAuthDriver` for parts BA doesn't expose. Same pattern allowed for any future driver impl.
- Invite token storage is part of cve-auth's own tables (NOT a driver responsibility); only skeleton user creation crosses into the driver.
