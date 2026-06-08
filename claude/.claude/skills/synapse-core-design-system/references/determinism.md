# Determinism contract — intent → output, with bounded nudge-knobs

Cited by every sub-skill. This is the operator's locked decision (SKILL-DESIGN §10.4): for a given
**intent**, the skill provides the same **structure / coverage / guarantees / pipeline / output
shape** — it is decisive on behavior so that future Synapse-Core builds are fast and repeatable. The
*creative details* stay operator-directable through a small set of explicit, bounded **nudge-knobs**.

## What this is — and is NOT

This is **intent → output** determinism, not code → output determinism. Two runs with the same intent
get the same pipeline, the same gates, the same artifact shapes, the same guarantees. They do **not**
get pixel-identical UIs — the creative specifics (which ramp anchor, which states are design-relevant,
which host blocks to recompose) are meant to differ, and they differ only through the nudge-knobs.

The thing the contract forbids is **silent variability**: the skill never makes an unannounced
creative choice that the operator can't see or steer. Every place judgment enters is a named
nudge-knob; everywhere else is deterministic.

## Two columns every sub-skill declares

Each sub-skill's `SKILL.md` states its own two columns. The shape is fixed:

### Deterministic outputs (always produced for the intent)
The structure, coverage, guarantees, and output shape that are the same every run. Examples across
the pipeline:
- intake → a `.synapse-core-design-system.md` with fixed sections + a located-paths manifest.
- digest → the 4-table intent ledger + `digest.json`.
- diagnose → a complete drift report, every gap 3-axis classified.
- color → a widened 13-slot `ThemeSeed` + back-compat tests + WCAG-both-modes gate.
- recompose → a coverage map with no holes (see `completeness-contract.md`) + built families.
- review → a `file://`-openable `review.html` (SOLO+MOCKUP, light+dark) + manifest + the two
  confirmations (impeccable + operator).
- audit → one `audit-all` report with one exit code.
- host → a re-themed host, package defaults untouched, regen gate green.
- learn → an appended L-format ledger entry.

These are non-negotiable. The agent does not get to skip a gate or change an artifact shape because a
particular run "didn't seem to need it."

### Nudge-knobs (the bounded places creativity enters)
The few explicit inputs through which the operator steers specifics. There are exactly three kinds:

1. **The recipes** — `recipes/states-recipe.json` (which states are design-relevant) and
   `recipes/screen-recipes.json` (which screens to reconstruct). Shipped defaults, brand-overridable.
   These are the *only* judgment in review-surface generation.
2. **Documented flags** — the bounded CLI flags the scripts expose (e.g. `--kind accent`, the curated
   override anchor when `derive-ramp --check-monotonic` is false, `--config audit.json` denylists).
3. **The interview answers** — the 5 brand dimensions, usage policies, and package↔host split from
   intake. Content the operator authors; the *structure* that captures them is deterministic.

A knob is **bounded**: it picks among a closed set or supplies a value into a fixed slot. It never
opens unbounded freeform behavior. If a desired change isn't reachable through a knob, that is a
signal to add a knob deliberately (and document it), not to improvise.

## Why this matters

The point of the skill is to pave the road: a Synapse-Core app team should get the same rigorous
pipeline and the same guarantees every time, and spend their judgment only where judgment belongs —
the brand specifics — through knobs that are visible, bounded, and reviewable. Determinism on behavior
is what makes the creativity safe.
