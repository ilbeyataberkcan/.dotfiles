# Design Agent Guide

Use the primary `design` agent for design implications and visual implementation sweeps.

## When to use it
- End-to-end landing/dashboard redesigns.
- Brand-alignment passes that need iterative approvals.
- Cases where you want UI changes without accidental logic edits.

## How it works
1. Captures or resumes approved Business DNA and constraints.
2. Builds a dynamic decision tree (including sub-branches as needed).
3. Runs iterative loop: propose -> approve -> apply -> inspect.
4. Uses mandatory inspection questionnaire after major bundles:
   - `Looks good, continue`
   - `Refine this direction`
   - `Change direction`
5. Runs logic integrity checks and runtime preflight before handoff.
6. Uses XML contracts in `.opencode/*.xml` as source-of-truth.

## Logic safety behavior
- Defaults to visual scope only.
- Blocks unexpected logic-sensitive changes unless explicitly approved.
- Reports risky file edits and rationale if logic-adjacent changes are required.

## Live preview behavior
- Optionally starts a background dev server for inspection.
- Keeps server healthy during sweep and restarts when needed.
- Reports restart reason and count.
