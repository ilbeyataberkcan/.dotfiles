---
name: project-invite-link-step-up-fix
description: invite-link copy threw AuthStepUpRequiredError to console; fixed by making the cve-user-management invite slot step-up-aware + adding a detail-page invite card
metadata:
  node_type: memory
  type: project
  originSessionId: 14a0163e-8b67-43ca-9da9-143e59e9e63c
---

Copying an invite link in the admin users list threw `AuthStepUpRequiredError` ("Console" error) and copied nothing. Root cause: issuing an invite is credential-equivalent and intentionally step-up-gated at `admin` (lib/step-up-policy.ts:67-69, test-locked) — but the invite flow was the ONLY sensitive admin action that **threw** instead of returning the discriminated `{ok:false,error:'STEP_UP_REQUIRED',...}` result, and it routed through package-owned `UsersTable` which `.catch(console.error)`d the throw. The step-up popup (`app/admin/layout.tsx:56` `<AdminStepUpDialogMount/>`, `openStepUp` from cve-auth/react — a module-level emitter, no provider) was never engaged.

**Fix (COMMITTED 2026-07-10, pending publish):**
- **cve-user-management** (monorepo `packages/extensions/user-management`, commit `6bb0c37c` on `feat/federation-platform`, changeset = **minor**): widened `InviteLinksSlot.onCopyInviteLink/onReissueInvite` to `Promise<string|void | StepUpRequiredResponse>` (backward compatible — bare `Promise<string>` still satisfies it); exported `StepUpRequiredResponse` + `isStepUpRequired`; `UsersTable` narrows the discriminator → `openStepUp` + re-submit, copied/busy feedback, refresh via `useUsersSelection().refresh`; new `InviteManagementCard` on `UserDetailRoute` (behind existing `inviteLinks` slot, unclaimed+canEdit only). Pattern mirrors `EditableProfileSection` (the in-package step-up template) + host `storage-actions`/`StorageDashboard`.
- **tmmaf** (commit `09dcaac`): `lib/admin/invite-link-actions.ts` `withInviteStepUp()` catches `AuthStepUpRequiredError` → returns the discriminator (returnUrl `/` — popup never navigates). `lib/step-up-policy.ts` UNCHANGED (gate stays).

**Why a card on the detail page needs a package change** (durable, user-confirmed): cve-admin engine has NO route-body injection seam and **throws "Ambiguous admin routes"** if a host registers a 2nd `users/:id` (`AdminEngine.assertNoAmbiguousRoutePatterns`). Labels kept ENGLISH (matches the rest of the package chrome).

**OPERATOR TODO (blocks host verify):** publish cve-user-management `11.1.0` (`bunx changeset version` → tier-ordered `bun publish` per [[project_cve_release_path]]); then bump tmmaf pin `^11.0.0`→`^11.1.0` (deps + overrides), `bun install`, host `typecheck`+`build` (server down), Playwright e2e (stale step-up → popup → copy works; detail card). Host typecheck FAILS until reinstall (widened return not assignable to installed 11.0.0 slot). Related: [[project_create_user_cve_core_split]], [[feedback_fix_properly_system_wide]].
