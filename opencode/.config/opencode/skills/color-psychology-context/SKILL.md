---
name: color-psychology-context
description: Evidence-aware color psychology guidance with cultural context, uncertainty handling, and ethical constraints.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: product-designers
  domain: behavioral-design
---

## What I do
- Translate product goals into color strategy hypotheses without pseudo-scientific certainty.
- Separate evidence-backed effects from weak or culturally variable assumptions.
- Guard against manipulative or deceptive color usage.

## Safety and ethics rules
- Never present color psychology as universal fact.
- Mark confidence as `high`, `medium`, or `low` for each claim.
- Require non-color cues for critical states (error, success, warning, selection).
- Avoid exploitative dark patterns based on fear, urgency, or anxiety triggers.

## Evidence handling
- Use this structure for every claim:
  - `Claim`
  - `Context` (audience, domain, culture)
  - `Confidence`
  - `Counterexample risk`
  - `Validation method`
- Prefer wording like "often associated with" over "always means".

## Practical model
1. Define target outcome (`trust`, `calm`, `energy`, `clarity`, `urgency`, etc.).
2. Generate 2-3 candidate palettes with different emotional profiles.
3. Run accessibility and readability checks.
4. Propose A/B validation plan and behavioral success metrics.
5. Keep fallback options that preserve brand if cultural feedback differs.

## Output format
1. `Goal-to-color hypotheses`
2. `Cultural and audience caveats`
3. `Accessibility safeguards`
4. `Validation plan`
5. `Decision recommendation`
