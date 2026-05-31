---
name: feedback-user-facing-pages-must-use-render-engine
description: "User-facing pages in apps/cve-test-host MUST render via RenderEngine + ComponentNode trees consuming cve-components / host-blocks, even for smoke testing"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0645c899-476a-4e96-b88b-f310afefd7d1
---

User-facing pages in `apps/cve-test-host/app/**/page.tsx` MUST render via `<RenderEngine />` from `@synapsys-integrated/cve-core`, consuming a `ComponentNode` JSON tree against `hostRegistry` (which composes `cve-components`' `componentRegistry` + host-block overrides). This applies EVEN to smoke / integration test pages.

**Why:** The whole point of CVE is that consumer apps render via the engine. If a host app builds user-facing surfaces with raw `'use client'` JSX, it stops dogfooding the engine — the smoke tests no longer prove the integration works end-to-end. Per project memory `feedback_phase18_ships_package_functionality_only`, host UI rendering is the consumer app's job, and the consumer app's job is to use RenderEngine.

**For module/smoke test pages, you do NOT need variants** — a single canonical tree is fine. But the rendering path is non-negotiable.

**How to apply when adding a new user-facing page (sign-in, sign-up, account, etc.):**

1. **Interactive logic** (form state, event handlers, async API calls) that can't be JSON-described lives in a registered **host-block client component** at `apps/cve-test-host/lib/host-blocks/<Name>.tsx` + sibling `.schemas.ts`. Pattern: `HostCustomButton.tsx` + `HostCustomButton.schemas.ts`.
2. **Register the host-block** in `apps/cve-test-host/lib/registry.ts` via `defineComponent({...})`. The spread-first ordering (D-21-G) is load-bearing — `...componentRegistry` first, then host keys on top.
3. **The page route** (`app/<route>/page.tsx`) is a **Server Component** that constructs a `ComponentNode` tree (inline literal for smoke, or seeded into the database via `seedPages()` for full-fidelity) and renders via `<RenderEngine rootNode={tree} componentRegistry={hostRegistry} animationRegistry={...} strategyRegistry={...} />`.
4. **No `'use client'` directive on the page route itself.** Client interactivity lives only inside the registered host-block component.
5. **No raw JSX rendering of cve-components in the page route** — every visible UI element comes from the ComponentNode tree.

**Anti-pattern (do NOT do this):**

```tsx
// apps/cve-test-host/app/sign-in/page.tsx — WRONG
'use client';
import { signIn } from '@/lib/auth-client';
export default function SignIn() {
  const [email, setEmail] = useState('');
  return <form onSubmit={() => signIn.magicLink({email})}>...</form>;
}
```

This bypasses RenderEngine entirely. The smoke test no longer proves the engine renders an interactive auth surface.

**Canonical shape:**

```tsx
// apps/cve-test-host/app/sign-in/page.tsx — RIGHT
import { RenderEngine, type ComponentNode } from '@synapsys-integrated/cve-core';
import { hostRegistry } from '../../lib/registry';
import { animationRegistry, strategyRegistry } from '../../lib/strategy-registry';

const tree: ComponentNode = {
  id: 'sign-in-root', type: 'section', props: {...},
  children: [
    { id: 'h', type: 'text', props: { content: 'Sign in', as: 'h1' } },
    { id: 'f', type: 'signInForm', props: { callbackUrl: '/' } },
  ],
};

export default function SignInPage() {
  return (
    <RenderEngine
      rootNode={tree}
      componentRegistry={hostRegistry}
      animationRegistry={animationRegistry}
      strategyRegistry={strategyRegistry}
    />
  );
}
```

Where `signInForm` is the registered host-block client component that owns the email state + `signIn.magicLink(...)` call.

Related: [[feedback-host-app-imports-no-js-extension]], [[feedback-client-context-only-for-client-consumers]], [[project-phase18-ships-package-functionality-only]].
