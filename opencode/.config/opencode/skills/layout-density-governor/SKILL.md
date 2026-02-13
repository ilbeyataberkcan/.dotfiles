---
name: layout-density-governor
description: Lock baseline width, side padding, and spacing rhythm with explicit approval before implementation.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: frontend-design-iteration
  domain: layout-density
---
<skill_contract id="layout-density-governor" strict_order="true">
  <purpose>
    <item>Prevent over-wide layouts and excessive side padding by requiring explicit density approvals.</item>
    <item>Set predictable baseline spacing before visual implementation starts.</item>
  </purpose>

  <skill_definition>
    This skill governs spatial density so content width and side gutters are deliberate and approved. It is designed to stop generic wide-canvas defaults that reduce focus and make pages feel overly padded.
    When using this skill, the agent should lock a baseline density profile early, apply it consistently across sections, and only deviate with explicit user approval.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/templates/design-flow-tree.template.xml">Density-related leaves and decision dependencies.</resource>
    <resource path="~/.config/opencode/templates/design-flow-state.template.xml">Density approvals and checkpoint history.</resource>
    <resource path="~/.config/opencode/templates/visual-preflight-policy.template.xml">Layout and composition quality gates.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan density as a first-class decision before implementation.</objective>
    <phase order="1">Propose baseline width and side-padding profile.</phase>
    <phase order="2">Propose section and component spacing rhythm profile.</phase>
    <phase order="3">Collect explicit approval and record decision status.</phase>
    <phase order="4">Enforce approved density profile during implementation and preflight.</phase>
    <completion_signal>Width, side-padding, and spacing rhythm are approved and applied consistently.</completion_signal>
  </planning_language>

  <default_density_profile>
    <max_width>max-w-[1200px]</max_width>
    <side_padding>px-4 sm:px-5 md:px-6 lg:px-6</side_padding>
    <section_spacing>space-y-14</section_spacing>
  </default_density_profile>

  <questionnaire_execution>
    <rule>Use question tool prompts when available.</rule>
    <rule>If question tool is unavailable, use structured prompt fallback with explicit approval capture.</rule>
  </questionnaire_execution>

  <policy>
    <rule>Do not increase baseline width or side padding without explicit user approval.</rule>
    <rule>Apply approved density consistently across responsive breakpoints.</rule>
    <rule>Keep implementation Tailwind-first and avoid large bespoke global spacing overrides.</rule>
  </policy>

  <outputs>
    <output>Approved density profile.</output>
    <output>Spacing contract by section and component level.</output>
    <output>Implementation constraints for layout work.</output>
  </outputs>
</skill_contract>
