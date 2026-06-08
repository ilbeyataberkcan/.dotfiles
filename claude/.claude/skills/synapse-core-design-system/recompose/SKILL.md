---
name: synapse-core-design-system-recompose
description: Stages 4-5 of synapse-core-design-system, Read-loaded by the parent when recompose runs. Author the coverage map with no deferred holes, recompose the reference into primitives under the 5 hard rules, ship light + dark first-class, and gate on a green build. Not separately invokable; the parent pulls it in by path.
---

# recompose — Stages 4–5 (map → build)

> Sub-skill module. The parent Read-loads this when Stages 4–5 run; it is not a top-level skill.
> Set `SKILL="$HOME/.claude/skills/synapse-core-design-system"` once at the top of the run, then
> execute the shipped scripts below by path. Do not re-derive in prose what a script owns.

## Responsibility

Turn the diagnosis into built code. Stage 4 **maps** every reference shape and every shell slot to a
realization strategy (the coverage map). Stage 5 **builds** it — recomposing variants, hand-building
missing families, widening chrome — under the five hard rules, in both modes at once.

The reason this is two stages behind one gate is that the failure mode is *building before you've
enumerated*: you discover a missing slot mid-build, in a context that no longer remembers why. Map
first (cheap, complete), then build against a map with no holes. See
`../references/completeness-contract.md` for why "we'll wire it later" is the exact bug this prevents.

**Inputs.** The drift report (from diagnose) · the widened `ThemeSeed` + generated theme CSS (from
color) · the existing package registry + src tree · the screen/states recipes.

**Outputs.** A coverage map (every shape + slot dispositioned) · built primitives/families wired to
the widened tokens · a sandbox/showcase route that renders them · a green build.

## The five hard rules (load before you build)

Read `../references/hard-rules.md` now. Every recomposition holds all five — they are not style
preferences, they are lessons that already cost an engagement, and each is an exit-code gate
somewhere downstream. In one line each: **(1)** separate by elevation, not outline; **(2)** generic
names, no domain words; **(3)** brand is fed through the seed, never patched into a default; **(4)**
recompose, never rewrite, and never rename a registered key; **(5)** light and dark are both
first-class. If you find yourself wanting to relax one, stop and raise it with the operator.

## Stage 4 — MAP reference → primitives

### 4a · List the registry — EXECUTE, don't guess what exists

Re-deriving the component inventory from memory is how a recomposition accidentally rewrites a
primitive a variant could have reached (Rule 4). Dump the real registry instead:

    bun "$SKILL/scripts/review/build-review-surface.ts" --registry <index.ts> --dump --json

Read the printed key list silently; do not paste it into context. This is the authoritative set of
existing primitives you recompose *from*. *(`--dump` replaces the standalone `dump-registry`.)*

### 4b · Author the coverage map — LLM judgment, bounded by the preference order

This is the central judgment of the stage. For **every** shape in the reference and **every** slot in
the shell, write one row with a disposition. The disposition is `realizedBy` in the fixed Rule-4
preference order — **variant-of-existing ≻ compose-tailwind ≻ new-primitive ≻ wrap-radix** — or, if it
truly isn't realized this run, `out-of-scope (justified)` or `known-limitation (filed)`. A blank row
is a gate failure, never a warning (`../references/completeness-contract.md`).

Bind each row to the widened tokens from Stage 3, and enumerate **all** shell slots up front (L11) —
the shell contract exposes every slot, so discover them now, not mid-build. Your judgment picks
*which* strategy fits each gap; the *preference order* and the *requirement to dispose every row* are
fixed.

### 4c · Lint the names you propose — EXECUTE the denylist

New variant and primitive names must be generic (Rule 2) so the package owes nothing to its first
consumer. Check proposed names against the domain-word denylist before they enter the tree:

    bun "$SKILL/scripts/audit/audit-naming.ts" --scan <src> --domain-words <list> --json

A non-zero exit means a domain word leaked in — rename before building. This is mechanical; do not
eyeball it.

### Gate G4 — the map is complete

Stage 4 cannot advance until: every reference shape has a row; every shell slot is enumerated and
dispositioned; the naming lint is clean (exit 0); no registered key is renamed; **no deferred holes**.
Enforces L2, L10, L11, L12, recompose-not-rewrite, and the completeness contract.

