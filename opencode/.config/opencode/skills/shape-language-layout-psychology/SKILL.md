---
name: shape-language-layout-psychology
description: Expert guidance for shape semantics, geometric placement, and page-level psychological signaling.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: ui-ux-designers
  domain: spatial-design
---
<skill_contract id="shape-language-layout-psychology">
  <purpose>
    <item>Design and audit shape language with usability-first constraints.</item>
    <item>Evaluate placement and geometry effects on clarity and action discoverability.</item>
  </purpose>

  <skill_definition>
    This skill guides shape and geometry decisions so interface structure communicates clearly without compromising usability. It treats symbolic meaning as directional and keeps interaction clarity as the primary goal.
    When using this skill, the agent should refer to brand constraints for allowed geometry style and use preflight policy to ensure shape choices do not reduce accessibility or action discoverability.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/templates/brand-guidelines.template.xml">Shape-family and forbidden-pattern constraints.</resource>
    <resource path="~/.config/opencode/templates/visual-preflight-policy.template.xml">Layout, grouping, and discoverability checks.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan shape and geometry decisions as usability-led constraints before aesthetic refinement.</objective>
    <phase order="1">Define dominant and accent shape families from approved brand context.</phase>
    <phase order="2">Audit geometry consistency and directional affordances.</phase>
    <phase order="3">Evaluate placement effects on focus path and action visibility.</phase>
    <phase order="4">Return fix plan with severity and implementation hints.</phase>
    <completion_signal>Shape language and placement decisions are coherent, accessible, and actionable.</completion_signal>
  </planning_language>

  <safety>
    <rule>Treat shape meaning as directional tendency, not deterministic truth.</rule>
    <rule>Do not rely on shape alone for critical feedback.</rule>
    <rule>Do not substitute symbolism for usability.</rule>
  </safety>

  <semantic_defaults>
    <shape type="rounded">approachability and continuity</shape>
    <shape type="rectangular">stability and reliability</shape>
    <shape type="angled">direction and urgency</shape>
    <rule>Use one dominant family with one accent family.</rule>
  </semantic_defaults>

  <layout_protocol>
    <step order="1">Define focus path: entry, action, confirmation.</step>
    <step order="2">Assign visual weight with size and negative space.</step>
    <step order="3">Tokenize spacing rhythm across breakpoints.</step>
    <step order="4">Ensure directional shapes point toward intended actions.</step>
    <step order="5">Audit corner radius consistency.</step>
  </layout_protocol>

  <outputs>
    <output>Shape language map.</output>
    <output>Geometry audit.</output>
    <output>Placement audit.</output>
    <output>Risk findings by severity.</output>
    <output>Fix plan.</output>
  </outputs>
</skill_contract>
