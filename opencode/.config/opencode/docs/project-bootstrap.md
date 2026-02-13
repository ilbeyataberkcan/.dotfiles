# Project Bootstrap Guide (Guided Interview + Brand Orchestration)

Use this when starting a new project from scratch or when brand inputs are incomplete.

## Natural prompts
- "Bootstrap a new project for [product] and suggest repo names."
- "Start a frontend project, read my brand docs, and generate guidelines."
- "I only have a logo and website URL, help me derive Brand DNA."

The system routes this work through `@bootstrap-design-lead` automatically.

For implementation-heavy design iterations, switch to the primary `design` agent using Tab.

## Interaction defaults
- Guided interview mode is the default.
- Fast mode is optional and only used when explicitly requested (`/bootstrap-fast`).
- High-impact gates use interactive question prompts.
- Core brand truth is never inferred in guided mode before user answers.
- Single-sweep execution is preferred: branch decisions, apply, inspect, continue.

## Quick local template setup
Run from the target project root:

```bash
mkdir -p .opencode && cp \
  ~/.config/opencode/templates/design-flow-tree.template.xml \
  ~/.config/opencode/templates/design-flow-state.template.xml \
  ~/.config/opencode/templates/project-bootstrap.template.xml \
  ~/.config/opencode/templates/brand-evidence-bundle.template.xml \
  ~/.config/opencode/templates/brand-dna.template.xml \
  ~/.config/opencode/templates/brand-guidelines.template.xml \
  ~/.config/opencode/templates/design-token-contract.template.xml \
  ~/.config/opencode/templates/visual-preflight-policy.template.xml \
  .opencode/
```

Templates are XML contracts. Keep required tags and attributes intact when editing.

Flow templates:
- `design-flow-tree.template.xml`: immutable stage and leaf structure.
- `design-flow-state.template.xml`: mutable runtime state and checkpoint history.

## Orchestration flow
1. Business DNA interview first (mission, audience, value model, constraints).
2. Design source gate (existing design inputs vs define now).
3. Link authority classification per URL (`canonical`, `inspiration`, `wip`).
4. Live dev server gate when defining design interactively.
5. Mandatory logo gate (provided, define now, or explicitly defer with risk).
6. Secure evidence intake and normalization.
7. Explicit web-search consent gate (search is OFF unless user opts in).
8. Decision consolidation and guideline synthesis.
9. Dynamic decision-tree sweep (propose -> approve -> apply -> inspect).
10. Visual and runtime preflight before handoff.

## Explicit web-search consent behavior
- No external search is performed by default.
- If documentation is missing, the assistant asks whether web search is allowed.
- If denied, flow continues with local files and interview-derived inputs only.

## Link authority behavior
- Every provided link is classified before use:
  - `canonical`: can define constraints.
  - `inspiration`: can inform suggestions only.
  - `wip`: discussion input only, never hard source-of-truth by default.
- This classification is required even in fast mode.

## Logo behavior
- Logo status is mandatory during bootstrap.
- If logo assets are missing, assistant can produce a logo direction brief and AI prompt pack.
- If logo is deferred, assistant records explicit design risk in the final report.

## Inspection checkpoint behavior
- After each major applied design bundle, assistant asks exactly one questionnaire:
  1. `Looks good, continue`
  2. `Refine this direction`
  3. `Change direction`

## Live preview behavior
- When design is defined collaboratively, assistant asks whether to run a background dev server.
- If enabled, preview remains active during the sweep and restarts when needed.

## What to edit first
1. `.opencode/design-flow-tree.template.xml`
   - Review stage ordering, mandatory gates, and leaf definitions.
2. `.opencode/design-flow-state.template.xml`
   - Confirm runtime state fields for approvals, checkpoints, and live preview lifecycle.
3. `.opencode/project-bootstrap.template.xml`
   - Confirm business DNA, setup intent, source authority, and policy defaults.
4. `.opencode/brand-evidence-bundle.template.xml`
   - Fill accepted sources, authority class, claims, conflicts, and evidence gaps.
5. `.opencode/brand-dna.template.xml`
   - Capture positioning, audience, personality, tone, accessibility posture, and approval status.
6. `.opencode/brand-guidelines.template.xml`
   - Lock hard constraints and forbidden patterns.
7. `.opencode/design-token-contract.template.xml`
   - Align with real token values.
8. `.opencode/visual-preflight-policy.template.xml`
   - Confirm WCAG/APCA and output requirements.

## Optional rename after editing
```bash
mv .opencode/design-flow-tree.template.xml .opencode/design-flow-tree.xml
mv .opencode/design-flow-state.template.xml .opencode/design-flow-state.xml
mv .opencode/project-bootstrap.template.xml .opencode/project-bootstrap.xml
mv .opencode/brand-evidence-bundle.template.xml .opencode/brand-evidence-bundle.xml
mv .opencode/brand-dna.template.xml .opencode/brand-dna.xml
mv .opencode/brand-guidelines.template.xml .opencode/brand-guidelines.xml
mv .opencode/design-token-contract.template.xml .opencode/design-token-contract.xml
mv .opencode/visual-preflight-policy.template.xml .opencode/visual-preflight-policy.xml
```

## Team workflow tip
- Commit `.opencode` artifacts with the project so design and engineering share the same constraints.
