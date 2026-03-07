---
name: design-logic-integrity-guard
description: Ensure visual updates do not introduce unintended logic changes during design-focused implementation.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: design-implementation
  domain: change-safety
---
<skill_contract id="design-logic-integrity-guard" strict_order="true">
  <purpose>
    <item>Protect logic integrity during visual implementation sweeps.</item>
    <item>Block unintended logic drift unless explicitly approved.</item>
  </purpose>

  <skill_definition>
    This skill protects product logic while visual work is being applied. It detects when design changes accidentally cross into behavior, data, API, or permission domains and stops progression until that risk is addressed.
    When using this skill, the agent should classify file changes after each major apply bundle, request explicit approvals for exceptions, and map outcomes to integrity leaves.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/templates/visual-preflight-policy.template.xml">Logic-integrity gate requirements.</resource>
    <resource path="~/.config/opencode/templates/design-flow-state.template.xml">Integrity status and approved exception tracking.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan integrity checks as a protection boundary between visual updates and product logic.</objective>
    <phase order="1">Capture and classify changed files after each major design apply bundle.</phase>
    <phase order="2">Detect unexpected logic-sensitive changes and pause progression when found.</phase>
    <phase order="3">Collect explicit approvals and rationale for allowed exceptions.</phase>
    <phase order="4">Publish integrity disposition and required follow-up actions.</phase>
    <completion_signal>Logic integrity is pass or approved exception is documented with rationale.</completion_signal>
  </planning_language>

  <guard_protocol>
    <step order="1">Capture change set after each major apply bundle.</step>
    <step order="2">Classify files as visual-first or logic-sensitive.</step>
    <step order="3">If logic-sensitive changes are unexpected, block progression and request approval.</step>
    <step order="4">Require rationale for approved logic-adjacent edits.</step>
  </guard_protocol>

  <drift_checks>
    <check>Event handler behavior changes.</check>
    <check>Data flow and API contract changes.</check>
    <check>Auth, permission, or validation changes.</check>
    <check>Backend-affecting configuration changes.</check>
  </drift_checks>

  <leaf_mapping>
    <leaf on_pass="L_LOGIC_INTEGRITY_PASS" />
    <leaf on_approved_exception="L_LOGIC_EXCEPTION_APPROVED" />
  </leaf_mapping>

  <outputs>
    <output>Integrity check summary.</output>
    <output>Risky changes.</output>
    <output>Required approvals.</output>
    <output>Final integrity disposition.</output>
  </outputs>
</skill_contract>
