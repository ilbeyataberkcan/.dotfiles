---
name: phase07-3-flows-engine-design
description: Phase 07.3 cve-core/flows v0.1 design — 4 engine primitives (Orchestrator/Step/Branch/Terminal) + 6 surface conveniences in cve-components + shared cve-core/predicates substrate consumed by flows AND the future RuleSet engine package.
metadata: 
  node_type: memory
  type: project
  originSessionId: ffb39c9f-dfa7-4b2f-9d2b-af4511c2a93f
---

cve-core/flows v0.1 lands as a SUB-PATH (`@synapsys-integrated/cve-core/flows`) with a deliberately small engine surface (4 primitives), friendly surface nodes in cve-components (6 conveniences), and a SHARED predicate substrate (`@synapsys-integrated/cve-core/predicates`) consumed both by the flows engine and the future RuleSet engine package.

**Why:** The original Phase 07.3 design (9 node kinds + a thin predicate AST with 8 comparison ops) failed [[composable-primitives-litmus-test]] in two places — catalog trap (5 of 9 nodes were frozen compositions) and parallel condition language (the RuleSet engine package being designed concurrently would have had its own predicate AST). Applying the test produced a half-sized engine, a substrate the RuleSet engine will reuse, and a node-kind set that closes under composition.

**How to apply:** Phase 07.3 plan-phase MUST align with this redesign — not the original 9-node SPEC. Phase 07.4 (Create User modal) and any future flow consumer (registration, onboarding, payment-step-up) authors flow definitions against the 4 engine primitives, picks UI from the 6 surface conveniences, and writes conditions in the shared substrate. The substrate version-couples cve-core/flows with the future cve-ruleset (name TBD) package; coordinate version bumps.

---

## The 4 engine primitives (cve-core/flows)

| Primitive | Role | Irreducibility |
|---|---|---|
| `FlowOrchestratorNode` | Root; owns React state + `FlowContext.Provider` + dispatch | No composition produces a state-owning context provider |
| `FlowStepNode` | Atomic progress unit; carries `enter?: Predicate` + `onFail: 'block' \| 'abort'` (guard) | Atom of progression + unit of resumability |
| `FlowBranchNode` | Conditional routing; ≥2 named continuations, evaluates Predicate at advance-time | Only structural way to encode ≥2-forward-edge routing |
| `FlowTerminalNode` | `{kind: 'complete' \| 'abandon', payload}` | Engine must distinguish done vs abandoned |

**`FlowForkJoinNode` is the canonical deferred primitive** — it would join the set if/when a real consumer needs concurrent branches that rejoin. v0.1 has no such consumer. Additive without breaking the existing 4.

**`FlowStepNode.enter` guard semantics:** see [[branch-vs-guard-forward-path-rule]]. Guard property, NOT a standalone node. Closed `onFail = 'block' | 'abort'`.

---

## The 6 surface conveniences (cve-components)

Runtime-bind via `useFlowContext()` (per Q4 = b, not compile-down). Ordinary registered cve-components nodes with flow-aware behavior at render time. The engine never sees them as primitives.

| Surface node | Runtime binding |
|---|---|
| `FlowNextButtonNode` | `<Button onClick={useFlowContext().advance}>` |
| `FlowPrevButtonNode` | `<Button onClick={useFlowContext().retreat}>` |
| `FlowSubmitNode` | `<Button onClick={() => useFlowContext().terminal({kind:'complete', payload})}>` |
| `FlowStepProgressNode` | Block reading `useFlowContext().progress` (`{current, total}`) |
| `FlowFileUploadNode` | `<FileInput>` consuming flow state by `props.name`; submit handler serializes to FormData and hands to host's `onSubmit` callback (v0.1 = no FileUploadDriver) |
| `FlowTriggerNode` | `<Button onClick={() => flowsRuntime.navigate(slug) \| flowsRuntime.openModal(slug)}>` |

**Registration site:** cve-components, alongside Button/Input/Select. cve-components already imports from `cve-core/registries` + `cve-core/schemas`; adding `cve-core/flows` for the `useFlowContext` hook is no new cross-package coupling.

---

## Shared predicate substrate (`@synapsys-integrated/cve-core/predicates`)

NEW sub-path of cve-core, alphabetically between `./engine` and `./registries`. Consumed by `cve-core/flows` (in FlowBranchNode.when + FlowStepNode.enter) AND by the future RuleSet engine package (Q1 = a).

```ts
type Target = { path: string };  // dotted path into evaluation context

type ValueExpression =
  | { kind: 'literal'; value: JsonValue }
  | { kind: 'range'; min?: number; max?: number; minInclusive?: boolean; maxInclusive?: boolean }
  | { kind: 'rangeSet'; ranges: Array<{ min?: number; max?: number; minInclusive?: boolean; maxInclusive?: boolean }> }
  | { kind: 'oneOf'; values: JsonValue[] }
  | { kind: 'shape'; fields: Record<string, ValueExpression> };

type Predicate =
  | { op: 'matches'; target: Target; value: ValueExpression }
  | { op: 'exists';  target: Target }
  | { op: 'and';     children: Predicate[] }
  | { op: 'or';      children: Predicate[] }
  | { op: 'not';     child: Predicate };

// Pure evaluator — no engine state, no domain awareness
function evaluate(predicate: Predicate, context: unknown): boolean;
```

