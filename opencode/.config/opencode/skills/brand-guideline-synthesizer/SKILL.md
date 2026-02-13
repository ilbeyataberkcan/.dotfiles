---
name: brand-guideline-synthesizer
description: Convert evidence and Brand DNA into enforceable guideline and token-ready outputs with accessibility gates.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: design-system-engineers
  domain: synthesis
---
<skill_contract id="brand-guideline-synthesizer" strict_order="true">
  <purpose>
    <item>Synthesize approved decisions into enforceable brand and implementation guidance.</item>
    <item>Keep every hard rule traceable to approved inputs.</item>
  </purpose>

  <inputs priority_order="true">
    <input order="1">Approved decision ledger.</input>
    <input order="2">Project-local brand docs and token files.</input>
    <input order="3">Normalized evidence with source authority.</input>
    <input order="4">Brand DNA output.</input>
    <input order="5">Frontend implementation constraints.</input>
  </inputs>

  <synthesis_flow>
    <step order="1">Build hard and soft constraint snapshot.</step>
    <step order="2">Build dynamic decision tree for unresolved categories.</step>
    <step order="3">Propose and approve branch options before lock.</step>
    <step order="4">Define color, type, shape, spacing, and motion intent.</step>
    <step order="5">Generate enforceable do and do-not rules.</step>
    <step order="6">Run WCAG hard gate and APCA advisory checks.</step>
    <step order="7">Run layout and brand consistency checks.</step>
    <step order="8">Verify non-canonical sources did not become hard constraints.</step>
  </synthesis_flow>

  <quality_gates>
    <gate id="wcag" required="true" blocking="true" />
    <gate id="branch-approvals" required="true" blocking="true" />
    <gate id="source-authority" required="true" blocking="true" />
  </quality_gates>

  <safety>
    <rule>Do not create mission, promise, or voice facts not explicitly provided or approved.</rule>
    <rule>If brand hard constraints conflict with accessibility, provide compliant alternatives.</rule>
  </safety>

  <outputs>
    <output>Guideline package.</output>
    <output>Design token direction.</output>
    <output>Compliance matrix.</output>
    <output>Conflict report.</output>
    <output>Go or no-go disposition.</output>
  </outputs>
</skill_contract>
