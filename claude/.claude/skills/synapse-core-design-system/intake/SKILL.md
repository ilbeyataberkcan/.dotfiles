---
name: synapse-core-design-system-intake
description: Stage 0 of synapse-core-design-system, Read-loaded by the parent when intake runs. Owns the translation seam — interview the 5 brand dimensions, usage policies, and package↔host split, then locate the EMITTED ground-truth output. Not separately invokable; the parent pulls it in by path.
---

# intake — Stage 0: own the translation seam, locate the ground truth

> Sub-skill module, Read-loaded by `synapse-core-design-system/SKILL.md` when Stage 0 runs. Not a
> top-level skill. Set `SKILL="$HOME/.claude/skills/synapse-core-design-system"` once for the run.

## Responsibility

Stage 0 is the seam where a human's design intent becomes a machine-readable contract. Everything
downstream — the digest, the drift diagnosis, the widened seed, the recomposition — reads the two
artifacts this stage produces. If the seam is wrong, every later stage faithfully realizes the wrong
thing. So intake does two jobs, and refuses to advance until both are solid:

1. **Elicit the intent** the code can't tell you (L6 — interpretation is *authored*, never inferred
   from an existing codebase). A design system's geometry, elevation, motion, rhythm, type, motif,
   and voice are choices a person made; you capture them from the operator and the reference, not by
   reverse-engineering whatever the current code happens to do.
2. **Locate the EMITTED ground truth** (L7 — you diagnose from what the system actually renders, not
   from source intent). The generated theme CSS, the component registry, and the package `src` tree
   are the surfaces later stages compare against. Resolving their real paths now is what lets
   `diagnose` read `theme.generated.css` instead of guessing.

**In → Out.** operator pointers + the repo → a `.synapse-core-design-system.md` context file (fixed
sections) + a located-paths manifest (`intake-paths.json`).

**Why these two, not one.** The context file is *what the brand wants*; the manifest is *where the
truth lives*. Separating them keeps the human-authored intent reviewable on its own (checkpoint C0)
and keeps the path resolution mechanical and re-runnable.

## Steps

### 1 · Locate the emitted ground truth — EXECUTE the script, don't hand-walk the tree

Finding the generated theme CSS, the registry, and the package `src` is a deterministic search, not
a judgment call — so run the shipped locator rather than globbing by hand (re-deriving the walk wastes
context and drifts run-to-run). Pass the repo root and, when the operator gave one, the design-system
dir; never hardcode paths inside the script — targets arrive as args:

    SKILL="$HOME/.claude/skills/synapse-core-design-system"
    bun "$SKILL/scripts/intake/intake-locate.ts" --root <repo-root> [--reference <design-system-dir>] --out <out-dir>/intake-paths.json

Read the JSON it writes (it prints a clean summary; do not `cat` the file into context). It resolves
the emitted `theme.generated.css`, the component registry, the package `src` root(s), and the host
app root, each with a `found | ambiguous | missing` status.

- **`found`** for every required surface → proceed.
- **`ambiguous`** (more than one candidate) → *this is a nudge-knob*: present the candidates to the
  operator and let them pick; re-run with the chosen path as an explicit flag. Don't guess silently.
- **`missing` for the emitted theme CSS** → stop. This is the L7 ground-truth, and `diagnose` cannot
  run without it. Surface it to the operator (it may need generating first) before advancing.

### 2 · Interview the 5 brand dimensions + policies + the split — *LLM judgment*

This is the irreducibly human part: ask the operator for what the code can't tell you. The *structure*
of the interview is fixed (so every engagement captures the same dimensions); the *answers* are the
operator's to author. Cover, in order:

- **The 5 brand dimensions** beyond the palette — geometry, elevation, motion, rhythm, and type/voice.
  A theme is not a palette (L1); the last engagement copied colors and these never arrived. Ask
  concretely: how sharp or soft is the geometry? Does separation come from shadow or hairline? What's
  the motion temperament? Where does emphasis fall? What does the type want to say?
