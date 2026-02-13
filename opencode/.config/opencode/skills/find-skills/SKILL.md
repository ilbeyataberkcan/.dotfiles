---
name: find-skills
description: Compatibility skill that maps legacy calls to the current local skill system.
compatibility: opencode
metadata:
  audience: migration
  source: legacy-alias
---
<skill_contract id="find-skills">
  <purpose>Map legacy skill names to current local skills.</purpose>
  <mapping>
    <map from="vercel-composition-patterns" to="nextjs-react-tailwind-radix, gestalt-layout-composition" />
    <map from="vercel-react-best-practices" to="nextjs-react-tailwind-radix" />
    <map from="web-design-guidelines" to="brand-guideline-enforcer, oklch-color-theory, shape-language-layout-psychology" />
  </mapping>
  <rule>When invoked, load mapped skills and continue there.</rule>
</skill_contract>
