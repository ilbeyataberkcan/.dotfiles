# XML Contract Spec

This project uses XML contracts as the execution source-of-truth for profile, agent, skill, and template behavior.

## Contract layers
- `profiles/default/AGENTS.md` uses `<profile_contract>`.
- `agents/*.md` use `<agent_contract>` after YAML frontmatter.
- `skills/*/SKILL.md` use `<skill_contract>` after YAML frontmatter.
- `templates/*.template.xml` are canonical project artifacts.

## YAML frontmatter policy
- Keep YAML frontmatter for loader metadata in `agents/*.md` and `skills/*/SKILL.md`.
- Place exactly one XML root element after frontmatter.

## Core XML roots
- `<profile_contract>`: profile-level priorities and routing.
- `<agent_contract>`: orchestration, stage flow, gate policy, outputs.
- `<skill_contract>`: focused behavior contract and guardrails.
- `<template>`: project data contracts and runtime state.

## Required tags by contract type

### Profile contract
- `priorities`
- `frontend_workflow`
- `bootstrap_workflow`
- `interaction_policy`
- `completion_criteria`

### Agent contract
- `mission`
- `workflow`
- `execution_rules`
- `inspection_checkpoint`
- `required_outputs`

### Skill contract
- `purpose`
- `skill_definition`
- `resource_references`
- `planning_language`
- behavior section (`workflow` or domain-equivalent)
- safety or policy section
- `outputs`

## Plain language contract
Every `skill_contract` must include:
- `skill_definition` with plain human-readable explanation of what the skill does.
- `resource_references` listing the files or artifacts an agent should consult while using the skill.

This requirement ensures agents can interpret skills in natural terms and reliably locate the right supporting resources.

## Planning language contract
Every `skill_contract` must include `planning_language` with:
- `objective`
- ordered `phase` entries (at least 2)
- `completion_signal`

The goal is to make agent execution intent explicit and predictable for orchestration.

## Standard attributes
- `required="true"`: stage or gate must run.
- `blocking="true"`: workflow cannot continue until resolved.
- `strict_order="true"`: execute in declaration order.
- `dynamic="true"`: branch model can expand beyond predefined categories.
- `infer="false"`: inference is disallowed for protected topics.
- `impact="high|medium|low"`: decision severity.
- `status="approved_by_answer|approved_by_gate|needs_clarification|deferred"`: decision state.

## Decision tree model

### Structure template
- `templates/design-flow-tree.template.xml` defines stage map, branches, and leaf nodes.
- Each leaf must include:
  - `id`
  - `path`
  - `impact`
  - `reached_when`

### Runtime state template
- `templates/design-flow-state.template.xml` stores mutable state:
  - stage progress
  - gate status
  - leaf status ledger
  - checkpoint history
  - live preview lifecycle
  - preflight disposition

## Leaf selection policy (mandatory)
1. Pick unresolved high-impact leaves first.
2. Respect dependency order (`blocked_by` leaves).
3. If multiple leaves are eligible, use earliest stage path.
4. Apply only after leaf is approved (`approved_by_answer` or `approved_by_gate`).
5. Agent recommendations are allowed, but autonomous leaf locking is not allowed.
6. A leaf cannot become `approved_by_gate` without explicit confirmation evidence (question tool or structured fallback).

## Mandatory bootstrap gates
1. Business DNA
2. References and authority classification
3. Logo status
4. Decision tree approvals
5. Logic integrity and runtime preflight

## Inspection checkpoint contract
After every major applied bundle, use exactly:
1. `Looks good, continue`
2. `Refine this direction`
3. `Change direction`

Execution requirement:
- Use the question tool for mandatory gates and checkpoints when available.
- If the question tool is unavailable, use a structured prompt fallback and require explicit confirmation.
- Plain text option prompts without explicit confirmation are not valid gate completion evidence.

## Inference policy
- Guided mode: core brand truth is never inferred before explicit user input.
- Fast mode: provisional hypotheses are allowed only with immediate confirmation before lock.

## Source authority policy
- `canonical`: may define constraints.
- `inspiration`: suggestion-only, not hard truth.
- `wip`: discussion input, cannot override approved decisions.
- Unknown links default to `inspiration`.

## XML template policy
- XML-only templates are allowed under `templates/`.
- Do not reintroduce `.template.jsonc` files.
- Preserve required nodes and attributes from flow and state templates.
