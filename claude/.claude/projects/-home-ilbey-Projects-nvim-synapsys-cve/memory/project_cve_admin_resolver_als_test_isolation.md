---
name: cve-admin-resolver-als-test-isolation
description: "cve-admin resolver tests must clear ALS state in-body, not via beforeEach — enterWith(null) doesn't propagate into Vitest it() callbacks"
metadata: 
  node_type: memory
  type: project
  originSessionId: 05e0613a-641d-48e2-aee9-938c042f8cd3
---

`packages/admin/src/resolver.ts` stores the permission resolver in a module-private `AsyncLocalStorage` (`resolverStore`) set via `enterWith()`. In Vitest, `beforeEach`'s `clearPermissionResolver()` → `enterWith(null)` does NOT reliably propagate into the sibling `it()` callback's async context, so a resolver set by an EARLIER test leaks forward into a later one.

**How to apply:** Any resolver test that asserts the clean/unconfigured state (e.g. `getPermissionResolver()` returns null, `checkPermission` returns true / throws AdminResolverNotConfiguredError, warn-once latch) MUST call `clearPermissionResolver()` as the first line of its OWN `it()` body — relying on `beforeEach` alone is flaky (passes locally, fails in CI depending on test order/pool). Tests that call `setPermissionResolver(theirResolver)` are safe (they overwrite the leaked value in their own context). `resolverStore` is not exported, so `.run()` isn't available to tests.

**Why it recurred:** This bit twice during the v1.3 green-up — the first fix patched only 3 ALS-sensitive tests and missed two clean-state assertions (`:29`, `:48`), which then failed CI. resolver.ts itself is correct; the leak only matters in tests (production sets the resolver once at app init). Don't "fix" it by weakening the prod-throw/warn assertions. Related: [[project_admin_access_tiers]], [[feedback_ui_gates_server_side_only]].
