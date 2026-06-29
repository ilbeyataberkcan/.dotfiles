---
name: project_weight_model_declared_vs_approved
description: Weight model — profile editable declared weight + read-only last-approved (weigh-in only); registration persists per-event declared weigh-in weight; softer confirm checkbox
metadata: 
  node_type: memory
  type: project
  originSessionId: a661b985-7630-47d8-85af-18cda1d98564
---

Operator-decided weight model (2026-06-22 UAT, supersedes the 7.2 currentWeightKg ask):

- **Registration flow: do NOT ask "current weight" (Güncel Kilo).** Only collect the declared weigh-in-day weight (Tartı Kilosu) — the commitment the athlete will make at the official weigh-in. It drives category/weight-class eligibility (already keyed on `declaredWeightKg` in eligibility/compute.ts + matchers.ts).
- **Autofill** the registration declared weight from the athlete profile's declared weight.
- **Persist** the per-event declared weigh-in weight on the registration line (it was previously only in accumulatedState, never stored — only weightClassId was).
- **Athlete profile gets two weights:**
  - `declaredWeight` — athlete-editable any time, however they like (their self-declared weight).
  - `lastApprovedWeight` — READ-ONLY to the athlete; updated ONLY on weigh-in days by officials/referees.
- **Weigh-in day tools are FUTURE**: referees verify the declaration and enter the athlete's exact weight, which updates the profile's last-approved weight. Not built in 7.2.
- **Confirmation checkbox wording must be gentle, not "fraud"-aggressive.** Use: "I approve that the weight I declare is true and I checked it before submitting it" (Turkish in UI).

Weight has been modeled wrong before — see [[project_trainingsince_is_experience_bracket]]; get the editable-vs-read-only split right. Schema change = new migration (agent authors, operator runs db:migrate per [[project_tmmaf_drizzle_migration_ops]]).
