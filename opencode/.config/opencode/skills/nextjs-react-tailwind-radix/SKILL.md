---
name: nextjs-react-tailwind-radix
description: Production patterns for Next.js 16, React, Tailwind v4 tokens, and Radix or shadcn composition.
license: MIT
compatibility: opencode
metadata:
  audience: frontend-engineers
  domain: implementation
---
<skill_contract id="nextjs-react-tailwind-radix">
  <purpose>
    <item>Provide implementation guidance for Next.js, React, Tailwind tokens, and Radix composition.</item>
    <item>Keep UI implementation secure, accessible, and token-driven.</item>
  </purpose>

  <skill_definition>
    This skill translates approved design decisions into practical frontend implementation for Next.js and React stacks. It emphasizes tokenized styling, semantic components, and predictable architecture boundaries.
    When using this skill, the agent should use token and guideline contracts as implementation input and keep output compatible with runtime and accessibility checks used later in preflight.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/templates/design-token-contract.template.xml">Tokenized implementation target.</resource>
    <resource path="~/.config/opencode/templates/brand-guidelines.template.xml">Brand behavior and visual constraints.</resource>
    <resource path="~/.config/opencode/templates/visual-preflight-policy.template.xml">Accessibility and runtime acceptance checks.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan implementation decisions as token-first, accessibility-safe frontend architecture steps.</objective>
    <phase order="1">Choose architecture boundaries and component responsibilities.</phase>
    <phase order="2">Map design decisions into tokenized implementation primitives.</phase>
    <phase order="3">Apply accessibility and interaction semantics at component boundaries.</phase>
    <phase order="4">Return build-ready implementation sequence with known risks.</phase>
    <completion_signal>Implementation steps are aligned with tokens, accessibility, and runtime constraints.</completion_signal>
  </planning_language>

  <security>
    <rule>Validate untrusted input at boundaries.</rule>
    <rule>Avoid unsafe html injection patterns.</rule>
    <rule>Keep server-only values out of client components.</rule>
  </security>

  <defaults>
    <rule>Prefer server components and add client boundaries only when required.</rule>
    <rule>Use predictable state flow and controlled component APIs.</rule>
    <rule>Use tokenized theme variables instead of ad hoc literals.</rule>
    <rule>Preserve semantic roles, keyboard behavior, and focus management.</rule>
  </defaults>

  <design_system_integration>
    <rule>Prefer semantic tokens over direct color literals.</rule>
    <rule>Use OKLCH-capable token values for new color decisions.</rule>
    <rule>Align spacing, radius, and typography scales with project tokens.</rule>
  </design_system_integration>

  <outputs>
    <output>Architecture choice.</output>
    <output>Component and token strategy.</output>
    <output>Accessibility checks.</output>
    <output>Risk notes.</output>
    <output>Implementation steps.</output>
  </outputs>
</skill_contract>
