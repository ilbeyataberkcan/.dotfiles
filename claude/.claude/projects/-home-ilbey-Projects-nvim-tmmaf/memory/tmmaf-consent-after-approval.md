---
name: tmmaf-consent-after-approval
description: "Approved registrations can owe consent again (restamp/dishonor ops scripts, PDF pinned after approval); status-page consent gates key on outcomeAdmitsConsent, not isTerminal — changed 04.09.2026, overriding an 07.08.2026 \"decided apps never ask for consent\" ruling"
metadata: 
  node_type: memory
  type: project
  originSessionId: 83affe53-786a-4101-bbfc-936e8bd3008c
  modified: 2026-09-04T11:24:45.564Z
---

On 04.09.2026 an athlete got an agreement reminder but saw no agreements card on the status
page. Root cause: every consent affordance (acceptance panel, action notice, guardian send,
parent tab badge) was gated on `descriptor.isTerminal`, so an APPROVED application whose
consent re-opened (02.09 ops scripts `restamp-stale-agreement-status.psql` /
`dishonor-minor-self-consent.psql`, or an agreement PDF pinned after approval) showed
"Onaylandı" with the timeline stuck on the consent node and nothing to click, while the
reminder cohort and the draw gate both treated consent as owed.

**Why:** the 07.08.2026 rule "a decided application never asks for consent" predates the
September mechanics that re-open consent after a decision. Rejected/cancelled outcomes still
never ask.

**How to apply:** consent-on-outcome questions go through `outcomeAdmitsConsent` in
`lib/registration-status-descriptor.ts`; never reintroduce an `isTerminal` gate for consent.
Second scenario to check when an adult athlete sees no card: sentinel DOB 1900-01-01 resolves
to PARENT authority since 03.09.2026 (a305d1fb) — a policy choice, not changed. See
[[tmmaf-national-id-backfill-guards]] for the sibling "imported rows lack identity" caveat.
