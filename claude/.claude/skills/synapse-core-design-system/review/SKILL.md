---
name: synapse-core-design-system-review
description: Stage 6 sub-skill of synapse-core-design-system, Read-loaded by the parent when the visual-confirm stage runs. Generate the interactive HTML review surface (SOLO + MOCKUP, light + dark, A/B wipe, reference side-by-side), capture renders mechanically, then route fidelity judgment to the impeccable skill and the operator. The operator's sign-off is the only fidelity gate. Not separately invokable; the parent pulls it in by path.
---

# review — Stage 6, the fidelity gate

> Sub-skill module. The parent Read-loads this when Stage 6 runs; it is not a top-level skill. Set
> `SKILL="$HOME/.claude/skills/synapse-core-design-system"` once before running the commands below.

**Responsibility.** Build the artifact that lets a human and the design authority *see* whether the
built primitives realize the reference's feel — then run both of them past it. This stage owns the
impeccable + operator visual-confirm loop. It does **not** itself judge fidelity, and it never lets a
sub-agent do so either.

**In → Out.** built primitives + widened theme CSS + reference shots + the two recipes →
`review.html` + `manifest.json` + an impeccable report + an operator `feedback.json`.

**Why this stage exists at all.** Every earlier gate proves *existence* — the build compiles, tests
pass, tokens resolve. None of that is *fidelity*. The first engagement passed every green gate and
still shipped a wireframe: the light-mode badge dissolved, the split-hero collapsed, and the
composed page never read like the mockup. Those are paint and composition failures that only a human
eye catches, and a sub-agent that returned "PASS" on a screenshot hid them (L13, L16). So this stage
is built around one hard truth: **the operator is the fidelity authority; the surface and impeccable
exist to make their judgment fast and grounded, not to replace it.**

## The loop (ordered; each step is SCRIPT, IMPECCABLE, or OPERATOR)

Run these in order. Steps 1–2 are deterministic scripts you EXECUTE — do not re-derive a review
page, a node tree, or a screenshot harness by hand; that is wasted tokens and silent drift from the
real registry (R3, §6). Steps 3–4 are the two judgments, and step 4 is the gate.

### 1 · Generate the surface — EXECUTE the script

The page must render straight from the live registry and the real `/showcase` helpers so it can't
diverge from what actually ships. The script introspects the registry, expands the recipes, SSRs the
SOLO + MOCKUP node trees with the generated theme CSS inlined for both modes, pairs each specimen
with its reference slice, and emits a manifest of every `data-capture-id`:

    bun "$SKILL/scripts/review/build-review-surface.ts" \
      --registry <path/to/registry/index.ts> \
      --theme <path/to/theme.generated.css> \
      --states "$SKILL/recipes/states-recipe.json" \
      --screens "$SKILL/recipes/screen-recipes.json" \
      --reference <path/to/reference-shots-dir> \
      --intent <path/to/.synapse-core-design-system.md> \
      --out <out-dir>

Read the summary it prints (specimen count, screens built, any unpaired references) — do **not** dump
the HTML into context. The artifact is a single `file://`-openable `review.html` with no dev server.

### 2 · Capture the renders — EXECUTE the script (a sub-agent may run this)

Take a still of every specimen across both modes and the three viewports, so impeccable has stable
images and the operator has a console-error check. This is the *one* place a sub-agent is permitted
in the visual path, because **capture is mechanical and carries zero verdict** (L16):

    bun "$SKILL/scripts/review/capture-renders.ts" \
      --url "file://<out-dir>/review.html" \
      --out <out-dir>/captures \
      --modes light,dark --viewports desktop,tablet,mobile

The script writes PNGs keyed by `data-capture-id × mode × viewport` plus a console report. If you
delegate it to a sub-agent, the sub-agent returns only the manifest of paths and the console log — it
does not, and is not asked to, say whether anything "looks right". Treat any PASS/FAIL a sub-agent
volunteers about imagery as noise, not signal.

### 3 · Critique via impeccable — DELEGATE the judgment (design authority)

