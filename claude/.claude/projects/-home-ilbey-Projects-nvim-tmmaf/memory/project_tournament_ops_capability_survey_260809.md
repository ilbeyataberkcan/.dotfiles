---
name: project_tournament_ops_capability_survey_260809
description: "Code-verified survey of the tournament-ops spine (weigh-in→draw→schedule→referee→results) 2026-08-09 — pre-mat is strong, on-mat/post-mat is thin; 6 day-of-breaking findings; report artifact + build order"
metadata: 
  node_type: memory
  type: project
  originSessionId: db42dc2c-885f-4a6b-bec1-c8af6ecbcee5
  modified: 2026-08-10T01:14:15.357Z
---

Full capability + progress survey of the tmmaf tournament-operations spine, run 2026-08-09 on `staging` @ `b8ab5570`. 10 parallel code surveys + adversarial refutation pass on every non-trivial gap (138 agents). Report artifact: **https://claude.ai/code/artifact/62ef16a8-9d7e-4cae-be0e-b72f65a0cd00**. Raw per-area JSON was written to the session scratchpad (ephemeral — the artifact is the durable copy).

**The shape of it:** everything BEFORE athletes reach a mat (admission, weigh-in measurement, draw, schedule) is genuinely federation-grade — server-authoritative, DB-constraint-enforced, fail-closed, audited. Everything DURING and AFTER is thin. Matchday is staff-only *by construction*: no file under `app/app/`, `app/register/`, `app/events/` or `app/[[...slug]]` imports `lib/db/schema/matchday`, so publishing a schedule changes nothing any competitor can observe.

**Six findings that break a real tournament day** (all hand-verified or adversarially CONFIRMED):
1. `lib/matchday/draw.ts:631` — re-draw runs an unconditional `DELETE FROM bout`; `bout_score` + `bout_schedule` cascade, so decided bouts and scorecards die. Guarded by `matchmaking:override` + step-up + a danger dialog, but there is **no refusal when bouts were actually fought** and no impact count.
2. Published-schedule read-only is **client-only** (`canEditNow = grants.canEdit && !published`). No scheduling server action reads `event_schedule.status` as a precondition.
3. `withdrawBout` (lib/scheduling/actions.ts:1308) — the whole day-of withdrawal/no-show chain — is complete, audited, and has **zero callers**. A no-show cannot be recorded anywhere.
4. Transport failures are silent. Domain refusals DO render in a `role="alert"` banner; a network/500 does not — no try/catch on mutations, no `error.tsx` anywhere, referee autosave is `.then()` with no `.catch`.
5. `weighin:*` and `schedule:*` are **global grants, no event dimension**. Referees are the counter-example (bound via `ring_desk`, enforced server-side) — that is the pattern to copy.
6. No medical/stoppage record and no post-KO bar — and propagation **auto-seats a KO'd semi-finalist into the bronze bout the same day**.

**Also true:** `bout.result_note` is read by 3 export paths and written by nothing (SKOR column always blank). No persisted result of record — placements recompute on every read. Scoring has no round dimension and no clock; the winner is typed by hand with no cross-check against the cards the archive tx already holds.

**Watch for over-calling these** (adversarially refuted or narrowed — see [[feedback_fix_all_severity_findings]] on why the verify pass earns its cost): the draw optimizer is NOT unbounded (`getScaledPolicy` is a size-aware governor the host uses); a ruleset binding DOES exist under another name (`discipline_match_format`/`discipline_point_type` via `event_discipline.match_format_id`) — what's missing is rulebook *identity/provenance*; medical *document* validity is fully built (health report expiry engine, blocking gate); deleting an athlete row fails loudly rather than cascading bouts away.

**Why:** the operator asked for this to design and implement the remaining features. The build order in the artifact is sequenced so each block de-risks the next — stop destructive paths → make writes fail visibly → make the day operable → walk it end to end → then round/clock, design, results, visibility.

**SUPERSEDED AS PLAN-OF-RECORD 2026-08-10.** The artifact is now only the *evidence*; the plan lives in the repo at `.planning/tournament-day-operations/` (milestone **Tournament Day Operations**, phases 30–43, merged to local staging as v0.7.1). `DECISIONS.md` there is the scope authority — every finding mapped to the operator's ruling — and all six federation rulings plus six follow-up questions are **closed**. See [[project_tournament_day_operations_milestone]].

**How to apply:** read `.planning/tournament-day-operations/DECISIONS.md` before touching any of this, not the artifact. Corrections to the older matchday memory are recorded in [[project_matchday_design_implementation_milestone]].
