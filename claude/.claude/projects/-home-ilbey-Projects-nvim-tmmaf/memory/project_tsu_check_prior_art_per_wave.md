---
name: project_tsu_check_prior_art_per_wave
description: Before planning any tmmaf wave, audit what already ships — W7 shrank by most of a wave once the code was actually read
metadata:
  type: project
---

**Check the tree for prior art BEFORE planning a wave.** In the Tournament Systems Update this kept
paying out:

- **W7 (medals) collapsed from "build a medal system" to "add a handout screen + club rankings."**
  Already shipped: `event_draw_setup.third_place_bout`, `bout.is_bronze` (unique per bracket), the
  R5.8 mint gate refusing bronze when a semi is a bye, `derivePlacements` (the documented SINGLE
  owner of the rule), `bracket_placement` with versioning + voiding, medal data, xlsx, PDF, print.
- **The DQ card needed no schema at all** — `weigh_in.outcome = 'disqualified'` is already a real
  value; the live CHECK admits it and 12 rows carried it. Only the schema *comment* was stale.
- **`weigh_in_claim`** already implements server-authoritative one-desk-per-athlete claiming, so the
  referee-takeover dialog rides existing SSE (`use-versioned-state.ts`) rather than a new mechanism.
- Conversely the audit also finds **conflicts**: the shipped placement rule is SHARED BRONZE while
  the federation's new rule is deterministic 3rd/4th — the plan silently assumed agreement.

**How to apply:** one agent per wave inside the wave Workflow, classifying every requirement as
ALREADY_BUILT / PARTIAL / MISSING with `file:line`, then **adversarially refute every ALREADY_BUILT
claim** — an over-claim cancels work that genuinely needs doing, which is the expensive direction.
Prefer PARTIAL when unsure. Use `graphify query` over grep sweeps.

Related: [[feedback_wave_cadence_pause_and_compact]], [[project_graphify_scope_code_and_docs]],
[[feedback_verify_db_state_not_docs]].
