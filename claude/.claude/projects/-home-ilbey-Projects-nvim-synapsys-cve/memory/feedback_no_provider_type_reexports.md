---
name: no-provider-type-reexports
description: "cve-auth's public types must be its OWN — never re-exported or `ReturnType` of a provider's types"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 95c401f4-9643-4dfc-abfe-2d5f7d7d6284
---

cve-auth's public surface defines its own types — never re-export `better-auth` types, never use `ReturnType<typeof createBetterAuthClient>` (or similar) to leak a provider's type into the cve-auth contract.

**Why:** Re-exported types couple the consumer to the provider. If cve-auth swaps BetterAuthDriver for Auth0Driver tomorrow, hosts pinned to re-exported BA types break. This is the same principle that motivated the [[project_cve_auth_redesign_locked_arch]] 3-driver shape — provider-agnostic contracts at every boundary, not just server-side.

**How to apply:** When designing any cve-auth surface (server or client):
- Define cve-auth interfaces explicitly: input DTOs, return shapes, the client object's shape.
- Implementations may use the underlying provider internally (BetterAuthDriver wraps BA's api; cve-auth's client facade wraps BA's `createAuthClient`), but the EXPOSED types are cve-auth-owned.
- Server-side `auth-driver-interface.ts` already does this correctly — `SignInMagicLinkInput`, `SessionWithUser`, etc. are cve-auth interfaces with zero `better-auth` imports. The client facade must follow the same posture.
- Trap to avoid: `type CveAuthClient = ReturnType<typeof createBetterAuthClient>` — that's BA's client type under a different name. Write the interface explicitly.

Related: [[feedback_never_work_around_root_cause]] (fix at root, don't paper over) — same logic applied to the type system.
