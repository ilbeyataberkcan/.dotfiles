---
name: web-design-guidelines
description: Compatibility wrapper for web design guidance using local brand, color, shape, and Gestalt skills.
compatibility: opencode
metadata:
  audience: migration
  source: legacy-alias
---
<skill_contract id="web-design-guidelines">
  <purpose>Compatibility alias retained for legacy prompts.</purpose>
  <skill_definition>
    This compatibility skill redirects legacy web-design requests to the current brand, color, shape, and composition stack. It exists to preserve older prompt habits while still enforcing modern contracts.
    When using this skill, the agent should follow the delegate order and apply the same safety and accessibility policies used by the active design workflow.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/skills/brand-guideline-enforcer/SKILL.md">Brand compliance and governance.</resource>
    <resource path="~/.config/opencode/skills/oklch-color-theory/SKILL.md">Color and contrast preflight.</resource>
    <resource path="~/.config/opencode/skills/shape-language-layout-psychology/SKILL.md">Shape and geometry guidance.</resource>
    <resource path="~/.config/opencode/skills/gestalt-layout-composition/SKILL.md">Layout and grouping diagnostics.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan legacy web design requests as delegated execution through current specialist skills.</objective>
    <phase order="1">Interpret request as compatibility alias invocation.</phase>
    <phase order="2">Load delegated skills in defined order.</phase>
    <phase order="3">Return control to delegated skill workflow and enforce shared safety policies.</phase>
    <completion_signal>Delegation handoff is complete and governed by current contracts.</completion_signal>
  </planning_language>
  <delegate>
    <skill order="1">brand-guideline-enforcer</skill>
    <skill order="2">oklch-color-theory</skill>
    <skill order="3">shape-language-layout-psychology</skill>
    <skill order="4">gestalt-layout-composition</skill>
  </delegate>
  <rule>Enforce brand and accessibility before visual preference decisions.</rule>
</skill_contract>
