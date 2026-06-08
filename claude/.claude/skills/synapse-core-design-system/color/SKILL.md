---
name: synapse-core-design-system-color
description: >-
  Stage 3 of synapse-core-design-system, Read-loaded by the parent when color runs (not separately
  invokable). Widen the neutral seed into a full 13-slot ThemeSeed, derive curated OKLCH ramps with a
  monotonic-chroma guard, prove back-compat + that seeded values reach the generated CSS, and gate
  WCAG status-foreground in both light and dark. Executes the shipped color/seed scripts — never
  hand-computes OKLCH or hand-writes a ramp.
---

# color — Stage 3: derive the token contract (widen the seed)

> Sub-skill module. The parent Read-loads this when Stage 3 starts; it is not a top-level skill.
> Set `SKILL="$HOME/.claude/skills/synapse-core-design-system"` once at the top of the run.

## Responsibility

Turn the drift report (Stage 2) into the **token contract** the rest of the pipeline builds against:
a widened, typed `ThemeSeed` carrying the brand's geometry / elevation / motion / rhythm / type — not
just its colors — with the codegen and the back-compat tests threaded as **one unit**.

The first engagement's whole failure was here: it copied the palette and stopped. A theme is not a
palette (L1). The brand's intent reaches the package only through the seed and the codegen that emits
from it (Rule 3, brand-fed) — never by patching a brand value into a neutral default. So this stage
*widens* the seed across all the non-color slots the brand actually has an opinion about, and proves
the widening survives codegen, back-compat, and both contrast modes before anyone builds a component.

**In → Out.** drift report + the package's seed/codegen source → a widened `ThemeSeed` literal +
regenerated theme CSS + green back-compat/contrast tests.

## The OKLCH math is a script — execute it, never re-derive it

Hand-computing OKLCH or hand-writing a ramp wastes tokens and drifts from the package's own math —
the package and the skill must share one source of truth (L9), and a ramp eyeballed from one hex is
lossy (L4). The scripts `import` the real package functions (`generateAccents`, `generateStatusRamp`,
`generateNeutrals`, `colorToOklch`) via the `_vendor` snapshot, so what the script prints is exactly
what the package will emit. Read the JSON it prints silently; present a clean summary — never `cat`
raw theme CSS into context.

## Ordered steps

Run these in order. Each deterministic sub-step names the exact command; the LLM sub-steps are the
few places judgment enters (and they map 1:1 to the nudge-knobs below).

**1 — Convert each brand hex to OKLCH** *(SCRIPT)*. Ground every brand color in the package's own
color space before reasoning about ramps:

    bun "$SKILL/scripts/color/oklch.ts" "<brandHex>" --json

**2 — Derive each ramp with the monotonic-chroma guard** *(SCRIPT + one LLM knob)*. Run per anchor
(accent, then each status seed). Do **not** hand-write the 10-step expansion:

    bun "$SKILL/scripts/color/derive-ramp.ts" "<anchorHex>" --kind accent --check-monotonic --json
    bun "$SKILL/scripts/color/derive-ramp.ts" "<errorHex>"  --kind status --check-monotonic --json

Read the `monotonic` field. If `false`, the algorithmic ramp is lossy (L4) — **this is the one place
your judgment enters the ramp**: pick a curated override anchor that restores monotonic chroma and
re-run. If `true`, the script's ramp stands; do not "improve" it by hand.

**3 — Author the widened `ThemeSeed`** *(LLM, then SCRIPT)*. Decide the slot *shapes and generic
names*; the structure is fixed. The seed has 13 slot-groups — `primary`, `accents{primary,secondary?,
tertiary?}`, `status?`, `fonts?{sans,mono,display}`, `borderRadius?`, `shadows?`, `motion?{easing,
duration}`, `spacing?`, `typography?{scale,weights,tracking}`, `defaultMode?`. The brand expresses its
geometry / elevation / motion / rhythm / type through the non-color slots (the 0.6.0 front-doors);
fill the ones the brand has an opinion on. Name slots for what they *are* in a design system
(`accent`, `surface`, `signal`), never for the consuming domain — domain words leak the host into the
package and block reuse (Rule 2). Then scaffold the typed literal rather than hand-typing it:

    bun "$SKILL/scripts/seed/scaffold-seed.ts" --out <theme-seed.ts> --from <digest.json>

When you fill `fonts`, set each role's `source` deliberately (`'google'` | `'custom'`) — it is now
**meaningful**, not decorative: it drives the loader. **Naming a font in the seed does not LOAD it.**
The seed only *declares* the family; the bytes arrive through the package font loader. So filling a
`fonts` slot creates an obligation the host must honor at mount time — see step 4b and the host stage.

**4b — Mount the package font loader so the seed fonts actually LOAD** *(host wiring — flagged here
because it is where the obligation is born)*. The brand's type only renders if the host mounts
`ThemeFontLinks` from `@synapsys-integrated/cve-design-system` in its root `<head>`:

    import { ThemeFontLinks } from '@synapsys-integrated/cve-design-system';
    // in the host root <head>, once:
    <ThemeFontLinks seed={seed} />   // or fonts={seed.fonts}

