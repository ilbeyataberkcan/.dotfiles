---
name: No bare console.* in host src/** — hard rule, enforced by test
description: Host code (synapsysintegrated/src/**) must never contain bare `console.{log,error,warn,info}` calls outside `src/lib/log/emit.ts`. Refactor to `logEvent` from `@/lib/log/emit` instead of allowlisting the offender.
type: feedback
originSessionId: bb18f426-c473-4779-885a-f0d65cc744eb
---
When a `console.*` call appears in host source (`synapsysintegrated/src/**`), the correct fix is to refactor it to use `logEvent` from `src/lib/log/emit.ts` — not to add the file to `tests/phase-06/log/no-bare-console.test.ts`'s allowlist. The test exists specifically as a publish-time guard against bare console drift; allowlisting normalizes the regression instead of fixing it.

**Why:** User stated 2026-05-01 during Phase 11 verify:release work, after Phase 8 had silently introduced `console.error('[auth] marker cookie issuance failed', err)` in `src/lib/auth.ts:170` and that drift sat undetected for 5 days because the verify chain was failing earlier: "No bare console commands in our host application allowed. Only if I manually decide to log locally I will add one to debug. But the test should catch them before I stupidly publish them to clients."

**How to apply:**
- When `tests/phase-06/log/no-bare-console.test.ts` flags a host file, refactor the call site to:
  ```ts
  import { logEvent } from '@/lib/log/emit';
  // ...
  logEvent({ event: 'snake_case_event_name', severity: 'error', errorCode: 'subsystem.what_failed' });
  ```
  Per the emit contract, callers pass a stable `errorCode`, not raw exception messages (Phase 4 D-14 no-PII scrub). Losing raw `err` detail is intentional — if more diagnostics are needed, propose extending `LogEventInput` rather than reverting to bare `console.*`.
- Do NOT add the offending file path to the allowlist. The allowlist is reserved for `src/lib/log/emit.ts` itself (the canonical emit path) and any future locally-equivalent emit module — never as a "skip this file" escape hatch.
- The user has explicitly authorized temporary local-debug `console.*` usage during their own debugging, but they expect the publish-time test to catch any such usage before it ships. Do not commit local-debug `console.*` calls; if you add one for triage, remove it before staging.
- This rule applies to the host repo (synapsysintegrated). CVE packages (synapsys-cve) have their own console policy via lint rules — different scope.
