---
name: synapse-core-design-system
description: >-
  Realize a provided design system, UI kit, or mockups in code by digesting their full DESIGN INTENT
  (geometry, elevation, motion, rhythm, type, motif, voice — not just the palette) into a Synapse-Core
  (@synapsys-integrated) package + host through recomposition, not rewrite. Use this skill whenever a
  design system / UI kit / mockup must be faithfully built or audited in code, whenever implemented UI
  has drifted from a reference design, or whenever a "themed" package only got the colors right and the
  geometry, elevation, motion, rhythm, and type never arrived — even if the user does not say
  "design system." Confirms fidelity through an interactive HTML review surface judged by the impeccable
  skill plus the operator, never by a sub-agent screenshot verdict.
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent, Skill, TodoWrite, AskUserQuestion]
metadata:
  argument-hint: "[digest|realize|review|audit|host|learn] [--brand <dir>] [--check]"
  version: 0.1.0
  user-invocable: true
---

# synapse-core-design-system

The foundational design-system capability for building Synapse-Core (`@synapsys-integrated`) apps
faster. It takes a *provided* design system + mockups, digests them, and systematically realizes their
**intent** — not just their palette — into a cve-style package + host by **recomposition, not rewrite**.
Every mechanical step is a shipped Bun/TS script you EXECUTE with args; every judgment step is yours;
and **visual fidelity is confirmed by the operator + the impeccable skill, never by a sub-agent verdict**.

This was learned the hard way: a real engagement copied the colors and called a package "themed," while
the geometry, elevation, motion, rhythm, type, motif, and voice never arrived. This skill encodes the
judgment that *did* land so it repeats — as ordered stages, each behind a gate that caught a distinct
failure.

## Set this once per run

    SKILL="$HOME/.claude/skills/synapse-core-design-system"

`$SKILL` is the skill root. Every script below runs as `bun "$SKILL/scripts/<ns>/<script>.ts" <args>`.

## How the sub-skills load (the confirmed JIT pattern — keep it)

The eight capabilities (`intake`, `digest`, `diagnose`, `color`, `recompose`, `review`, `audit`, `host`)
plus the `learn` closing step each live in their **own subfolder with their own `SKILL.md`**. Claude
Code auto-discovery only registers top-level `~/.claude/skills/<name>/` directories, so these nested
`SKILL.md` files are **not** separately discovered or invokable — they are progressive-disclosure
modules this parent **Read-loads by path** when a stage runs. That is the whole reason this body stays
lean: per-stage depth lives one level down (each sub-skill's own `references/`, `scripts/`, `assets/`),
loaded only when its stage needs it, so no single `SKILL.md` blows the ~500-line budget.

The contract, per stage: *"Stage N (`<sub>`) is starting — Read `$SKILL/<sub>/SKILL.md` now and follow
it."* Each sub-skill names its deterministic outputs (always produced), its nudge-knobs (where your
judgment enters), and the exact scripts to execute. Do not hand-compute what a script owns.

## Mode dispatch

The operator invokes a mode (`argument-hint`: `[digest|realize|review|audit|host|learn]`). A mode is an
**entry point into the same ordered pipeline**, not a different pipeline — earlier gates still hold, so
entering mid-pipeline means confirming the prior gates are green (or running the stages that produce
them) before proceeding.

| Mode | Intent | Enters at | Runs through |
|---|---|---|---|
| `digest` | Understand a provided design system / mockups | Stage 0 | Stages 0–2 (intake → digest → diagnose) |
| `realize` | Build the reference into a package, full pipeline | Stage 0 | Stages 0–7 (the default, end-to-end) |
| `review` | Re-confirm fidelity of already-built primitives | Stage 6 | Stage 6 (+ loop back to 4/5 on deltas) |
| `audit` | Run the convention net on a built tree | Stage 7 | Stage 7 |
| `host` | Adopt approved packages into a host app | Stage 8 | Stage 8 (re-runs Stage 6 surface on host) |
| `learn` | Close out: capture what generalized | Stage 9 | Stage 9 |

