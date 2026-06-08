---
name: project_ramp_5010_both_modes
description: Accent + status ramp 50/100 steps must be toned down in BOTH light and dark; only the NEUTRAL ramp keeps its bright 50/100 (needed for text)
metadata: 
  node_type: memory
  type: project
  originSessionId: 2b34fa58-2e9f-4c0f-b947-d5b1587a3840
---

The **50 and 100 steps** (lightest tints) of the **accent + status** color ramps read too near-white and must be **pulled down (capped lightness, ~0.85 / 0.78) in BOTH light AND dark modes** — the ramps are mode-shared, so apply the cap at the RAMP level (generateAccents / generateStatusRamp), not via a dark-only branch of generateModePair. The **ONLY** ramp left untouched is the **NEUTRAL** ramp (its bright 50/100 are needed for text).

**Why:** operator correction — "The color ramps' 50 and 100 tokens should be fixed in both light and dark mode. Not just dark mode. Only color ramp it shouldn't touch is the neutral colors." (I first instructed a dark-only ceiling and was corrected.)

**How to apply:** when adjusting ramp 50/100 brightness in `oklch.ts`, cap at the ramp level so both modes get it; never touch the neutral ramp. Relates to [[project_light_dark_both_first_class]].
