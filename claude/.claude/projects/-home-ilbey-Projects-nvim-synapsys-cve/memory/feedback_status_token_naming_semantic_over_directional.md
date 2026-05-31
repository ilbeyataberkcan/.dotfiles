---
name: feedback-status-token-naming-semantic-over-directional
description: "When designing a Tailwind utility class surface, never use direction-suffixed token keys (`fg`/`bg`/`left`/`right`) — they collide with the utility prefix's CSS meaning. Use semantic suffixes (`surface`, `subtle`) or step numbers (`-500`) instead."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: e8e5c5ea-4f72-451d-9329-bfbbf532024a
---

When a design-system token feeds into Tailwind v4's `@theme {}` block and produces utility class names, the suffix on the token key becomes part of the utility name. Direction-encoded suffixes like `fg`/`bg` collide with the utility's prefix semantics:

- `status.success.fg` → `bg-status-success-fg` = "set background to the foreground color of the success status" → semantic collision: `bg-` (CSS layer) carries one meaning, `-fg` (domain layer) carries another.
- `status.success.bg` → `bg-status-success-bg` = "set background to the background color of the success status" → tautological.

**Why this matters:** Tailwind utility class names are read left-to-right. The reader expects a coherent statement. Direction-encoded suffixes break that coherence; semantic suffixes preserve it.

**How to apply:**

- **For multi-step color ramps:** number the steps (`-50`, `-100`, ..., `-900`). Bare class (no suffix) aliases the 500 step.
- **For low-alpha backdrops:** name them `-surface` or `-subtle`. `bg-status-success-surface` = "set background to the surface tone of the success status" — coherent.
- **For paired emphasis:** name them by role (`-strong` / `-default` / `-subtle`), not by CSS layer.
- **Reserve `fg`/`bg` for the OBJECT shape, not the TOKEN shape.** If your code reads `token.fg` and `token.bg`, fine — those map to utility-friendly suffixes via the preset emitter, not directly through Tailwind's @theme reader.

**Origin:** Phase 20.2 originally shipped `ColorTokens.status = { fg, bg }` per slot, producing `bg-status-success-fg`. User caught it immediately: "What is bg-status-success-fg? It doesn't make sense." The fix (Revised Option C′) restored 10-step ramps + a `-surface` slot per status — Tailwind utility names became readable.

See also: [[project-cve-design-system-0-5-0-shape]] for the landed surface; [[feedback-grep-utility-classes-workspace-wide]] for the migration audit pattern; FINDINGS at `.planning/phases/20.2-cve-design-system-accents-v2/20.2-FINDINGS.md` P-D5.
