---
name: feedback-grep-utility-classes-workspace-wide
description: "Before retiring or renaming CSS variables that Tailwind exposes as utility classes, grep every `packages/**` and `apps/**` for the bare utility name — not just the package being patched"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: e8e5c5ea-4f72-451d-9329-bfbbf532024a
---

When changing `preset.css` (or any source that Tailwind v4 exposes as utility classes via its `@theme` reader), grep the entire monorepo for bare utility-class consumers before declaring a "migration deferred to host apps."

**Why:** Phase 20.2 retired `--color-accent` and `--color-success-*` / `--color-warning-*` / `--color-error-*` / `--color-info-*` while 160+ sibling-package source files still use `bg-accent`, `text-accent`, `ring-accent`, `border-accent`, `bg-success`, `text-error`, `bg-warning`, `text-warning`, `bg-error` Tailwind classes. The patch SUMMARY framed it as "host-side migration deferred" — but `packages/design-system/src/theme/ThemeToggle.tsx` (the same package!), `packages/components/`, `packages/admin/`, `packages/extensions/studio/`, and `packages/extensions/user-management/` are workspace-internal sibling packages, NOT host apps. Tests pass because they don't render against the real CSS variables. Effect: silent visual regression across the workspace the moment any sibling package rebuilds against the new preset.

**How to apply:**
Before declaring a CSS-variable rename "complete":
1. Identify every utility class Tailwind v4 derives from the variables you're touching. For `--color-accent-50..900`, that's `bg-accent-50`..`bg-accent-900`, `text-accent-50`..`text-accent-900`, plus the BARE forms `bg-accent`/`text-accent`/`ring-accent`/`border-accent` derived from any `--color-accent` (no suffix) declaration.
2. Run, from repo root: `rg "\b(bg|text|ring|border|from|to|hover:bg|hover:text|focus:bg|focus:text|focus-visible:ring|prose)-(accent|success|warning|error|info)(\s|/|\b)" packages/ apps/ --type tsx --type ts --type css`.
3. Every hit is a consumer that breaks if the variable is removed or renamed. List them in PLAN.md `files_modified` or add explicit bridging aliases in `preset.css` for backwards compat.
4. If keeping bridges: comment them with `/* TODO(<next-version>): remove after sibling-package migration */` and track in CHANGELOG.md.
5. If migrating in the same branch: include the sibling-package edits in `files_modified`. Tests still won't catch utility-class drift (they don't render against CSS) — visual smoke-test required.
6. Same discipline applies to `--color-success`, `--color-warning`, `--color-error`, `--color-info` semantic aliases.

**Trigger:** Any PR or quick task that edits `packages/design-system/src/preset.css`, removes/renames a `--color-*` variable, or restructures `ColorTokens` semantic-color keys. Memory item [[feedback-design-system-import-questionnaire]] flagged the design-system-import contract surface; this one flags the downstream consumer footprint.
