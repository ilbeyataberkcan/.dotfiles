---
name: find-skills
description: Compatibility skill that maps legacy calls to the current local skill system.
compatibility: opencode
metadata:
  audience: migration
  source: legacy-alias
---

## Purpose
This compatibility skill replaces a legacy external reference.

## Local skill map
- `vercel-composition-patterns` -> `nextjs-react-tailwind-radix` + `gestalt-layout-composition`
- `vercel-react-best-practices` -> `nextjs-react-tailwind-radix`
- `web-design-guidelines` -> `brand-guideline-enforcer` + `oklch-color-theory` + `shape-language-layout-psychology`

## Recommendation
When invoked, prefer loading the target skills above and continue work there.
