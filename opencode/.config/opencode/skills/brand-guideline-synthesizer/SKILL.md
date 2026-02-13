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

  <skill_definition>
    This skill transforms approved interview decisions and vetted evidence into practical brand rules, token direction, and implementation constraints. It is the point where strategy becomes enforceable design guidance.
    When using this skill, the agent should only consume approved decisions, reject non-canonical hard constraints, and run all required quality gates before publishing a go/no-go disposition.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/templates/brand-guidelines.template.xml">Target guideline structure and policy output shape.</resource>
    <resource path="~/.config/opencode/templates/design-token-contract.template.xml">Token-direction compatibility target.</resource>
    <resource path="~/.config/opencode/templates/visual-preflight-policy.template.xml">Required quality and runtime gates.</resource>
    <resource path="~/.config/opencode/templates/design-flow-state.template.xml">Approval and high-impact leaf completion status.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan synthesis as a constraints-first conversion from approved decisions to enforceable guidelines.</objective>
    <phase order="1">Assemble inputs in strict priority and reject missing required approvals.</phase>
    <phase order="2">Resolve remaining branch decisions before generating hard guidance.</phase>
    <phase order="3">Run accessibility, authority, and consistency gates.</phase>
    <phase order="4">Emit guideline package with conflict handling and disposition.</phase>
    <completion_signal>Guideline package and compliance disposition are published without unresolved blocking gates.</completion_signal>
  </planning_language>

  <inputs priority_order="true">
    <input order="1">Approved decision ledger.</input>
    <input order="2">Project-local brand docs and token files.</input>
    <input order="3">Normalized evidence with source authority.</input>
    <input order="4">Brand DNA output.</input>
    <input order="5">Frontend implementation constraints.</input>
  </inputs>

  <flow_contract_sources>
    <tree_template>~/.config/opencode/templates/design-flow-tree.template.xml</tree_template>
    <state_template>~/.config/opencode/templates/design-flow-state.template.xml</state_template>
  </flow_contract_sources>

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
    <gate id="high-impact-leaves-complete" required="true" blocking="true">Requires L_TREE_HIGH_IMPACT_COMPLETE.</gate>
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
