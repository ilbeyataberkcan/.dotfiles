---
name: project_registration_guardian_waveA_D_shipped
description: Registration funnel + guardian identity work — Parts A-D IMPLEMENTED (uncommitted, staging); Parts E/F (cve-auth step-up) NOT started and blocked on an operator decision
metadata:
  type: project
---

2026-08-23. Four of six planned parts are implemented and green in the tmmaf working tree
(uncommitted, branch `staging`). Plan file: `~/.claude/plans/we-have-a-feedback-graceful-clarke.md`.

**Done — A (funnel), B (guardian identity), C (guardian form), D (event scoping).**
The funnel regression was ONE commit: `f2cfda3b` (2026-08-03) flipped
`decideRegistrationEntryMode`'s null-capability arm to `'ineligible'` and added a
`hasActiveAthleteAccount` bar — a gate the registration flow could never satisfy, because
registration mints the `athletes` row but **never granted the ATHLETE capability**. Fixed by
granting it transactionally beside the insert in `lib/registration-profile-persistence.ts`.

**NOT done — E (cve-auth 14.1.0 step-up modes) and F (host adoption).** `synapsys-cve` is
untouched; nothing to publish. E/F are **blocked on an operator decision**: a call-site
`treatment` parameter defaulting to `'confirmation'` silently disarms every caller that cannot
pass it — the invite-link mint, cve-user-management's 15 actions, and cve-payment-processing's
5 sites (its dispatcher treats a non-throwing return as "allow", with no config knob). Proposed
resolution is an optional `treatmentFor` on `StepUpPolicy` so the host pins those to `ceremony`.

**Accepted risk A-5 (federation ruling, same date):** the guardian phone-axis name guard is a
knowledge test, not a possession test — name and handset are both athlete-declared and
`copyPendingGuardianInvitation` hands the issuer the bearer link. Accepted because guardianship
is re-verified IN PERSON at weigh-in and matches, and a discrepancy disqualifies. Security report:
`.planning/reports/20260823-SECURITY.md` (deliberately not repo root — it is an exploit playbook).

**Why `.next/dev` matters here:** it reached 8.0 GB and crashed the session repeatedly on a 15 GB
box. See [project_turbopack_dev_cache_ram].
