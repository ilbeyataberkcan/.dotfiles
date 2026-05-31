---
name: feedback-unsafe-suffix-for-escape-hatch
description: "User's naming convention for escape-hatch APIs in CVE packages — `_Unsafe` (underscore + PascalCase) suffix as a sharp code-review signal."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 68dade9f-cf86-4f34-9fdb-1d7c457fc893
---

For escape-hatch / pre-verified-input / bypass-validation APIs in CVE packages, use the `_Unsafe` suffix convention (underscore separator + PascalCase suffix). Example: `MailService.ingestProviderWebhook(rawBody, signatureHeader)` (safe default) paired with `MailService.ingestProviderWebhook_Unsafe(messageId, status)` (escape hatch — caller asserts upstream verification).

**Why:** User explicitly chose this naming during Phase 22 SPEC. The `_Unsafe` suffix is a sharp visual flag at every call site: every IDE / grep / linter / code-review pass surfaces calls to `_Unsafe` functions as needing justification. Mimics React's `UNSAFE_componentWillMount` rationale (you probably don't want this; if you do, the name self-incriminates in code review). The underscore + PascalCase visually separates the warning from the operation name. Departs from workspace camelCase convention; the convention break IS the signal.

**How to apply:** When designing a paired safe-default / escape-hatch API in CVE packages, name the escape-hatch with the `_Unsafe` suffix (underscore + PascalCase). Do NOT normalize to camelCase ("ingestProviderWebhookUnsafe") — the underscore is load-bearing. Do NOT use React's `UNSAFE_` prefix form; the user's chosen pattern is the suffix form. Note the workspace-convention departure in JSDoc + commit message so future readers understand it's deliberate.