## Stage 5 — BUILD with the hard rules

### 5a · Recompose and hand-build — LLM judgment, scoped

Work the map: recompose existing primitives into the new variants, hand-build the families the map
marked `new-primitive`, widen the chrome/shell, and wire the closed escape-hatch vocabulary. Apply
the identity primitives the digest required (display type, tabular figures, uppercase, emphasis
easing) where the reference applies them — that is the L3 "0/45" gap closing. Build **light and dark
together** (Rule 5); drift hides in the mode you didn't look at. Keep a single root per family.

### 5b · Regenerate the tree-shake icon index — EXECUTE

New components pull new glyphs; the registry must stay in sync or the bundle ships dead or missing
icons (L3). Regenerate the index rather than hand-editing it:

    bun "$SKILL/scripts/icons/icon-index.ts" --registry <index.ts> --scan <src> --write <index.ts>

### 5c · Gate the build — EXECUTE; green is existence, not fidelity

Run the build/type-check/test gate before claiming the stage done:

    bun "$SKILL/scripts/build/gate-build.ts" --root <repo-root> [--filter <pkg>]

Read the honesty contract into how you treat the result: **a green build proves the code exists and
compiles, never that it paints the intent** (L13). The escape-hatch must stay the closed 7-token
`data-cve-look` set — a green build with an open vocabulary is still a fail. Fidelity is judged later,
by the review surface + impeccable + the operator (Stage 6), never here and never by a sub-agent
(L16).

### Gate G5 — the build is real

Stage 5 cannot advance until: build, type-check, and tests are green; each family has a single root;
the escape-hatch vocabulary stays the closed 7-token set; the required identity primitives are
applied where the reference applies them. Enforces L3, L10, L13 (the green-≠-fidelity note), L14,
elevation-not-outline, recompose-not-rewrite.

## The HARD GATE out

**Stages 4–5 advance to review (Stage 6) only when G4 and G5 both hold: a coverage map with no
deferred holes (every shape + slot dispositioned, naming-clean, no registered-key rename) AND a green
build/tsc/test with a single root per family and the escape-hatch held to the closed 7-token set.**
Green is necessary, not sufficient — it gates *entry to* the fidelity check, it is never the fidelity
verdict itself. Visual fidelity is the operator's call at G6, never decided in this stage.

## Deterministic outputs vs nudge-knobs

Per the determinism contract (`../references/determinism.md`): for a given intent this stage always
produces the same structure, coverage, and guarantees; only the few bounded knobs below carry
operator judgment. No silent variability.

**Deterministic outputs (always produced for the intent)**
- A coverage map where **every** reference shape and **every** shell slot has a row, each with an
  explicit disposition in the fixed Rule-4 preference order — no deferred holes (G4).
- Built primitives/families wired to the widened tokens, light + dark first-class, single root per
  family, regenerated icon index, escape-hatch held to the closed 7-token set.
- A green build/tsc/test gate (G5) and a sandbox/showcase route that renders the result.

**Nudge-knobs (the bounded places judgment enters)**
- The `realizedBy` disposition per gap — *which* strategy fits — chosen within the fixed preference
  order and the completeness contract (a row must be disposed; it may not be left blank).
- Variant and primitive **naming**, bounded by the domain-word denylist (`audit-naming`).
- Which states/screens to realize, supplied through the recipes (`../recipes/states-recipe.json`,
  `../recipes/screen-recipes.json`) — the same knobs the review stage consumes.

## Learnings this stage enforces

L2 (non-token intent → explicit artifact: the coverage map row, the generic name) · L3 (components
reach for the identity primitives — the 0/45 closes here) · L10 (components own identity application;
the MOCKUP composition is realized, not just solo primitives) · L11 (the shell contract exposes every
slot — all enumerated at G4) · L12 (present-but-unwired vs missing — routed to the right layer) ·
L13 (green gates validate existence, not paint — encoded in 5c and the gate-out) · L14 + elevation
(state-only outline; identity widths) · recompose-not-rewrite and the completeness contract (G4).

References: `../references/hard-rules.md`, `../references/completeness-contract.md`,
`../references/determinism.md`.
