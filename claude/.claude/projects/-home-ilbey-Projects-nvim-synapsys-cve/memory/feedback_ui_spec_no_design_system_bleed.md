---
name: feedback-ui-spec-no-design-system-bleed
description: "UI-SPEC scope is NEW UI element creation only — must NOT bleed into cve-design-system token configuration, color contracts, or 60/30/10 prescriptions."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: cd298cb3-50f9-4591-835f-8b4d10b2f71a
---

UI-SPEC.md must stay scoped to NEW UI element creation: new components, new layouts, new interaction contracts. It MUST NOT bleed into cve-design-system configuration: token mappings, semantic-token assignment tables, 60/30/10 splits at the design-system layer, accent reserved-for lists at the system layer, or status-ramp suffix decisions. Those are cve-design-system's domain.

**Why:** Token mapping + color contract decisions belong to the design-system package (cve-design-system) — they're decided once at the package layer and consumed everywhere. When UI-SPEC duplicates those decisions per phase, it (a) creates drift between phases and the system source-of-truth, (b) inflates phase-level review surface with already-locked global choices, and (c) confuses the boundary between "this phase creates a NEW UI element" and "this phase migrates to an existing design-system contract". Example breach (Phase 5, 2026-05-26): UI-SPEC enumerated a 17-line `bg-neutral-*` → `bg-canvas`/`bg-surface`/`bg-accent-primary` migration table — that's cve-admin's package work consuming cve-design-system's contract, not a UI design decision.

**How to apply:**
- When a phase has no NEW UI element creation (only existing-shell renders, theme verification, token migrations consuming an existing design system), skip UI-SPEC — use `/gsd:plan-phase N --skip-ui`. Don't auto-generate a UI-SPEC just because the UI gate fires.
- If UI-SPEC IS needed, scope it to: new component visual contracts, new layout specs, new interaction patterns, new copywriting/empty-states for new surfaces. Operator screenshot evidence shape is acceptable IF tied to a new UI element being defined.
- Never include in UI-SPEC: token migration tables across existing files (that's package work), 60/30/10 prescriptions at the system layer (that's cve-design-system), semantic-token assignment rationale (that's cve-design-system), status-ramp naming conventions (that's cve-design-system).
- Operator screenshot acceptance for "verify existing renders correctly under updated tokens" belongs in CONTEXT.md / SPEC.md, NOT UI-SPEC.
- Related: [[project-cve-design-system-0-5-0-shape]] (the system-layer contract that should not be re-encoded per phase).
