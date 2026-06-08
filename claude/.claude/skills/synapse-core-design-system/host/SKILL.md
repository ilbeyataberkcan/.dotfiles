---
name: synapse-core-design-system-host
description: Stage 8 sub-skill of synapse-core-design-system — adopt the approved packages into a host app by feeding brand through the seed, recomposing host blocks, and adding host-owned custom CSS only where Tailwind can't reach. Read-loaded by the parent when host runs; not separately invokable. Package defaults stay untouched.
---

# host — Stage 8, host adoption

> Sub-skill module, Read-loaded by the parent (`synapse-core-design-system`) when Stage 8 runs. Not a
> top-level skill — the parent pulls it in by path. Set `SKILL="$HOME/.claude/skills/synapse-core-design-system"`
> once per run if it isn't already set.

The packages are approved and fidelity-confirmed (Stage 6 / C6). This stage makes a real host app
*wear* the brand: the host feeds its seed, the host recomposes its own screens against the design,
and — only where Tailwind genuinely can't express something — the host owns a little custom CSS. The
discipline that makes the whole skill worth running lives here: **the package never learns the host's
name.** A brand reaches the package through the seed and the codegen that emits from it, never by a
hand-patched value in a neutral default (Rule 3, `../references/hard-rules.md`). That neutrality is
what lets one package serve many Synapse-Core (`@synapsys-integrated`) apps — break it and the next
app inherits this app's brand by accident.

## Responsibility · inputs → outputs

**Responsibility.** Adopt the approved packages into a host: seed-feed the brand, recompose host
blocks under the same hard rules, decide host custom CSS only where Tailwind can't reach — with the
package defaults provably unchanged (L5, L9, L14, L17).

**In.** Approved + confirmed packages · the host repo · the `.synapse-core-design-system.md` intent
file + intent ledger (from intake/digest) · the host's `ThemeSeed`.

**Out.** A re-themed host whose screens match the reference, package defaults byte-for-byte untouched,
the regen gate green, the host leak re-scan clean, and operator host-fidelity sign-off (C8).

## Ordered steps

Each deterministic sub-step EXECUTES a shipped script — do not hand-compute what a script owns
(re-deriving OKLCH, hand-writing theme CSS, eyeballing a leak grep) wastes tokens and drifts from the
package math (L9). Judgment sub-steps are marked **[LLM]**.

1. **Regenerate the host theme from its seed — EXECUTE, never hand-write CSS.** The host's brand is in
   its `ThemeSeed`; the theme CSS is *emitted*, not authored. Run the host-seed regen, which wraps
   `emit-theme-css` on the host seed and greps that the seeded tokens actually reach the generated CSS
   (the L9 "seed + codegen move together" proof — a seed value that never reaches a `--var` is a
   silent failure):

       bun "$SKILL/scripts/host/host-regen.ts" --host <host-repo-root> --out <host/theme.generated.css> --expect <token,token>

   It runs the host's own `tokens:generate` (emit-theme-css on the host seed) and then greps `--expect`
   for the seeded token substrings that MUST reach the generated CSS — a missing one fails the gate.
   (`--out` is relative to `--host`; add `--no-regen` to grep an already-written CSS without regenerating.)
   Read the summary it prints; do not `cat` the CSS into context.

