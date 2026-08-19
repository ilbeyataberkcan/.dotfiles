---
name: project_coach_athlete_selection_fixes
description: Coach athlete-selection rework — PUSHED to origin, 2 open federation policy rulings
metadata:
  type: project
---

Branch `worktree-coach-athlete-selection-fixes`, commits `e9b41d26` (code) + `3480f688`
(graphify), forked off staging tip `2ff0516c` on 2026-08-06. **PUSHED to origin** 2026-08-06,
remote == local. No PR opened. Local worktree at `.claude/worktrees/coach-athlete-selection-fixes`
is now disposable — the branch on GitHub is the durable copy.

Three operator-reported bugs in the antrenör batch registration, fixed at the root:
identity typing removed (coach only selects), already-registered athletes unselectable,
dialog fixed at 1284×768 with internal scroll.

**Two silent bugs the work uncovered, not reported by the operator:** the coach was the
identity authority for another human (a typo rewrote that athlete's stored legal name,
national ID, phone, region via `persistAthleteProfileStep`), and the grid always published
an empty `clubName`, which advanceCore reads as the Ferdi sentinel — **every
coach-registered athlete was silently losing their club affiliation**. Both die with the
grid, because `resolveAthleteDefaultsForUsers` selects no club column. See
[[project_registration_category_model]], [[project_club_affiliation_feature]].

**TWO OPEN FEDERATION RULINGS — neither is a code choice:**
1. A minor with no live parent link is **not registerable by a coach at all**. Guardian
   contact is not on the athlete row and 25.3 moved consent off the coach entirely
   ([[project_phase253_athlete_consent_parental_authority]]), so there is nothing for the
   server to substitute. Unblock chain: coach invites athlete → athlete claims account →
   athlete invites parent from `/app/profile/athlete` → parent accepts. **In a junior club
   this is the common case, not the edge.** A coach-side guardian-link surface is unbuilt.
2. Three messages say "sporcu kendi hesabından tamamlamalı", achievable ONLY through the
   athlete's own registration flow — `/app/profile/athlete` says the opposite ("yalnızca
   federasyon incelemesiyle değiştirilebilir"). If a wrong birth date is a federation
   correction, those three should name the federation.

Operator UAT still owed (the fidelity gate is the operator, never a sub-agent): the fixed
frame at desktop and ~343px, and the new blocked-athletes panel that replaces the
"önce sporcularınızı ekleyin" line when the roster is non-empty but every athlete is blocked.

**No migration, no seed bump, no package publish.** `COACH_REGISTRATION_FLOW_VERSION` stays
2 — `fields[]` unchanged, only the MEANING of `roster_identity_json` changed and the driver
no longer parses it. Pre-existing environment blockers still apply
([[project_coach_console_delegated_payment]]).

Tests 4 red, all reproducing at the unmodified merge base (send-payment-reminders ×3,
event-creation-edit-mode ×1) — pre-existing, verified against the main checkout.
