---
name: feedback-no-helper-for-static-placeholder
description: "Don't create a helper module + test + JSDoc for a placeholder static value. Inline the literal at the consumer site with a swap-here comment."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: af583d0e-ad1a-4f36-8c60-b5cb6d638a92
---

When a binding is deferred to a future phase and the foundation-phase value is a single static literal, **inline the literal at the consumer site with a swap-here comment**. Don't write a helper function, a test file, a JSDoc block, or a dedicated module to hold a one-line `return 'ltr'`.

**Why:** A 28-line module + a 3-case test + a vitest config + a FINDINGS row + a SUMMARY note to host one `return 'ltr'` is overengineering. The premise that "we'll swap the body later" doesn't justify the scaffolding: the swap site is more discoverable if the literal lives at the consumer (`<DirectionProvider dir="ltr">`) with a one-line comment than if it lives in a separate module that pretends to be a real abstraction. The helper module reads as a stable contract; in reality it's stub-only and exists purely to absorb a JSDoc-sized planning trace.

**How to apply:**
- Foundation-phase deferred bindings with static placeholder values: inline the literal at the consumer site. Add ONE inline comment naming the future-phase swap (e.g. `// Phase 25 swaps to getLocaleDirection from cve-multilingual-workflow`).
- Keep the planning trace (memory + FINDINGS row + SUMMARY) — that's the load-bearing record. But don't materialize it as a code module unless there's already a real consumer at the foundation phase that benefits from the indirection.
- If there's exactly ONE consumer and the body is one literal, inline it. Promote to a helper module only when (a) a second consumer arrives, OR (b) the body becomes non-trivial (parsing, branching, lookup).
- Tests follow the same rule: don't write a test for a function whose body is `return 'ltr'`. The regression-guard for "did someone accidentally introduce the binding too early?" can live as a comment on the inline literal or as a Phase-25-pre-execution checklist item.

**Counter-cases (when the helper IS justified):**
- Two or more consumers already exist at the foundation phase.
- The body is a real computation, even if currently a placeholder (e.g. a parser that today returns 'ltr' but will be extended to handle script subtags).
- The contract surface needs documentation that's too long for an inline comment.

**Reference:** This came up at Plan 20-02 (lib/variant-direction.ts). Don't retroactively undo that — but for future foundation-phase deferrals, default to inline. See also [[project-phase20-direction-deferred-to-p25]] for the specific binding this rule was learned against.
