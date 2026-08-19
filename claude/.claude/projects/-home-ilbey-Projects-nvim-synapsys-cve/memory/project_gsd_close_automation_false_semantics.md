---
name: project_gsd_close_automation_false_semantics
description: "GSD plan-close automation asserts semantic claims from mechanical counts — 3 distinct instances in Phase 6 gap-closure round 2; verify tracking artifacts after every plan close"
metadata:
  type: project
---

In synapsys-cve Phase 6 gap-closure round 2 (2026-07-29), GSD close automation made three separate
false semantic assertions from mechanical counts, all caught by executors rather than by the tooling:

1. `gsd-sdk state.advance-plan` corrupted `STATE.md` frontmatter `percent` (92 → 10, later 10 → 98).
   `bun run reconcile` re-derives it correctly; the SDK verb does not.
2. `requirements.mark-complete` flipped **AUTHZ-01** to `Complete` (commit `b3d8ad15`) off a plan's
   `requirements:` frontmatter — contradicting REQUIREMENTS.md's own ledger note, ROADMAP's explicit
   "must not be marked complete", and a verification that had it BLOCKED. AUTHZ-01 spans Phases 6-11
   and cannot be discharged by any single phase's plan. Reverted to `Pending` in 06-25.
3. ROADMAP/STATE stamped Phase 6 **"Complete"** because those counters are derived from SUMMARY
   presence (25/25) — NOT from verification. `06-VERIFICATION.md` was still `gaps_found` at the time.
   The executor reverted it three times; `reconcile` re-derived it each time. It is the convention,
   so the stamp is not a bug — but it means **"every plan has a SUMMARY", never "verified"**.

**Why:** each is a count standing in for a judgement. A phase with every SUMMARY written can still be
unverified; a plan naming a requirement in frontmatter does not discharge a requirement spanning six
phases.

**How to apply:**
- After any plan close, check `STATE.md` percent and any `requirements` status the plan named.
  Re-derive with `bun run reconcile`; never hand-edit derived counters (they get overwritten).
- Do NOT run `requirements.mark-complete` for a multi-phase requirement (AUTHZ-01 is the live case).
- Treat a ROADMAP/STATE "Complete" marker as a SUMMARY-count statement. The authority on phase status
  is `NN-VERIFICATION.md` frontmatter `status:`. Check that before believing a phase is done.
- See [[feedback_verify_code_not_just_tests]] and [[feedback_prove_the_proof_can_fail]] — same family.
