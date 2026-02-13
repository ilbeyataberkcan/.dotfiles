---
name: vercel-composition-patterns
description: Compatibility wrapper for composition guidance, now served by local Next.js and Gestalt skills.
compatibility: opencode
metadata:
  audience: migration
  source: legacy-alias
---
<skill_contract id="vercel-composition-patterns">
  <purpose>Compatibility alias retained for legacy prompts.</purpose>
  <skill_definition>
    This compatibility skill routes older composition-pattern requests into the current implementation and layout-composition stack. It keeps legacy prompts usable without duplicating composition logic.
    When using this skill, the agent should delegate in order and ensure resulting guidance remains tokenized, accessible, and consistent with modern layout contracts.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/skills/nextjs-react-tailwind-radix/SKILL.md">Implementation and component architecture baseline.</resource>
    <resource path="~/.config/opencode/skills/gestalt-layout-composition/SKILL.md">Composition and grouping diagnostics.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan legacy composition guidance through current composition and implementation specialists.</objective>
    <phase order="1">Resolve alias to modern delegated skill sequence.</phase>
    <phase order="2">Apply composition guidance through tokenized and accessible defaults.</phase>
    <completion_signal>Delegation to current composition stack is complete.</completion_signal>
  </planning_language>
  <delegate>
    <skill order="1">nextjs-react-tailwind-radix</skill>
    <skill order="2">gestalt-layout-composition</skill>
  </delegate>
  <rule>Route composition decisions through tokenized, accessible, brand-safe patterns.</rule>
</skill_contract>
