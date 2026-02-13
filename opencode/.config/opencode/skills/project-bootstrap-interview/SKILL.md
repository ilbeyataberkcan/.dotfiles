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

  <mandatory_gates>
    <gate id="business-dna" required="true" blocking="true" />
    <gate id="references" required="true" blocking="true" />
    <gate id="logo-status" required="true" blocking="true" />
    <gate id="live-preview-choice" required="false" blocking="false" />
  </mandatory_gates>

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
