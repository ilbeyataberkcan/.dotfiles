# OpenCode Visual Workflow Cheat Sheet

Use these natural prompts. You do not need to name skills or agents explicitly.

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

## Optional power-user prompts
If you want explicit specialist routing, you can use:
- "Use @expert-colorist for this palette."
- "Use @shape-language-architect for this component geometry."
- "Use @visual-psychology-orchestrator for full preflight."
