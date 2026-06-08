---
name: synapse-core-design-system-diagnose
description: Stage 2 sub-skill, Read-loaded by the parent when diagnose runs. Compare the EMITTED output (the resolved theme + composed render) against the intent ledger, run the token-ref and intent-primitive census as scripts, and classify every gap on 3 axes — rejecting the "wrong-brand" trap. Not separately invokable; the parent pulls it in by path.
---

# diagnose — Stage 2 · emitted-vs-intent drift, 3-axis classified

Sub-skill module the parent Read-loads when Stage 2 runs. It is one stage of a gated pipeline, not a
standalone skill — it consumes Stage 1's intent ledger and hands Stage 3 a drift report it can widen
the token contract from.

**Responsibility.** Find where the implementation diverges from intent, *prove* each divergence from
the emitted artifact, and classify every gap so the fix lands in the right layer. The whole stage
exists to defeat one specific failure: the naive reading "the package uses the wrong brand" that both
of this engagement's survey passes reached — and that, acted on, would have patched a brand into a
neutral package and broken every other consumer (L5, L7).

**In → Out.** intent ledger (Stage 1) + emitted theme (`theme.generated.css`) + package src → a
complete **drift report**: every gap a row, every row classified on 3 axes, with the
"seed-is-correct" evidence stated up front.

`SKILL="$HOME/.claude/skills/synapse-core-design-system"` (set once per run).

---

## Why diagnose from emitted output, not from defaults (L7)

The library *default* theme is violet + Inter; the host re-themes it. If you compare the default
package to a red-and-Barlow mockup you will "discover" a wrong brand that does not exist — the host
already seeded red, Barlow, the status colors, light mode, correctly. The real drift is everything the
seed *can't* carry (geometry, elevation, motion, rhythm, type rules) plus everything the components
*never apply* even though the seed emits it. None of that is visible from defaults; all of it is
visible in the resolved output. So diagnose reads the **emitted** theme CSS and the **composed**
render, never the library's `DEFAULT_*` constants. State this resolution explicitly — it is the line
that stops the engagement from corrupting Stage 3.

---

## Ordered steps

Run the census with scripts (deterministic — never eyeball a count), then apply judgment to classify.
The scripts produce evidence; the classification is yours.

### 1 · Resolve and read the emitted theme — EXECUTE the staleness check (L7, L9)

Confirm the emitted theme on disk actually regenerates from the current seed; a stale
`theme.generated.css` means you would diagnose against a render nobody ships:

    bun "$SKILL/scripts/color/emit-theme-css.ts" --seed <host-theme-seed.ts> --out <theme.generated.css> --check

Exit 0 = the emitted CSS matches what the seed would emit (safe to diagnose against). Exit 1 = stale —
regenerate before going further, otherwise every downstream gap is suspect. Read the resolved CSS
silently; do not dump it into context — note the seeded-vs-default dimensions as a clean summary.

### 2 · Census the token references — EXECUTE, don't grep by hand (L8)

Every `var(--…)` / Tailwind token utility a component reaches for must resolve to a defined token. The
ones that don't fail *silently* — `text-status-error-fg` used 36× with no `--color-status-error-fg`
behind it inherits graphite, so the brand-red required-marker just vanishes with a green build:

    bun "$SKILL/scripts/audit/audit-token-refs.ts" --scan <package-src> --theme <theme.generated.css> [--preset <preset.css>] --json

Read the JSON. Each unresolved reference is a hard finding (not a visual surprise), and it is the
purest case of L8 — record file:line for every one. These become drift rows whose axis is almost
always "missing token" (the seed has no slot to carry it yet → widen in Stage 3).

### 3 · Census the intent primitives — EXECUTE the "0/45" count (L3)

The most identity-defining choice — the condensed display face — was emitted correctly and applied by
**zero** components. Count applied-vs-required mechanically so the number is defensible, not impressionistic:

    bun "$SKILL/scripts/audit/audit-intent-primitives.ts" --scan <package-src> --require font-display,tabular-nums,uppercase,ease-emphasis [--min-files 1] --json

