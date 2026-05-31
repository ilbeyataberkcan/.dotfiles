---
name: auth-driver-first-design
description: "Design the AuthDriver contract from cve-auth's service needs first; THEN implement BetterAuthDriver as a bridge using whatever BA primitives are available — never let BA's API shape constrain the contract"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c71b8f93-4f73-4f51-911a-8222346f6dc5
---

When proposing the cve-auth redesign (or any provider-facade work in cve-auth), the design priority is strict:

1. **AuthDriver / RbacDriver / AuditDriver contracts are designed from cve-auth's service requirements** — what does AuthService need to do? List operations from the cve-auth side, then write the contract.
2. **BetterAuthDriver is the bridge** — implements the contract by using BA's `auth.$context.internalAdapter`, `auth.api.*`, `@simplewebauthn/server` library, or direct SQL on cve-auth's own table schemas. Mix freely; the driver's job is to satisfy the contract however it can.
3. **The schemas are cve-auth's** — `createAuthTables(schemaName)` is a cve-auth factory; BetterAuth consumes them via its `drizzleAdapter` mapping, but the columns/constraints/indexes belong to cve-auth. Adding columns (e.g., `deleted_at`, `skeleton_state`) is a unilateral cve-auth decision.

**Why:** When the conversation framed AuthDriver shape as "what does BA expose? → map cve-auth operations to it," the user pushed back: that approach lets BA's surface dictate cve-auth's contract, which inverts the facade-pattern intent. The contract is OURS; provider APIs are implementation details of the bridge.

**How to apply:**
- When listing operations a driver must support, anchor on cve-auth service-level usage, not on BA endpoint inventories.
- When BA doesn't expose an operation natively, propose a fallback inside the driver (direct SQL on our schema, library call, hand-rolled crypto). Do NOT propose changing the AuthDriver contract to match what BA offers.
- When discussing schema changes (e.g., `deleted_at`), frame as "our schema, our column" — never as "extending BA's table."
- Mapping tables ("operation X → BA's auth.api.Y") are descriptive inventories, NOT prescriptive design constraints.
