---
name: project_signup_agreements_and_seedkey
description: Sign-up legal agreements (welcome v7) + rename-safe federation file-type seeding via host-owned seedKey
metadata: 
  node_type: memory
  type: project
  originSessionId: 8f81335d-bfa5-47dd-b7db-cedc16ef0b21
---

Federation requested 4 account-level legal consents at sign-up (distinct from event agreements). Built 260626, UNCOMMITTED, pending operator db:migrate + seed + PDF uploads.

**Rename-safe seeding (the core ask — answers "is federation type seeding safe?": idempotent on rerun but was NOT rename-safe — matched by display `name`, so an admin rename spawned a duplicate, same failure as the weight-class/age-category incident).** Fix = host-owned stable `seed_key` column on `file_types` + partial unique index `file_types_seed_key_idx` (WHERE seed_key IS NOT NULL). `seedFederationAgreementTypes()` now matches on seedKey, NEVER heals name/description, and adopts pre-seedKey legacy rows ONCE by canonical name (only while their key is null). Analog of the [[project_catalog_clean_slate_reseed]] / migration 0024 partial-unique fix. Two exports: `EVENT_AGREEMENT_TYPE_SEED` (3, bound to events) vs `FEDERATION_AGREEMENT_TYPE_SEED` (union of 7 = 3 event + 4 signup) — seed creates all 7, only the 3 get event bindings.

**The 4 sign-up agreements** (single source of truth `lib/signup-agreements.ts` `SIGNUP_AGREEMENT_DEFS`, PDF/16MB, category reuses `federation-agreement`, separated only by seedKey): `terms-of-service`, `kvkk-gdpr`, `explicit-consent`, `cookie-policy`. NO binding table — fixed code list, latest version resolved at runtime via `latestFederationFileForType`.

**Surface = welcome flow, now v7** (`lib/fixtures/welcomeFlow.ts`): new gated `step-agreements` between documents and passkey, REUSES the `tmmaf-agreements` island (it's fully context-free — reads `agreements` prop, publishes `agreements_accepted`). Chrome in `lib/welcome-steps.ts` (label 'Sözleşmeler', requireFields:['agreements_accepted']). Injection in `injectWelcomeStepProps` (now async) `case 'step-agreements'` → `resolveSignupAgreements()`. Gate+snapshot in `host-flow-actions.ts` on `isTreeAdvance && isWelcome && fromStepId==='step-agreements'` (mirrors the registration step-summary block) → writes `signup_agreement_snapshots` (per-USER analog of registrationAgreementSnapshots, userId FK cve_auth.users, unique (userId,fileTypeId), onConflictDoNothing) directly on advance (no terminal — user already exists). Migration `0025_signup_agreements`.

create-user flow is admin-side cve-user-management (NOT self-signup); self-signup = SignInForm /sign-in → redirect /welcome, so welcome is the only flow-engine sign-up surface. Static KvkkFinePrint on /sign-in left as-is. Operator steps: db:migrate, seed:storage-file-types, seed-welcome-flow (v7), federation uploads the 4 PDFs on Federasyon Dosyaları. Pre-existing UNRELATED test drift: registration-flow-fixture asserts v19 but fixture is v20.
