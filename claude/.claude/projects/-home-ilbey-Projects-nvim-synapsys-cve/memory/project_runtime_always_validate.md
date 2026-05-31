---
name: project-runtime-always-validate
description: "CVE design lock — `'use server'` / route-boundary shims must ALWAYS Zod-validate inputs before DB mutation; per-host configurability of validation parameters (volumes, shapes, format/regex) is additive future work, not a substitute for the default-on validation."
metadata: 
  node_type: memory
  type: project
  originSessionId: 4ec8544f-a4f5-457b-8965-a20e25cfe838
---

CVE packages that expose `'use server'` route-boundary shims (Next.js server actions, route handlers, anywhere a host call reaches the package over the network) must Zod-validate every input BEFORE touching the database or dispatching to internal services. This is non-negotiable — "the infrastructure is reliable by default."

Locked during Phase 17 cve-user-management CR-02 review (2026-05-12).

**Why:** Host applications cannot be trusted to wrap every package route with their own validation. The package itself owns the "no DB mutation on unvalidated input" guarantee. Hosts that wrap the route in their own auth shim still get the package's input validation as a second line of defense.

**How to apply:**

1. Every `'use server'` shim or route action in a CVE package validates inputs via Zod `safeParse` / `parse` at the function entry — BEFORE permission checks, BEFORE factory dispatch, BEFORE any DB call.
2. Validation behavior (the fact that validation runs) is hardcoded — not an opt-in slot.
3. Validation **parameters** (volume caps, accepted shapes, text-field patterns/regex) MAY be host-configurable at compile time via an optional `validation?: {...}` slot in the package's `Config` interface. This is additive — defaults must remain neutral (no format bias, sensible volume caps).
4. Concrete future requirement: see [[USERMGMT-FUTURE-02]] in `.planning/REQUIREMENTS.md` for the cve-user-management slot shape. Other packages with `'use server'` shims (cve-studio-extension, host integrations) should follow the same pattern when they ship configurable validation.
5. Permission gating on the shim is a separate axis — opt-in via `actorResolver` + `permissionResolver` slots (cve-user-management CR-02 pattern). The host-wrap-or-config-opt-in posture is acceptable for permissions; it is NOT acceptable for input validation.

Related: [[feedback_extension_terminology]] (don't confuse "extension" with this update pattern); [[project_phase13_deferred_host_verifications]] (similar pattern — package owns mechanism, host owns meaning).
