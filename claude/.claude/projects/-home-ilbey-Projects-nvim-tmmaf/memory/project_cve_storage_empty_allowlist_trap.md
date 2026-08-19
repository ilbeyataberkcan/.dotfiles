---
name: project_cve_storage_empty_allowlist_trap
description: "cve-storage treats an empty allowedExtensions array as \"reject everything\", not \"unrestricted\" — the opposite of undefined"
metadata: 
  node_type: memory
  type: project
  originSessionId: 7865d8f2-0562-4658-a27f-894162e2fc44
  modified: 2026-07-29T11:35:37.070Z
---

In cve-storage's `enforceExtensionRule`, `constraints.allowedExtensions === undefined`
returns early (no extension restriction), but an empty array `[]` is a live allow-list
that matches nothing — `allowed.includes(extension)` against `[]` is always false. The
two are opposite behaviours and the thrown message, `File extension is not allowed for
this file type`, names no cause.

Fixed 2026-07-29 in `lib/admin/federation-file-actions.ts`: both
`createFederationDocumentTypeAction` (which wrote `data.allowedExtensions ?? []`) and
the update path's constraint merge now OMIT the key when the list is empty. Before the
fix, any federation document type an admin created without typing an extension list
rejected every upload.

The service normalizes a leading dot (`entry.replace(/^\./, '')`), so seeded values
mixing `"pdf"` and `".pdf"` are harmless — don't chase that.

**Why:** this is a silent, production-affecting failure mode of an admin CRUD path, and
the error message actively misleads. Same shape may exist for other constraint
allow-lists (`allowedMimeTypes`) and in other hosts consuming cve-storage.

**How to apply:** whenever mapping optional admin form fields into a cve-storage
`constraints` bag, omit the key rather than defaulting to `[]`. Check any other
`?? []` on a constraint allow-list.

Found via `lib/__tests__/federation-org-storage.test.ts`, which selects a federation
type with an unordered `limit(1)` and intermittently draws the freshly created one —
that under-specified query is why it presented as a flake. Related:
[[project_storage_permission_redesign]], [[project_storage_document_model_redesign]].
