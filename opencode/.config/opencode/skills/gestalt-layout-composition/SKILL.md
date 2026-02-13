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
