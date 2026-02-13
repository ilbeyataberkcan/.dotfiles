---
name: design-decision-tree-orchestration
description: Build and execute a dynamic design decision tree with proposal, approval, apply, and inspection checkpoints.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: design-orchestration
  domain: decision-tree
---
<skill_contract id="design-decision-tree-orchestration" dynamic="true">
  <purpose>
    <item>Build a decision tree from approved Business DNA and constraints.</item>
    <item>Expand any category or sub-category introduced by user decisions.</item>
  </purpose>

  <skill_definition>
    This skill executes the core design engine. It chooses the next unresolved decision, proposes options, collects approval, applies the change, and drives the inspection loop until high-impact branches are complete.
    When using this skill, the agent should read structural rules from the flow tree, mutate only runtime state fields, and honor dependency blockers before advancing to low-impact refinements.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/templates/design-flow-tree.template.xml">Authoritative branch and leaf topology.</resource>
    <resource path="~/.config/opencode/templates/design-flow-state.template.xml">Queue, statuses, checkpoint history, and dependency blockers.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan design execution as a dynamic tree that resolves high-impact leaves first.</objective>
    <phase order="1">Build or resume tree and queue unresolved leaves by impact and dependencies.</phase>
    <phase order="2">Run propose-and-approve cycle for the active branch.</phase>
    <phase order="3">Apply approved branch bundle and run inspection checkpoint routing.</phase>
    <phase order="4">Persist node status updates and advance to next unresolved branch.</phase>
    <completion_signal>All high-impact leaves are approved or explicitly deferred with rationale.</completion_signal>
  </planning_language>

  <linear_presentation>
    <rule>Expose flow as linear numbered steps to users.</rule>
    <rule>Keep branch and leaf complexity internal to orchestration/state.</rule>
  </linear_presentation>

  <tree_protocol>
    <step order="1">Create root nodes from approved context.</step>
    <step order="2">Expand dependent sub-branches.</step>
    <step order="3">Track status per node.</step>
    <statuses>
      <status>approved_by_answer</status>
      <status>approved_by_gate</status>
      <status>needs_clarification</status>
      <status>deferred</status>
    </statuses>
  </tree_protocol>

  <flow_contract_sources>
    <tree_template>~/.config/opencode/templates/design-flow-tree.template.xml</tree_template>
    <state_template>~/.config/opencode/templates/design-flow-state.template.xml</state_template>
  </flow_contract_sources>

  <tree_execution>
    <rule>Initialize tree from structure template when state is absent.</rule>
    <rule>Persist every node update into state after each question or apply step.</rule>
    <rule>Keep queue sorted by impact and dependency readiness.</rule>
    <rule>Never lock a node from agent judgment alone; lock only after explicit user approval or explicit user answer.</rule>
  </tree_execution>

  <apply_loop>
    <step order="1">Propose options tied to prior answers.</step>
    <step order="2">Collect approval.</step>
    <step order="3">Apply approved branch bundle.</step>
    <step order="4">Run inspection checkpoint.</step>
  </apply_loop>

  <questionnaire_execution>
    <rule>Use question tool interactions when available.</rule>
    <rule>If question tool is unavailable, use structured prompt fallback and require explicit confirmation.</rule>
    <rule>If confirmation is unclear, keep node status as needs_clarification.</rule>
  </questionnaire_execution>

  <approval_policy>
    <rule>Recommendations are allowed; autonomous decision locking is not allowed.</rule>
    <rule>Node status may become approved_by_answer only when user directly answered that decision.</rule>
    <rule>Node status may become approved_by_gate only when user explicitly approved a proposed option.</rule>
  </approval_policy>

  <checkpoint_routing>
    <route response="Looks good, continue">Advance to next unresolved leaf.</route>
    <route response="Refine this direction">Stay in branch and run focused follow-up.</route>
    <route response="Change direction">Re-open branch options and replace pending proposal.</route>
  </checkpoint_routing>

  <inspection_checkpoint>
    <option order="1">Looks good, continue</option>
    <option order="2">Refine this direction</option>
    <option order="3">Change direction</option>
  </inspection_checkpoint>

  <outputs>
    <output>Decision tree.</output>
    <output>Applied branch bundle.</output>
    <output>Checkpoint response.</output>
    <output>Next unresolved branch.</output>
  </outputs>
</skill_contract>
