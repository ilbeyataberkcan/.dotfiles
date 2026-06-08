# Hard rules — the 5 recomposition invariants (+ elevation-not-outline)

These are the non-negotiable invariants every recomposition holds. They are not style preferences;
each one is a lesson that already cost an engagement when it was violated, so each is also an
exit-code gate somewhere in the pipeline (the script that enforces it is named in parentheses). Cited
by `recompose/SKILL.md` (Stages 4–5), `audit/SKILL.md` (Stage 7), and `host/SKILL.md` (Stage 8).

## Why these are rules, not guidance

A theme is not a palette (L1). The first engagement copied the colors and called it "themed" — and
the geometry, elevation, motion, rhythm, type, motif, and voice never arrived. The fix was to encode
the judgment that *did* land as invariants the next run can't skip. If you find yourself wanting to
relax one of these, that is the signal to stop and raise it with the operator, not to proceed.

## Rule 1 — Separation by elevation, not by outline; NO hairlines (elevation-not-outline)

Separation = **ELEVATION**: shade + shadow + radius + breathing room. A resting surface earns its
boundary from that surface ladder, never from a drawn line. **An outline is STATE-ONLY** — allowed
under `hover` / `focus` / `active` / `selected` / an explicit state, and **never** as a resting bound.
A border at rest flattens the hierarchy and reads as a wireframe, not a product.

**Hairlines are BANNED by default — everywhere, not just on cards.** A hairline is any resting drawn
edge used as separation: `variant="hairline"`, `data-cve-look~="hairline"`, `look:["hairline"]`, a
`hairline:` cva key, or a resting `border` + `border-subtle`/`border-default` used as a bound. The
*only* time a hairline (or any resting outline) is permitted is when **the operator explicitly asks
for one** — at which point it carries an explicit opt-in marker (`cve-allow-hairline`) so the
exception is visible and auditable. There is no standing "hairline look" anymore; the prior "hairline
is allowed" carve-out is **removed**. Single-side seams between two stacked surfaces (`border-b` /
`border-t` dividers inside one component) are not bounds and are out of scope — the ban is about
encapsulating resting outlines, not internal dividers.

**Why this is a hard rule, not a taste call.** The first realization passes still defaulted cards to a
resting outline and the whole surface read flat — a wireframe of the product, not the product. Once
*one* hairline is sanctioned as a resting look, it spreads (header underline, card edge, panel border)
and the elevation language dies by a thousand cuts. Banning it by default — and forcing an explicit,
marked opt-in for the rare real case — keeps elevation the *only* resting separation language and
makes any exception a deliberate, reviewable choice rather than a silent default. This holds in light
**and** dark (Rule 5): a hairline that "reads fine" in dark often dissolves or boxes-in in light.
*Enforced by* `audit-elevation.ts`: a resting element bounded by a border/outline OR any hairline
token fails, unless under a state prefix or carrying the explicit `cve-allow-hairline` opt-in.

## Rule 2 — Generic naming, no domain words

Primitives and tokens are named for what they *are* in a design system (`accent`, `surface`,
`signal`), never for the domain that happens to consume them first (no event/federation/sport words
in a reusable package). Domain words leak the host into the package and block reuse.
*Enforced by* `audit-naming.ts` against the domain-word denylist.

## Rule 3 — Brand is fed, never patched (brand-fed)

A brand reaches the package through the **seed** (and the codegen that emits from it), never by
hand-patching a brand value into a neutral default. Defaults stay achromatic and locale-free; the
seed carries the brand. This is what lets one package serve many Synapse-Core apps.
*Enforced by* `audit-leak.ts`: any `tr-TR` / `toLocaleString` / currency glyph / brand hex / brand
font in the defaults fails. Back-compat proof: no-seed → defaults must stay green.

## Rule 4 — Recompose, never rewrite (recompose-not-rewrite)

Realize the reference by **recomposition** in this preference order: variant-of-existing ≻
compose-tailwind ≻ new-primitive ≻ wrap-radix. Do not rewrite a primitive from scratch when a variant
reaches it, and never rename a registered key. A rewrite throws away the contract the rest of the
system depends on; a recomposition extends it.
*Enforced by* the coverage map gate (G4) + `audit-naming.ts` (no registered-key rename) +
single-root-per-family in `gate-build`.

## Rule 5 — Light and dark are both first-class (light-dark)

Every primitive and every screen is realized in **both modes at once**, never light-first with dark
as an afterthought (or vice-versa). Drift hides in the mode you didn't look at — the light-mode badge
dissolution and the split-hero light collapse were both real catches that a single-mode pass missed.
*Enforced by* the review surface rendering light + dark **stacked** (Stage 6) + WCAG status-fg gated
in both modes (Stage 3, `contrast-check`).

## How they compose

Rules 1 and 5 are about *paint* (what the eye sees at rest, in both modes — elevation does the
separating; hairlines/resting outlines are banned unless the operator explicitly opts in). Rules 2 and 3 are about
*neutrality* (the package owes nothing to its first consumer). Rule 4 is about *method* (extend the
contract, don't fork it). Together they are the difference between "the colors got themed" and "the
intent got realized." Green tests confirm existence, never these — fidelity is confirmed by the review
surface + impeccable + the operator (L16).
