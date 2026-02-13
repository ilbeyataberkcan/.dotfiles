---
name: color-psychology-context
description: Evidence-aware color psychology guidance with cultural context, uncertainty handling, and ethical constraints.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: product-designers
  domain: behavioral-design
---
<skill_contract id="color-psychology-context">
  <purpose>
    <item>Map product goals to color hypotheses without pseudo certainty.</item>
    <item>Keep claims contextual and ethically safe.</item>
  </purpose>

  <skill_definition>
    This skill helps agents reason about color psychology without overclaiming certainty. It frames emotional intent as testable hypotheses with explicit caveats and avoids manipulative patterns.
    When using this skill, the agent should ground recommendations in approved brand context, pair claims with confidence and validation guidance, and keep accessibility safeguards visible in the final recommendation.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/templates/brand-guidelines.template.xml">Brand personality and voice boundaries that influence psychological interpretation.</resource>
    <resource path="~/.config/opencode/templates/visual-preflight-policy.template.xml">Accessibility and ethical guardrails for color usage.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan psychology guidance as hypothesis-driven support, not deterministic doctrine.</objective>
    <phase order="1">Define intent and audience context for psychological hypotheses.</phase>
    <phase order="2">Generate bounded candidate directions with confidence labels.</phase>
    <phase order="3">Attach caveats, counterexample risks, and validation approach.</phase>
    <phase order="4">Recommend a decision path with ethical and accessibility safeguards.</phase>
    <completion_signal>Recommendation includes confidence, caveats, and validation method.</completion_signal>
  </planning_language>

  <safety>
    <rule>Never frame color psychology as universal fact.</rule>
    <rule>Require non-color cues for critical states.</rule>
    <rule>Avoid fear, urgency, or anxiety manipulation patterns.</rule>
  </safety>

  <evidence_structure>
    <field>claim</field>
    <field>context</field>
    <field>confidence</field>
    <field>counterexample-risk</field>
    <field>validation-method</field>
  </evidence_structure>

  <workflow>
    <step order="1">Define target outcome.</step>
    <step order="2">Generate 2 to 3 candidate palettes.</step>
    <step order="3">Run accessibility checks.</step>
    <step order="4">Propose validation plan and metrics.</step>
    <step order="5">Prepare fallback options for cultural variance.</step>
  </workflow>

  <outputs>
    <output>Goal-to-color hypotheses.</output>
    <output>Cultural and audience caveats.</output>
    <output>Accessibility safeguards.</output>
    <output>Validation plan.</output>
    <output>Decision recommendation.</output>
  </outputs>
</skill_contract>
