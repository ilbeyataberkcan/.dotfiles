---
name: tmmaf-admin-otp-email-bug
description: "Open bug reported 02.09.2026: one admin account could not send OTP e-mail; investigate after the Sporcu Ekle wizard ships"
metadata: 
  node_type: memory
  type: project
  originSessionId: 61d3cbe6-066e-4be8-8217-c0cf59bb45b9
  modified: 2026-09-02T06:52:00.531Z
---

Reported by the operator on 02.09.2026 while scoping the "Sporcu Ekle" identity wizard: **one
of the admins could not send an OTP e-mail** for an unknown reason. Other admins were unaffected,
which points at a per-account or per-role condition rather than a broken mail transport.

The operator explicitly deprioritised it — *"don't stall on it we need to ship this fast but
reliably"* — so it is a follow-up, not a blocker.

**Why:** it is an auth-path defect that no repo artifact records; it surfaced only in
conversation, and the "one admin, not all" detail is the whole diagnostic lead.

**How to apply:** raise it once the wizard work is committed. Start from the per-account angle
(mailbox state / placeholder e-mail / claim state) rather than the transport, since mail works
for other admins. Local mail goes through mailpit (`bun run mail:up`, UI on :8026).
Related: [[tmmaf-deploy-hostnames]].