The script reads the required-primitive list from `digest.json` (Stage 1's output) and reports
applied/required per primitive — the literal "`font-display`: 0 files / every headline" census from
REPORT-B §3. Under-application is the signal that a *correct* theme never shows up on screen (L3);
each under-applied primitive is a drift row whose fix lives in the component, not the host (L10).

### 4 · Classify every gap on 3 axes — LLM JUDGMENT (the heart of the stage)

This is the judgment step the scripts feed but cannot make. For every gap (a census finding, a ledger
row with no emitted counterpart, a composed shape that reads wrong), assign all three axes:

- **Axis A — widen-neutral vs host-override (L5).** Does the fix add *capability* to the neutral
  package (a new seed slot, a new variant), or is it a *brand specific* that belongs in the host
  theme/override? Patching a brand into the package is the trap; widening its contract is the cure.
  Geometry/elevation/motion/rhythm slots the seed lacks → widen. A `tr-TR` currency default → host.
- **Axis B — present-but-unwired vs missing (L12).** Does the primitive already support this and the
  host just never passed it (→ host composition fix), or is the capability genuinely absent (→ widen
  the package)? Misreading "unwired" as "missing" sends the fix to the wrong layer and wastes a wave —
  the `contextAside`/`eventLock` slots looked missing but already existed. Resolve Tailwind→token
  before judging rendered appearance.
- **Axis C — component-composes vs host-composes (L10).** Should the package own this application by
  default (a `display` heading variant, a tabular numeric — so every host gets fidelity for free), or
  is it legitimately host-domain composition? ~67% of page drift was host blocks reaching for the
  wrong utilities; that is the package's job to make a default, not the host's discipline to remember.

### 5 · State the "seed-is-correct" evidence — LLM JUDGMENT (defeat the wrong-brand trap)

Open the drift report with the evidence that the seed re-themed correctly: the seeded accent, fonts,
status colors, and mode read from the *emitted* CSS. This is not ceremony — it is the line that stops
a reader (or the next stage) from "fixing" the brand. Name explicitly that the failure is "the palette
was copied; the intent was not," and that the gaps below are intent-application and contract-width, not
brand-correction (REPORT-B §0, L7).

---

## HARD GATE — G2 (the stage cannot advance until…)

The drift report is **complete and every gap is 3-axis classified**, specifically:

- The emitted theme was resolved and its staleness checked (`emit-theme-css --check` ran); diagnosis is
  against emitted output, never package defaults.
- Both censuses ran as scripts (token-refs + intent-primitives) and every unresolved-token and
  under-applied-primitive finding is a row with file:line evidence — none eyeballed.
- Every gap carries all three axes (A widen-vs-host · B unwired-vs-missing · C component-vs-host).
- The report opens with the stated seed-is-correct evidence, so the wrong-brand trap is explicitly
  rejected.

Why this is a gate, not a checklist: a gap with a missing axis is a fix routed to an unknown layer,
and that is exactly how the first engagement nearly patched the package. Stage 3 (color/widen) and the
recompose stages read these axes to decide *where* each change lands — an unclassified gap stalls them.

---

## Deterministic outputs vs nudge-knobs

Per the determinism contract (`../references/determinism.md`): same intent → same drift-report shape,
same coverage, same gates, every run. Only the creative specifics below are operator-steerable.

**Deterministic outputs (always produced for this intent):**
- A complete drift report where **every** gap is a row classified on all 3 axes (G2). Coverage is
  fixed: every unresolved token reference and every under-applied required primitive appears.
- The two script censuses (token-refs, intent-primitives) run mechanically — the counts come from the
  scripts, never from prose estimation.
- The emitted-theme staleness check (`emit-theme-css --check`) and the stated seed-is-correct evidence
  line. Diagnosis is always against emitted output.

**Nudge-knobs (the bounded places judgment/operator steer specifics):**
- The **3-axis classification calls** — genuine judgment per gap, but each picks from a *closed* set
  (widen|host · unwired|missing · component|host), so it is bounded, not freeform.
- The **root-cause narrative framing** — how the report explains the drift (LLM curation over the
  fixed census data).
- **Documented flags** — `--preset <preset.css>`, the theme/seed paths, `--require <primitive-list>`
  (sourced from `digest.json`), `--min-files`. Target inputs arrive as path args, never hardcoded.

There is no silent variability: every place creativity enters is one of the above; everywhere else the
scripts and the gate make the output the same shape each run.

---

## What this stage refuses to do (and where it hands off)

- It does **not** widen the seed, derive ramps, or edit primitives — it only diagnoses and classifies.
  Stage 3 (color) acts on the widen-vs-host axis; the recompose stages act on the other two.
- It does **not** declare fidelity from a green build or a sub-agent verdict. Green gates validate
  existence, not paint or leaks (L13); the unresolved-token and under-applied-primitive findings here
  are precisely the things a passing build hides. Fidelity is confirmed later by the review surface +
  `Skill → impeccable` + the operator (L16) — not in this stage.

References: `../references/hard-rules.md`, `../references/determinism.md`,
`../references/completeness-contract.md`.
