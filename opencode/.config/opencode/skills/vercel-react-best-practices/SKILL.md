---
name: vercel-react-best-practices
description: Compatibility wrapper for React best practices using local Next.js and React production conventions.
compatibility: opencode
metadata:
  audience: migration
  source: legacy-alias
---
<skill_contract id="vercel-react-best-practices">
  <purpose>Compatibility alias retained for legacy prompts.</purpose>
  <skill_definition>
    This compatibility skill maps older React best-practice prompts to the current implementation contract. It prevents obsolete routing while preserving expected outcomes for legacy usage.
    When using this skill, the agent should hand execution to the delegated implementation skill and preserve security, accessibility, and token constraints.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/skills/nextjs-react-tailwind-radix/SKILL.md">Primary implementation contract for React and Next.js.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan legacy React best-practice requests as delegation to the active implementation contract.</objective>
    <phase order="1">Resolve alias to current implementation skill.</phase>
    <phase order="2">Delegate with security, accessibility, and token constraints preserved.</phase>
    <completion_signal>Execution is handed off to nextjs-react-tailwind-radix.</completion_signal>
  </planning_language>
  <delegate>
    <skill>nextjs-react-tailwind-radix</skill>
  </delegate>
  <rule>Apply accessibility, security, and token discipline as non-negotiable defaults.</rule>
</skill_contract>
