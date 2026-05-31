---
name: branch-vs-guard-forward-path-rule
description: "Mechanical criterion separating control-flow branches from guards by counting forward continuations. Guards live ON the gated thing (e.g., step.enter), never as standalone nodes. Closed onFail = block | abort prevents guard from drifting into branch."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: ffb39c9f-dfa7-4b2f-9d2b-af4511c2a93f
---

The difference between a branch and a guard is the number of FORWARD paths. Count the forward edges from the node — that single test settles the classification across the entire codebase, end to end.

**Why:** Operator-supplied detailed rationale during Phase 07.3 redesign. The forward-path count is the mechanical criterion that prevents guard from drifting into branch (or vice versa) and prevents both from drifting into ad-hoc validation logic. It also forces "failure that redirects" to be recognized as a branch in disguise, which is the most common subtle leak.

**How to apply:** Every time a new gating / routing / conditional / validation primitive is proposed — in cve-core/flows, in the future RuleSet engine, in any host-application flow definition — count the forward edges. ≥2 → branch (or a thing that requires branching machinery). 1 + non-forward failure → guard property on the gated entity. Reject any `redirect`-style failure mode; that's a branch.

---

## The rule (mechanical)

Count forward continuations from the node:

- **Branch** = **≥ 2 forward continuations.** A routing decision. Must live as a structural node (e.g., `FlowBranchNode`) because the tree shape encodes the alternatives.
- **Guard** = **exactly 1 forward continuation** (the "pass") **+ a failure that is NOT a forward path.** Lives as a PROPERTY on the gated entity (`step.enter`), never as a standalone node.

When unclear which you're holding, **count the forward edges**. The count settles it.

---

## Worked classifications

| Scenario | Forward edges | Verdict |
|---|---|---|
| "If user is admin, go to step A; otherwise step B" | 2 | Branch |
| "User must be 18+ to enter this step; otherwise halt" | 1 + halt | Guard (`step.enter`) |
| "Show validation error and let the user retry the same step" | 2 (the retry IS a forward edge back to self) | Branch (not a guard) |
| "Async verification must resolve before entering; halt and re-check until it does" | 1 + halt-with-retry-on-condition-flip | Guard, onFail=block |
| "If feature flag is off, end the flow" | 1 + abort | Guard, onFail=abort |
| "If payment fails, route to retry-payment step; if it succeeds, route to confirmation" | 2 | Branch |
| "If consent was not given, end the flow; otherwise continue" | 1 + abort | Guard, onFail=abort |
| "If user is admin go to admin-onboarding; if user is editor go to editor-onboarding; otherwise go to viewer-onboarding" | 3 | Branch |
| "Capture must succeed before this step renders; otherwise replace step body with an error" | 1 + halt-with-message | Guard, onFail=block |

The retry case is the most-missed trap: showing an error and letting the user retry adds a second forward edge (back to self). It IS a branch, even if it visually looks like "the same step shown twice." The forward-path count makes that visible.

---

## Why guards live ON the gated thing, never standalone

The gated entity in cve-core/flows IS the step (the atom of progression). A standalone `FlowGuardNode{when, children: [step]}` is structurally equivalent to `FlowStepNode{enter: when, ...}` — the wrapper adds no power the entry condition doesn't already have.

The "but I want to guard a REGION of steps" objection decomposes cleanly: a region in a sequential flow is entered at a defined point, so guarding the region reduces to guarding its entry step. A condition that must hold across the whole region isn't one guard watching the region — it's the same entry condition appearing on each step in the region, re-checked as the flow reaches each one. That decomposition is strictly more local and more composable than a region-wide guard.

**Only steps need entry guards.** Branches self-gate via their condition. Terminals are endpoints. "Every node guards itself" would hand the property to nodes with no use for it.

---

## onFail is a CLOSED enum: `'block' | 'abort'`

Failure modes on `step.enter` are restricted by design:

- **`'block'`** — Halt at the boundary without ending the flow. Only makes sense when the condition CAN later flip — async verification resolves, an external state changes, a user action elsewhere unblocks. The guard re-evaluates on the next opportunity.
- **`'abort'`** — Route to a terminal and end the flow. The flow as a whole is no longer viable; clean exit.

**No `'redirect'` mode.** A redirect is a forward path. Adding it would re-introduce a branch in disguise — and worse, a branch hidden inside a property, invisible at the tree level. Keeping `onFail` closed to `block | abort` is what stops the guard from drifting into a branch over time.

**Litmus follow-up:** If a use case demands "failure goes do X first, then comes back" — that's not a guard with a richer onFail. That's a branch with a remediation continuation. Use a `FlowBranchNode`, name the branches, encode the remediation as one of them.

---

## Visual explicitness — editor concern, not engine concern

The one thing you give up by folding guard into `step.enter` is the visual explicitness of a distinct node in the tree. **Don't pay for it.** That explicitness is an editor concern. The engine stores `step.enter`; the editor renders it as a visible gate badge or band above the step. Same primitives philosophy: friendly explicit shape lives in the editor, compiles down to (or runtime-reads) a property the engine already has.

Result: clarity of the standalone node AND smallness of the folded one, because each lives where it belongs.

---

## Cross-references

- [[composable-primitives-litmus-test]] — the parent rule; this is a control-flow specialization
- [[phase07-3-flows-engine-design]] — applied to FlowStepNode.enter in v0.1
- [[project_cve_core_flows_subpath]] — the engine this lives inside

---

## Skill-shape (for future `/gsd:classify-control-flow` extraction)

A skill driving this rule would:

1. Take a proposed conditional / gating / routing primitive
2. Ask: "List every forward continuation from this node when it evaluates."
3. Count: ≥2 → branch class; 1 + failure → guard class
4. If "guard": ask the failure semantic — re-evaluatable → `block`, terminal → `abort`, "go do X first" → reject as a branch in disguise
5. If "branch": confirm every continuation is named and produces a forward path
6. Output: the verdict + the API shape (`branches[]` for branch class; `enter: Predicate, onFail` for guard class) + a one-paragraph rationale
