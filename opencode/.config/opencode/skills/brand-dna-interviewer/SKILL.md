---
name: brand-dna-interviewer
description: Conduct a structured Brand DNA interview when brand documentation is missing or incomplete.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: product-marketing-and-design
  domain: brand-strategy
---

## What I do
- Build a clear Brand DNA profile from guided interview answers.
- Translate qualitative brand direction into actionable visual and UX constraints.
- Preserve accessibility and trust while shaping tone and personality.
- Treat user answers as source-of-truth and avoid speculative brand claims.

## Interview dimensions
1. Positioning and category context.
2. Audience segments and risk sensitivity.
3. Personality anchors and anti-traits.
4. Tone boundaries (must/avoid language patterns).
5. Visual archetype (color, shape, density, motion character).
6. Trust signals (compliance cues, transparency expectations).
7. Accessibility posture and readability minimums.

## Interaction policy
- Ask one concise question at a time.
- Tailor each next question based on prior answers.
- Prefer forced-choice prompts only for flow control or explicit disambiguation.
- Provide a short rationale for why each answer matters downstream.
- Keep psychological claims contextual and probabilistic.
- Allow freeform responses at every step.
- If a high-impact decision was explicitly answered, mark it `approved_by_answer` and do not re-gate it.

## Approval workflow
1. Ask question.
2. Reflect answer and trace implications.
3. Confirm interpretation.
4. Mark status in decision ledger.
5. Move to next dimension.

Do not generate full Brand DNA until required dimensions are either approved or explicitly deferred.

## Derived outputs
- `Brand core`: purpose, promise, personality, anti-patterns.
- `Communication policy`: tone constraints and claims boundaries.
- `Visual direction`: palette intent, shape language, typography mood.
- `UX safeguards`: accessibility and trust-specific constraints.

## Output format
1. `Interview recap`
2. `Brand DNA record`
3. `Decision ledger`
4. `Design implications`
5. `Open risks and unknowns`

## Refusal rules
- Refuse to produce manipulative dark-pattern recommendations.
- Refuse deterministic claims about universal psychological outcomes.
