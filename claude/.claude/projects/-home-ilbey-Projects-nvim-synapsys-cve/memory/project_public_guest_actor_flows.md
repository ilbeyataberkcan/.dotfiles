---
name: project_public_guest_actor_flows
description: Upcoming app needs PUBLIC (no-login) users to email-validate then continue a flow; guest-actor pattern is the foundation
metadata: 
  node_type: memory
  type: project
  originSessionId: 4d035440-9695-4bb7-bcc8-1c9c47946bdb
---

The user's next application requires **public users (no sign-in) to validate themselves via email and then continue a flow** — this is core functionality, not a nice-to-have. The server-authoritative flow engine ([[project_phase07_3_flows_engine_design]]) enforces per-instance ownership (`owner_id`, every instance needs a non-null owner), so a public flow still needs *some* stable owner identity.

The foundation now exists in `apps/cve-test-host`: `resolveFlowActorOrGuestId()` returns the authenticated user id if signed in, else a stable per-browser **guest id from an httpOnly cookie** (`lib/guest-cookie.ts`), never throws. The demo flow (`/flows/demo-flow`) is wired to it and is genuinely public. `advanceAction` resolves the same identity so ownership stays consistent (the actor that advances == the owner that started). `buildFlowServerContext` returns `null` ctx.server for guests (guards fail-closed — a guest hits no guarded flow).

**How to apply:** when the user builds the public email-validation flow, build ON this guest-actor seam — do not require auth at flow start. Email validation is a flow step/guard POST identity-gathering, consistent with [[feedback_onboarding_post_verify_preserves_sr02]]. Guarded flows (create-user) keep the auth-required resolver; public flows use the or-guest resolver.
