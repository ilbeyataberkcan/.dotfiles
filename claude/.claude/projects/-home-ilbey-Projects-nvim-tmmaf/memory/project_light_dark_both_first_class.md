---
name: project_light_dark_both_first_class
description: Both light and dark modes are first-class in the cve design system; never build mode-biased primitives
metadata: 
  node_type: memory
  type: project
  originSessionId: 2b34fa58-2e9f-4c0f-b947-d5b1587a3840
---

The tmmaf app ships **light-only**, and the cve-design-system historically leaned dark (since updated) — but neither history matters: **light and dark are equally first-class**. Package primitives must never assume or favor a mode. Drive all color/surface/scrim/contrast from theme tokens (they resolve per-mode); never hardcode a light- or dark-only value.

The "dark-media" drama (photo-well event/fighter cards, heroes) is a **scrim-over-image treatment** — mode-agnostic, holds under either app theme — NOT a dark-mode effect.

**Why:** the user flagged that an earlier "dark-dramatic" framing risked under-weighting light: "they both [are] first class citizens of the app."
**How to apply:** in specs/builds/reviews, require both-mode parity; demo at `cve-test-host` `/showcase` in light AND dark; run visual verify in both. Relates to [[feedback_fix_properly_system_wide]] (system-wide, not mode-biased).
