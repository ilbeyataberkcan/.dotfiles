---
name: feedback_no_hairline_outlines
description: Never use hairline / resting outlines anywhere unless the operator explicitly asks; separation is elevation only
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 2b34fa58-2e9f-4c0f-b947-d5b1587a3840
---

The operator HATES hairline outlines: "I hate those hairline outlines. Please don't use them anywhere ever, if I didn't specifically ask for." Agents keep reaching for `hairline` (a subtle resting border) as a separation device — STOP. This sharpens the standing rule: **separation = elevation (shade + shadow + radius + breathing room), NEVER a resting outline/hairline.** Outlines are STATE-only (hover/selected/focus).

**Why:** a resting hairline reads as encapsulation-by-outline, the exact anti-pattern of the design intent.
**How to apply:** never apply `Card variant="hairline"`, `data-cve-look~="hairline"`, `border-subtle`/`border-default` as a resting bound, or any default hairline — anywhere (packages, host blocks, the review tool's own chrome) unless explicitly requested. The `synapse-core-design-system` `audit-elevation` script must FLAG hairline usage (no longer allow it), and `references/hard-rules.md` encodes the ban. Relates to [[feedback_fix_properly_system_wide]].
