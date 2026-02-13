---
name: logo-intake-and-prompt-pack
description: Resolve logo availability and generate AI-ready logo brief or prompt packs when logos are missing.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: brand-and-frontend-teams
  domain: logo-workflow
---
<skill_contract id="logo-intake-and-prompt-pack">
  <purpose>
    <item>Make logo handling mandatory before visual synthesis.</item>
    <item>Collect provided logo constraints or generate a practical no-logo path.</item>
  </purpose>

  <skill_definition>
    This skill resolves logo readiness so the design system does not move forward with hidden identity gaps. It supports provided assets, guided logo direction, or explicit defer-with-risk behavior.
    When using this skill, the agent should treat logo status as a hard gate, write the resolved path into state, and provide concrete next resources when logos are missing.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/templates/brand-evidence-bundle.template.xml">Logo capture and authority context fields.</resource>
    <resource path="~/.config/opencode/templates/brand-guidelines.template.xml">Identity constraints affected by logo decisions.</resource>
    <resource path="~/.config/opencode/templates/design-flow-state.template.xml">Mandatory logo gate status tracking.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan logo readiness as a mandatory branch before visual implementation.</objective>
    <phase order="1">Determine logo status with one required gate.</phase>
    <phase order="2">If provided, collect constraints and usage readiness.</phase>
    <phase order="3">If missing, build brief and prompt pack with evaluation rubric.</phase>
    <phase order="4">If deferred, register explicit risk and blocked downstream items.</phase>
    <completion_signal>Logo branch is resolved as provided, generated-direction, or deferred-with-risk.</completion_signal>
  </planning_language>

  <gate id="logo-status" tool="question" required="true" blocking="true">
    <option order="1">Logo provided</option>
    <option order="2">Define logo direction now</option>
    <option order="3">Defer logo for now</option>
  </gate>

  <provided_logo_flow>
    <step order="1">Collect file paths and formats.</step>
    <step order="2">Capture lockup variants.</step>
    <step order="3">Capture clear-space and minimum size constraints if known.</step>
    <step order="4">Capture misuse restrictions.</step>
  </provided_logo_flow>

  <no_logo_flow>
    <step order="1">Build logo brief from approved Business DNA.</step>
    <step order="2">Generate symbol-first, wordmark-first, and monogram prompt packs.</step>
    <step order="3">Provide negative prompts to avoid off-brand outputs.</step>
    <step order="4">Provide evaluation rubric for selection.</step>
  </no_logo_flow>

  <defer_policy>
    <rule>If deferred, record explicit design risk and blocked follow-up items.</rule>
  </defer_policy>

  <outputs>
    <output>Logo status and captured constraints.</output>
    <output>Prompt pack when needed.</output>
    <output>Selection rubric.</output>
    <output>Risk note for deferred logo.</output>
  </outputs>
</skill_contract>
