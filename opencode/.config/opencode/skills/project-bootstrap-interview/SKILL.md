---
name: project-bootstrap-interview
description: Run a progressive project bootstrap interview that captures setup, stack, naming, and design constraints.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: product-and-frontend-teams
  domain: project-initialization
---
<skill_contract id="project-bootstrap-interview" strict_order="true">
  <purpose>
    <item>Capture Business DNA first and continue through setup and design gates.</item>
    <item>Keep bootstrap in one sweep from interview to validation.</item>
  </purpose>

  <skill_definition>
    This skill handles the opening interview for bootstrap work. It captures business intent, source-of-truth context, and setup constraints in the right order so downstream design decisions are based on explicit user input.
    When using this skill, the agent should complete mandatory bootstrap gates before design synthesis. It should reference the flow tree for required leaves, write state progress continuously, and prepare a clean handoff payload for decision-tree execution.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/templates/design-flow-tree.template.xml">Bootstrap stage order and mandatory leaves.</resource>
    <resource path="~/.config/opencode/templates/design-flow-state.template.xml">Session progress and unresolved-node tracking.</resource>
    <resource path="~/.config/opencode/templates/project-bootstrap.template.xml">Project bootstrap payload structure.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan bootstrap as a staged interview that locks mandatory gates before synthesis.</objective>
    <phase order="1">Capture business DNA and project context with minimal assumptions.</phase>
    <phase order="2">Resolve references, authority, logo status, and live preview choice.</phase>
    <phase order="3">Record approvals and unresolved decisions into ledger/state.</phase>
    <phase order="4">Emit handoff context for decision-tree execution and preflight.</phase>
    <completion_signal>Bootstrap mandatory gates are resolved and handoff context is complete.</completion_signal>
  </planning_language>

  <mandatory_gates>
    <gate id="business-dna" required="true" blocking="true" />
    <gate id="references" required="true" blocking="true" />
    <gate id="logo-status" required="true" blocking="true" />
    <gate id="live-preview-choice" required="false" blocking="false" />
  </mandatory_gates>

  <flow_contract_sources>
    <tree_template>~/.config/opencode/templates/design-flow-tree.template.xml</tree_template>
    <state_template>~/.config/opencode/templates/design-flow-state.template.xml</state_template>
  </flow_contract_sources>

  <required_leaf_groups>
    <group>governance-and-control</group>
    <group>business-dna-references-logo</group>
  </required_leaf_groups>

  <interview_flow>
    <step order="1">Mission, audience, value model, and constraints.</step>
    <step order="2">Existing or new project context and goals.</step>
    <step order="3">Design source path: provided system or define now.</step>
    <step order="4">Assets: logo, brand docs, tokens, links, file paths.</step>
    <step order="5">Technical baseline only when implementation requires it.</step>
    <step order="6">Scope boundaries and compliance posture.</step>
  </interview_flow>

  <adaptive_rules>
    <rule>One question at a time.</rule>
    <rule>Skip already answered decisions.</rule>
    <rule>Add sub-branches when new downstream decisions appear.</rule>
    <rule>Use options as flow controls while keeping freeform answers enabled.</rule>
    <rule>Mark explicit high-impact answers as approved_by_answer.</rule>
  </adaptive_rules>

  <naming>
    <rule>Prefer concise kebab-case repo names.</rule>
    <rule>Package names must be npm-safe.</rule>
    <rule>Provide 2 to 3 ranked naming options with rationale.</rule>
  </naming>

  <security>
    <rule>Do not request or store secrets unless strictly required.</rule>
    <rule>Redact sensitive values in outputs.</rule>
    <rule>Flag risky architecture defaults.</rule>
  </security>

  <outputs>
    <output>Business DNA snapshot.</output>
    <output>Bootstrap snapshot.</output>
    <output>Decision ledger.</output>
    <output>Stack and setup decisions.</output>
    <output>Known constraints and assumptions.</output>
    <output>Missing inputs.</output>
  </outputs>
</skill_contract>
