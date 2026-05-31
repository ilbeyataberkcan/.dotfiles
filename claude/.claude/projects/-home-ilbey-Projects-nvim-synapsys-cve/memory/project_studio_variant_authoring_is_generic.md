---
name: project-studio-variant-authoring-is-generic
description: "Studio's variant authoring (canvas-of-variants, variant switching, per-variant preview) is a GENERIC capability with a HARD dependency on cve-variants/cve-core. Multilingual is a wrapper use case — cve-multilingual-workflow ships its own Studio expansion separately."
metadata: 
  node_type: memory
  type: project
  originSessionId: 695d2b81-3a47-46ac-8c5c-8d03f86252cc
---

**The boundary (confirmed P18 spec-phase 2026-05-13):**

- **`cve-studio-extension` (P18 scope):** ships *generic* variant authoring depth — rendering variants on the 2D canvas, switching the selected variant, tree/inspector reacting to the selection, draft-time `ClientRenderEngine` per variant node. Hard dependency on `cve-core` variant primitives (`PageVariant`, `applyDiff`, `branchedFromHash`, per-variant `publishedAt`). NO dependency on cve-multilingual-workflow.

- **`cve-multilingual-workflow` (separate, NOT in P18):** is a wrapper that uses the variant system as i18n infrastructure. Its purpose is to provide *Studio expansions* for the multilingual use case. The package already reserves a TYPE-ONLY `/admin` subpath (`packages/multilingual-workflow/src/index.ts` comment cites D-19 / I18N-07 / Pitfall 8). The actual runtime Studio expansion that wires multilingual UX onto Studio's generic variant controls is **not P18's deliverable** — it belongs to multilingual-workflow's own extension surface.

**Why this matters:**
- The handoff brief (`docs/NewMilestone-Handoff-Docs/02-cve-studio-extension-handoff-brief.md`) frames P18 as "multilingual authoring depth." That framing is *motivating context*, not the deliverable. The actual deliverable is the variant primitives Studio needs to expose so the multilingual wrapper can build on them.
- STUDIO-01..STUDIO-06 requirements in REQUIREMENTS.md read as "multilingual X" but the X is shipped by P18 as a *generic variant* capability. The multilingual flavor (locale tag rendering, completeness badges, translator workflow indicators) is consumed by multilingual-workflow's own admin expansion, not built into Studio.
- Variants are used for more than i18n: A/B testing, regional variation, audience-targeted content, etc. Studio's variant authoring serves all of them.

**How to apply:**
- When P18 planning or execution drifts toward "Studio must surface locale labels / language switcher chrome / completeness badges" — STOP. That's multilingual-workflow's expansion. P18 only knows about generic `variantKey` (an opaque non-empty string per cve-core).
- When P18 plans tests/fixtures: use generic variant scenarios (e.g. `variantKey: "primary-cta-a"`, `"primary-cta-b"`, `"summer-promo"`), NOT locale-tagged variants. The naming-discipline grep (GATE-06) will catch locale tokens in reusable code surfaces.
- When discussing peer dependencies for the studio extension: cve-multilingual-workflow is **not a peer dep of cve-studio-extension** in P18.

**Open downstream item:** cve-multilingual-workflow's Studio expansion (the runtime admin extension that the type-only `/admin` subpath foreshadows) is unimplemented. Re-surface this when the user asks about deferred work, or if a future milestone wants real multilingual editor UX.

Related: [[project-phase18-deferred-workflow-indicator]] (WorkflowState indicator wiring also deferred to that future multilingual-workflow expansion).
