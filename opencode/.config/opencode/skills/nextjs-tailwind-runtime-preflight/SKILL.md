---
name: nextjs-tailwind-runtime-preflight
description: Run runtime safety checks for Next.js and Tailwind resolution before bootstrap handoff.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: frontend-implementation
  domain: runtime-validation
---

## What I do
- Catch runtime issues that lint/build may miss.
- Detect common Tailwind and root-resolution misconfigurations.
- Prevent false "done" status when localhost fails.

## Checks
1. `Config sanity`
   - flag risky `next.config` root overrides (for example `turbopack.root: process.cwd()`).
2. `Dependency and import alignment`
   - verify `tailwindcss` dependency exists.
   - verify stylesheet imports and postcss plugin configuration are consistent.
3. `Execution checks`
   - run lint.
   - run build.
   - run dev smoke test and verify page response.
4. `Environment checks`
   - detect port conflicts and report resolution.
   - verify command workdir is project root.

## Blocking policy
- Block handoff when resolver errors are found (for example "Can't resolve 'tailwindcss'").
- Block handoff when dev server fails after passing build.
- Downgrade to warning only for non-blocking workspace lockfile root warnings.

## Output format
1. `Check matrix` (`pass`, `warn`, `fail`)
2. `Detected risks`
3. `Fix guidance`
4. `Final runtime disposition`
