---
name: brand-dna-interviewer
description: Conduct a structured Brand DNA interview when brand documentation is missing or incomplete.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: product-marketing-and-design
  domain: brand-strategy
---
<skill_contract id="brand-dna-interviewer">
  <purpose>
    <item>Build Brand DNA from explicit user answers.</item>
    <item>Translate approved answers into actionable design constraints.</item>
  </purpose>

  <skill_definition>
    This skill builds the strategic brand core through a structured interview. It should never invent identity claims in guided mode; it converts explicit answers into reliable constraints the rest of the system can implement.
    When using this skill, the agent should resolve required Business DNA leaves first, keep suggestion traces tied to user answers, and emit structured outputs that can directly feed guideline synthesis.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/templates/design-flow-tree.template.xml">Required Business DNA leaf definitions.</resource>
    <resource path="~/.config/opencode/templates/design-flow-state.template.xml">Leaf status, answer traceability, and progress.</resource>
    <resource path="~/.config/opencode/templates/brand-dna.template.xml">Brand DNA output contract.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan Brand DNA resolution dimension-by-dimension with traceable approvals.</objective>
    <phase order="1">Prioritize unresolved high-impact DNA dimensions.</phase>
    <phase order="2">Ask one focused question and capture explicit interpretation.</phase>
    <phase order="3">Confirm and lock dimension status with source trace.</phase>
    <phase order="4">Emit downstream design implications tied to approved dimensions.</phase>
    <completion_signal>All required DNA leaves are approved or explicitly deferred.</completion_signal>
  </planning_language>

  <dimensions>
    <dimension order="1">Positioning and category context.</dimension>
    <dimension order="2">Audience and risk sensitivity.</dimension>
    <dimension order="3">Personality anchors and anti-traits.</dimension>
    <dimension order="4">Tone boundaries.</dimension>
    <dimension order="5">Visual archetype: color, shape, density, motion.</dimension>
    <dimension order="6">Trust signals and transparency expectations.</dimension>
    <dimension order="7">Accessibility posture and readability minimums.</dimension>
  </dimensions>

  <adaptive_branching dynamic="true">
    <rule>Add new branches when answers introduce high-impact topics.</rule>
    <rule>Do not close DNA while high-impact branches remain unresolved.</rule>
  </adaptive_branching>

  <required_leaves>
    <leaf>L_BDNA_MISSION_LOCKED</leaf>
    <leaf>L_BDNA_AUDIENCE_LOCKED</leaf>
    <leaf>L_BDNA_RISK_POSTURE_LOCKED</leaf>
    <leaf>L_BDNA_VALUE_MODEL_LOCKED</leaf>
    <leaf>L_BDNA_CONSTRAINTS_LOCKED</leaf>
    <leaf>L_BDNA_PROOF_STRATEGY_LOCKED</leaf>
    <leaf>L_BDNA_DIFFERENTIATION_LOCKED</leaf>
    <leaf>L_BDNA_SUCCESS_CRITERIA_LOCKED</leaf>
  </required_leaves>

  <interaction>
    <rule>Ask one concise question at a time.</rule>
    <rule>Tailor follow-up to prior answers.</rule>
    <rule>Allow freeform answers.</rule>
    <rule>Show short based-on trace for each suggestion.</rule>
  </interaction>

  <approval>
    <step order="1">Ask question.</step>
    <step order="2">Reflect interpretation and implications.</step>
    <step order="3">Confirm interpretation.</step>
    <step order="4">Record status in decision ledger.</step>
  </approval>

  <inference_policy>
    <guided_mode infer_core_truth="false" />
    <fast_mode provisional_hypothesis="allowed_with_immediate_confirmation" />
  </inference_policy>

  <outputs>
    <output>Interview recap.</output>
    <output>Brand DNA record.</output>
    <output>Decision ledger.</output>
    <output>Design implications.</output>
    <output>Open risks and unknowns.</output>
  </outputs>

  <refusals>
    <rule>Refuse manipulative dark-pattern recommendations.</rule>
    <rule>Refuse deterministic universal psychology claims.</rule>
  </refusals>
</skill_contract>
