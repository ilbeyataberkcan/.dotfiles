---
name: project-three-shell-types
description: "synapsys-cve / CVE application design uses THREE shell types (public / application / takeover) at the route-navigation layer. 'Shell' is a reserved term — do not name flow-tree concepts or layer concepts using it. Logged 2026-05-30."
metadata: 
  node_type: memory
  type: project
  originSessionId: c3810180-957a-477f-b286-5e86fd39fe3a
---

The CVE application architecture uses **three distinct shell types** at the route-navigation layer. Each route inherits EXACTLY ONE shell, determined by path prefix + access classification — **not customizable per-screen**.

## The three shells

**1. Public shell** — unauthenticated routes.
Surfaces: landing, news, events, athlete / club / federation directories, disciplines, documents, contact, sponsors, press, legal, help.
Chrome: horizontal marketing navigation + prominent sign-in / registration cluster + comprehensive footer.

**2. Application shell** — every authenticated portal route.
Chrome: portal-aware top bar (notifications, locale, avatar), left sidebar (desktop) or bottom tab bar (mobile), portal switcher for multi-role users moving between authorized scopes.

**3. Takeover shell** — onboarding routes + cross-cutting flow routes (the Phase 07.3 cve-core/flows target).
Chrome: brand mark + progress indicator + active step ONLY. Portal navigation stripped entirely.
**Why:** half-completed ramps (identity verification, payment, ticket purchase) are dangerous to navigate away from — chrome removal is a safety feature.

## Distinction from the z-axis layering model

Shells and z-axis layers are orthogonal:
- **Shells** = which navigation chrome wraps a route (route-time decision, exactly one per route).
- **Z-axis layers** (see [[project_website_layering_architecture]]) = what stacks on top of the current shell (main content → second-layer studio panels → dialogs → notifications).

A takeover-shell route can still have dialogs and notifications stacked above it; an application-shell route can still mount a flow inside a modal (using cve-core/flows in embedded mode, NOT in takeover mode).

## Reserved terminology — do NOT reuse "shell"

When designing cve-core/flows or any new ComponentNode kind, **do not use "Shell" in the name** — it would collide with the reserved application-layer concept.

Examples of names to avoid for flow-tree concepts:
- ✗ FlowShellNode
- ✗ FlowShell

Use names like FlowRootNode, FlowProviderNode, FlowDefinitionNode, FlowMounterNode, etc. instead.

## How to apply

- When recommending names for new ComponentNode kinds, navigation primitives, or route components: confirm the name does not collide with "shell" (public / application / takeover).
- When recommending route placement: identify which shell the route lands under (and respect the one-shell-per-route rule).
- When documenting flow execution surfaces: "takeover shell mode" is a valid descriptor (it names the existing shell); "flow shell" is not (it overloads the reserved term).
- When extracting architecture docs (PROJECT.md, docs/MasterProjectArchitecture.md, future shell docs): cross-reference this memory and [[project_website_layering_architecture]].

**Source:** Operator-provided 2026-05-30 during Phase 07.3 cve-core/flows spec-phase Round 3.
