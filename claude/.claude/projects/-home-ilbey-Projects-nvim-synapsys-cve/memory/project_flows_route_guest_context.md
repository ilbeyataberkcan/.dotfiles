---
name: project_flows_route_guest_context
description: "The cve-test-host /flows/[[...slug]] route runs in GUEST context — it does NOT authenticate sessions. Auth-required flows can't run there; the admin modal is their path."
metadata: 
  node_type: memory
  type: project
  originSessionId: 437fca5d-336c-4d75-88e1-223e0dbdd427
---

`apps/cve-test-host`'s `/flows/[[...slug]]` takeover route runs in **guest context**: the proxy
middleware mints a guest cookie for every `/flows` request, and `resolveCurrentActor()` /
`getSession()` return null there. A session that authenticates fine at `/admin` resolves to a
`guest:<uuid>` at `/flows` — verified 2026-06-02: a demo instance started with a signed-in superadmin
session is owned by a `guest:` id, and `resolveCurrentActor()` throws `AuthUnauthenticatedError` for
that same session at `/flows`. This affects ALL `/flows` actor resolution (`resolveFlowCaller`,
`resolveFlowActorOrGuestId`), not one helper.

**Consequence:** an auth-required flow (create-user) CANNOT be completed via `/flows/create-user` —
every caller is a guest, so the enter guard fails closed. After the Phase 07.6 C fix
(`createFlowTakeoverRoute` guard-gates the seed via the host `resolveInitialStep` seam), the route
correctly **404s all callers + creates no instance** rather than leaking the guarded mode selector.
The authenticated create-user UX is the **admin modal at `/admin`** (where sessions resolve), which
seeds its first body via `resolveCreateUserInitialBody`.

If `/flows/create-user` must serve authenticated admins in future, honoring sessions at `/flows`
(middleware + session read) is a SEPARATE, pre-existing host task — not part of the flow-engine work.
Demo flow (public/guest by design) is unaffected. Related: [[project_public_guest_actor_flows]],
[[project_test_host_live_e2e_harness]], [[feedback_ui_gates_server_side_only]].