When a mode enters mid-pipeline, state which upstream gates you are assuming green and verify them
rather than trusting they happened. Skipping a gate is the failure this skill exists to prevent.

## The 10-stage pipeline (the map — load each sub-skill just-in-time)

Run stages in order. Each row names the sub-skill to **Read-load when you reach it**, the mode-mix
(SCRIPT = execute, LLM = judgment), the hard gate that blocks advance, and ★ where the operator is the
authority. The per-stage detail — the scripts, the steps, the deterministic-outputs/nudge-knobs split —
lives in the sub-skill, not here.

| # | Stage | Read-load when you reach it | Mode-mix | Hard gate out |
|---|---|---|---|---|
| 0 | INTAKE ★ | `intake/SKILL.md` | SCRIPT locate + LLM interview | **G0** context file operator-confirmed (C0); emitted ground-truth path resolved |
| 1 | DIGEST | `digest/SKILL.md` | SCRIPT extract + LLM ledger | **G1** every motif/policy is a ledger row tagged token-vs-policy; nothing left in prose |
| 2 | DIAGNOSE | `diagnose/SKILL.md` | SCRIPT census + LLM classify | **G2** drift report complete; every gap 3-axis classified; seed-is-correct evidence stated |
| 3 | COLOR (widen) | `color/SKILL.md` | SCRIPT ramps/seed + LLM slots | **G3** back-compat green · seed reaches CSS · WCAG both modes · zero brand in defaults · ramps monotonic |
| 4–5 | RECOMPOSE (map → build) | `recompose/SKILL.md` | SCRIPT registry/build + LLM map | **G4** coverage map, no deferred holes · **G5** build/tsc/test green, single root per family |
| 6 | REVIEW ★ | `review/SKILL.md` | SCRIPT surface/capture + impeccable + OPERATOR | **G6** operator `feedback.json` all ✅ + no open impeccable critical/major Fix (the only fidelity gate) |
| 7 | AUDIT | `audit/SKILL.md` | SCRIPT net + LLM triage | **G7** `audit-all` exits zero; carried-forward blockers re-verified live; CRITICAL+HIGH fixed |
| 8 | HOST ★ | `host/SKILL.md` | SCRIPT regen/leak + LLM recompose | **G8** host matches reference (re-run Stage 6 on host, C8); zero package-default edits; regen green |
| 9 | LEARN | `learn/SKILL.md` | SCRIPT append + LLM extract | **G9** ledger updated; every operator delta fixed or filed as a known limitation |

Stages 0–2 are mode `digest`; 3–7 plus 0–2 are `realize`; 8 is `host`; 9 is `learn`. The skill runs
*finer* than the four engagement phases because each gate caught a distinct failure — collapsing them
loses the catch.

