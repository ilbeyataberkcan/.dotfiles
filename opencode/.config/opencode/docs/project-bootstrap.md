# Project Bootstrap Guide (Guided Interview + Brand Orchestration)

Use this when starting a new project from scratch or when brand inputs are incomplete.

## Natural prompts
- "Bootstrap a new project for [product] and suggest repo names."
- "Start a frontend project, read my brand docs, and generate guidelines."
- "I only have a logo and website URL, help me derive Brand DNA."

The system routes this work through `@bootstrap-design-lead` automatically.

## Interaction defaults
- Guided interview mode is the default.
- Fast mode is optional and only used when explicitly requested (`/bootstrap-fast`).
- High-impact gates use interactive question prompts.
- Core brand truth is never inferred in guided mode before user answers.

## Quick local template setup
Run from the target project root:

```bash
mkdir -p .opencode && cp \
  ~/.config/opencode/templates/project-bootstrap.template.jsonc \
  ~/.config/opencode/templates/brand-evidence-bundle.template.jsonc \
  ~/.config/opencode/templates/brand-dna.template.jsonc \
  ~/.config/opencode/templates/brand-guidelines.template.jsonc \
  ~/.config/opencode/templates/design-token-contract.template.jsonc \
  ~/.config/opencode/templates/visual-preflight-policy.template.jsonc \
  .opencode/
```

## Orchestration flow
1. Business DNA interview first (mission, audience, value model, constraints).
2. Design source gate (existing design inputs vs define now).
3. Link authority classification per URL (`canonical`, `inspiration`, `wip`).
4. Live dev server gate when defining design interactively.
5. Mandatory logo gate (provided, define now, or explicitly defer with risk).
6. Secure evidence intake and normalization.
7. Explicit web-search consent gate (search is OFF unless user opts in).
8. Decision consolidation and guideline synthesis.
9. Visual and runtime preflight before handoff.

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

## What to edit first
1. `.opencode/project-bootstrap.template.jsonc`
   - Confirm business DNA, setup intent, source authority, decision ledger, and policy defaults.
2. `.opencode/brand-evidence-bundle.template.jsonc`
   - Fill accepted sources, authority class, claims, conflicts, and evidence gaps.
3. `.opencode/brand-dna.template.jsonc`
   - Capture positioning, audience, personality, tone, accessibility posture, and approval status.
4. `.opencode/brand-guidelines.template.jsonc`
   - Lock hard constraints and forbidden patterns.
5. `.opencode/design-token-contract.template.jsonc`
   - Align with real token values.
6. `.opencode/visual-preflight-policy.template.jsonc`
   - Confirm WCAG/APCA and output requirements.

## Optional rename after editing
```bash
mv .opencode/project-bootstrap.template.jsonc .opencode/project-bootstrap.jsonc
mv .opencode/brand-evidence-bundle.template.jsonc .opencode/brand-evidence-bundle.jsonc
mv .opencode/brand-dna.template.jsonc .opencode/brand-dna.jsonc
mv .opencode/brand-guidelines.template.jsonc .opencode/brand-guidelines.jsonc
mv .opencode/design-token-contract.template.jsonc .opencode/design-token-contract.jsonc
mv .opencode/visual-preflight-policy.template.jsonc .opencode/visual-preflight-policy.jsonc
```

## Team workflow tip
- Commit `.opencode` artifacts with the project so design and engineering share the same constraints.
