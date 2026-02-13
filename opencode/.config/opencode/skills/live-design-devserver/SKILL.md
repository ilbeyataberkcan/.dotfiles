---
name: live-design-devserver
description: Manage a background dev server for continuous design inspection with restart and health recovery.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: frontend-design-iteration
  domain: preview-lifecycle
---
<skill_contract id="live-design-devserver" strict_order="true">
  <purpose>
    <item>Provide live preview continuity during decision sweeps.</item>
    <item>Recover automatically from expected runtime interruptions.</item>
  </purpose>

  <skill_definition>
    This skill runs the background preview environment so users can inspect changes continuously during the design sweep. It tracks server health and restarts safely when required by runtime conditions.
    When using this skill, the agent should write lifecycle updates to flow state and keep restart reasons transparent for auditability and troubleshooting.
  </skill_definition>

  <resource_references>
    <resource path="~/.config/opencode/templates/design-flow-state.template.xml">Live preview status, restart counts, and health timestamps.</resource>
    <resource path="~/.config/opencode/templates/visual-preflight-policy.template.xml">Runtime expectations tied to preview behavior.</resource>
  </resource_references>

  <planning_language>
    <objective>Plan live preview as a resilient background service that supports iterative design decisions.</objective>
    <phase order="1">Decide preview enablement and initialize server session metadata.</phase>
    <phase order="2">Start and health-check server before first inspection checkpoint.</phase>
    <phase order="3">Monitor health after each major bundle and restart when needed.</phase>
    <phase order="4">Persist lifecycle history for final reporting and resumability.</phase>
    <completion_signal>Preview status is healthy or failure is explicitly surfaced with restart evidence.</completion_signal>
  </planning_language>

  <lifecycle>
    <step order="1">Ask whether live preview should run.</step>
    <step order="2">Start server in project root and record pid, port, and log path.</step>
    <step order="3">Health-check preview after each major bundle.</step>
    <step order="4">Restart on startup failure, crash, or required config dependency reload.</step>
    <step order="5">Report restart count and reason history.</step>
  </lifecycle>

  <state_update>
    <rule>Persist live preview status, restart_count, and last_restart_reason to design-flow-state.xml.</rule>
  </state_update>

  <safety>
    <rule>Do not run from wrong workdir.</rule>
    <rule>Resolve port conflicts safely.</rule>
    <rule>Avoid duplicate instances on the same port.</rule>
  </safety>

  <outputs>
    <output>Live preview status.</output>
    <output>Server endpoint.</output>
    <output>Restart history.</output>
    <output>Current health.</output>
  </outputs>
</skill_contract>
