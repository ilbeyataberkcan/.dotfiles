---
name: synapse-core-design-system-digest
description: >-
  Stage 1 sub-skill of synapse-core-design-system, Read-loaded by the parent when digest runs.
  Convert a provided design system + mockups (tokens → prose → composition → render) into the
  structured intent ledger — the four-table artifact that makes a theme more than a palette. Not
  separately invokable; the parent pulls it in by path.
---

# digest — Stage 1: turn the reference into an intent ledger

> Sub-skill module. The parent `synapse-core-design-system/SKILL.md` Read-loads this when Stage 1
> runs; it is not a top-level, separately-invokable skill. Set `SKILL="$HOME/.claude/skills/synapse-core-design-system"`
> once at the top of the run (the parent already did this — reuse it).

## Responsibility

Read the *whole* reference and write down what it means to build, not just what colors it uses. A
theme is not a palette (L1): the geometry, elevation, motion, rhythm, type, motif, and voice all
carry intent, and most of it lives **outside** the token table — in how the reference composes
primitives, in the policies its mockups imply, and in what it deliberately holds back. This stage
turns that diffuse signal into one structured **intent ledger** plus a machine-readable `digest.json`
that every later stage reads. If a piece of intent stays in prose or in your head, the next stage
can't enforce it and the drift that L1/L2 name comes right back.

**In → Out.** intake's located-paths manifest (reference dir, mockups, tokens, fonts) → the four-table
intent ledger (markdown) + `digest.json` (extracted tokens, fonts, glyph map, required-identity
primitives).

## Ordered steps

The mechanical extraction is shipped as scripts — execute them, do not eyeball hex values or
hand-walk the icon set. Hand-deriving what a script owns wastes tokens and silently drifts from the
package math (L4, L9). The curation of the four tables is your judgment.

**1. Extract every color into OKLCH** *(SCRIPT — execute, never hand-compute)*. For each hex in the
reference token set, run the shipped converter so the ledger speaks the same color space the package
codegen does:

    bun "$SKILL/scripts/color/oklch.ts" "#d81e0b" --to obj --json

Read the JSON it prints. Do this per anchor (or pipe the token list through it); never estimate
lightness/chroma/hue by eye — `oklch.ts` re-exports the real package conversion, so its numbers are
the ones the seed will later emit.

**2. Scan the reference's icon usage against the registry** *(SCRIPT — execute, never hand-scan)*.
The glyph set is part of the intent (L3); resolve it mechanically:

    bun "$SKILL/scripts/icons/icon-index.ts" --registry <index.ts> --scan <reference-src-or-mockups>

Read the unmapped / dead / missing report. Record the glyph map (reference name → registry key) into
`digest.json`. Do not guess registry keys — the scan is authoritative.

**3. Tally the composition spend** *(SCRIPT-assisted census, LLM reads the result)*. Beyond raw
tokens, the reference *spends* its design budget somewhere — heavy elevation, tight rhythm, one signal
color used sparingly. Use the token/font extract to seed a census of which identity primitives the
reference actually reaches for (`font-display`, `tabular-nums`, `uppercase`, `ease-emphasis`, the
surface ladder). This list becomes the `requiredIdentityPrimitives` field in `digest.json` that
Stage 2's `audit-intent-primitives` later checks the implementation against (the "0/45" census).

**4. Curate the four-table intent ledger** *(LLM judgment — this is the heart of the stage)*. Read
tokens, then the reference prose, then the mockups' *composition*, then the rendered feel, and write:

- **Table 1 — Token contract.** Every color/space/radius/shadow/type token, each in OKLCH (from step
  1), tagged with its DS source line. The mechanical part.
- **Table 2 — Composition expression.** How the reference *uses* those tokens: the surface ladder
  (shade+shadow, not outline — Rule 1), the rhythm, the one-signal-CTA discipline, the media drama.
  This is where 67% of drift hid (L10) — composition, not palette.
- **Table 3 — Motif / policy.** The non-token intent: voice, locale/currency policy, "borders are
  state-only", "fee figures are tabular", display-type headings. Each becomes an enforceable row.
- **Table 4 — Restraint fingerprints.** What the reference deliberately *omits* — the color budget it
  doesn't spend, the elevation it doesn't pile on. Restraint is intent too, and it's the easiest to
  lose in a rebuild.

**5. Emit `digest.json`** *(SCRIPT writes the mechanical fields; you fill the curated ones)*. The
extracted tokens, fonts, glyph map, and `requiredIdentityPrimitives` are written from steps 1–3; the
motif/policy rows you curated in step 4 are recorded as structured entries so downstream audits can
read them as requirements, not prose.

## Hard gate out — G1

**The stage cannot advance until every motif and every policy is a ledger row tagged token-vs-policy,
with nothing left only in prose or only in your head.** This is the gate because L2's named failure is
exactly "non-token intent that stayed prose" — if "borders state-only" or "tabular fees" lives in a
paragraph instead of a tagged row, no later script can enforce it and the implementation quietly
drifts. A token-tagged row routes to the seed/codegen; a policy-tagged row routes to a component or
host primitive and to an audit. A row with no tag is a gate failure, not a note.

## Why this stage exists (the learnings it enforces)

- **L1 — a theme is not a palette.** Tables 2–4 force geometry/elevation/motion/rhythm/type/motif/voice
  into the ledger, not just Table 1's colors.
- **L2 — non-token intent must become an explicit artifact.** G1 is the gate that no policy stays
  prose-only; the ledger + `digest.json` are that artifact.
- **L7 — diagnose from emitted output.** The ledger is built from the *composed* reference expression
  (mockups, render), not from token names alone — so Stage 2 compares emitted-vs-intent, not name-vs-name.
- **L3 — components must reach for the primitives.** `requiredIdentityPrimitives` is captured here so
  Stage 2's census has a contract to measure against.

## Deterministic outputs vs nudge-knobs

Per `../references/determinism.md`: same intent → same structure, coverage, and guarantees. The
creative specifics enter only through the named knobs below.

**Deterministic outputs (always produced for this intent):**
- The four-table intent ledger, always all four tables, always in that order.
- Every motif and policy as a row tagged token-vs-policy (gate G1) — coverage is fixed: nothing
  in-scope is left untabulated.
- `digest.json` with the mechanically extracted tokens (OKLCH), fonts, glyph map, and
  `requiredIdentityPrimitives` list — fixed shape every run.

**Nudge-knobs (the bounded places your judgment steers specifics):**
- **Which composition expressions and restraint fingerprints to foreground** in Tables 2 and 4 —
  brand-led curation. Bounded: you select and rank from what the reference exhibits; you do not invent
  intent the reference doesn't show.
- **The reference-pointer flags** from intake's manifest (which dir/mockups/tokens are the source) —
  a fixed slot the operator fills, not freeform behavior.

References this sub-skill cites: `../references/hard-rules.md` (Rule 1 elevation, Rule 2 naming),
`../references/determinism.md`.
