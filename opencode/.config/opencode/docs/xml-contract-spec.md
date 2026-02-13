# XML Contract Spec

This project uses XML instruction contracts in profile, agent, skill, and template files.

## Contract layers
- `profiles/default/AGENTS.md` uses `<profile_contract>`.
- `agents/*.md` use `<agent_contract>` after YAML frontmatter.
- `skills/*/SKILL.md` use `<skill_contract>` after YAML frontmatter.
- `templates/*.template.xml` are XML source-of-truth artifacts.

## Core tags
- `workflow`, `stage`, `step`: ordered execution flow.
- `gate`: blocking decision that must be resolved.
- `decision_tree`: dynamic branch model.
- `inspection_checkpoint`: mandatory review questionnaire.
- `policy`, `safety`, `completion_criteria`: non-negotiable constraints.
- `outputs`: required deliverables.

## Common attributes
- `required="true"`: must run.
- `blocking="true"`: cannot continue until resolved.
- `strict_order="true"`: execute in declared order.
- `dynamic="true"`: can branch beyond predefined categories.
- `infer="false"`: disallow inference for protected topics.

## Required inspection options
Every major bundle checkpoint must use exactly:
1. `Looks good, continue`
2. `Refine this direction`
3. `Change direction`

## Required bootstrap gates
1. Business DNA
2. References and authority
3. Logo status
4. Decision tree approvals
5. Preflight and runtime disposition

## Template policy
- Use XML templates only.
- Preserve required tags and attributes.
- Add optional nodes freely, but do not remove required gate nodes.
