---
name: gestalt-layout-composition
description: Apply Gestalt perception principles to layout composition, grouping clarity, and responsive hierarchy.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: frontend-and-product-design
  domain: perception
---

## What I do
- Audit layout quality with Gestalt principles.
- Convert perception principles into actionable UI fixes.
- Prevent grouping errors that cause missed actions and scanning failure.

## Core principles for implementation
- Proximity: related items are closer than unrelated items.
- Similarity: consistent style indicates relationship.
- Common region: containers define explicit grouping.
- Continuity: alignment guides scan flow.
- Figure-ground: critical content stands out from background.
- Closure: avoid forcing users to infer too much from broken structures.
- Focal point: one dominant focal anchor per section.

## Responsive safety checks
- Re-evaluate grouping at each breakpoint; proximity shifts can break semantics.
- Verify CTA remains near explanatory copy after stacking.
- Keep heading-to-content spacing tighter than section-to-section spacing.
- Ensure banners and side modules do not hijack primary flow.

## Audit rubric
1. Group integrity (clear or ambiguous)
2. Scan path continuity (strong or broken)
3. Action discoverability (high or low)
4. Noise level (controlled or cluttered)
5. Accessibility impact (safe or risky)

## Output format
1. `Gestalt diagnosis`
2. `Breakpoint-specific issues`
3. `Hierarchy corrections`
4. `Post-fix verification checklist`
