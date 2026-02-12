---
name: project-bootstrap-interview
description: Run a progressive project bootstrap interview that captures setup, stack, naming, and design constraints.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: product-and-frontend-teams
  domain: project-initialization
---

## What I do
- Run a structured but conversational bootstrap interview.
- Capture Business DNA first, then ask conditional setup/design follow-ups.
- Produce implementation-ready bootstrap records without requiring users to know internal workflows.

## Security and integrity rules
- Never request or store secrets unless they are strictly required for the user's explicit goal.
- Redact sensitive values in examples and outputs.
- Flag risky project choices (unsafe defaults, missing auth boundaries, weak deployment posture).

## Interview model (progressive disclosure)
1. Core business DNA: mission, audience, value model, and constraints.
2. Project context: existing vs new project, goals, and success criteria.
3. Design source path: existing design inputs vs define design now.
4. Asset status: logos, brand docs, tokens, references, URL/file inputs.
5. Technical baseline: framework/runtime/package manager/deployment only when relevant.
6. Scope controls and compliance posture.

## Adaptive interview rules
- Ask one concise question at a time.
- Tailor each question using prior answers when relevant.
- Skip questions that are already explicitly answered.
- Do not infer core brand truth before user-provided answers.
- Use options only as flow controls; always allow freeform user input.
- Mark explicit answers as `approved_by_answer` for high-impact decisions.

## Naming rules
- Prefer concise, kebab-case repo names.
- For package names, require npm-safe patterns and collision-aware alternatives.
- Always provide 2-3 ranked naming options with rationale.

## Output format
1. `Business DNA snapshot`
2. `Bootstrap snapshot`
3. `Decision ledger` (`approved_by_answer`, `approved_by_gate`, `needs_clarification`)
4. `Stack and setup decisions`
5. `Known constraints and assumptions`
6. `Missing inputs`

## Refusal and escalation
- Refuse insecure setup suggestions that materially increase risk without warning.
- Escalate ambiguous architectural choices by presenting safe defaults and tradeoffs.
