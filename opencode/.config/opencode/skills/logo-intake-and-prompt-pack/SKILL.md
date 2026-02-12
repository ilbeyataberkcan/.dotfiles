---
name: logo-intake-and-prompt-pack
description: Resolve logo availability and generate AI-ready logo brief/prompt packs when logos are missing.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: brand-and-frontend-teams
  domain: logo-workflow
---

## What I do
- Make logo handling a mandatory bootstrap checkpoint.
- Accept provided logo assets and record usage constraints.
- If logos are missing, build a practical prompt pack for AI logo tools.

## Required gate
Ask one of these paths:
1. `Logo provided`
2. `Define logo direction now`
3. `Defer logo for now`

If deferred, log explicit design risk and blocked follow-up items.

## Provided-logo workflow
1. Collect file paths and format types (svg/png/eps/pdf).
2. Capture lockup variants (horizontal/mark-only/monochrome/inverse).
3. Capture clear-space and minimum-size constraints if known.
4. Capture misuse restrictions.

## No-logo workflow
1. Build logo brief from approved Business DNA.
2. Generate style-specific prompt packs:
   - symbol-first
   - wordmark-first
   - monogram
3. Provide negative prompts to avoid off-brand outputs.
4. Provide selection rubric (legibility, distinctiveness, scalability, brand fit).

## Output format
1. `Logo status`
2. `Collected assets and constraints`
3. `Prompt pack` (if needed)
4. `Selection rubric`
5. `Risk note` (if deferred)
