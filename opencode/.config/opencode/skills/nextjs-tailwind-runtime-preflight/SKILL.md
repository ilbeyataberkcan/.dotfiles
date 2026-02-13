---
name: nextjs-tailwind-runtime-preflight
description: Run runtime safety checks for Next.js and Tailwind resolution before bootstrap handoff.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: frontend-implementation
  domain: runtime-validation
---
<skill_contract id="nextjs-tailwind-runtime-preflight" strict_order="true">
  <purpose>
    <item>Catch runtime failures that lint or build alone can miss.</item>
    <item>Block handoff when localhost is not healthy.</item>
  </purpose>

  <skill_definition>
    This skill is the runtime release gate for design delivery. It verifies that configuration, dependencies, and local execution are healthy so the user does not receive a visually updated project that fails at localhost or runtime resolution.
    When using this skill, the agent should run checks in strict order, map outcomes to runtime leaves, and provide actionable remediation when any blocking condition appears.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/templates/visual-preflight-policy.template.xml">Runtime and blocking policy expectations.</resource>
    <resource path="~/.config/opencode/templates/design-flow-state.template.xml">Runtime leaf status and final disposition fields.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan runtime validation as a fail-fast release gate with explicit pass or fail evidence.</objective>
    <phase order="1">Run configuration and dependency sanity checks before command execution.</phase>
    <phase order="2">Execute lint, build, and dev smoke tests in strict sequence.</phase>
    <phase order="3">Classify findings by blocking severity and map them to runtime leaves.</phase>
    <phase order="4">Emit remediation guidance and final disposition for handoff decisions.</phase>
    <completion_signal>All blocking checks pass or blocking failures are explicitly reported.</completion_signal>
  </planning_language>

  <checks>
    <check id="config-sanity">Flag risky next root overrides such as turbopack root from process cwd.</check>
    <check id="tailwind-alignment">Verify tailwind dependency, imports, and postcss alignment.</check>
    <check id="execution">Run lint, build, and dev smoke checks.</check>
    <check id="environment">Detect port conflicts and verify project-root workdir.</check>
    <check id="live-preview" when="enabled">Keep background server healthy and restart when required.</check>
  </checks>

  <leaf_mapping>
    <leaf check="config-sanity">L_RUNTIME_ROOT_SANITY_PASS</leaf>
    <leaf check="tailwind-alignment">L_RUNTIME_TAILWIND_RESOLVE_PASS</leaf>
    <leaf check="execution">L_RUNTIME_LINT_BUILD_DEV_PASS</leaf>
    <leaf check="live-preview">L_RUNTIME_RESTART_RECOVERED</leaf>
  </leaf_mapping>

  <blocking_policy>
    <rule>Block on resolver errors such as cannot resolve tailwindcss.</rule>
    <rule>Block if dev server fails after passing build.</rule>
    <rule>Downgrade workspace lockfile root warnings to warn when non-blocking.</rule>
  </blocking_policy>

  <outputs>
    <output>Check matrix: pass, warn, fail.</output>
    <output>Detected risks and fix guidance.</output>
    <output>Final runtime disposition.</output>
  </outputs>
</skill_contract>
