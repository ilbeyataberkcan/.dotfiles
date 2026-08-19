---
name: feedback_prove_the_proof_can_fail
description: A gate or test is only worth the mutant it reds on — always mutate the real implementation and watch the specific assertion fail
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3f671175-d5f3-48f5-b9b6-5d6e1ba723e7
  modified: 2026-07-28T13:57:45.024Z
---

Every "proof" in a plan must be shown failing against a mutated implementation before it counts. Phase 05 (v1.6 cve-articles) shipped **seven** assertions that passed while proving nothing, each caught only by an adversarial pass:

1. `expect(sql).toContain('organization_id')` — `select()` emits a projection naming every column, so it was true regardless of the WHERE clause. Three unscoped list reads shipped under it.
2. A bundle-isolation RED that injected a **depth-1** import into a gate that only scanned depth 1. Proved the gate works at the only depth it covered.
3. `whereClauseOf` slicing to end-of-statement — for UPDATE/DELETE it swallowed the `returning` projection, same false positive one level narrower.
4. `expect(Object.keys(barrel)).not.toContain('ArticlesAuthorizer')` — an erased TS interface can never appear in a runtime namespace. Unfalsifiable.
5. A cascade-child assertion placed *after* a row-survival assertion, so it never executed.
6. `expect(after.updatedAt).toEqual(before.updatedAt)` — seed and mutation both called bare `new Date()`, landing in the same millisecond. Passed against a driver that performed the cross-tenant write and returned `null`. Needed `vi.useFakeTimers()` + explicit advance.
7. A cross-tenant delete asserting only the return value + parent row, with no cascade child seeded. A two-edit mutant destroyed another tenant's children at 131/131 green.

**Why:** each read as convincing evidence in a SUMMARY and a review. Only running the mutant exposed them. "The test passes" and "the test can fail" are different claims.

**How to apply:**
- Assert on the *extracted* WHERE clause + bound parameters, never a raw SQL string.
- Every negative case must first assert exactly one statement was captured against the expected table — `expect('').not.toContain(x)` passes when nothing was emitted.
- Order assertions so the *damage* is checked before the *answer*: children before parent, state before return value.
- Require one revert-observe-restore cycle **per mechanism**, not one standing in for a set.
- Beware inert observables: timestamps from bare `new Date()`, and helpers hardcoding one table name reused across clusters.
- Deleting a guard outright often reds on the return value — the realistic mutant is the guard placed one line *too late*.

Related: [[feedback_verify_code_not_just_tests]], [[feedback_never_work_around_root_cause]].