Hand the captures, the reference shots, and the intent file to the existing design authority. Do not
re-implement critique here — L16 is explicit that the *existing* skill judges the rendered surface:

    Skill → impeccable (mode: critique, then polish)
      inputs: <out-dir>/captures, <reference-shots-dir>, <.synapse-core-design-system.md>

Expect a 5-axis report where every Fix cites a specific `data-capture-id` + reference slice (e.g.
`"MOCKUP/registration · dark · fee figure not tabular vs ref"`), not a vague impression. This is a
**report, not a gate** — it sharpens the operator's eye and pre-files the obvious deltas, but it
cannot sign off on its own.

### 4 · Operator sign-off — the GATE (★ C6, human, final authority)

Pause and hand the operator the live `review.html`. They drag the A/B wipe, toggle light/dark, zoom
the lightbox, and work the inline checklist — voice · elevation · media-drama · rhythm · color-budget
· both-mode parity — emitting `feedback.json` (per unit ✅/⚠️/❌ + notes, no backend). The wipe over a
matched-width reference is the single best, un-fakeable drift check, which is exactly why a human
does it live and a sub-agent screenshot never substitutes.

This is an `AskUserQuestion`-style blocking checkpoint — never auto-advance past it.

### 5 · Reconcile and loop (LLM, scoped)

