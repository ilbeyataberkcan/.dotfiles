---
name: tokens-before-custom-css
description: Sub-agents must use design-system tokens/utilities first; a custom CSS class only when the approved design cannot be expressed with them
metadata:
  type: feedback
---

When instructing implementation agents on UI work, tell them explicitly: use the
design-system tokens and utilities (`--radius-*`, `--space`, `shadow-*`, OKLCH ramps
from `app/theme.generated.css`, Tailwind utilities) before writing any CSS class.
A custom class is the last resort, only when the approved design genuinely needs it.

**Why:** Agents default to inventing ad-hoc classes with magic values, which drifts
from the design system and duplicates what tokens already express. The user asked for
this rule on 2026-09-05 during the mat-screen redesign orchestration.

**How to apply:** Put the rule in every agent prompt for UI tasks, and check for
"classes out of the blue" during review. Related: [[host-custom-css-allowed]],
[[no-hairline-outlines]].