1a. **Detect the host's existing theme wiring FIRST — adopt into what's there, never duplicate it.**
    We adopt into **existing** apps, not greenfield, so read the host root layout (`app/layout.tsx`)
    *before* patching anything and **mount only what's missing**:
    - **The design-system runtime is already mounted** (the canonical host — `<ThemeInjector seed>` +
      `<ThemeMode>`, as in this repo's tmmaf `app/layout.tsx`) → the host already owns mode. `ThemeInjector`
      emits the swappable token VALUES as a `<style>` block (`:root` + `[data-theme]`, per-request SSR,
      inspectable); `ThemeMode` (attribute mode) flips `data-theme` on `<html>` on the client. The review's
      mode toggle **drives THAT provider** through the design-system's `useThemeMode()` hook (the
      `useReviewMode` bridge) — do **not** inject a second/competing provider. Two providers fighting over
      `data-theme` is exactly what breaks the switch (one writes, the other overwrites): **ONE provider.**
    - **A legacy `ThemeProvider` exists instead** (e.g. raw `next-themes`, `attribute="data-theme"`) → it is
      detected and driven the same way, but the recommended path is to migrate the host onto the
      design-system runtime (`ThemeInjector` + `ThemeMode`) so theming flows *through the package*, not a
      bypass — the package owns `ThemeScope`, `ThemePersistence`, font links, and the swappable seed.
    - **No theme provider exists** → the review calls `useThemeMode()` and therefore REQUIRES a host
      `<ThemeMode>`; add the design-system runtime (`<ThemeInjector seed>` + `<ThemeMode>`) — the single
      provider the app needs to be up-and-running.
    - **`ThemeFontLinks` already mounted** → reuse it (don't add a second mount). **Not mounted** →
      mount it (step 1b).
    The principle: **detect-existing-and-adapt; mount only what's missing; implement as a real app would
    (ONE provider, via the design-system runtime) so the app is actually up-and-running after authoring.**
    The scaffold encodes this — it reads `layout.tsx`, recognizes `ThemeMode`/`ThemeInjector` (and a legacy
    next-themes/`ThemeProvider`) as the host provider, and for the font loader replaces its own marked block
    in place but leaves an UNMARKED hand-mount untouched (no double-mount). Never add a provider the host
    already has.

1b. **Mount the package font loader so the seed fonts actually LOAD — EXECUTE the wiring.** The
    generated CSS *names* the brand families via `--var`s; it does **not** fetch the bytes. Naming ≠
    loading. The host must mount `ThemeFontLinks` from `@synapsys-integrated/cve-design-system` **once**
    in its root `<head>` so every `source:'google'` role becomes a `css2` request and every
    `source:'custom'` role an `@font-face` — but **only if it isn't already mounted** (step 1a):

        import { ThemeFontLinks } from '@synapsys-integrated/cve-design-system';
        // host root layout <head>, mounted once:
        <ThemeFontLinks seed={seed} />   // or fonts={seed.fonts}; pass nonce={cspNonce} if the host sets CSP

    **This is the LOADING layer and it is decoupled from the mode-switcher** — the theme/mode toggle
    re-themes colors and must never be what loads fonts; font loading is mounted once at the root and
    is independent of which mode is active. A host seed that names `Barlow Condensed` with no mounted
    `ThemeFontLinks` silently falls back to a system face — the "named ≠ loaded" gap, invisible to a
    green build and to the color stage. Confirm the loader is mounted (grep the root layout for
    `ThemeFontLinks`) before the host-fidelity review (step 6), or the brand type won't render.

2. **Recompose the host blocks** — **[LLM]**, the brand-specific judgment, steered by the nudge-knobs
   below. Apply the same hard rules the packages were built under (`../references/hard-rules.md`):
   - **One signal CTA per screen.** The host picks where the single accent-weight call-to-action
     lands; everything else is quieter. Recompose, don't rewrite (Rule 4) — reach the look through
     existing variants and Tailwind composition, never by forking a package primitive.
   - **Borders stay state-only; NO hairlines.** Separation at rest = elevation (shade + shadow +
     radius + breathing room), never a resting outline (Rule 1). A border is allowed only under
     hover/focus/active/selected. Hairlines (`variant="hairline"`, `data-cve-look~="hairline"`,
     `look:["hairline"]`, a resting `border-subtle`/`border-default` bound) are **banned by default** —
     the only permitted resting outline is one the operator explicitly asked for, marked
     `cve-allow-hairline`. `audit-elevation` fails on any unmarked resting outline or hairline token.
   - **Currency, locale, and number formatting are host-fed.** The host supplies locale/currency at
     the call site (`Intl.NumberFormat(undefined, …)`, host-provided currency) — the package formatter
     stays neutral (L14). This is exactly where neutrality leaks hid before, so it's load-bearing.
   - **Both modes at once.** Realize each host screen in light *and* dark together (Rule 5) — drift
     hides in the mode you didn't look at.

3. **Decide host custom CSS — only where Tailwind can't reach** — **[LLM]**. Some design intent has no
   Tailwind utility (a bespoke gradient mask, a clip-path, a scroll-driven transform). That CSS is
   **host-owned and justified** (L17): it lives in the host, the packages stay Tailwind-only, and each
   rule carries a one-line reason for why a utility couldn't express it. If you reach for custom CSS to
   restyle a *package* primitive, stop — that's a recomposition you skipped, not a CSS gap.

4. **Re-scan the package defaults for leaks — EXECUTE.** Confirm Stage 2/3 neutrality survived
   adoption: the host must not have smuggled `tr-TR` / `toLocaleString` / a currency glyph / a brand
   hex / a brand font into a package default while wiring things up:

       bun "$SKILL/scripts/audit/audit-leak.ts" --scan <package/src> --brand-hex <#hex> --brand-font <Family>

   Exit 1 means a brand leaked into a neutral default — that is a Rule-3 violation, not a nit. Fix it
   by moving the value to the host seed, then re-run.

5. **Gate the host build — EXECUTE.** Build + typecheck + tests on the host. Green here means
   *existence*, not fidelity (L13) — it's necessary, never sufficient. Use the parent's build gate:

       bun "$SKILL/scripts/build/gate-build.ts" --root <host>

6. **Confirm host fidelity — re-run the review surface, then the operator signs off** — the HARD GATE.
   Reuse the Stage-6 machinery: Read `../review/SKILL.md` and run its `build-review-surface` +
   `capture-renders` against the **host page** (the constructed-screen MOCKUP mode, host screens
   side-by-side with the reference, light + dark, A/B-wipe). Route critique to `Skill → impeccable` for
   a Keep/Fix report, then the **operator** opens `review.html` and works the checklist into
   `feedback.json`. The operator is the only fidelity authority (L16) — a sub-agent screenshot, a green
   build, and an impeccable "looks good" are all necessary-not-sufficient. Any ❌/⚠️ loops back to step
   2 (recompose at the right layer), regenerate is cheap, re-capture only the touched ids.

## Hard gate (G8) — the stage can't advance until…

- the host's screens match the reference in **both modes**, confirmed through the review surface and
  **operator host-fidelity sign-off (C8)** — the only fidelity authority (L16);
- **zero package-default edits** — the leak re-scan is clean and the defaults are provably untouched
  (Rule 3 / L5, L14);
- the **regen gate is green** — `host-regen --check` shows no stale diff and every seeded token reaches
  the generated CSS (L9);
- the **font loader is mounted** — `ThemeFontLinks` is in the host root `<head>`, so seeded
  `source:'google'`/`'custom'` families actually load (named ≠ loaded), decoupled from the mode-switcher;
- **exactly ONE theme provider** — the host's `ThemeMode`/`ThemeInjector` runtime (or a legacy
  `ThemeProvider`) was detected and driven via `useThemeMode`, never duplicated; the app is
  up-and-running with a single provider (no competing-provider switch breakage);
