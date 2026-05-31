---
name: cve-admin-slot-system-architecture
description: "cve-admin shell exposes 5 core slots + 5 header sub-slots + arbitrary custom string slots + 3 direct shell props (userContent, defaultLogo, expandedLogo). Hosts use direct props for shell-level chrome; modules use slot registrations."
metadata: 
  node_type: memory
  type: project
  originSessionId: 297cca6f-f479-4e96-8787-365bfe603550
---

# cve-admin Expansion Slot System

The admin shell has **three composition layers** for placing content into named locations. Knowing which layer to use is the load-bearing distinction.

## Layer 1 — Direct shell props (host → AdminShell)

Bypasses the slot/extension mechanism. Required props on `<AdminShell>` (see `packages/admin/src/shell/types.ts:31-38`):

| Prop | Type | Role |
|---|---|---|
| `defaultLogo` | `ReactNode` | Logo in collapsed sidebar mode (`~64px` width) |
| `expandedLogo?` | `ReactNode` | Logo in expanded sidebar mode (~250px width) |
| `userContent?` | `ReactNode` | Sidebar bottom user-menu region (passed straight to `AdminSidebar` via `ShellLayout.tsx:146`) |

**When to use:** Shell-level chrome the host owns (company logo, signed-in user menu). The host knows these without any module needing to register them.

**Use case for Phase 5:** `userContent={<UserMenu user={...} />}` where `UserMenu` comes from `@synapsys-integrated/cve-auth/react`. No coupling between cve-admin and cve-auth — `userContent` accepts any ReactNode.

## Layer 2 — Core slot keys (modules → AdminShell)

Declared in `packages/admin/src/types/slots.ts:28-34`:

```
'sidebar:before-nav'   // Above main navigation (pinned items, widgets)
'sidebar:after-nav'    // Below main navigation (widgets, quick stats)
'sidebar:controls'     // Alongside default lock/expand controls (additive)
'header'               // Header zone (search, notifications, user avatar)
'footer'               // Footer zone (status info, links)
```

Each is rendered by `AdminShell` calling `renderSlots(allowedExtensions, slotKey)` (`packages/admin/src/shell/AdminShell.tsx:35-41`).

**When to use:** A package's admin extension wants to inject content into a known shell zone (e.g., cve-payment registering a "billing alerts" widget in `sidebar:after-nav`).

## Layer 3 — Header sub-slots (declared but NOT wired)

Declared in `packages/admin/src/shell/types.ts:53-66`:

```
'header:top' 'header:search' 'header:extensions' 'header:actions' 'header:bottom'
```

`HEADER_SLOTS` array exists but `AdminShell` only renders the parent `'header'` slot. The sub-slots are **forward-compat surface** — modules can register against them today but nothing renders them. Future minor of cve-admin should wire `AdminHeader` to consume each sub-slot via `renderSlots(extensions, 'header:X')`.

## Layer 4 — Custom string slots (open extensibility)

`AdminSlotKey` type accepts any string (`packages/admin/src/types/slots.ts:45`). Extensions can register slots with arbitrary names (e.g., `'studio:preview-toolbar'`). Renderers must explicitly call `renderSlots(extensions, 'studio:preview-toolbar')` — there's no auto-discovery.

## Slot Registration shape

```ts
interface SlotRegistration<TComponent> {
  slotKey: AdminSlotKey;
  component: TComponent;
  order?: number;  // lower numbers render first; default 0
}
```

Declared per-extension via `AdminModuleExtension.slots: SlotRegistration[]`. `resolveSlots` flattens-and-sorts across all extensions (`packages/admin/src/shell/resolveSlots.ts:26-42`).

## Server-side rendering invariant

Slot resolution is **fully server-side** (`AdminShell` is an async Server Component, not 'use client'). Permission filtering of extensions runs BEFORE slot resolution (`AdminShell.tsx:28-29`), so denied extensions contribute no slot content to the rendered HTML — no client-side leakage.

## Direct-prop vs slot — decision rule

| Question | Use direct prop | Use slot registration |
|---|---|---|
| Does the host KNOW the content at engine-construction time? | ✓ | — |
| Is the content provided BY an admin module/extension? | — | ✓ |
| Should the content render with extension permission gating? | — | ✓ |
| Is this shell-level chrome (logo, signed-in user)? | ✓ | — |

For Phase 5's `modules: []` case, only direct props are exercised. Slot registrations require ≥1 module; their structural correctness is provable but their runtime is deferred to Phase 7+.

## Related memories

- [[cve-admin-redesign-phase-5]] — Phase 5's factory + permission-internalization redesign
- [[client-context-only-for-client-consumers]] — `userContent` direct prop pattern aligns with this rule
- [[no-provider-type-reexports]] — cve-admin should not re-export cve-auth's UserMenu type
