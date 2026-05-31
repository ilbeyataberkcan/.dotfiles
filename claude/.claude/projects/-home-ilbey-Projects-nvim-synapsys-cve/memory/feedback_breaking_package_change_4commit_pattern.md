---
name: feedback-breaking-package-change-4commit-pattern
description: "For breaking utility-class / token surface changes in a workspace package, use the 4-commit hybrid (shape → bridges → migrate → remove bridges) for safe in-monorepo migration with atomic rollback per step."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: e8e5c5ea-4f72-451d-9329-bfbbf532024a
---

When a package change retires/renames a public surface that downstream consumers rely on (Tailwind utility classes, exported function names, CSS variables, etc.), and ≥1 workspace-internal consumer uses the surface, ship the breaking change in this sequence:

**Commit 1 — Shape change in the package itself**

- Update types, runtime helpers, generators, internal tests.
- Bump version (minor or major per semver).
- Update the package's OWN consumers (e.g., the package's own `ThemeToggle.tsx` if it uses the affected utility classes).
- Workspace-wide `typecheck` / `test` / `lint` must pass against this commit AS LONG AS bridge aliases are still present at the consumer-facing boundary (preset.css, exported function aliases). If passing requires the bridges, that's expected — proceed to Commit 2.

**Commit 2 — Bridge aliases at the consumer-facing boundary**

- `--color-old-name: var(--color-new-name)` in CSS, or `export const oldName = newName` in TS, or per the appropriate adapter shape.
- Workspace builds clean against BOTH old AND new utility names / function names. This is the safety net — if Commits 3 or 4 hit problems, the rollback target is "Commit 2 with bridges in place," which is a publishable, working state.

**Commit 3 — Script-driven migration**

- Audit consumers via `rg` with PCRE constraints (lookbehind/lookahead) — emit a manifest of every match.
- Apply rewrite via `perl -i -pe` (handles PCRE properly + in-place edit). One pass per transformation class (don't combine accent + status renames in one regex).
- Per-pass workspace gate: `typecheck` + `test` + `lint`. Sanity grep to confirm zero stragglers outside legitimate bridge-comment contexts.
- Manifest recorded for review.

**Commit 4 — Remove bridges**

- Drop the alias commits added in Commit 2.
- Workspace `typecheck` + `test` + `lint` must STILL pass. If green, the migration is provably complete — no consumer needed the legacy alias.
- If gates fail at this step, Commit 2 saved you: `git revert HEAD` returns to the bridges-in-place safe state.

**Why 4 commits not 1:**

- Atomic rollback per step. Commit 1 ships even if 2/3/4 stall.
- Bridges are inspectable. Code review sees "bridges added" + "migration script applied" + "bridges removed" as three distinct review surfaces.
- The bridge-removal commit IS the proof of completion.

**Where this pattern works:**

- Tailwind utility class renames (`bg-accent` → `bg-accent-primary`).
- CSS variable renames (`--color-success-500` → `--color-status-success-500`).
- Exported TS function/type renames (with `@deprecated` jsdoc + alias re-export as the bridge).
- Public API parameter renames (with positional / overloaded acceptance as the bridge).

**Where this pattern is overkill:**

- Internal-only changes (no consumers outside the package).
- Strictly additive changes (no retirement of old surface).
- Tiny surfaces where the bridge cost dominates the migration cost.

**Origin:** Phase 20.2 shipped the cve-design-system 0.5.0 accent rename + status reshape this way. 4-commit chain `297a5ac → b11a1f7 → 1d48a24 → d511bf8` plus a 5th commit `a47ac93` for the REVIEW.md warning closures. 63 sibling-package source files rewritten with zero workspace breakage at any commit in the chain.

See FINDINGS at `.planning/phases/20.2-cve-design-system-accents-v2/20.2-FINDINGS.md` P-D8 for the full sequence and audit/rewrite scripts.

Pairs with [[feedback-grep-utility-classes-workspace-wide]] (the audit step before Commit 1).
