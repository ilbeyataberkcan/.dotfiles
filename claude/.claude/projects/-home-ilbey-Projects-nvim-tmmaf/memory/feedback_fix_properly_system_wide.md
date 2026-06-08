---
name: feedback_fix_properly_system_wide
description: "Analyze top-down (whole system first, then details); fix root causes properly and once — never one-off patches"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0a786c21-2a6b-4a3c-87a7-31c9975610f7
---

Approach every problem from the WHOLE-SYSTEM perspective FIRST, then descend to the finer implementation details — top-down, never bottom-up. Fix root causes properly and ONCE at the system level; never apply a narrow one-off patch to the code in front of you.

**Why:** The user repeatedly got stuck in long bug-fixing circles on the TMMAF registration flow because fixes were reactive and local (querying "the single event" instead of binding an event id to the flow definition; bespoke host-blocks that bypass the cve-core flow engine's field/injection/prefill/navigation model; per-component prefill instead of one seam). Narrow, detail-first patches sacrifice reusability and reliability and just generate the next bug. The user explicitly wants me to "focus on the entire system and analyze from that perspective down to the finer implementation details."

**How to apply:** When a bug appears, first ask what SYSTEM-level contract is missing or violated, then design the proper reusable mechanism, then implement the detail. Prefer aligning with the existing engine/reference model — cve-test-host does flow steps, prefill, back navigation, data injection, resume, and instance lifecycle "the right way"; mirror it. For reusable platform code (synapsys-cve, flow definitions), design the proper contract once (event binding via config like payment-definition IDs; a single data/prefill-injection seam applied at every render site; declared field contracts; minimal-privilege flow-gate system actors) and implement it for all events/flows — not a TMMAF-specific shim. If the proper fix is large, surface the design/decision and get alignment before coding.

**Fix in the package, NOT the host.** The cve-* packages are symlinked workspace deps (`node_modules/@synapsys-integrated/* -> ../../synapsys-cve/packages/*`) and ARE editable. When a bug's root cause is in a package (cve-core flow engine, cve-auth, etc.), fix it THERE — do not work around it in the TMMAF host. The user was explicit: "You would be wrong by fixing errors in this project. That would only be a patch up that will bite us in future. No patch up no workarounds. Fix the problem in the cve-auth or any other package you've identified." Host-side symptom-papering (e.g. hiding a back button because the client position is wrong) is exactly the patch-up they reject. The host's job is to pass correct data to a correctly-behaving package. Relates to [[project_registration_flow_is_signup]] and [[feedback_concise_comments]].
