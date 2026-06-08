---
name: feedback_host_custom_css_allowed
description: "Host app may use custom CSS classes when Tailwind can't express a design; packages stay Tailwind + escape-hatch"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 2b34fa58-2e9f-4c0f-b947-d5b1587a3840
---

The "compose Tailwind, no new CSS classes" rule is a PACKAGE constraint. The HOST app (tmmaf) MAY add custom CSS classes when Tailwind utilities cannot express a design the operator provided.

**Why:** operator: "if the current tailwind classes is not enough to express a design I provided to you, you can use custom css classes in the host application to achieve that design."
**How to apply:** keep package primitives generic / Tailwind / token-driven (+ the `[data-cve-look]` escape-hatch as the only sanctioned package CSS); when a host needs a look Tailwind can't reach, host-side custom CSS is allowed (host-owned, like locale/brand policy). Don't contort a package to avoid it. Relates to [[feedback_fix_properly_system_wide]].
