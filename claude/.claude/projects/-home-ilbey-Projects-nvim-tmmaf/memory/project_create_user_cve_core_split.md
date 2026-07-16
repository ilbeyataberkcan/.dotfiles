---
name: create-user-cve-core-split
description: "admin create-user dialog broken by a 2nd cve-core from the cve-user-management link: override; needs package publish, not a host fix"
metadata:
  node_type: memory
  type: project
  originSessionId: d3e0bdd5-ec68-4b7c-b42f-7d5b2d7e6130
---

The admin "Kullanıcı oluştur" (create-user) dialog throws "Component flow-select/flow-next-button must render inside a FlowOrchestratorNode". Root cause is NOT a missing wrapper: the `cve-user-management` `link:` override (package.json `overrides` block) symlinks to the local `synapsys-cve` monorepo, which resolves its OWN `cve-core` (copy B) — a different physical module than tmmaf's bundled `cve-core@10.1.2` (copy A). `AddUserAction` mounts a FlowOrchestratorNode whose Provider is copy B's FlowContext, while the host-rendered flow body uses cve-components' flow nodes reading copy A's context; React matches context by object identity → `useFlowContext()` returns null.

**Cannot be fixed host-side** and cannot dedupe cve-core across the link boundary under bun's isolated linker. The local monorepo user-management has unpublished committed work (e.g. `a302f6be` "refuse claim invites for activated accounts", still v10.1.1), so reverting the override to published is LOSSY.

**FIX:** publish `cve-user-management` (≥10.1.2) then pin `^10.1.x` in tmmaf (a published dep resolves cve-core from tmmaf → one copy), OR a coordinated delink + `bun install` + rebuild with the dev server down.

The SAME `link:` reality ALSO blocked two invite-link items — but the `link:` override was retired (published 11.0.0, pinned `^11.0.0`), so both are now **RESOLVED** in the package: see [[project_invite_link_step_up_fix]] (2026-07-10) which made the invite slot step-up-aware and added the detail-page invite card.

Surfaced in batch `260709-5h1-event-mgmt-and-fixes` (2026-07-09). Related: [[project_bun_dual_cve_core_store]], [[project_cve_auth_version_drift]], [[project_client_bundle_server_import_poison]].
