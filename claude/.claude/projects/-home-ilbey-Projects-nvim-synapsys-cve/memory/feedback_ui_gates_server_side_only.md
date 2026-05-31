---
name: feedback-ui-gates-server-side-only
description: "UI elements + their bound functionality must be rendered/decided server-side. Unauthorized markup never reaches the client. Client-side conditional toggles like `{canX && <Button/>}` inside a `'use client'` component are forbidden — they ship the disallowed branch to the bundle anyway."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3253e619-6844-44bd-8dcd-c868ea74bb6c
---

UI elements and their bound functionality MUST be rendered on the server and only transmitted to the client when the actor is authorized to use them. Unauthorized markup, handlers, action references, and the underlying component imports must never reach the client.

**Why:**
- **Security leak**: even hidden, a `{canDelete && <DeleteButton/>}` toggle inside a `'use client'` component ships the entire `<DeleteButton>` JSX, the bound action handler, and any action-endpoint references in the RSC payload + client bundle. An unprivileged user can read the page source / DevTools / network tab and enumerate the privileged actions they don't have. That's a route-enumeration vector and a tells-the-attacker-what-to-target signal.
- **Transmission cost**: payload bytes the user can't use are pure waste.
- **Correctness**: stale client state can desync from server permissions and render briefly-visible unauthorized UI during hydration or role-change transitions.

**How to apply:**
- The gating decision lives in a **Server Component** that branches on the actor's permission and either includes the privileged subtree or omits it entirely. The privileged subtree may itself be a client island (because it needs interactivity), but the server decides whether to instantiate it at all.
- **Bad** (continuation #3 introduced this pattern; needs reversal):
  ```tsx
  // 'use client'  ← client component
  export function BulkActionsBar({canDelete}: Props) {
    return (
      <div>
        {canDelete && <DeleteButton/>}  // ship-then-hide
      </div>
    );
  }
  ```
- **Good**:
  ```tsx
  // server component
  return (
    <div>
      {canDelete ? <BulkDeleteActionIsland /> : null}
    </div>
  );
  // BulkDeleteActionIsland is the 'use client' boundary; only when canDelete is true
  // does the server include it. The unprivileged response carries no reference to it.
  ```
- The client island's import in the server component should be a **direct** import — Next.js code-splitting + the conditional include together keep the unauthorized client bundle out of the response. If the client component must be statically imported (forcing it into the bundle), refactor to a `next/dynamic` lazy import gated by the permission check.
- Applies to ALL admin actions, not just user-management. Tier 4-client (per [[project_admin_access_tiers]]) must be reframed: it's not "hide via client prop" — it's "server decides whether to ship the action UI at all."

**Audit lens:**
- Search any admin/extension for `'use client'` files that conditionally render based on a `can*` prop. Each is a regression to fix.
- For any new admin UI, the questions are: which server component decides this is included? Which client component houses the interactivity? The server-side branch precedes the client-side instantiation always.

**What this does NOT mean:**
- Client components are still fine for interactivity itself (form state, optimistic UI, etc.). The directive is about what gets SHIPPED, not what runs in the browser.
- Server-side decisions can still feed config to client components (e.g., "this user's locale") — the gate is specifically about action UI for permissions the actor lacks.
