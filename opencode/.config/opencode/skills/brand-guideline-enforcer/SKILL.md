---
name: brand-guideline-enforcer
description: Enforce project brand constraints while proposing safe, accessible alternatives that preserve identity.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: multi-disciplinary-product-teams
  domain: governance
---
<skill_contract id="brand-guideline-enforcer" strict_order="true">
  <purpose>
    <item>Enforce declared brand constraints and token contracts.</item>
    <item>Reject design drift and provide compliant alternatives when conflicts exist.</item>
  </purpose>

  <skill_definition>
    This skill is the governance layer that decides whether proposed design output is actually on-brand. It compares output against declared constraints and forces explicit handling of conflicts instead of silent drift.
    When using this skill, the agent should read project-local brand and token sources first, apply precedence rules, and emit a compliance matrix that can be audited by the rest of the pipeline.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/templates/brand-guidelines.template.xml">Primary brand constraints and implementation policy.</resource>
    <resource path="~/.config/opencode/templates/design-token-contract.template.xml">Token contract alignment checks.</resource>
    <resource path="~/.config/opencode/templates/visual-preflight-policy.template.xml">Acceptance gates for final compliance disposition.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan governance as deterministic compliance evaluation against ordered constraint sources.</objective>
    <phase order="1">Resolve active constraint source precedence.</phase>
    <phase order="2">Evaluate proposal against hard and soft constraints.</phase>
    <phase order="3">Classify compliance outcomes and generate correction paths.</phase>
    <phase order="4">Publish compliance matrix with explicit approval boundaries.</phase>
    <completion_signal>All evaluated items are classified with corrective action for non-compliant outcomes.</completion_signal>
  </planning_language>

  <precedence>
    <source order="1">Project-local brand and design docs.</source>
    <source order="2">Project-local design system and token files.</source>
    <source order="3">Organization defaults.</source>
    <source order="4">Global fallback templates.</source>
  </precedence>

  <hard_rules>
    <rule>Do not silently violate declared hard brand constraints.</rule>
    <rule>When accessibility conflicts with brand, provide accessible alternatives that preserve identity.</rule>
    <rule>Keep typography, spacing, radius, and motion aligned to standards.</rule>
  </hard_rules>

  <safety>
    <rule>Block deceptive CTA styling and hidden tracking patterns.</rule>
    <rule>Do not include secrets or internal-only identifiers in deliverables.</rule>
  </safety>

  <compliance_flow>
    <step order="1">Extract constraints from docs and tokens.</step>
    <step order="2">Compare output against constraints.</step>
    <step order="3">Mark each item compliant, partial, or non-compliant.</step>
    <step order="4">Provide correction plan for partial and non-compliant items.</step>
  </compliance_flow>

  <outputs>
    <output>Constraint snapshot.</output>
    <output>Compliance matrix.</output>
    <output>Conflict report.</output>
    <output>Approved alternatives.</output>
  </outputs>
</skill_contract>
