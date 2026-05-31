---
name: cve-auth-no-client-facade
description: "cve-auth has a server-side facade only; client-side auth ceremonies bind directly to the underlying provider (Better Auth's React client), confirmed against synapsysintegrated prod reference"
metadata: 
  node_type: memory
  type: project
  originSessionId: c71b8f93-4f73-4f51-911a-8222346f6dc5
---

cve-auth (`packages/auth`) ships TWO layers, asymmetric:

1. **Server-side facade — mature.** AuthService, AuditLogService, StepUpService, WebAuthnService, InviteService, AuthContext, CORE_PERMISSIONS, SYSTEM_ROLES, AuthValidationError, BetterAuthDriver. Host server code goes through cve-auth.
2. **Client-side facade — does NOT exist.** `@synapsys-integrated/cve-auth/react` only exports `useRequirePermission`, `withPermission`, `UserMenu` (presentational). There is NO `signIn`, `signOut`, `useSession`, `passkey.register/authenticate`, or equivalent.

**Production reference — synapsysintegrated/src/lib/auth-client.ts** is `createAuthClient` from `better-auth/react`. Five UI sites import from it directly:
- `login-form.tsx` → `signIn` (BA)
- `session-user-menu.tsx`, `admin-user-menu.tsx` → `signOut` (BA)
- `onboarding-form.tsx` → `passkey` (BA)
- `auth-boundary.tsx` → `useSession` (BA)

The header in `synapsysintegrated/src/lib/auth.ts` states it explicitly: "Better Auth handles the actual auth flow; CVE-auth adds validation + RBAC."

**Why:** Wraps a deliberate split. cve-auth = validation + RBAC + audit + step-up + invites (cross-cutting + server-authoritative). Provider (BA today, swappable in principle) = ceremony surface (sign-in/out, magic link, passkey, OAuth, session). Phase 23's D-23-B "dual singleton" + C5 SPEC correction lock this in for cve-test-host.

**How to apply:**
- When a user asks "why isn't the UI talking to cve-auth?" — the answer is "because cve-auth doesn't expose that surface today; the production reference uses BA's React client directly."
- A real cve-auth/client facade (provider-agnostic useSession/signIn/signOut over an AuthClientInterface) would be a NEW package-design phase, not a host-app fix.
- Do NOT propose host-side facade workarounds (host-owned wrapper around BA's client) — that recreates the missing package surface in the wrong place. Surface it as a package-coherence FINDINGS observation instead, mirroring how C5 records the parallel-API `requestMagicLink` divergence.
