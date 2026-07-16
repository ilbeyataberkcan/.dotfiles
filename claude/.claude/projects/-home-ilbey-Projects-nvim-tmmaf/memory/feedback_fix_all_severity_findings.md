---
name: feedback-fix-all-severity-findings
description: "Review/audit findings are ALWAYS fixed at every severity level (CRITICAL→LOW), never filtered to crit/high only"
metadata:
  node_type: memory
  type: feedback
  originSessionId: d56d0b4d-7556-4155-ab18-cb0703831bbc
---

When a reviewer or security auditor returns findings, fix ALL of them — CRITICAL, HIGH, MEDIUM, and LOW — in the same fix pass. Never wire a fix loop that filters to CRITICAL/HIGH only (2026-07-08, federation-platform run: user corrected exactly this twice).

**Why:** the user treats unfixed LOW/MEDIUM findings as debt that silently accumulates; a second sweep later costs more tokens than fixing inline.

**How to apply:** fix agents receive the reviewer's complete findings list. A finding may be DEFERRED only when the fix requires an architectural decision the specs don't cover — each deferral named with reason + concrete upgrade path. Environmental findings (docker-down test noise) are skip-with-note, not fixes. Related: [[feedback-model-effort-ponytail-matrix]] (comment policy is prevention-only — don't sweep existing comments), [[feedback-revision-verification]] (spot-check the fixer's changelog with targeted greps, not a full re-review).
