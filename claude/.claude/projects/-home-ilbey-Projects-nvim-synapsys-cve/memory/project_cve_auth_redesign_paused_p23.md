---
name: cve-auth-redesign-paused-p23
description: "Phase 23 paused after Wave 7 to redesign cve-auth's BetterAuthDriver to delegate to betterAuth.api.* instead of duplicating BA's table writes; user-locked decision 2026-05-21"
metadata: 
  node_type: memory
  type: project
  originSessionId: c71b8f93-4f73-4f51-911a-8222346f6dc5
---

Phase 23 paused mid-execution on 2026-05-21 after Plan 23-07 landed. User locked the redesign call.

**The problem the user identified:**
- `BetterAuthDriver` (packages/auth/src/drivers/better-auth/driver.ts, 833 LOC) imports ZERO symbols from `better-auth`; it's raw Drizzle SQL over BA's tables
- `AuthService.requestMagicLink` / `verifyMagicLink` (and the W8 planned `requestEmailVerification` / `verifyEmail` / `requestRecovery` / `recover` symmetry additions) are dead code in prod — synapsysintegrated calls NONE of them (grep proved zero hits)
- The current pattern is "two parallel systems writing the same tables" — schema/behavioral/security drift risk as BA evolves
- W8 would have published this design choice into a public package version (cve-auth@0.4.0 to GHP + 3 patch cascade)

**User's intended architecture (locked target):**
- `AuthDriver` interface defines what cve-auth services need
- `BetterAuthDriver` subpath export IMPLEMENTS by calling `betterAuth.api.*` (delegation, not duplication)
- Hosts get a single API: host → cve-auth services → AuthDriver → BA (or future Supabase/custom)
- Provider-swappable on the server side — facade-pattern intent realized

**Constraints:**
- Cleanest path, not path of least resistance
- Required before Phase 23 resumes
- "As soon as possible" with proper scoping
- synapsysintegrated also needs migration ("synapsysintegrated not calling functions from cve-auth is also wrong")

**Phase 23 landed work that survives (W1–W7, no rollback):**
mkcert HTTPS + schema/migration + bare Better Auth + magicLink+passkey+OAuth plugins + cve-auth init + audit-hook bridge + marker cookie + /api/me. These use cve-auth's RBAC/audit/context (clean) and BA directly for ceremony (prod-correct).

**Phase 23 plans needing re-scope after redesign:**
- 23-08: CANCEL symmetry-fix; rescope as parallel-API removal/deprecation
- 23-09: REROUTE 4 verification/recovery routes to `betterAuth.api.sendVerificationEmail/forgetPassword/verifyEmail/resetPassword`
- 23-10: KEEP — step-up + audit doesn't touch parallel API
- 23-11: EXPAND FINDINGS to make the redesign the capstone observation

**Client-side asymmetry (separate concern, see [[cve-auth-no-client-facade]]):** cve-auth has no React-client ceremony facade. Production binds UI to BA's React client directly. The server-side redesign does NOT close this; it would be a follow-on if the user wants full provider-swappability on the client too.

**How to apply:**
- Do NOT resume Phase 23 execution until the cve-auth redesign phase lands.
- Do NOT propose adding more parallel-API methods to AuthService.
- When planning the redesign, the working hypothesis is "Answer C" (driver delegates ceremony writes to BA's API; keeps direct SQL only for cve-auth-owned tables: roles, role_assignments, audit_logs, approval_requests, invite tokens).
- W8's GHP publish is BLOCKED until redesign decisions are locked.