- **Usage policies** — locale and currency posture, density, accessibility floor, any motif the brand
  leans on. These become the leak-gates later (a package owes nothing to its first consumer).
- **The package↔host split** — what belongs in the reusable `@synapsys-integrated` package (neutral,
  brand-fed) versus what is host-specific (the brand seed, host blocks, locale-bound formatting). This
  decision steers every later "which layer does this fix go in" call.

Use `AskUserQuestion`-style prompts; prefer a few sharp questions over a long form. Where the
reference design system or mockups already answer a dimension, read it back for confirmation rather
than re-asking — but the operator confirms; you don't infer it as settled.

### 3 · Author the `.synapse-core-design-system.md` context file — *LLM judgment, fixed sections*

Write the interview into the context file at the repo root. The section set is deterministic so
downstream stages always find what they need; the content is the operator's authored intent:

- `## Audience & voice`
- `## Brand dimensions` (geometry · elevation · motion · rhythm · type/voice)
- `## Usage policies` (locale/currency · density · a11y floor · motif)
- `## Package ↔ host split`
- `## Located paths` (a pointer to `intake-paths.json` — the manifest stays the machine surface)

This file is the L2 artifact: non-token intent made explicit, named, and reusable — not left in chat
scrollback or a reviewer's head, which is exactly the failure L2 records.

### 4 · Operator confirm (C0) — the read-back before any code

Read the context file back to the operator and get explicit sign-off (checkpoint C0). This is a
blocking human pause, never auto-advanced: because interpretation is authored (L6), the operator is
the authority on whether the read-back is right *before* a single line of code is written. Cheap to
correct here; expensive once the seed and primitives are built on a wrong premise.

## Hard gate out (G0)

Stage 0 cannot advance to digest until **both** hold:

1. The `.synapse-core-design-system.md` context file is **operator-confirmed** (C0) — audience, the 5
   dimensions, policies, and the package↔host split read back correct.
2. The **emitted ground-truth path is resolved** — `intake-paths.json` reports the generated theme CSS
   as `found` (and the registry + package `src` resolved).

A missing emitted-theme path or an unconfirmed context file is a gate failure, not a warning. The
parent does not proceed to Stage 1 until G0 is green.

## Deterministic outputs vs nudge-knobs

Per `../references/determinism.md` — same intent, same structure/coverage/guarantees; creativity
enters only through bounded knobs, never silently.

**Deterministic outputs (always produced for an intake intent):**
- A `.synapse-core-design-system.md` with the **fixed section set** above (audience/voice, the 5 brand
  dimensions, usage policies, package↔host split, located-paths pointer).
- An `intake-paths.json` manifest resolving the emitted theme CSS, registry, package `src`, and host
  root, each with a `found | ambiguous | missing` status.
- Operator checkpoint **C0** is always raised before any code, and gate **G0** always blocks until the
  context is confirmed and the emitted ground-truth path is resolved.

**Nudge-knobs (the bounded places the operator steers specifics):**
- **The interview answers** — the 5 dimensions, the usage policies, the package↔host split. Authored
  content; the structure that captures them is fixed.
- **Path-override flags** — `--reference <dir>` and the explicit `--package` / `--host` path flags that
  override auto-location, and the operator's pick when `intake-locate` reports `ambiguous`.

## Learnings this stage enforces

- **L6 — own the translation seam.** Intake is a first-class mandatory stage, not "use the design
  system as-is"; intent is interviewed and authored, never inferred from code.
- **L7 — diagnose from emitted output.** Resolving the generated `theme.generated.css` path here is
  what lets `diagnose` read what the system actually renders.
- **L2 — non-token intent becomes an explicit artifact.** The context file makes geometry/elevation/
  motion/rhythm/voice and the policies a named, reusable document instead of lost prose.

References: `../references/determinism.md`, `../references/hard-rules.md`.
