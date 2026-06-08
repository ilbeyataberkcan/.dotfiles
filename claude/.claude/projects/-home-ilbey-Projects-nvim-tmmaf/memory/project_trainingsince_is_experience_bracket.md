---
name: project_trainingsince_is_experience_bracket
description: "athletes.training_since is a TEXT experience bracket ('3+'|'1-3'|'<1'), NOT an integer year — per the mockup; do not flip it back"
metadata: 
  node_type: memory
  type: project
  originSessionId: fddc189e-0a5d-4c7a-8591-0cfd8e08cbfa
---

`athletes.training_since` is a **categorical experience bracket stored as TEXT**: `'3+'`, `'1-3'`, `'<1'`. It is NOT an integer year and NOT a date.

**Why:** the design authority (`docs/design/tmmaf-event-registration-mockup/project/src/steps.jsx`, athlete case) renders "Antrenman yılı" as a `<select>` of experience brackets, and the primary registration flow (`TmmafAthlete.tsx`) collects exactly those bracket values. The label "Antrenman yılı" (training year) is a misnomer — it's experience, not a calendar year.

This was modeled wrong twice: the column went `date` → `integer` (a prior session, trusting `welcome`/`profile` "year as integer" comments) → finally `text` once the mockup + registration UI made the bracket intent clear. `z.coerce.number('3+')` → NaN was crashing the registration terminal fold.

**How to apply:** keep `trainingSince` as TEXT/`z.string()` everywhere — registration terminal schema, `welcome` onboarding (`TmmafAthleteOnboarding` uses the same bracket select), and `app/app/profile` (schema + form types are `string | null`). Do NOT reintroduce a numeric/year model or a `z.coerce.number()`. See [[project_db_driver_abstraction_debt]] for the related DB-access caveat and [[feedback_fix_properly_system_wide]].
