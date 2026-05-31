---
name: feedback-design-system-import-questionnaire
description: "When configuring cve-design-system theme seed, run a design-system-import questionnaire — never pick a default seed silently"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: e8e5c5ea-4f72-451d-9329-bfbbf532024a
---

When an agent (executor, planner, or skill) reaches the cve-design-system theme-seed configuration step, it must NOT auto-select a default seed. Instead, run a short questionnaire:

1. **Source check** — "Do you have an established design system to import, or should we start from a default?"
2. **If imported (e.g. from Claude Design or any structured design-system spec):**
   - Accept any shape of design-system data the user provides (colors, scales, typography, motion, components, etc.).
   - Extract ONLY the aspects that map to cve-design-system's surface: primary OKLCH, accent OKLCH, neutral scale anchors, font families (sans/mono/display), typographic scale, radii, shadow tokens, spacing scale, motion durations/easings — whatever cve-design-system's `ThemeSeed` + `generateTheme()` consume.
   - DEFER component examples, page templates, illustration sets, marketing assets. Those are NOT cve-design-system inputs. They belong at the cve-components stage (Phase 21) where they may inform composed components if desired.
   - Confirm each extraction back to the user before committing.
3. **If default:** Show 2–3 candidate seeds with rationale and let the user pick; do not silently lock option-a.

**Why:**
- Phase 20 Plan 20-01 task 1.5 silently committed a "RESEARCH §12 candidate" seed (cool charcoal + warm coral + Inter + Playfair Display) without asking. The user's actual established design system was bypassed.
- Conflating component examples with design-system tokens scrambles the layering: cve-design-system owns tokens + theme runtime; cve-components owns composition. Importing component examples into cve-design-system pollutes the contract.

**How to apply:**
- At any theme-seed gate (regardless of plan auto-mode or whether the gate is `checkpoint:decision`): bypass auto-selection. AskUserQuestion with "import existing | start from default" + collect design-system data if imported.
- When the user provides design-system data: enumerate what you extracted, what you deferred to cve-components, and what you discarded as out-of-scope (illustrations, marketing assets, page templates).
- Update FINDINGS.md (or equivalent phase deliverable) to record the extraction decisions — these become the design-system-import audit trail.
- Same discipline applies at every later phase that touches design tokens.
