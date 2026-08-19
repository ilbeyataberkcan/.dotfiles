---
name: project_registration_adjustments_batch2
description: 13 registration adjustments + 3 operator rulings — ALL PUSHED (f039348e), auto-disqualification withdrawn
metadata:
  type: project
---

Branch `worktree-coach-athlete-selection-fixes`, commits `b4b90973` (code, 73 files) +
`23513d36` (graphify), on top of the earlier selection rework
([[project_coach_athlete_selection_fixes]]), then the operator rulings + resource fixes through
`f039348e`. **ALL PUSHED 2026-08-07**; `staging` also pushed (`d2b4e433`, 85 commits that had been
sitting local). Bitwarden re-locks between pushes — just retry, it is not a real failure.

**TWO BUGS, neither where it looked:**

1. **Documents.** The delegated upload was NEVER at fault — it writes to the athlete's own
   vault, which is exactly where the admin reads. The cause was an event binding only
   `optional` document types → empty required set → vacuous compliance → a BLOCKING verdict
   printed as a PRESENCE claim ("Belgeler tam" on an empty vault). The real harm: the upload
   toggle rendered only under `!ready`, so a vacuously-ready athlete gave the coach no way to
   upload at all. DB-proven: that batch had 5 coach-advance audit rows and ZERO upload rows.
   **No code makes an all-optional event gate anything** — which types are required per event
   is a federation decision, fixed in the admin file-types surface.
2. **Admin approvals reverting to rejected.** FOUR mechanisms, one defect: approveApplication
   re-derived the level gate after the decision; a CANCELLED line was filtered out of the
   dialog while the action still loaded it (so the rejection was structurally unreachable —
   that is why step-up re-approval never helped); staging downgraded an explicit admin
   rejection to pending; and the dialog defaulted an untouched category to rejected. Level now
   gates no decision. Separately the applications board counted category DISPLACEMENTS as
   rejections because it never read `rejectionReason` — the same trap as
   [[project_displaced_line_is_not_a_decision]], one surface short.

**RULINGS SETTLED 2026-08-07:**
- Parent hard-redirect REVERTED — too extreme; parents keep the public site. Per-child badge stays.
- Auto-disqualification WITHDRAWN by the operator ("headache before we educate the federation").
  Built, then removed — one revert to restore. **It also had a real bug worth remembering: the same
  confirm click force-accepts an offer as approved+unpaid, which is exactly what the sweep hunted,
  so it minted the debt and punished it; a re-run disqualified athletes the prior run had approved
  and mailed. Any future version needs the debt to PREDATE the sweep.**
- Coach batch DROP policy: a document-refused athlete is silently removed (named, info note)
  and the coach must start a NEW batch for them — re-selectable because no registration line
  was minted, but there is no direct resume link.

Also: the guardian mail is now ONE grouped mail per guardian, and child names are MASKED
("A** Y**") matching other guardian templates — item D said "naming" the children, so confirm.

**No migration, no seed, no flow version bump, no package publish.** Existing wrongly-rejected
rows do NOT self-heal — reopen and re-approve after deploy.
