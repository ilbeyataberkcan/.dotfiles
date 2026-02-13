---
name: nextjs-tailwind-runtime-preflight
description: Run runtime safety checks for Next.js and Tailwind resolution before bootstrap handoff.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: frontend-implementation
  domain: runtime-validation
---
<skill_contract id="nextjs-tailwind-runtime-preflight" strict_order="true">
  <purpose>
    <item>Catch runtime failures that lint or build alone can miss.</item>
    <item>Block handoff when localhost is not healthy.</item>
  </purpose>

  <checks>
    <check id="config-sanity">Flag risky next root overrides such as turbopack root from process cwd.</check>
    <check id="tailwind-alignment">Verify tailwind dependency, imports, and postcss alignment.</check>
    <check id="execution">Run lint, build, and dev smoke checks.</check>
    <check id="environment">Detect port conflicts and verify project-root workdir.</check>
    <check id="live-preview" when="enabled">Keep background server healthy and restart when required.</check>
  </checks>

  <blocking_policy>
    <rule>Block on resolver errors such as cannot resolve tailwindcss.</rule>
    <rule>Block if dev server fails after passing build.</rule>
    <rule>Downgrade workspace lockfile root warnings to warn when non-blocking.</rule>
  </blocking_policy>

  <outputs>
    <output>Check matrix: pass, warn, fail.</output>
    <output>Detected risks and fix guidance.</output>
    <output>Final runtime disposition.</output>
  </outputs>
</skill_contract>
