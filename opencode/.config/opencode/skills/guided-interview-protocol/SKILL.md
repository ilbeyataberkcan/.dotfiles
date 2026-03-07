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

  <skill_definition>
    This skill is the interaction backbone for guided sessions. It ensures the agent asks one focused question at a time, keeps the user in control, and avoids silent assumption jumps while decisions are still unresolved.
    When using this skill, the agent should treat the flow tree as the source of required decision nodes and the flow state as the source of progress. It should always update decision status and source trace after each answer before moving to the next node.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/templates/design-flow-tree.template.xml">Required stage and leaf structure.</resource>
    <resource path="~/.config/opencode/templates/design-flow-state.template.xml">Mutable runtime status, checkpoints, and approvals.</resource>
  </resource_references>

  <planning_language>
    <objective>Run interviews as a deterministic planning loop with explicit state transitions.</objective>
    <phase order="1">Identify missing high-impact facts and mark explicit answers as approved_by_answer.</phase>
    <phase order="2">Select the highest-impact unresolved leaf and form one focused question.</phase>
    <phase order="3">Confirm interpretation, update status, and persist source trace.</phase>
    <phase order="4">Hand off the next unresolved branch to orchestration.</phase>
    <completion_signal>Required interview leaves are approved or deferred with rationale.</completion_signal>
  </planning_language>

  <interaction required="true">
    <rule>Ask one concise question at a time.</rule>
    <rule>Use question tool prompts for high-impact gates.</rule>
    <rule>Allow freeform responses for content decisions.</rule>
    <rule>Tailor each next question to prior answers.</rule>
    <rule>Skip already answered high-impact questions.</rule>
  </interaction>

  <flow_contract_sources>
    <tree_template>~/.config/opencode/templates/design-flow-tree.template.xml</tree_template>
    <state_template>~/.config/opencode/templates/design-flow-state.template.xml</state_template>
  </flow_contract_sources>

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

  <leaf_selection>
    <rule>Select unresolved high-impact leaves first.</rule>
    <rule>If blocked_by dependencies exist, resolve blockers first.</rule>
    <rule>When a new high-impact topic appears, generate dynamic leaves and continue.</rule>
  </leaf_selection>

  <inspection_checkpoint>
    <option order="1">Looks good, continue</option>
    <option order="2">Refine this direction</option>
    <option order="3">Change direction</option>
  </inspection_checkpoint>

  <approval_policy>
    <rule>Do not apply branch decisions when status is needs_clarification.</rule>
    <rule>approved_by_answer counts as approval and should not be re-gated.</rule>
    <rule>Record source trace for every approved leaf.</rule>
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