Merge impeccable's open Fixes with the operator's ❌/⚠️ into one targeted change list. Route each fix
to the **right layer** — the package primitive or the recipe, by recomposition not rewrite (that
routing is `recompose`'s job; this stage hands it the list). Then regenerate: re-run step 1, and
re-capture in step 2 **only the touched `data-capture-id`s** (L15 — regeneration is cheap, a full
re-shoot is waste). Loop until termination.

## The step-by-step design-review flow — one stage at a time, gated by the feedback↔fix loop

The reviewer (the `/review` surface) drives a **step-by-step design flow**, not a one-shot gallery.
Build and settle ONE stage before drafting the next. This is **not a "pity UI lock"** — it is a genuine
step in a step-by-step process: each stage's accepted output is the *input* the next stage composes
from, so drafting ahead risks rebuilding on a foundation that is still moving.

**The loop — every stage runs it:**

    propose a design
      → represent it in the reviewer (the /review surface)
      → operator gives annotated, targeted feedback
      → fix until it is right
      → when the feedback↔fix loop concludes, move to the next stage

- **Stage 1 — Foundations.** Tokens, fonts, and buttons — the overall foundations
  (color/type/elevation/radius/motion + the primitive atoms), shown SOLO across design-relevant states,
  light + dark, beside the reference slice. The first feedback round covers **only this**.
  *Gate: the operator confirms the foundations read right* before Stage 2 is drafted.
- **Stage 2 — Building blocks.** Drafted **only after foundations are accepted**. The composed elements
  built *from* the foundations — cards, interactives (pickers, selectors), text elements — the reusable
  building blocks of every screen and page. **Not full screens yet.** Do not draft building blocks while
  Stage 1 is still open. *Gate: the operator confirms the building blocks* before Stage 3 is drafted.
- **Stage 3 — Pages, screens & layout.** Assembled from the accepted building blocks, **one page at a
  time** — no rush to cover every planned page. A "page" is a landing page or a flow-step screen (e.g.
  payment, authentication). For each page, work in order: **(1) the layout first → (2) the building
  blocks + their variants the page needs → (3) the final assembly of the page.** The page-building is
  carried out through the `host` stage. *Gate: the operator confirms each page* before the next starts.

State which stage you are in at the top of every review run, and which prior gate you are assuming
green. Skipping a gate is the failure; the global rules (no hairlines, separation = elevation, both
modes first-class) apply across **all** stages, but stage *content* advances only on accept.

> These three **design-flow** stages (Foundations → Building blocks → Pages) are the operator's review
> sequence — distinct from the skill's **pipeline** stages 0–9. Don't conflate "Stage 2 Building blocks"
> (this flow) with "Stage 2 diagnose" (the pipeline).

## The end-vision this surface serves (why the artifact is a node tree, not just an image)

The review surface is the front end of a **pre-cve-studio design tool**. The thing the operator
accepts is not a screenshot — it is a set of **RenderEngine node trees** (the SOLO specimens and the
MOCKUP pages render straight from the live registry, §1). Once accepted, those trees are **seedable
into an app's database**: an approved design becomes app data, not a redraw. Keep the surface honest
to that pipeline — every specimen and screen is a real node tree the engine can emit, so "approved"
means "ready to seed," never "looked fine in a picture."

## Element-targeting granularity — overall vs part

Feedback and theming target at **two granularities**, and the surface must make both addressable:

- **Overall** — the *whole specimen card / whole screen*. A verdict or theme at this level applies to
  the entire unit (this card's elevation is wrong; re-theme this whole screen).
- **Part** — an *inner element* of a specimen (the fee figure inside the card, the CTA inside the
  hero). A verdict or theme at this level targets just that part.

Every `data-capture-id` therefore addresses a node at a known granularity (`<unit>` for overall,
`<unit>/<part>` for a part), so an operator note and a theme change both land on exactly the node
they mean — never "somewhere on the card."

## Theme must re-theme the WHOLE surface

When the operator switches theme/mode on the surface, it re-themes the **entire** surface — every
specimen, every MOCKUP screen, both panels — not a single preview tile. A theme is a property of the
whole rendered tree (it flows from the seed through every node), so a switch that only repaints one
specimen is a bug: it would let drift hide in the units that didn't re-theme (the Rule-5 trap, one
level up). The mode/theme switcher is wired once at the surface root and cascades to all node trees.

## Host-adoption intelligence — drive the host's provider, never duplicate it

The review surface is **scaffolded into an existing app**, so it must detect the host's theme wiring
before patching and **mount only what's missing** — the same discipline the host stage owns
(`../host/SKILL.md`, step 1a):

- **The host owns mode through the design-system runtime** (`<ThemeInjector seed>` + `<ThemeMode>`, the
  canonical host — e.g. this repo's tmmaf `app/layout.tsx`) → `ThemeInjector` emits the swappable token
  VALUES as a `<style>` block (`:root` + `[data-theme]`); `ThemeMode` (attribute mode) flips
  `data-theme` on `<html>`. The surface's mode toggle **drives THAT provider** through the design-system's
  `useThemeMode()` hook (the `useReviewMode` bridge). Do **not** inject a second, competing provider —
  two providers writing `data-theme` overwrite each other and the switch breaks: **ONE provider**. (A
  legacy raw-`next-themes` host is recognized too and driven the same way.)
- **No host provider exists** → the surface calls `useThemeMode()` and so REQUIRES a host `<ThemeMode>`;
  add the design-system runtime (`<ThemeInjector seed>` + `<ThemeMode>`) — the single provider the app needs.
- **`ThemeFontLinks` already mounted** → reuse it; **not mounted** → mount it once.

The scaffold (`scaffold/review-app/scaffold-review-app.ts`) **reads `layout.tsx` before patching**: it
replaces its own marker-guarded blocks in place, detects an UNMARKED hand-mount of `ThemeFontLinks`
and leaves it untouched (no double-mount), and never adds a provider the host already has. The
principle, stated once: **detect-existing-and-adapt; mount only what's missing; implement as a real app
would (ONE provider, via the design-system runtime) so the app is actually up-and-running after authoring.**

## Popovers are Radix, collision-aware

Any popover/menu/tooltip on the surface (the per-node feedback popover, the theme menu, the lightbox
controls) is a **Radix** primitive with **collision-aware** placement — it flips/shifts to stay in the
viewport near a screen edge, never clips or renders off-screen. This keeps the feedback affordance
usable at every node, including the ones pinned to the panel edges where a naive popover would be cut
off. (The components *under review* stay pure; this is surface scaffolding, L17.)

## The HARD GATE out (G6)

**This stage cannot advance to host adoption (Stage 8) until the operator's `feedback.json` is all
✅ for every in-scope unit AND impeccable has no open critical/major Fix — AND the current stage's
gate (Stage 1 foundations → Stage 2 building blocks → Stage 3 pages) is accepted before the next
stage's content is built.** Returned deltas loop back to Stage 4/5; they do not get waved through, and a later stage is
never built ahead of an earlier accept.

A green test suite and a sub-agent "PASS" are *necessary-not-sufficient* and are never this gate. The
operator's verdict is the only fidelity authority, and it gates host adoption — the host page is
confirmed by re-running this same surface on the host page at Stage 8 (C8). Encoding the human as the
gate, with sub-agents capture-only, is the whole point of the stage.

## Both modes, both panels — non-negotiable coverage

The surface renders **light + dark stacked** for every specimen (Rule 5: drift hides in the mode you
didn't look at) and runs **both panels**:

- **SOLO** — every component across its design-relevant states, each beside its reference slice.
  *Answers: does each primitive paint the intent, in both modes?*
- **MOCKUP** — those components composed into a page mirroring a reference screen, pinned
  side-by-side at matched width. *Answers: does the composed page read with the mockup's feel?* — this
  is where ~67% of drift hid (L10) and where sub-agents falsely passed (L16).

The surface is a host-style artifact, so it MAY use its own scaffolding CSS for the split-frame and
wipe (L17 applies); the components under review stay pure.

## Deterministic outputs vs nudge-knobs

Per the determinism contract (`../references/determinism.md`): for the review intent, the structure,
coverage, and the two confirmations are the same every run; only the recipes steer the specifics.

**Deterministic outputs (always produced).**
- A self-contained `file://`-openable `review.html` rendering **RenderEngine node trees** (SOLO +
  MOCKUP, light + dark stacked, draggable A/B wipe, reference side-by-side, click-to-zoom) — plus
  `manifest.json` listing every `data-capture-id` at its granularity (`<unit>` overall / `<unit>/<part>`).
- A whole-surface theme/mode switcher wired at the surface root that re-themes **every** node tree
  (all specimens + all screens), never a single tile — and, where the host already owns mode, it
  **drives the host's existing provider** (ONE provider; detect-existing-and-adapt, never duplicate).
- Radix, collision-aware popovers/menus for every node-level affordance (feedback, theme, lightbox).
- Mechanical captures per `id × mode × viewport`, with zero console errors.
- **Both** confirmations always run: an impeccable report **and** an operator `feedback.json`
  (verdicts addressable at overall *and* part granularity). Neither is skipped because a run "looked fine".
- The G6 gate: operator all-✅ + no open impeccable critical/major Fix, **for the current stage**, with
  the stage sequence honored (Stage 1 foundations → Stage 2 building blocks → Stage 3 pages, one at a time).
- Accepted trees are **seedable** — the output is app data the RenderEngine can emit, not just an image.

**Nudge-knobs (the bounded places judgment enters).**
- `../recipes/states-recipe.json` — which states are design-relevant per component (Stage-1 foundations).
- `../recipes/screen-recipes.json` — which reference screens to reconstruct as MOCKUP pages (Stage-3
  pages; built only after Stage 2 building blocks are accepted).
- The **stage** being reviewed (1 foundations / 2 building blocks / 3 pages) and the **granularity** a verdict targets
  (overall vs part) — bounded picks, not freeform, and gated by the prior accept.

These recipes plus the stage/granularity selection are the **only** judgment in surface generation;
everything downstream (registry introspection, node-tree build, theme inlining + whole-surface
re-theme, collision-aware popovers, reference pairing, manifest, capture) is mechanical. They ship as
brand-overridable defaults — bounded knobs (pick states / pick screens / pick stage / pick granularity
into fixed slots), never unbounded freeform.

## Learnings this stage enforces

- **L16** — sub-agents don't judge fidelity. The entire design: surface + impeccable + **operator**;
  sub-agent capture-only; the scripts emit zero verdict.
- **L13** — green gates validate existence, not paint/leaks. The visual gate sits *after* the green
  build precisely because the build can't see paint.
- **L10** — components own identity application; the MOCKUP panel catches composition drift the SOLO
  panel can miss.
- **L15** — verify before re-acting; the loop re-captures only touched ids.
- **L1 / Rule 5** — a theme is not a palette, and light + dark are both first-class; the surface
  foregrounds geometry/elevation/motion/rhythm in both modes at once.

References: `../references/hard-rules.md` (Rule 5, light-dark), `../references/determinism.md`,
`../references/completeness-contract.md` (in-scope units come from the recompose coverage map).
