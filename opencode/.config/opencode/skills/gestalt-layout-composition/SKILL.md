---
name: gestalt-layout-composition
description: Apply Gestalt perception principles to layout composition, grouping clarity, and responsive hierarchy.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: frontend-and-product-design
  domain: perception
---
<skill_contract id="gestalt-layout-composition">
  <purpose>
    <item>Audit grouping, scan flow, and hierarchy using Gestalt principles.</item>
    <item>Convert findings into concrete layout fixes.</item>
  </purpose>

  <skill_definition>
    This skill evaluates whether layout structure matches how people visually parse pages. It helps agents diagnose grouping, scan flow, and hierarchy issues and convert them into explicit composition corrections.
    When using this skill, the agent should use preflight policy as acceptance criteria and align corrections with brand and spacing constraints rather than treating layout as purely subjective styling.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/templates/visual-preflight-policy.template.xml">Gestalt and responsive grouping requirements.</resource>
    <resource path="~/.config/opencode/templates/brand-guidelines.template.xml">Composition and density limits defined by brand contract.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan layout audits as perception-first diagnostics with breakpoint-specific corrections.</objective>
    <phase order="1">Evaluate grouping and hierarchy using Gestalt principles.</phase>
    <phase order="2">Audit responsive behavior and CTA discoverability across breakpoints.</phase>
    <phase order="3">Prioritize defects by impact on comprehension and action flow.</phase>
    <phase order="4">Emit correction checklist and verification sequence.</phase>
    <completion_signal>Hierarchy corrections are defined with verification criteria per breakpoint.</completion_signal>
  </planning_language>

  <principles>
    <principle>proximity</principle>
    <principle>similarity</principle>
    <principle>common-region</principle>
    <principle>continuity</principle>
    <principle>figure-ground</principle>
    <principle>closure</principle>
    <principle>focal-point</principle>
  </principles>

  <responsive_checks>
    <rule>Re-evaluate grouping at each breakpoint.</rule>
    <rule>Keep CTA near explanatory copy after stacking.</rule>
    <rule>Keep heading-to-content spacing tighter than section-to-section spacing.</rule>
    <rule>Prevent secondary modules from hijacking primary flow.</rule>
  </responsive_checks>

  <rubric>
    <item>group-integrity</item>
    <item>scan-path-continuity</item>
    <item>action-discoverability</item>
    <item>noise-level</item>
    <item>accessibility-impact</item>
  </rubric>

  <outputs>
    <output>Gestalt diagnosis.</output>
    <output>Breakpoint-specific issues.</output>
    <output>Hierarchy corrections.</output>
    <output>Post-fix verification checklist.</output>
  </outputs>
</skill_contract>