**Old 8-op AST collapses into the new substrate:**

| Old (rejected) | New (substrate) |
|---|---|
| `{op:'eq', lhs:'form.userType', rhs:'admin'}` | `{op:'matches', target:{path:'form.userType'}, value:{kind:'literal', value:'admin'}}` |
| `{op:'gt', lhs:'form.age', rhs:18}` | `{op:'matches', target:{path:'form.age'}, value:{kind:'range', min:18, minInclusive:false}}` |
| `{op:'includes', lhs:'form.tags', rhs:'vip'}` | `{op:'matches', target:{path:'form.tags'}, value:{kind:'oneOf', values:['vip']}}` |
| (would have required `between`) | `{op:'matches', target:{path:'athlete.weight'}, value:{kind:'range', min:65, max:70, minInclusive:true, maxInclusive:false}}` |
| (would have required `oneOfRanges`) | `{op:'matches', target:{path:'athlete.weight'}, value:{kind:'rangeSet', ranges:[{min:65,max:70},{min:70,max:77}]}}` |

The variety lives in `ValueExpression`, not in the op count. 2 leaf ops + 3 combinators cover every comparison shape.

---

## Decisions (Q1–Q4) and rationale

**Q1 = (a) — `cve-core/predicates` ships in 07.3 alongside `/flows`.** RuleSet engine peer-depends on cve-core when it ships. Avoids voluntarily paying the duplication cost.

**Q2 = (b) — SPEC re-opened to re-pin the node-kind list.** Original SPEC §req 5 + req 8 named `FlowSubmitNode` + `FlowTriggerNode` as in-scope engine primitives; this redesign demotes them to surface conveniences. SPEC delta is mechanical — capability still ships, identity moves. Plan-phase blocked until SPEC re-pin commits.

**Q3 = `FlowStepNode.enter` with closed `onFail: 'block' | 'abort'`.** Guard property on the step, NOT a standalone `FlowGuardNode`. See [[branch-vs-guard-forward-path-rule]] for the criterion and the `block | abort` closure rationale.

**Q4 = (b) — runtime-bind via FlowContext.** Surface nodes are ordinary registered components that consume `useFlowContext()` at render time. Simpler than (a) schema compile-down; matches how the hook works anyway. Compile-down stays available for any future surface node whose shape DIFFERS structurally from its primitive — none of the 6 v0.1 surface nodes do.

---

## What this preserves from the original CONTEXT.md (unchanged)

- D-07..D-10: FlowsDbDriver shape (flat, 2 clusters + utilities); separate LocalStorageInstancesStore interface; reference Drizzle impl at `./flows/drizzle/`; mode selection at orchestrator boundary
- D-11..D-13: `createFlowTakeoverRoute(config)` factory pattern; `runtime.resolveFlowRoute` standalone escape-hatch export
- D-14..D-16: `initFlows({policy, driver, componentRegistry})` returns frozen plain-object `FlowsRuntime`; plain async functions for `recordTransition` + `submitFlow` (no `'use server'` shim shipped by cve-core); optional `requestId` field for host-opt-in idempotency
- D-17: `FlowFileUploadNode` v0.1 = client File state + host-defined `onSubmit` (no FileUploadDriver until v0.2) — unchanged, but the node is NOW a surface convenience in cve-components, not an engine primitive

---

## Open items for plan-phase

1. **SPEC re-pin** (Q2 follow-through) — the SPEC node-kind list must be updated before plan-phase commits. A small `/gsd:spec-phase 07.3 --update` or surgical edit + commit.
2. **`cve-core/predicates` schema lock** — the `ValueExpression` discriminated-union shape needs Zod schemas committed alongside the runtime types. RuleSet engine design needs to validate the shape from a second consumer's perspective before lock.
3. **Surface-node registration in cve-components** — which Button variant becomes `FlowNextButtonNode`? Re-use existing Button OR a thin wrapper that hard-codes flow-aware onClick?
4. **Editor explicitness for `step.enter`** — defer to a future cve-studio expansion; the engine stores the property regardless.

---

## Cross-references

- [[composable-primitives-litmus-test]] — the philosophy that drove the redesign
- [[branch-vs-guard-forward-path-rule]] — the criterion behind `step.enter` placement and the `block | abort` closure
- [[project_cve_core_flows_subpath]] — the sub-path-not-package decision (LOCKED 2026-05-30)
- [[project_three_shell_types]] — "shell" reserved at application layer; engine names verified
- [[project_host_policy_at_construction_pattern]] — `FlowHostPolicy` at `initFlows` time
- [[project_runtime_always_validate]] — Zod validates in `recordTransition`/`submitFlow` regardless of `'use server'` placement
- [[project_cve_per_package_db_driver_pattern]] — cve-core owns its own `FlowsDbDriver` contract