It reads the seed's `fonts`, merges every `source:'google'` role into one `css2` request and emits
each `source:'custom'` role as an `@font-face` (`display` defaults to `swap`; pass a CSP `nonce` if the
host sets one). **This is the LOADING layer and it is decoupled from the mode-switcher** — the
theme/mode toggle re-themes colors and never loads fonts; font loading is its own concern mounted once.
A seed that names `Barlow Condensed` but no mounted loader = the type silently falls back, the exact
"named ≠ loaded" gap. The host stage (`../host/SKILL.md`) owns the actual mount and re-checks it.

**4 — Regenerate the theme CSS and prove it is not stale** *(SCRIPT)*. The seed and the codegen move
together (L9) — a seed change that never reaches the generated CSS is a silent failure (L8):

    bun "$SKILL/scripts/color/emit-theme-css.ts" --seed <theme-seed.ts> --out <theme.generated.css>
    bun "$SKILL/scripts/color/emit-theme-css.ts" --seed <theme-seed.ts> --out <theme.generated.css> --check

`--check` exits non-zero if the committed CSS differs from a fresh regen. A non-zero exit here is the
seed-emits proof failing — fix the codegen wiring, do not commit a stale file.

**5 — Gate the default-leak** *(SCRIPT)*. Confirm no brand value crept into a neutral default. The
defaults stay achromatic and locale-free; the seed alone carries the brand (Rule 3):

    bun "$SKILL/scripts/audit/audit-leak.ts" --scan <package-src> --brand-hex "<brandHex>" --brand-font "<brandFont>" --json

A hit (a brand hex, brand font, `tr-TR`, `toLocaleString`, or a currency glyph in the defaults) exits
non-zero and blocks the gate.

**6 — Prove back-compat and contrast** *(SCRIPT-backed, run via `gate-build` / the package test
runner)*. Two properties must hold together: a consumer that passes **no** seed still gets the
unchanged Synapsys-neutral defaults (the codegen threads `{...DEFAULT_X, ...seed.X}`, and a legacy
`{accent}` seed normalizes with a single deprecation warning), and the status foregrounds clear WCAG
in **both** modes. Contrast runs inside the audit orchestrator, which reuses `derive-ramp`/`oklch` so
the numbers match the emitted ramp:

    bun "$SKILL/scripts/audit/audit-all.ts" --scan <package-src> --theme <theme.generated.css>

## Hard gate out — G3

Stage 3 cannot advance to recompose (Stage 4) until **all five** are green together:

1. **Back-compat** — no-seed → unchanged defaults; legacy `{accent}` seed normalizes with one warning.
2. **Seed reaches CSS** — `emit-theme-css --check` is clean; a seeded value is traceable into the
   generated theme CSS, and the compiled utility that consumes it actually exists (grep finds the rule).
3. **WCAG both modes** — every status foreground clears contrast in light *and* dark.
4. **Zero brand in defaults** — `audit-leak` finds no brand hex / brand font / locale leak in defaults.
5. **Ramps monotonic** — every derived ramp is `monotonic:true`, or carries a recorded curated-anchor
   override (the only sanctioned reason a ramp deviates from the algorithm).

Green here proves the contract *exists and is wired*, not that any component *looks* right — that
fidelity judgment is Stage 6's job (review surface + impeccable + operator). Do not treat a green
Stage 3 as a fidelity pass (L13).

## Deterministic outputs vs nudge-knobs

Per the determinism contract (`../references/determinism.md`): same intent → same structure, coverage,
guarantees, and output shape every run; creativity enters only through the bounded knobs below.

**Deterministic outputs** (always produced for this intent):
- A widened, typed `ThemeSeed` covering all 13 slot-groups (every slot the brand opinions, the rest
  left to defaults — none silently dropped).
- A regenerated, non-stale `theme.generated.css` proven to emit from that seed.
- The G3 gate result: back-compat green · seed-reaches-CSS green · WCAG both modes · zero brand in
  defaults · every ramp monotonic-or-overridden.

**Nudge-knobs** (the only places judgment steers specifics — no silent variability):
- The **brand anchor hex(es)** fed to `oklch` / `derive-ramp` (an interview/digest value).
- The **curated override anchor** when `derive-ramp --check-monotonic` reports `monotonic:false` — the
  single creative decision inside ramp derivation.
- The **generic slot names** and which non-color slots the brand fills (denylist-clean per Rule 2).
- Documented flags: `--kind accent|status|neutral`, `--brand-hex` / `--brand-font` for the leak scan.

## Learnings this stage enforces

- **L1** — a theme is not a palette → the seed widens across geometry/elevation/motion/rhythm/type,
  not just colors. **Named ≠ loaded**: a `fonts` slot with `source:'google'` only loads when the host
  mounts `ThemeFontLinks` (step 4b) — the loading layer, decoupled from the mode-switcher.
- **L4** — ramp-from-one-hex is lossy → `derive-ramp --check-monotonic` flags non-monotonic chroma.
- **L5 / Rule 3** — never patch a brand into a neutral package → `audit-leak` defaults gate.
- **L8** — silent token failures → `emit-theme-css --check` + the seeded-value-reaches-CSS proof.
- **L9** — seed and codegen move together → scripts reuse the package math via `_vendor`; `--check`.
- **L13** — green gates validate existence, not paint → G3 is necessary-not-sufficient; fidelity is
  Stage 6's surface + impeccable + operator, never this stage's green.

References: `../references/hard-rules.md` (Rules 2, 3), `../references/determinism.md`.
