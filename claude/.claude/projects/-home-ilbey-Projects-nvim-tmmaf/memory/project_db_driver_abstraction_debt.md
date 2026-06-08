---
name: project_db_driver_abstraction_debt
description: TMMAF host app bypasses the CoreDriver abstraction — ~23 sites call getDrizzle() directly; deferred refactor the user wants reminding about
metadata: 
  node_type: memory
  type: project
  originSessionId: fddc189e-0a5d-4c7a-8591-0cfd8e08cbfa
---

The TMMAF host app has a real DB-abstraction gap the user wants fixed later (NOT now — do not touch unprompted; remind them).

The intended design exists: `app/layout.tsx` runs `initDatabase({ driver: new DrizzleDriver(getDrizzle()) })` with `CoreDriver` from `@synapsys-integrated/cve-core` — the ORM-agnostic-core pattern. Swapping ORMs *should* mean changing only that one wiring site.

But ~23 call sites across `lib/` and `app/` (server actions, admin modules, `payment.ts`, `host-flow-actions.ts`, `registration-approval.ts`, flows, etc.) import `getDrizzle()` from `@/lib/db/client` and use Drizzle directly, bypassing the `CoreDriver`. So an ORM swap today would require refactoring every one of them — the abstraction is honored only at the layout wiring, defeated everywhere else.

**Why:** Violates the settled "ORM-agnostic core" decision in CLAUDE.md (Core defines the contract, host implements `DrizzleDriver`). Couples the whole app to Drizzle.

**How to apply:** When this refactor is greenlit, route all DB access through the initialized `CoreDriver` accessor from cve-core instead of `getDrizzle()`. If `CoreDriver`'s surface can't express a needed query, STOP and propose expanding the cve-core package contract — do not reach for raw Drizzle as the escape hatch. Treat it system-wide, not site-by-site. See [[feedback_fix_properly_system_wide]]. Tests under `lib/__tests__/` also use `getDrizzle()` and will need the same treatment.
