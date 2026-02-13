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
