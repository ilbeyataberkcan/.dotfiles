---
name: reference_cve_admin_shell_slots
description: cve-admin AdminShell only renders 5 coarse zone slots by EXACT key match — the granular header:* keys are vestigial; host modules contribute slots as extensions
metadata: 
  node_type: memory
  type: reference
  originSessionId: 85f11f1f-97c9-46e6-bf8f-e4c140392f76
---

How AdminShell slots ACTUALLY render in cve-admin (verified 10.2.1, 2026-06-26):

- **Only 5 core zones render**, and `resolveSlots` matches `s.slotKey === slotKey` EXACTLY (no prefix/zone expansion). Valid keys = `ADMIN_SLOTS` in `@synapsys-integrated/cve-admin` `dist/types/slots`: `'sidebar:before-nav'`, `'sidebar:after-nav'`, `'sidebar:controls'`, `'header'`, `'footer'`. AdminShell.tsx calls `renderSlots(allowedExtensions, 'header')` / `'footer'` / the three sidebar keys — nothing else.
- **`header:top` / `header:search` / `header:extensions` / `header:actions` / `header:bottom` are a TRAP.** They exist in a `HEADER_SLOTS` array in `shell/types` and as type-union members, but the shell NEVER resolves them — they're declared-but-unused. A slot keyed `'header:actions'` typechecks (because `AdminSlotKey = CoreAdminSlotKey | (string & {})` accepts any string) and then silently never renders. Use `slotKey: 'header'` for top-bar content.
- **Host apps contribute slots, not just first-party packages.** `defineAdminModule({ slots: [...] })` from the host becomes an engine extension; `createAdminEngine({ modules })` folds host modules into `engine.extensions`, which `renderSlots` reads. tmmaf's `getShellNavModule` (a host module) drives `sidebar:after-nav`, and `getVersionModule` drives `'header'` — both host-owned. Slot module needs `metadata.permissions.view` (e.g. `'admin:access'`); the shell filters extensions by that before rendering.
- **`footer` only renders when AdminShell is given `footer` (truthy) prop** (`footerContent = footer ? renderSlots(...,'footer') : null`). The `header` zone always renders.
- **`AdminHeader` is `<header class="relative z-10 flex h-14 items-center bg-surface px-5 shadow-sm">`** — a left-aligned flex bar. Header content is left-aligned by default; wrap in `ml-auto` (or `justify-end`) to sit top-RIGHT. It also renders on the mobile layout (with an absolute centered logo).

Source of truth: `~/Projects/nvim/synapsys-cve/packages/admin/src/shell/` (AdminShell.tsx, resolveSlots.ts, primitives/AdminHeader.tsx). The installed dist matches.
