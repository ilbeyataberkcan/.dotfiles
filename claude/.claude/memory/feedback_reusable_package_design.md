---
name: feedback-reusable-package-design
description: Directive for any project that ships reusable packages, libraries, SDKs, or shared classes — comprehensive does NOT mean "we built every flow"; it means consumers can express any reasonable policy without forking the package. Applies globally across all projects.
metadata:
  type: feedback
---

**Directive: Comprehensive ≠ "we built every flow." Comprehensive = "consumers can express any reasonable policy without forking us."**

When designing reusable packages, libraries, SDKs, shared classes, abstract base classes, or facade interfaces:

1. **The public surface is a policy expression language, not a feature catalog.** Don't bake one consumer's policy choices into the package. Expose configurable knobs for every dimension a consumer might reasonably want to vary.

2. **Default sensibly, but never default silently.** Defaults should reflect the most common case; consumers who diverge should be able to override individual knobs without rewriting framework-specific code.

3. **Configuration vocabulary belongs to the package, not its underlying framework.** If the package wraps a third-party library (e.g., a facade over BA, Stripe, Auth0), the consumer-facing config MUST use the package's own vocabulary. The package translates internally. Leaking the underlying framework's config shape to consumers defeats the facade — the day you swap the underlying framework, every consumer has to rewrite.

4. **Swap-survivability is the test.** For any package providing multiple driver/adapter/strategy implementations, the question "can a consumer swap concrete X for concrete Y by changing only the constructor line?" must be answerable YES. If the answer is "yes, plus they have to update these N other places," the abstraction is leaky.

5. **Policy knobs go in interfaces; framework-specific config goes in driver constructors.** The interface is what consumers depend on. Concrete driver constructors can accept framework-specific extras (BA secret, Stripe API key) — those are unavoidable. But anything cross-framework (verification policy, retry strategy, audit policy) belongs in the package's universal vocabulary.

6. **Comprehensiveness is foresight, not maximalism.** Include every knob that has a plausible consumer use case TODAY. Don't include knobs for hypothetical future scenarios with no concrete use case in mind. New knobs are added additively as real needs surface.

**Why:** User pointed out repeated pattern of designing facades that leak the underlying framework's shape (e.g., `buildCveAuthDatabaseHooks` returning `BetterAuthDatabaseHooks`-typed objects) — defeats the facade. Also pointed out tendency to under-design policy surfaces with minimalist YAGNI thinking when the actual ask is comprehensive forethought.

**How to apply:**
- When you propose a package API, ask: "If we swap the underlying framework tomorrow, what changes for the consumer? If it's anything other than the driver instantiation line, redesign."
- When you propose a config/policy interface, ask: "What knobs do reasonable consumers want? List ALL of them now. Don't strip the list to 'minimum viable' — strip it to 'no speculative knobs without a use case in mind'."
- Use the package's vocabulary in public types. Drivers translate to framework vocabulary internally.
- Concrete driver implementations OWN the framework-specific enforcement of policies. The interface declares WHAT is enforced; the driver decides HOW.
