---
name: nextjs-react-tailwind-radix
description: Production patterns for Next.js 16, React, Tailwind v4 tokens, and Radix/shadcn composition.
license: MIT
compatibility: opencode
metadata:
  audience: frontend-engineers
  domain: implementation
---

## What I do
- Provide implementation guidance for Next.js 16 + React + Tailwind v4 + Radix/shadcn.
- Keep UI work aligned with tokenized theming and accessibility.
- Prevent common anti-patterns in component architecture.

## Security and reliability rules
- Sanitize and validate untrusted input at system boundaries.
- Avoid unsafe HTML injection patterns.
- Keep server-client boundaries explicit; do not leak server-only values to client components.
- Prefer stable APIs and avoid undocumented hacks.

## Framework defaults
- Next.js: server components first, client boundaries only when needed.
- React: favor predictable state flow and controlled component APIs.
- Tailwind v4: use theme variables and tokenized custom properties.
- Radix/shadcn: preserve semantic roles, keyboard behavior, and focus management.

## Design-system integration
- Prefer semantic tokens over ad hoc color literals.
- Use OKLCH-capable token values when color decisions are new.
- Keep spacing/radius/type scales aligned with project token definitions.

## Output format
1. `Architecture choice`
2. `Component and token strategy`
3. `Accessibility checks`
4. `Risk notes`
5. `Implementation steps`
