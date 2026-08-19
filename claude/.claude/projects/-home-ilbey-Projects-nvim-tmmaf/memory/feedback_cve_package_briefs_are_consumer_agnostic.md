---
name: feedback_cve_package_briefs_are_consumer_agnostic
description: "A cve-package spec must be justified by general capability needs, never framed around the motivating host's constraint"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 64af19cd-176a-41f5-a99e-5fab31f9cbd6
  modified: 2026-08-14T13:44:08.408Z
---

When a host problem justifies extracting a new `cve-*` package, the package brief must be written
from **general usage needs and configurability, like any other cve-package** — the motivating
constraint is demoted to an appendix-level compatibility check. The user corrected exactly this on
2026-08-14: a `cve-dynamic-links` brief had been framed throughout in terms of tmmaf's 70-character
SMS budget.

**Why:** framing by the first consumer's constraint bakes that consumer's numbers into the
package's identity. Reviewers and implementing agents then treat a host-specific limit as a
package invariant, and knobs get hardcoded as constants. It also fails the handoff's own §6.3
neutrality test before a line is written.

**How to apply:** open with what the package *is*, then a numbered list of general needs, and make
every public surface trace to one of them. Constraints that came from the motivating host become
**configurable policy with a safe default** (e.g. code entropy became a `code.length` knob
defaulting to credential-grade, not a constant sized to fit an SMS). Put the host case in a closing
appendix labelled as a worked example, and state plainly that none of its domain vocabulary may
appear in the package's types, schemas, enums, copy or tests. Also list explicit v1 non-goals so
adjacent features are not quietly built.

Related: [[project_sms_one_segment_dynamic_links]], [[feedback_shared_tooling_scope_agnostic]].
