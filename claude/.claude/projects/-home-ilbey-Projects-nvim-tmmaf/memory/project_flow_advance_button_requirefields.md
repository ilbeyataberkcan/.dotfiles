---
name: project_flow_advance_button_requirefields
description: "The registration/welcome flow advance button disables on the chrome step config's requireFields array, NOT the tree's required prop"
metadata: 
  node_type: memory
  type: project
  originSessionId: b4da498c-1d31-461f-8c0f-68216bac08af
---

The "Devam et"/advance button in the registration & welcome flows (rendered by cve-core `FlowSubmitNode` inside `RegistrationChrome`, line ~291) disables based on the **host chrome step config's `requireFields: string[]`** for that stepId — defined per-step in `lib/registration-steps.ts` and `lib/welcome-steps.ts`. It is presence-only (non-empty), NOT format-aware.

It is NOT driven by:
- the flow tree node's `required: true` prop (`n('identity/nationalId','flow-input',{ required:true })` in `lib/fixtures/registrationFlow.ts`) — that's semantic/indicator only
- the server gate in `lib/host-flow-actions.ts` (server authority / inline fieldErrors backstop)

So to make a field block UI advance on a step, add its name to that step's `requireFields`. This is HOST code keyed by stepId, so it applies to ALL instances immediately — **no version bump / reseed** (unlike tree changes). The identity steps render via RenderEngine `flow-input` nodes, NOT the registered-but-unused `tmmaf-identity` host-block (`TmmafIdentity.tsx` only renders for legacy pre-v7 monolithic registration instances).

Concrete (260626-7f6, commit 84b7cf0): TCKN made mandatory on the EVENT-REGISTRATION flow's identity step by adding `'nationalId'` to `registration-steps.ts` step-identity requireFields; the WELCOME (sign-up/onboarding) flow's `welcome-steps.ts` deliberately omits it so it stays optional. Same per-flow split mirrored in the tree `required` + server gate (`isRegistration && nationalId===''`). See [[project_flow_validation_channel]] (fieldErrors-not-throw) and [[project_registration_flow_is_signup]].
