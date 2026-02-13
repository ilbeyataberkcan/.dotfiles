---
name: inspiration-decomposition
description: Break inspiration sources into keep, adapt, and avoid signals and map them to explicit design decisions.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: design-orchestration
  domain: reference-analysis
---
<skill_contract id="inspiration-decomposition" strict_order="true">
  <purpose>
    <item>Convert inspiration links into concrete, reviewable decision inputs.</item>
    <item>Prevent accidental copying and reduce vague inspiration handling.</item>
  </purpose>

  <skill_definition>
    This skill turns inspiration references into explicit guidance by capturing exactly what the user likes, dislikes, and wants to avoid. It ensures inspiration influences decisions intentionally instead of becoming a vague mood board.
    When using this skill, the agent should process each reference one by one, map findings to design categories, and ask for explicit confirmation before those findings influence implementation.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/templates/brand-evidence-bundle.template.xml">Reference authority and evidence storage.</resource>
    <resource path="~/.config/opencode/templates/design-flow-tree.template.xml">Reference and decision leaves.</resource>
    <resource path="~/.config/opencode/templates/design-flow-state.template.xml">Approval state and traceability.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan inspiration intake as explicit preference extraction with downstream decision mapping.</objective>
    <phase order="1">For each inspiration source, collect three liked elements.</phase>
    <phase order="2">Collect two disliked elements and one must-avoid pattern.</phase>
    <phase order="3">Map each item to design categories (color, spacing, typography, composition, motion).</phase>
    <phase order="4">Confirm mapping and write approved signals to state/evidence.</phase>
    <completion_signal>Each inspiration source has approved keep, adapt, and avoid signals mapped to design decisions.</completion_signal>
  </planning_language>

  <questionnaire_execution>
    <rule>Use question tool prompts when available.</rule>
    <rule>If question tool is unavailable, use structured prompt fallback with explicit confirmation.</rule>
  </questionnaire_execution>

  <safety_policy>
    <rule>Treat inspiration as suggestion-only until explicitly approved.</rule>
    <rule>Do not copy protected brand assets or signature motifs verbatim.</rule>
    <rule>Never elevate inferred preferences into locked decisions without explicit user confirmation.</rule>
  </safety_policy>

  <outputs>
    <output>Inspiration preference matrix.</output>
    <output>Keep/adapt/avoid mapping by category.</output>
    <output>Approved signals ready for decision-tree execution.</output>
  </outputs>
</skill_contract>
