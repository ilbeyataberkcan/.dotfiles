---
name: project_registration_flow_is_signup
description: "TMMAF registration flow is the primary athlete sign-up; collect full profile in-flow, Turkish-only interim"
metadata: 
  node_type: memory
  type: project
  originSessionId: 0a786c21-2a6b-4a3c-87a7-31c9975610f7
---

The Phase-6 registration flow (`app/flows/[[...slug]]/page.tsx`, `lib/host-flow-actions.ts`, `lib/host-blocks/Tmmaf*`) is intended to BE the primary athlete sign-up path — not a separate step after a normal account exists.

Intended design (per user direction, 2026-06-03):
- After magic-link verification the user is routed **directly into this flow** (unlike the normal sign-up screens). The flow collects user + athlete info and creates/fills the user account and athlete profile.
- The **full §3 athlete profile is collected IN the flow UI** (identity + athlete steps), not read from a pre-existing onboarding row. Persisted at the terminal fold. Goal: a **complete** user account + athlete profile must exist **before** event registration — even for athletes not yet eligible for that event.
- Desired (not yet built): **incremental per-step persistence** to the user/athlete rows so a user can leave and come back. Today resume works only via the flow's `accumulatedState` (terminal-only DB fold); prefill props on steps are declared but **not wired** to accumulatedState.
- **Turkish-only interim**: citizenship collection is deferred. `nationality` defaults to `'TR'` and `languagePreference` to `'tr'` in `RegistrationTerminalSchema`. The `TmmafCitizenship` step + foreign-tariff path stay in place for future non-Turkish events — that work is not wasted.
- **Weight is per-event**: `currentWeightKg` is mutable, re-claimed each event and proven at weigh-in — kept separate from the static profile.

**Why:** This reframes the flow from "registration for an already-onboarded athlete" to "the onboarding+registration flow itself," which determines where profile fields are sourced and how completion gates work.

**How to apply:** When extending Phase 6 / the next milestone, build the deferred pieces — incremental row persistence, magic-link→flow routing, and prefill wiring from accumulatedState — and only re-enable citizenship/nationality collection when non-Turkish events are in scope. Relates to [[feedback_tmmaf_deck_audience]].
