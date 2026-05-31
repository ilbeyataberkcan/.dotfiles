---
name: feedback-paired-api-name-both-members
description: "When proposing a paired API (safe default + escape hatch), name BOTH members explicitly in the same turn — don't leave one half implicit."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 68dade9f-cf86-4f34-9fdb-1d7c457fc893
---

When designing paired APIs (safe-default + escape-hatch, primary + advanced, sync + async, etc.), name BOTH members explicitly in the same proposal turn.

**Why:** During Phase 22 SPEC, I named the safe default (`ingestProviderWebhook`) clearly but left the pre-verified path as the existing `ingestProviderStatus` (still "misleading per user"). User flagged it: "you mentioned naming but didn't provide any naming for the raw ingestions and external verification flows MailService function." A paired API has two surfaces; leaving one unnamed effectively asks the user to do half the design work after I've claimed to have proposed a solution.

**How to apply:** When proposing API shape A + B (paired), the proposal must specify the name + signature + JSDoc for BOTH A AND B in the same turn, with rationale for the *pair* (not just for A). If renaming the existing function is part of the proposal, state the new name; if keeping the old name is part of the proposal, state that explicitly with the rationale.
