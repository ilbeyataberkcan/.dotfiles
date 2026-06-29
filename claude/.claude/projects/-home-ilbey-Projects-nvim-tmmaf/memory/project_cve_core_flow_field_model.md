---
name: project_cve_core_flow_field_model
description: cve-core flow engine step-field model — only text/number/multi-select(array); NO object step-field (broke event-creation)
metadata: 
  node_type: memory
  type: reference
  originSessionId: 5ecfac0b-6f99-443d-89d2-02334b00d64e
---

The cve-core flow engine's `buildStepSubmitSchema` shapes a step's submit payload from `props.fields` + body nodes, supporting only: `type:'text'`→`z.string()`, `type:'number'`→`z.number()`, and a `flow-multi-select` body node whose name matches a field → `z.array(z.string())`. **There is NO object/json step-field type.**

Consequence (hit in phase 07.1 event-creation): a per-class payment-binding map (`classPaymentBindings`, an object `{classId: paymentDefId}`) declared as a `type:'text'` field is validated as `z.string()`, the object is rejected, and the step shows "field required" and cannot advance. An array submitted for a field works ONLY if there's a matching `flow-multi-select` body node (registration's `applied_weight_division_ids` works for exactly this reason; `eventClassSelection` does too). Dropping a key from `fields` doesn't help — the schema strips non-declared keys, losing the data.

Object-shaped step data must therefore be either: JSON-stringified into a `text` field + `JSON.parse`d at the terminal fold; OR persisted out-of-band via a dedicated server action keyed by instanceId (terminal reads from there); OR — last resort, cross-repo — a new json field type added in `../synapsys-cve` (a cve-package change; avoid, per the no-cve-edits-in-host constraint). The event-creation flow (07.1-07) is paused for a design-first redesign over this; see the phase `.continue-here.md`. Related: [[project_cve_core_flow_terminal_rendering]], [[project_flow_validation_channel]].
