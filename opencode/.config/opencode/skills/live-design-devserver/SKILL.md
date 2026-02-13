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

  <lifecycle>
    <step order="1">Ask whether live preview should run.</step>
    <step order="2">Start server in project root and record pid, port, and log path.</step>
    <step order="3">Health-check preview after each major bundle.</step>
    <step order="4">Restart on startup failure, crash, or required config dependency reload.</step>
    <step order="5">Report restart count and reason history.</step>
  </lifecycle>

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
