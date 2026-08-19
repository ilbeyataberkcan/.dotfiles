---
name: project-displaced-line-is-not-a-decision
description: "A cancelled registration line is NOT proof the application was reviewed — a category replacement wears the same lifecycle+status shape as a real rejection, distinguished only by rejectionReason"
metadata:
  node_type: memory
  type: project
---

**A registration line can be `lifecycleState='cancelled', status='rejected'` without anyone
having reviewed the application.** That shape means "closed", not "decided". Two writers
produce it as a pure REPLACEMENT:

- the athlete accepting a federation offer (`CATEGORY_DISPLACEMENT_REASON`)
- an admin changing the category from the admin dialog (`ADMIN_CATEGORY_CHANGE_REASON`)

The ONLY thing separating a replacement from a genuine rejection is `rejectionReason`.
`lifecycleState` and `status` are identical. Anything asking "was this application decided?"
or "what does the athlete see?" MUST call `isCategoryDisplacement(reason)`
(`lib/registration-eligibility.ts`) — never test the lifecycle alone.

**How it broke (fixed 2026-08-04, `b39fe7a2`).** The weight-override branch made the admin
dialog settle-on-submit, so displacement started happening while an application was still
*pending* — previously it only followed an acceptance, so the bug was unreachable.
`isFinalized = lines.some(l => TERMINAL_LIFECYCLES.has(l.lifecycleState))` then went true on
a never-reviewed application: the dialog badged it **Sonuçlanmış** and
`submitApplicationDocumentReview` returned `redecision-step-up-required`, demanding a step-up
to approve something nobody had decided. Separately `registration-status.ts`'s active/dropped
split (`cancelled && status !== 'rejected'`) kept the displaced line ACTIVE, so the athlete saw
their old category as **Reddedildi** under copy claiming they had accepted an offer never shown
to them. 3 local applications were affected; `isFinalized` is derived, so rows heal on read —
never write a migration for this.

**Safety property that makes the fix sound:** ignoring displacement lines cannot weaken the
re-decision gate. A truly approved application still has an APPROVED line; a truly rejected one
carries a non-displacement reason. Only the displacement-only case flips to false, which is
correct.

A misleading `rejectionReason` is a real defect, not copy polish — it is load-bearing state,
and reusing the accepted-offer wording for an admin-initiated change tells the athlete they
consented to something they never saw.

Related: [[project_admin_weight_class_override]], [[project_registration_category_model]],
[[feedback_client_is_dumb_reflection]], [[feedback_fix_properly_system_wide]]
