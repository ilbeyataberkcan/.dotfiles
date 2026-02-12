# OpenCode Visual Workflow Cheat Sheet

Use these natural prompts. You do not need to name skills or agents explicitly.

## Project bootstrap and brand setup
- "Bootstrap a new project for [idea], suggest repo names, and define setup."
- "Use my brand files to initialize design constraints for this project."
- "I have partial docs, fill gaps with a Brand DNA interview."
- "Bootstrap this existing project with guided interview mode."

What happens:
- Starts with Business DNA interview first (one concise question at a time).
- Tailors follow-up questions based on your previous answers.
- Classifies each provided link (`canonical`, `inspiration`, `wip`) before use.
- Runs logo gate (provided, define now, or defer with risk note).
- Ingests local files/URLs with secure evidence normalization.
- Asks explicit consent before any external web search (search defaults to off).
- Produces a cohesive bootstrap + guideline package.

## Fast mode
- "Use /bootstrap-fast for this project."

What happens:
- Uses fewer questions and faster defaults.
- Still classifies each provided link (`canonical`, `inspiration`, `wip`) before use.
- Still enforces security/accessibility/runtime checks.

## Full frontend design
- "Design a full landing page for [product] with our brand style."
- "Redesign this dashboard for clarity and stronger hierarchy."

What happens:
- Runs integrated visual preflight (brand + color + shape + layout).
- Returns one cohesive recommendation.

## New component design
- "Design a new pricing card component for our app."
- "Create a safer, more readable alert component set."

What happens:
- Runs component-level color + shape checks.
- Aligns output with Next.js/React/Tailwind/Radix patterns when relevant.

## Color review
- "Review these colors and tell me what is risky."
- "Give me a better palette in OKLCH that keeps brand feel."

What happens:
- Runs WCAG AA gate and APCA warnings.
- Returns a contrast matrix and exact OKLCH adjustments.

## Shape/layout review
- "Are these shapes and spacing choices good for trust and clarity?"
- "Audit this layout with Gestalt principles."

What happens:
- Audits geometry, grouping, focus path, and responsive hierarchy.
- Returns concrete correction steps with severity.

## Combined color and shape opinion
- "Give me your opinion on these colors and shapes for this page."

What happens:
- Returns one unified critique with a final go/no-go disposition.

## Missing URL/help finding references
- "I don't know the right brand links yet; ask before searching the web."

What happens:
- Assistant requests explicit consent before external search.
- If denied, it continues with interview and local evidence only.
- If approved, externally sourced findings are labeled with source and confidence.

## Logo-first prompts
- "I don't have a logo yet; help me define one."

What happens:
- Runs a logo gate.
- Generates a logo brief + AI prompt pack + evaluation rubric when assets are missing.

## Optional power-user prompts
If you want explicit specialist routing, you can use:
- "Use @expert-colorist for this palette."
- "Use @shape-language-architect for this component geometry."
- "Use @visual-psychology-orchestrator for full preflight."
- "Use @bootstrap-design-lead for project initialization and Brand DNA flow."
