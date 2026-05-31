---
name: "extension" is a reserved term in CVE — use "update" or "expansion" for in-package modifications
description: In CVE, "extension" means a package that adds functionality to a parent package. Don't use it for editing existing files inside an existing package.
type: feedback
originSessionId: 1afcd473-2047-41eb-a1cf-363b46216a35
---
In the CVE codebase the term **extension** is reserved for **packages that add functionality to a parent package**. Examples: `packages/extensions/studio/` (the Studio admin extension), `packages/extensions/user-management/`, and the `<package>/extensions/admin/` pattern documented in CLAUDE.md.

When describing modifications to existing files inside a package (e.g., adding a method to `DatabaseService`, adding a prop to `RenderEngine`, adding a field to `PageSchema`), use **update** or **expansion**, never "extend"/"extension."

**Why:** Reusing "extension" for in-package edits confuses downstream agents (and humans) about scope — they may interpret it as "create a new extension package" rather than "edit the existing files." The user explicitly flagged this on 2026-05-09 during the Phase 10 design.

**How to apply:** Use "update X to..." or "expand X with..." or "files modified" when documenting changes to existing files. Reserve "extension" / "extension package" / "extends Y package" exclusively for the cross-package extension pattern. It's fine to keep package names that include "extension" (e.g., `cve-studio-extension` is a real package name).
