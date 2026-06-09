---
name: feedback_preview_html_is_element_ground_truth
description: The tmmaf DS preview/*.html files (named by element category) are the per-element ground truth for what to build and how it looks — correlate that hand-written non-reusable markup to our reusable RenderEngine components before building
metadata:
  node_type: memory
  type: feedback
  originSessionId: 2b34fa58-2e9f-4c0f-b947-d5b1587a3840
---

`docs/tmmaf-design-system/project/preview/*.html` — each file named by element category
(components-inputs, components-badges, components-buttons, components-nav, components-event-card,
components-fight-card, components-fighter-card, components-bracket, components-result-row,
components-hero, type-body, type-display, type-stats, colors-*, spacing-*, brand-*) — is the
**GROUND TRUTH** for two things: (1) **WHAT to display/build** for a given stage, and (2) **HOW each
element looks and is reconstructed** (exact structure, variants, states, geometry, type, color from the
self-contained HTML+CSS, backed by `ui_kits/website/kit.css` + `colors_and_type.css`).

CRITICAL: these previews are **hand-written, NOT reusable components** — the operator does NOT expect
the design-system files to be component-structured. So the real work is the **CORRELATION**: map each
preview element to our reusable `@synapsys-integrated/cve-components` RenderEngine components (+ the
recipe that drives it). Prefer REUSE; introduce CUSTOM only when no default reconstructs the look
(then follow defineComponent + sibling-schema conventions). Ambiguous correlations can be resolved
**together with the operator** — flag them, don't guess silently.

A first-pass correlation reference lives at `docs/tmmaf-design-system/CORRELATION-MAP.md` (preview file →
element → cve component/recipe → reconstruction notes → confidence/flags). Keep it current as a living
doc; it is what makes each component round faster + accurate from the start.

**Why:** operator directive 2026-06-08 ("at most seriousness") — consulting the previews up front and
doing the correlation makes me build the components accurately the FIRST time instead of iterating.

**How to apply:** before building/displaying ANY stage's components, READ the matching preview/*.html,
derive the element's exact appearance, and map it to cve components/recipes via the correlation map;
surface uncertain correlations for the operator. Relates to [[project_review_loop_gated_design_tool]],
[[feedback_never_drop_annotations]], [[feedback_evolve_skill_as_we_progress]].
