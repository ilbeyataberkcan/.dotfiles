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
