---
name: project-host-policy-at-construction-pattern
description: "All configurable behavior in cve-* packages is set up by HOST-POLICY at CONSTRUCTION time — not runtime flags, not per-call options, not config files. cve-core/flows persistence mode + every other configurable axis follows this pattern. Locked 2026-05-30."
metadata: 
  node_type: memory
  type: project
  originSessionId: c3810180-957a-477f-b286-5e86fd39fe3a
---

**Canonical CVE pattern:** every configurable axis in a cve-* package is exposed as a **host-policy object passed at construction time** (factory invocation / service init / provider mount), not as runtime flags or per-call options or external config files.

## Where this pattern already lives

- **cve-auth** — `CveAuthHostPolicy` + driver factories (`createBetterAuthDriver(config)`); step-up policy composed via `setStepUpPolicy([host, ...packages])` at init.
- **cve-payment-processing** — `PaymentService` config (callbacks, metadata, idempotency strategy, gateHighRiskByDefault) supplied at construction.
- **cve-mail** — driver factory + `createCveAuthEmailOtpHandler(deps)` + template-registration helpers at init.
- **cve-admin** — `createAdminEngine({ permissionAuthority, modules, ... })` at construction.
- **cve-core/flows** (Phase 07.3) — persistence mode (`'client' | 'server' | 'both'`), trigger conventions, and all other configurable axes are host-policy at construction. Operator locked 2026-05-30 Round 4: "The same pattern we use for all other parts of synapsys-cve."

## Why

- **Server-authoritative composition:** policy is evaluated once, in a trusted code path, before any user request is served.
- **Swap-survivability:** changing behavior means changing the construction line, not chasing per-call sites.
- **Type-safety at the boundary:** policy objects validate via Zod at construction; downstream code trusts the validated shape.
- **No runtime flag surface for attackers:** behaviors cannot be flipped mid-flight via environment, query strings, or admin UI inputs.

## How to apply

- When designing a new configurable axis on any cve-* package: expose it on the HostPolicy struct at construction time. Do NOT add a runtime flag, per-call option, or env-var read.
- When recommending where a flag goes: identify the construction site (factory / `init*` / provider mount) and add it to the policy object.
- When reviewing a PR that introduces a new behavior: if the behavior varies per-host, the variation knob MUST be on the policy object — not on the called method.
- When extracting docs: every cve-* package documentation should have a "Host Policy" section enumerating the configurable axes.

## Anti-patterns to reject

- ✗ `executeFlow(input, { persistence: 'server' })` — per-call option leaks policy across the call boundary.
- ✗ `process.env.CVE_FLOWS_PERSIST === 'server'` — env-var read inside the package.
- ✗ Mutable runtime config: `flowsRuntime.setPersistence('server')` after construction.
- ✓ `initFlows({ persistence: { mode: 'server', ... } })` at host startup — policy passed once, frozen, validated.

**Related:** [[project_cve_per_package_db_driver_pattern]] (drivers are the mechanism side of mechanism-vs-policy), [[project_runtime_always_validate]] (validation runs unconditionally; policy controls configurability of inputs, not whether validation runs), [[feedback_step_up_friction_guard_not_privilege]] (step-up policy is the canonical example of construction-time-only).
