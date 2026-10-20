---
name: tmmaf-flow-guards-come-from-packages
description: A repo-only grep never proves a flow condition resolver is unused — installed cve-* packages emit guard payloads that tmmaf seeds into the DB
metadata: 
  node_type: memory
  type: project
  originSessionId: 2f6cdb3d-8843-4bae-b8b8-9603b9c4c341
  modified: 2026-08-25T14:20:57.228Z
---

In tmmaf, `lib/flows.ts`'s `conditionRegistry` entries are consumed by flow trees **emitted from
installed cve-* package dist**, then seeded into `cve_flows.flows`. `grep -rn "<kind>"` over the
repo returns only the definition and reads as dead code.

Concrete case (2026-08-25, phase 46): `um-stepup-fresh` looked consumer-less. It is emitted by
`node_modules/@synapsys-integrated/cve-user-management/dist/flows/createUserFlowDefinition.js:386`
as `enter: { kind: 'um-stepup-fresh', action: 'CREATE_USER' }` with `onFail:'block'`, and seeded by
`scripts/seed-create-user-flow.ts`. Narrowing the Zod schema to drop `action` made `safeParse` fail,
cve-core returned a fail-closed condition, and admin user creation was bricked permanently — silently,
because the failure mode of a malformed guard payload is a closed gate, not an error.

**Why:** package owns the tree, host owns the resolver; the contract between them lives in seeded DB
rows, so neither typecheck nor a repo grep can see it.

**How to apply:** before changing any `conditionRegistry` schema, grep
`node_modules/@synapsys-integrated/*/dist` for the `kind` string and parse the literal payload the
package emits. Pin it with a test that imports the package's own flow definition rather than a
hand-written payload — a hand-written one pins your assumption, not the contract. Same discipline as
[[cve-matchmaking-source-gap]]: the installed dist is the truth.
