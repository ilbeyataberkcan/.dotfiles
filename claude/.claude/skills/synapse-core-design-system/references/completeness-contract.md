# Completeness contract — no deferred holes

Cited by `recompose/SKILL.md` (Stages 4–6). This is the rule that the coverage map has **no gaps left
as "later"**. It exists because a deferred hole is invisible at build time (tests pass, the page
renders) and only surfaces when a real screen needs the missing piece — by which point the context
that knew about it is gone.

## The contract

For every shape in the reference and every slot in the shell, the coverage map carries an explicit
**disposition** — never a blank, never a "TODO", never a stub. A disposition is one of:

1. **realizedBy** — the strategy that realizes it, in the Rule-4 preference order (variant-of-existing
   ≻ compose-tailwind ≻ new-primitive ≻ wrap-radix). This is the normal case.
2. **out-of-scope (justified)** — the operator explicitly excluded it, with the reason recorded. Not
   "we'll get to it"; a decision, owned by the operator.
3. **known-limitation (filed)** — it can't be realized this run for a stated reason, filed as a
   skill-delta in Stage 9 so the next run inherits it.

A row with no disposition is a gate failure (G4), not a warning. "We'll wire it later" is exactly the
shape of the bug this contract prevents.

## Why no stubs

A stub function, a placeholder variant, a `// TODO: dark mode` — these read as progress but encode
debt that the green build hides. Production-quality means every piece is ready: if it isn't ready,
it's either out-of-scope (a decision) or a known-limitation (filed), and both are visible in the
ledger. The middle ground — silently incomplete — is the one state the contract forbids.

## Enumerate before you build

The shell contract exposes **every** slot (L11), so Stage 4 enumerates all of them up front rather
than discovering them mid-build. Enumerate-then-dispose is cheap and complete; build-then-discover
leaves holes. The coverage map is done when every reference shape and every shell slot has a row, and
every row has a disposition.

## Relationship to determinism

This contract is a **deterministic output** (always produced — see `determinism.md`): the *coverage*
is fixed (all shapes, all slots, all disposed). What varies per engagement is *which* disposition each
row gets — that is a bounded nudge-knob the operator and the reference steer. No silent variability:
every gap is named and dispositioned, even when the disposition is "not this run."
