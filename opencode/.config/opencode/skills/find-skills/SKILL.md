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
  <skill_definition>
    This skill is a compatibility router for legacy prompts. It does not perform domain work itself; it resolves aliases to current local skills so execution uses the modern contract system.
    When using this skill, the agent should treat mapping output as a handoff instruction and continue with the delegated skills immediately.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/skills/web-design-guidelines/SKILL.md">Legacy web design alias target.</resource>
    <resource path="~/.config/opencode/skills/vercel-react-best-practices/SKILL.md">Legacy React alias target.</resource>
    <resource path="~/.config/opencode/skills/vercel-composition-patterns/SKILL.md">Legacy composition alias target.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan legacy resolution as deterministic skill remapping before execution continues.</objective>
    <phase order="1">Detect incoming legacy alias.</phase>
    <phase order="2">Resolve alias to current local skill set.</phase>
    <phase order="3">Hand off control to mapped skills and stop further alias processing.</phase>
    <completion_signal>Mapped skills are selected and ready for execution.</completion_signal>
  </planning_language>
  <mapping>
    <map from="vercel-composition-patterns" to="nextjs-react-tailwind-radix, gestalt-layout-composition" />
    <map from="vercel-react-best-practices" to="nextjs-react-tailwind-radix" />
    <map from="web-design-guidelines" to="brand-guideline-enforcer, oklch-color-theory, shape-language-layout-psychology" />
  </mapping>
  <rule>When invoked, load mapped skills and continue there.</rule>
</skill_contract>
