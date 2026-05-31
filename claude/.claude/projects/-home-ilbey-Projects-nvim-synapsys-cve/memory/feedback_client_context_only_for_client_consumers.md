---
name: feedback-client-context-only-for-client-consumers
description: "Before shipping a client-side Context Provider from a package, verify there are real (not hypothetical) client consumers — otherwise the Provider is speculative infrastructure that imposes RSC boundary costs for no benefit."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: af583d0e-ad1a-4f36-8c60-b5cb6d638a92
---

When a package considers shipping a React Context Provider that wraps consumer-rendered output, the question is NOT "could a future client component want this state?" — it is "do real, named client consumers exist today that genuinely need Context propagation rather than explicit props?"

**Why:** A Context Provider serialized across the RSC boundary forces a Client Component island into every render path that uses it. Under Next 16 + Turbopack, a server module importing the Context from a `'use client'` module receives a client-reference proxy whose `.Provider` is `undefined` — so the unconditional wrap doesn't just impose cost; it crashes ("Element type is invalid... got: undefined"). The original cve-core@0.5.2 `RenderEngine` shipped this exact failure. The wrong fix is a Client Component wrapper that hides the Provider; the right fix is asking whether the Provider should exist at all. cve-core@0.5.3 dropped it entirely — variant resolution stays server-side, the rendered HTML is the contract, the host page that called `RenderEngine` already knows the resolved variant key and passes it to any client component that needs it as an explicit prop.

**How to apply:** When designing a package API and the instinct is "I'll surface this state through a Context Provider so deeply-nested client components can read it," stop and answer three questions: (1) Name the real client components that will read this Context — not "Studio someday" or "the SEO hook" if those can equally well take a prop. (2) Show that prop-drilling those components from the server-render boundary is genuinely worse than the Context. (3) Confirm those client components actually exist and are integrated — not speculative. If any answer is weak, ship the data as an explicit return value or prop slot, NOT through Context. Memory link: [[feedback-never-work-around-root-cause]] — fixing the RSC crash via a wrapper Client Component would have been the "workaround" path; dropping the Provider is the "fix at the root" path. Also relates to [[feedback-no-helper-for-static-placeholder]] and [[feedback-inline-init-at-app-root]] — same family of "don't add indirection for hypothetical consumers."