- any host **custom CSS is justified** and host-owned; the packages stayed Tailwind-only (L17).

Until C8 is signed and the leak/regen gates are green, the engagement does not close — a green host
build alone never advances this stage (L13).

## Learnings this stage enforces

- **L5 — never patch a brand into a neutral package.** Brand reaches the package only through the seed
  (Rule 3); steps 1 and 4 prove the defaults stayed neutral.
- **L9 — seed and codegen move together.** `host-regen --check` is the proof the seed actually emits
  (no stale CSS, no orphaned seed token).
- **L14 — neutrality leaks hide in formatters.** Host-fed `Intl.NumberFormat(undefined)` / currency at
  step 2; `audit-leak` catches a leaked `tr-TR` / currency glyph at step 4.
- **L17 — host custom CSS where Tailwind can't reach.** Step 3 keeps bespoke CSS host-owned and
  justified; packages stay Tailwind-only.
- **L16 — sub-agents don't judge fidelity.** Step 6 / G8 puts the operator at the gate; capture is
  mechanical, judgment is impeccable + human.
- **Detect-existing-and-adapt (host adoption).** We adopt into existing apps — step 1a reads
  `layout.tsx` and mounts only what's missing; an existing provider — the `ThemeMode`/`ThemeInjector`
  runtime (or a legacy `ThemeProvider`) — is driven via `useThemeMode`, not duplicated (ONE provider, or
  the mode switch breaks); an existing `ThemeFontLinks` is reused.

## Deterministic outputs vs nudge-knobs

Per the determinism contract (`../references/determinism.md`): same intent → same structure, coverage,
guarantees, and pipeline. Creativity enters only through the named knobs below — no silent variability.

**Deterministic outputs (always produced for the intent).**
- A re-themed host whose theme CSS is *emitted* from its seed, with **zero package-default edits**, and
  the `ThemeFontLinks` loader mounted once in the root so the seeded fonts actually load (named ≠
  loaded; the loading layer, decoupled from the mode-switcher).
- An **adopted-not-duplicated** root: the host's existing theme wiring (the
  `ThemeMode`/`ThemeInjector` runtime or a legacy `ThemeProvider`, plus `ThemeFontLinks`) is detected and
  reused/driven via `useThemeMode`; only what's missing is mounted; the app runs with ONE provider
  (detect-existing-and-adapt).
- The regen gate (`host-regen --check`) green and the host leak re-scan clean — gate **G8**.
- The Stage-6 review surface re-run on the host page + **operator host-fidelity sign-off (C8)**.
- The host build/typecheck/tests green (existence, not fidelity).

**Nudge-knobs (the bounded places judgment enters).**
- **Which host blocks to recompose, and how** — the single signal CTA per screen, host-fed
  currency/locale, borders kept state-only. Bounded by the hard rules.
- **The host `ThemeSeed` values** — the brand the operator feeds (an interview/seed input), poured into
  the fixed 13-slot shape; the *structure* is deterministic, the *values* are the knob.
- **The host custom-CSS decision** — only where Tailwind can't reach, each rule justified (L17). A
  bounded escape hatch, not a license to restyle package primitives.

References: `../references/hard-rules.md`, `../references/completeness-contract.md`,
`../references/determinism.md`, and `../review/SKILL.md` (the surface this stage re-runs for C8).
