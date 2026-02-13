---
name: guided-interview-protocol
description: Enforce adaptive, one-question-at-a-time interview behavior with explicit decision tracking.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: orchestration-agents
  domain: interaction-governance
---
<skill_contract id="guided-interview-protocol">
  <purpose>
    <item>Enforce strict interview method with flexible answers.</item>
    <item>Prevent autopilot synthesis before approved decisions exist.</item>
  </purpose>

  <interaction required="true">
    <rule>Ask one concise question at a time.</rule>
    <rule>Use question tool prompts for high-impact gates.</rule>
    <rule>Allow freeform responses for content decisions.</rule>
    <rule>Tailor each next question to prior answers.</rule>
    <rule>Skip already answered high-impact questions.</rule>
  </interaction>

  <decision_tree dynamic="true">
    <rule>Expand sub-branches when answers create downstream decisions.</rule>
    <rule>Resolve high-impact leaves before low-impact refinements.</rule>
    <status_values>
      <value>approved_by_answer</value>
      <value>approved_by_gate</value>
      <value>needs_clarification</value>
      <value>deferred</value>
    </status_values>
  </decision_tree>

  <inspection_checkpoint>
    <option order="1">Looks good, continue</option>
    <option order="2">Refine this direction</option>
    <option order="3">Change direction</option>
  </inspection_checkpoint>

  <approval_policy>
    <rule>Do not apply branch decisions when status is needs_clarification.</rule>
    <rule>approved_by_answer counts as approval and should not be re-gated.</rule>
  </approval_policy>

  <inference_policy>
    <rule>In guided mode, never infer mission, promise, voice, or personality.</rule>
    <rule>Suggestions are allowed only when traceable to user answers.</rule>
  </inference_policy>

  <outputs>
    <output>Question asked and rationale.</output>
    <output>Captured answer.</output>
    <output>Decision status update.</output>
    <output>Next unresolved branch question.</output>
  </outputs>
</skill_contract>
