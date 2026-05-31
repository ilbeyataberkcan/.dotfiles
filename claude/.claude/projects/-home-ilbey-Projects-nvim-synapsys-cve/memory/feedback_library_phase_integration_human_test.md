---
name: Library/packaging phase verifications must be re-presented as human-runnable tests at first integration
description: When cve-admin/cve-auth/cve-core safety primitives reach a consumer-app integration phase, surface the deferred human verifications and refuse to let them be skipped.
type: feedback
originSessionId: c4dc5d47-fb37-4fa5-80b2-3e4886786826
---
Library-only phases (e.g. cve-admin Phase 16 — strict resolver adapter, env-gated fail-closed default, warn-once latch, optional-extension conformance, neutrality audit) auto-verify cleanly via typecheck/vitest/scripts. The deeper behaviors — production fail-closed actually denying requests, warn-once latch firing once per process, adapter `onDeny` receiving typed payloads, manager-override permission gating — only become observable when wired into a consumer app.

**Why:** User explicitly asked during Phase 16 UAT (2026-05-11) not to let these slide once auto-verification passes at the package level. "Trust your observation for now but make sure the very first integration stage has these to human test. Don't let me skip over them."

**How to apply:** At the first phase that integrates cve-admin (or any analogous safety-critical library deliverable from Phase 16) into a consumer app, do all three:
1. Generate a UAT that lists each Phase 16 deferred check as an explicit human-runnable step (production fail-closed → hit a real endpoint with no resolver, observe 403/deny; warn-once → boot the app, count stderr warnings; adapter denial → trigger a real deny, observe onDeny diagnostics).
2. Do NOT mark those tests pass on a single "yes" — require either a screenshot, log excerpt, or paste of the observed behavior.
3. If the user tries to skip or fast-pass them, remind them of this commitment by name and ask for explicit acknowledgement before recording skipped.

This applies equally to future library phases that defer human-observable behavior (e.g. step-up auth flows, mail send paths, multilingual-workflow seams) — when their first consumer integration arrives, surface the deferred checks the same way.
