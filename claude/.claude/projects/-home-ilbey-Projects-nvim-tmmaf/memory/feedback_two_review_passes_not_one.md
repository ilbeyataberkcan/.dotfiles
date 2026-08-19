---
name: feedback_two_review_passes_not_one
description: An adversarial verify pass and an independent /code-review find DIFFERENT defects — run both; the second found 10 more confirmed bugs in each of two waves the first had cleared
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 19d28b25-3265-464a-a020-5ac0463d7678
  modified: 2026-08-10T20:28:48.530Z
---

On tmmaf waves 3 and 4, each wave ran per-lane adversarial verifiers whose only job was to refute
the lane's own claims. They returned 49 and 33 findings respectively, all repaired, gate green.
**A separate workflow-backed `/code-review high` over the same diff then found TEN MORE confirmed
defects in each wave** — not duplicates, and several worse than what the first pass caught.

**Why:** the adversarial verifier checks a lane against *its own claims and its phase spec*. The
code reviewer reads the diff cold, with no claim list to anchor on, so it catches what nobody
thought to claim. Wave 3's reviewer found an unsubmitted draft card rewriting a closed round's
frozen verdict into the immutable audit row, and a KO after a round advance being unarchivable —
both would have broken a live mat. Wave 4's found that a panel rebuild had made a stale SSR value
gate controls, and that its tests passed only because they injected data production never supplies.

**How to apply:** after a wave's verify+repair+gate cycle, run `/code-review high <baseTag>..HEAD`
before tagging, with the repo's non-defect conventions spelled out in the args (no code comments,
Turkish copy, elevation-only separation, the loose-enforcement ruling) so the reviewer does not
burn findings on house style. Report via ReportFindings, fix in file-disjoint lanes, re-gate, then
tag — so the tag marks a twice-reviewed wave.

Corollary worth remembering on its own: **a passing test can be asserting a fiction.** Check what
production actually passes the component, not just that the test is green.

Related: [[feedback_fix_all_severity_findings]], [[feedback_audit_every_user_facing_sentence]],
[[project_tournament_day_operations_milestone]], [[feedback_ultracode_gsd_plan_execute]]
