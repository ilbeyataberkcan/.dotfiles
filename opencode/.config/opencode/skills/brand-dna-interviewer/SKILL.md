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
