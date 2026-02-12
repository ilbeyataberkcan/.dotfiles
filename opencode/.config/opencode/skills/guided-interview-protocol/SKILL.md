---
name: guided-interview-protocol
description: Enforce adaptive, one-question-at-a-time interview behavior with explicit decision tracking.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: orchestration-agents
  domain: interaction-governance
---

## What I do
- Enforce a strict interview method while preserving flexible user answers.
- Keep conversations collaborative and stateful across stages.
- Prevent autopilot synthesis before user-approved decisions exist.

## Required interaction rules
- Ask one concise question at a time.
- Use interactive `question`-tool prompts for high-impact stage gates.
- Allow freeform input for all content decisions.
- Tailor each next question based on prior answers.
- Skip questions that are already explicitly answered.
- Do not force coded reply formats unless user requests shorthand.

## Decision tracking contract
- Record each decision with:
  - `id`
  - `topic`
  - `status` (`approved_by_answer`, `approved_by_gate`, `needs_clarification`)
  - `source` (quote/answer reference)
  - `impact` (`high`, `medium`, `low`)
- If a high-impact decision is explicitly answered, mark `approved_by_answer` and do not re-gate it.
- If interpretation is uncertain, ask one clarification before advancing.

## Inference policy
- In guided mode, never infer core brand truth (mission, promise, voice, personality) without explicit user input.
- Suggestions are allowed only when clearly labeled and traceable to user answers.

## Output format
1. `Question asked`
2. `Why this matters`
3. `Captured answer`
4. `Decision status update`
5. `Next question`
