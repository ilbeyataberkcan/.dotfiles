---
name: synapse-core-design-system-audit
description: Stage 7 of synapse-core-design-system — the convention net. Read-loaded by the parent when audit runs. Runs the leak / cascade / token-ref / look-vocab / elevation / intent-primitive / contrast net as one exit-code gate, severity-tiers the findings, and re-verifies every carried-forward blocker against committed source. Not separately invokable; the parent pulls it in by path.
---

# audit — Stage 7, the convention net

> Sub-skill module, Read-loaded by the parent when Stage 7 runs. Not a top-level skill; the parent
> pulls it in by path after the visual gate (Stage 6) signs off and before host adoption (Stage 8).

**Responsibility.** Be the automated net that catches the failures the eye and the test suite both
miss: a brand or locale value leaked into a neutral default, a `var(--…)` that resolves to nothing, a
Tailwind-v4 cascade where the base radius beats a sharp variant, an unknown `look:[…]` token, a
resting element bounded by an outline, an identity primitive that was shipped but never applied, a
status colour that fails WCAG. Each of these passed a green build once and still shipped drift — so
each is an **exit-code gate** here, not a guideline.

**In → Out.** the built package tree (post-Stage-6) → one severity-tiered audit report with a single
pass/fail exit code, plus a live re-verification of every blocker carried forward from earlier stages.

**Why this stage exists (the WHY, not a MUST).** Green tests confirm *existence*, never *paint or
neutrality* (L13). A primitive can exist, type-check, and render while a brand hex sits in its
default, or while its radius silently loses to the cascade. The first engagement's drift survived a
green suite precisely because nothing mechanical was checking the conventions. This stage encodes each
lesson that cost an engagement as a script that fails loudly, so the next run can't re-ship the same
class of bug.

## Scripts owned — EXECUTE the net, don't re-audit by hand

Set `$SKILL` once, then run the orchestrator. It runs the seven checks plus `contrast-check`,
`emit-theme-css --check`, and `icon-index --check`, and returns ONE nonzero exit if any tier fails.
Re-grepping these by hand wastes context and drifts from the shipped logic — the whole point of the
gate is that one command is the source of truth.

    SKILL="$HOME/.claude/skills/synapse-core-design-system"
    bun "$SKILL/scripts/audit/audit-all.ts" --scan <package-src> --theme <theme.generated.css> [--config <audit.json>]

Read the report it prints (and its exit code) silently — do not `cat` raw CSS or source into context;
present a clean per-tier summary. The eight checks `audit-all` orchestrates, each its own gate:

| Check (script) | Catches | Rule / lesson |
|---|---|---|
| `audit-leak.ts` | `tr-TR` / `toLocaleString` / currency glyph / brand hex / brand font in defaults | Rule 3 brand-fed (L14) |
| `audit-naming.ts` | domain words in primitive/token names | Rule 2 generic-naming (L2) |
| `audit-token-refs.ts` | a `var(--…)` / utility that resolves to nothing | silent token failure (L8) |
| `audit-cascade.ts` | base radius co-existing with a sharp-variant radius (v4 cascade bug) | L13 root cause |
| `audit-elevation.ts` | a resting element bounded by border/outline | Rule 1 elevation-not-outline |
| `audit-intent-primitives.ts` | identity primitives shipped but under-applied (the "0/45" census) | L3 |
| `audit-look-vocab.ts` | a `look:[…]` token outside the closed 7-token set | escape-hatch closed |
| `contrast-check` (sub-routine) | status-fg failing WCAG in either mode | Rule 5 light-dark (L1/L4) |

When a blocker was *carried forward* from an earlier stage ("still-live" claim from diagnose or
review), re-verify it against the committed source before acting — a fix may already have landed, and
acting on a stale claim is its own bug (L15):

    bun "$SKILL/scripts/learn/verify-claim.ts" --scan <package-src> --pattern <grep-regex> [--expect present|absent]

## Ordered steps

1. **Run the net (SCRIPT).** Execute `audit-all` over the built package src + the generated theme CSS.
   This is the deterministic spine — every gate fires from this one command.
2. **Re-verify carried-forward blockers (SCRIPT).** For each blocker inherited from Stage 2 / Stage 6,
   run `verify-claim` against committed source. Drop any the source already resolved; keep the rest.
3. **Severity-tier the findings (LLM judgment).** Sort every finding into CRITICAL → HIGH → MEDIUM and
   route each to the layer that owns the fix (package primitive, recipe, seed, or host). This is the
   one judgment sub-step: the *findings* are the script's; the *triage narrative* is yours.
4. **Resolve CRITICAL + HIGH at the right layer (LLM, scoped).** Fix in place by recomposition, not
   rewrite — route a leak to the seed, a cascade mispaint to the variant, an under-applied primitive
   to the component (Rule 4, right layer per L10/L12). MEDIUM may defer only with a recorded
   disposition (out-of-scope or filed known-limitation — see `../references/completeness-contract.md`).
5. **Re-run the net (SCRIPT).** After fixes, run `audit-all` again. The gate is the clean exit, not
   your belief that the fix worked.

## Hard gate out — G7

**The stage cannot advance to host adoption (Stage 8) until `audit-all` exits zero** — meaning zero
leaks, zero dangling token refs, zero cascade-mispaints, every `look:[…]` in the closed vocabulary,
no resting outlines, the intent-primitive census met, WCAG green in both modes — **and** every
carried-forward blocker is re-verified live, with all CRITICAL and HIGH findings fixed. A nonzero exit
is a hard stop, not a warning; the host must never inherit an un-audited package.

Note the boundary with Stage 6: a clean `audit-all` is necessary but **not** a fidelity verdict. It
proves conventions hold, never that the UI matches the reference's feel — that remains the review
surface + `Skill → impeccable` + the operator (L16). This stage and the visual gate check different
things; neither substitutes for the other.

## Deterministic outputs vs nudge-knobs

**Deterministic outputs (always produced for the intent):**
- One `audit-all` report covering all eight checks, with one pass/fail exit code (gate G7).
- A live re-verification of every carried-forward blocker (`verify-claim`), not an eyeballed re-read.
- A severity-tiered finding list (CRITICAL → HIGH → MEDIUM) with each finding routed to a layer, and
  every deferred MEDIUM carrying an explicit disposition — no silent "we'll get to it".

**Nudge-knobs (the bounded places creativity enters):**
- `--config audit.json` — the bounded denylists and requirements: domain-word list, brand hex/font to
  flag, the required identity primitives, the look vocabulary. A closed set fed into fixed slots.
- The severity-tier and routing *narrative* (LLM judgment over the deterministic findings) — how the
  triage reads, never *whether* a check runs or *whether* the exit gates.

Everything else is fixed: the checks that run, the exit-code contract, and the carried-forward
re-verification are the same every engagement. No silent variability (`../references/determinism.md`).

## Learnings this stage enforces
L2 (naming), L8 (token refs), L13 (green ≠ paint/leak; cascade), L14 (leaks hide in formatters),
L15 (verify still-live before acting); guards Rules 1–5 via the check table above.

References: `../references/hard-rules.md`, `../references/determinism.md`,
`../references/completeness-contract.md`.
