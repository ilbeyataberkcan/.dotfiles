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

  <apply_loop>
    <step order="1">Propose options tied to prior answers.</step>
    <step order="2">Collect approval.</step>
    <step order="3">Apply approved branch bundle.</step>
    <step order="4">Run inspection checkpoint.</step>
  </apply_loop>

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
