---
name: project-admin-access-tiers
description: "CVE admin RBAC has 5 granularity tiers, each gated independently. All admin features must respect this progression — failing any tier is a defect, not a UX nit."
metadata: 
  node_type: memory
  type: project
  originSessionId: 3253e619-6844-44bd-8dcd-c868ea74bb6c
---

CVE admin RBAC progresses through 5 access tiers. Each tier MUST be enforced at its own layer; deeper tiers do not subsume shallower ones.

**Tier 1 — Admin Access**
Can this signed-in user see/use the admin shell at all? Enforced at the `/admin` root + shell mount. Users without admin access see no admin chrome and `/admin/*` returns 404 (not a "no permission" page; full 404 to avoid leaking the surface).

**Tier 2 — Module Access**
Within the admin, which modules can this user see/use? Each `AdminModule` declares `metadata.permissions.view`. Module Access gates:
- Sidebar nav entries for the module (currently correct — visual filter works)
- **Route resolution** — `/admin/{module}/*` paths must `notFound()` when the actor lacks the module's view permission. Currently NOT enforced at the route level — this is a defect ([07.2-08 operator pilot finding #1](project_phase07_2_approval_stepup_primitives.md))
- Server should NOT render route components from a module the actor can't access — the module's code paths must not execute server-side for unauthorized actors. Next.js handles client code-splitting; the server-side gate is the missing piece

**Tier 3 — Module Sub-Route Access**
Within a permitted module, which sub-routes can the actor reach? Sub-routes declare their own `permission`. Both nav filter AND route resolution gate sub-routes. The same `notFound()` gate that closes Tier 2 closes Tier 3 because `AdminEngine.resolveRoute` flattens module + sub-route permissions into `effective permissions` on the resolved route (`packages/admin/src/engine/AdminEngine.ts:269-280`).

**Tier 4 — Module Action Permissions**
Within a sub-route the actor can reach, which actions/buttons are interactive? Two layers:
- **Server-side include** — The Server Component decides whether to include the action UI subtree at all. Unauthorized actors receive a response that carries no reference to the action button, its handler, its action endpoint, or the client component that houses it. See [[feedback_ui_gates_server_side_only]] — `{canX && <Btn/>}` toggles inside a `'use client'` component are a regression (continuation #3 of 07.2-08 introduced this anti-pattern; needs follow-up correction).
- **Server-side gate** — Every route-action handler calls `permissionResolver.check(...)` BEFORE the action body (memory [[feedback_step_up_friction_guard_not_privilege]]). Fixed in plan 07.2-08 continuation #2 commit `eaa1dc93`.

**Tier 5 — High-Impact Action Step-Up**
Among the actions the actor CAN take, which require fresh re-auth? Currently level-based (`admin | general | purchase`); Phase 07.2.1 redesigns to hierarchical-extensible-union per [[project_step_up_hierarchical_policy]]. Step-up is a friction guard, never a privilege gate — Tier 4 always fires first.

**Audit lens for any admin feature:**
For a new admin-shell capability, walk down the 5 tiers and verify each is enforced. Skipping a tier is a defect. The current Tier 4 + Tier 5 are reasonably solid post-07.2-08; Tier 2 is the open architectural gap.
