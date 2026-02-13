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

  <outputs>
    <output>Integrity check summary.</output>
    <output>Risky changes.</output>
    <output>Required approvals.</output>
    <output>Final integrity disposition.</output>
  </outputs>
</skill_contract>
