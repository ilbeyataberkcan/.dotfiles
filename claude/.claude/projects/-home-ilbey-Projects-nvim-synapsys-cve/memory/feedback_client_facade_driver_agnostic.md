---
name: client-facade-driver-agnostic
description: "cve-auth's client surface must follow the same driver/contract pattern as the server — never instantiate the provider directly in the public client module"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 95c401f4-9643-4dfc-abfe-2d5f7d7d6284
---

Apply the AuthDriver pattern to the client side: cve-auth's public `client` subpath exposes a provider-agnostic factory + interface; provider implementations live in a parallel subpath (mirror of `cve-auth/better-auth`).

**Why:** [[project_cve_auth_redesign_locked_arch]] locked the rule "varies-by-impl → driver." Client transports vary by provider (BA's `createAuthClient`, Auth0's React SDK, custom) just as server ceremony does. If `cve-auth/client` directly imports `better-auth/react`, swapping providers later requires rewriting cve-auth's client module — defeating the contract. Provider-specific code lives behind a contract; the public client module is agnostic.

**How to apply:** When designing client surface:
- `@synapsys-integrated/cve-auth/client` — defines `CveAuthClient` interface + `AuthClientDriver` interface + factory `createAuthClient(driver: AuthClientDriver): CveAuthClient`. Zero `better-auth` imports.
- `@synapsys-integrated/cve-auth/client/better-auth` — exports `BetterAuthClientDriver` class implementing `AuthClientDriver`. This is where `createAuthClient` from `better-auth/react` gets called.
- Host: `new BetterAuthClientDriver({...})` → pass to `createAuthClient(driver)` to get the user-facing `CveAuthClient`. Symmetric with the server pattern (`new BetterAuthDriver(...)` → `initAuth({authDriver: driver, ...})`).

Trap to avoid: shipping a one-subpath client facade that directly wraps BA. Even though it satisfies "host has zero BA imports," it couples cve-auth's public module to BA — same anti-pattern the 22.5 redesign extracted on the server side.

Related: [[feedback_no_provider_type_reexports]] (no type leakage) — same principle, applied to module structure.
