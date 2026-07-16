---
name: project_flow_island_field_wiring_checklist
description: Adding a flow-island field needs 5 wiring points or it ZodError-rejects / silently drops on edit
metadata:
  node_type: memory
  type: project
  originSessionId: 542d3403-8cfa-4577-8d82-b1153d0541a9
---

A host-block island that writes a NEW field via `setInProgressInput(FIELD, ...)` must be wired in **five** places or it breaks. cve-core's `buildStepSubmitSchema` builds `z.object(shape).strict()` from the step's declared `fields[]` (persisted in the version-pinned DB flow tree) — any island-written key NOT in `fields[]` throws `ZodError unrecognized_keys` on step advance.

Checklist for a new island field:
1. Declare it in the step's `fields[]` in the flow fixture (`lib/fixtures/*.ts`).
2. **Bump the flow version** (e.g. `EVENT_CREATION_VERSION`) — the seeder guards on `(slug, version)` and won't overwrite an existing tree; operator must reseed.
3. Restore it in the revisit/resume `prefill` (the RSC step-data seam, e.g. `get-event-creation-flow.ts`) — else going *back* to the step drops it.
4. Restore it in edit-mode hydration (same seam's DB-read path) — else editing an existing row silently wipes it.
5. Read it in the terminal fold that writes the DB.

**Why:** `discipline_weigh_in_custom_dates` (weigh-in portal) shipped with only #1's sibling + #5 done — missing the declaration, prefill, and edit hydration. Caused the staging ZodError at the disciplines step + silent custom-date loss on revisit/edit. NOT a migration problem (migration 0039 existed).

**How to apply:** audit all 5 points whenever an island gains a field. Automated check: cross-ref every `setInProgressInput` first-arg (resolved through the `*_FIELD` constants) against the union of `fields[]` names across every fixture — any written-but-undeclared field is this bug. See [[project_weigh_in_referee_portal]], [[project_cve_core_flow_field_model]], [[project_flow_advance_button_requirefields]].
