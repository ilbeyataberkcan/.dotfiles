---
name: composable-primitives-litmus-test
description: "Mechanical gate deciding whether a proposed feature joins the engine as a primitive, ships as surface convenience, or sub-paths to its own export. Derived from the RuleSet engine philosophy + applied to Phase 07.3 cve-core/flows."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: ffb39c9f-dfa7-4b2f-9d2b-af4511c2a93f
---

A small set of primitives that compose freely beats a large catalog of specialized blocks at every scale — engine, sub-path, package. The expressive power lives in closure under composition, not in the size of the kit. Apply this test before adding ANY new node kind, sub-path export, or package.

**Why:** Caught a real catalog-trap design in Phase 07.3 — 9 node kinds proposed, only 4 were irreducible primitives; the other 5 were frozen compositions that would have ridden the maintenance ledger forever. Applying the test halved the engine surface AND identified `cve-core/predicates` as a sub-path the flows engine and the future RuleSet engine package should SHARE, not duplicate.

**How to apply:** Walk the test EXPLICITLY when sizing any new primitive. If you find yourself thinking "but it's so common we should have a primitive for it" — that IS the catalog trap; surface convenience is the answer. If the existing primitive set "feels too few," audit the value model BEFORE adding nodes.

---

## The litmus test (mechanical)

For every proposed new primitive (node kind, sub-path, package), ask in order:

1. **Can this be expressed as a composition of existing primitives?**
   - YES → It is NOT a primitive. It is surface convenience. Ship it in the editor / cve-components / a wrapping factory that compiles down or runtime-binds to existing primitives. The engine never learns it exists.
   - NO → Continue to (2).

2. **Does it provide an irreducible capability no composition can produce?**
   - YES → It earns primitive status. (Article's worked example: true concurrent fork-and-join is irreducible — no sequential composition produces concurrency.)
   - NO → Reconsider (1); you missed a composition.

3. **Does adding it overlap any existing primitive's responsibility?**
   - YES → Reject. Orthogonality keeps composition unambiguous; overlapping primitives produce two ways to encode identical intent and they will drift.
   - NO → Promote to primitive.

---

## The corollary — variety in values, not in op count

When a primitive set feels "too few," the fix is almost NEVER another primitive. It is a richer, more uniform value model the existing primitives bind to.

**Worked example (Phase 07.3 predicate substrate):**
- Catalog trap: 8 comparison ops — `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `includes`, `exists`. Adding `between`, `oneOf`, `regex` is the future tax.
- Composable substrate: 2 leaf ops — `matches`, `exists` — plus 3 combinators (`and`, `or`, `not`). Variety lives in the value expression: `literal | range | rangeSet | oneOf | shape`. Same expressive power, 5× smaller engine surface.

A predicate does not compare a target to a scalar. It binds a target to a value EXPRESSION, and the value expression carries the variety. Get the binding right and the primitive set stays singular.

---

## Mechanism vs policy

- **Mechanism** (engine): node shape, tree traversal, value binding, evaluation. Reusable.
- **Policy** (data): the tree authored on top — specific predicates, specific values, specific flows / rules. Domain-specific.

The engine knows mechanism only. Domain concepts (payment, MMA, files, registration, Create User) NEVER reach the engine. The instant a domain concept leaks into a primitive, the engine stops being general and becomes a one-host scaffold.

**Test:** If a proposed primitive's name contains a domain word (`PaymentStep`, `ConsentBranch`, `FileUpload`), it's almost certainly a frozen composition + a domain leak. Demote to surface.

---

## Surface escape hatch

Authoring directly in raw primitives feels low-level. The answer is NOT new primitives. It's friendly, named SURFACE shapes in the editor / cve-components that either:

- **(a) Compile down** at definition-load time into compositions of primitives. The engine never sees them. (Higher purity; harder to debug.)
- **(b) Runtime-bind** as ordinary registered components that consume engine context via hooks. They appear in the tree as normal nodes; their flow-aware behavior comes from the hook. (Simpler; default choice unless compile-down earns its keep.)

Surface shapes give the author clarity without paying the catalog cost. The friendliness lives in the editor; the smallness lives in the engine; the two never contaminate each other.

---

## Phase 07.3 worked examples

**Rejected (failed test → surface convenience, registered in cve-components):**
| Proposed primitive | Composes to | Why it failed |
|---|---|---|
| `FlowSubmitNode` | `FlowTerminalNode{kind:'complete', payload}` | Frozen composition of terminal + payload |
| `FlowNextButtonNode` | `<Button onClick={useFlowContext().advance}>` | Frozen composition of Button + dispatch hook |
| `FlowPrevButtonNode` | `<Button onClick={useFlowContext().retreat}>` | Same as Next, opposite dispatch |
| `FlowStepProgressNode` | Block that reads `useFlowContext().progress` | UI widget; runtime-binds via hook |
| `FlowFileUploadNode` | `<FileInput>` consuming flow state by `props.name` | Ordinary form input + domain word in name = double fail |
| `FlowTriggerNode` | `<Button onClick={flowsRuntime.navigate(slug)}>` | Frozen composition; the bridge primitive is the runtime method, not a node |

**Accepted (passed test → engine primitive):**
| Primitive | Irreducibility argument |
|---|---|
| `FlowOrchestratorNode` | Owns React state + Context provision + dispatch — no composition produces a state-owning context provider |
| `FlowStepNode` | Atomic unit of progression + entry guard (`enter: Predicate`); the unit of resumability |
| `FlowBranchNode` | Conditional routing of ≥2 forward continuations — the only structural way to encode "what next depends on state" |
| `FlowTerminalNode` | Endpoint signaling complete vs abandon with payload — engine must distinguish "done" from "abandoned" |

**Deferred (would pass test IF a consumer arrives):**
- `FlowForkJoinNode` — true concurrent branches that rejoin. No v0.1 consumer; additive in v0.2 without breaking the existing 4.

---

## Closure under composition — why "small" reaches "more"

Arithmetic does not provide an operation per formula; it provides four operations + a rule for composing them, and from that finite set every formula is reachable. A 50-block catalog that does NOT compose expresses exactly 50 things. A 5-block kit that DOES compose expresses infinitely many. The small kit is not a compromise on power — it IS the source of power.

This is also why correctness scales with primitive count, not with the expressible space: 4 things to implement, test, secure, and document — regardless of how many flows or rules ever get authored on top.

---

## Cross-references

- [[branch-vs-guard-forward-path-rule]] — applies the test to control-flow primitives specifically
- [[phase07-3-flows-engine-design]] — the worked Phase 07.3 application
- [[project_cve_core_flows_subpath]] — establishes sub-path-not-package for cve-core/flows
- [[project_host_policy_at_construction_pattern]] — the configurability variant of "mechanism vs policy"

---

## Skill-shape (for future `/gsd:litmus-primitive` extraction)

A skill driving this test would:

1. Take a proposal: `name + capability description + sketched API`
2. Walk the irreducibility test conversationally — "Can this be expressed as a composition of <list of existing primitives in domain>?"
3. Audit the value model — "Does the existing primitive's value binding cover this, or are you forced to vary the op?"
4. Mechanism/policy boundary check — "Does the name contain a domain word? Does the API leak a domain concept?"
5. Surface vs engine recommendation with stated tradeoff
6. If "primitive" is the verdict, audit orthogonality against the existing set
7. Produce a one-paragraph rationale the operator can paste into CONTEXT.md / SPEC.md