**The review design-flow is itself GATED and SEQUENTIAL — never draft a later stage before the earlier
is accepted.** Stage 6 reviews a step-by-step design flow in order: **Stage 1 Foundations** (tokens,
fonts, buttons in SOLO) → *operator accept* → **Stage 2 Building blocks** (composed elements — cards,
pickers/selectors, text — drafted only after foundations are accepted) → *operator accept* → **Stage 3
Pages** (screens/layouts assembled from the building blocks, one page at a time: layout → blocks +
variants → assembly; carried out via Stage 8 / `host`). Jumping ahead — drafting building blocks while
foundations are open, or a page before its blocks — is the exact drift this ordering prevents. (These
design-flow stages are distinct from the pipeline's numbered stages 0–9.) The end-vision: an
**approved** design is a
set of **RenderEngine node trees seedable into an app DB** (a pre-cve-studio design tool), so
"accepted" means "ready to seed," never "looked fine in a screenshot." Detail in `review/SKILL.md`.

## Execute the scripts — never re-derive them

Each sub-skill names its scripts; here is the canonical pattern so the discipline is unambiguous. The
deterministic work (OKLCH math, ramp derivation, theme emission, leak/cascade/token-ref audits, the
review surface, captures) is **shipped Bun/TS the agent runs** — never re-computed in prose. Re-deriving
what a script owns wastes context and drifts from the package's own math, which is the L4/L9 failure:

    bun "$SKILL/scripts/color/derive-ramp.ts" "#d81e0b" --kind accent --check-monotonic --json

Read the JSON it prints; do not `cat` raw theme CSS or pixel data into context. Scripts print a clean
summary or write a sidecar manifest later stages read. The *only* judgment inside a script's domain is
the one the sub-skill explicitly marks as a nudge-knob (e.g. a curated override anchor when
`--check-monotonic` reports `false`). Target inputs — the registry, the src tree, the theme CSS — arrive
as path **args** at runtime; nothing is hardcoded.

## The five hard rules

Every recomposition holds all five. They are not style preferences — each is a lesson that already cost
an engagement, and each is an exit-code gate somewhere downstream. In one line: **(1)** separate by
elevation, **NO hairlines** — outlines are state-only, a resting hairline is banned unless the operator
explicitly opts in (`cve-allow-hairline`); **(2)** generic names, no domain words; **(3)** brand is fed through the seed,
never patched into a default; **(4)** recompose, never rewrite, and never rename a registered key;
**(5)** light and dark are both first-class. If you find yourself wanting to relax one, that is the
signal to stop and raise it with the operator.

Read `$SKILL/references/hard-rules.md` before any build stage (4–8) — it gives the *why* and names the
script that enforces each rule. The completeness rule (no deferred holes — "we'll wire it later" is the
exact bug it prevents) lives in `$SKILL/references/completeness-contract.md`, cited by Stages 4–6.

## The determinism contract

For a given operator **intent**, the skill provides the same **structure / coverage / guarantees /
pipeline / output shape** every run — it is decisive on behavior so future Synapse-Core builds are fast
and repeatable. This is *intent → output* determinism, **not** code → output: the creative specifics
(which ramp anchor, which states are design-relevant, which host blocks to recompose) are meant to
differ — but only through a small set of explicit, **bounded nudge-knobs** (the recipes, documented
flags, and the interview answers). The thing the contract forbids is **silent variability**: the skill
never makes an unannounced creative choice the operator can't see or steer.

Every sub-skill therefore declares two columns — its **deterministic outputs** (always produced for the
intent) and its **nudge-knobs** (the bounded places creativity enters). The full contract is
`$SKILL/references/determinism.md`. If a desired change isn't reachable through a knob, add a knob
deliberately and document it — don't improvise.

## The four operator checkpoints

The operator is the authority at four blocking points — `AskUserQuestion`-style pauses, never
auto-advanced. Sub-agents are permitted in the visual path at exactly **one** place — running
`capture-renders` (mechanical screenshots) — and are forbidden to return a PASS/FAIL verdict on imagery.

| Checkpoint | Stage | What the operator authorizes |
|---|---|---|
| C0 — intent confirm | G0 | The `.synapse-core-design-system.md` read-back (audience/voice/5-dims/policies/split) before any code |
| C6 — package fidelity ★ | G6 | The rendered surface matches the reference's *feel* in both modes. **The only fidelity sign-off.** Gates host adoption |
| C8 — host fidelity ★ | G8 | The host page matches the reference; package defaults untouched; custom CSS justified |
| C9 — learnings | G9 | The skill-delta list (what the skill should add next run). Lightweight |

## The honesty contract (the fidelity gate, stated plainly)

A green test suite proves the code **exists and compiles**. A sub-agent that returns "PASS" on a
screenshot proves nothing — it cannot see the light-mode badge dissolve or the composed page read
unlike the mockup. Both are **necessary-not-sufficient** and **neither is ever the fidelity gate** (L13,
L16). The first engagement passed every green gate and still shipped a wireframe.

Fidelity is confirmed by exactly one loop, owned by Stage 6 (and re-run on the host at Stage 8): the
interactive `review.html` surface (SOLO + MOCKUP, light + dark stacked, A/B-wipe over a matched-width
reference) is judged by the **impeccable** skill (`Skill → impeccable`, the design authority — a report,
not a gate) and then **the operator** (who works the live checklist into `feedback.json` — the gate).
The operator's verdict is the only fidelity authority. Encoding the human as the gate, with sub-agents
capture-only and every script emitting zero verdict, is the point of the whole skill.
