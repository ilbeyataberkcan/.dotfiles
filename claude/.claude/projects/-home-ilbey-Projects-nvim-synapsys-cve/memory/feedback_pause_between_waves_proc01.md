---
name: feedback-pause-between-waves-proc01
description: "For v1.2 phases (PROC-01 discipline), pause between every wave for user review — don't auto-chain waves even with AUTO_MODE on"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: e8e5c5ea-4f72-451d-9329-bfbbf532024a
---

For Phase 20 (and every v1.2 phase that inherits PROC-01 discipline), STOP between waves so the user can inspect the result, verify the build/UX, and decide whether to advance. Wave-level pauses are part of user-piloted granularity, not just plan-internal checkpoints.

**Why:** PROC-01 originates at Phase 20 and runs across every v1.2 phase: "fine-grained user-piloted steps (smallest viable surface per step, manual verification between steps, user piloted every configuration choice)". Wave boundaries are the natural user-verification points the v1.2 milestone is built around. Auto-chaining through them defeats the entire pitfall-discovery model that v1.2 exists to operate.

**How to apply:**
- After each wave completes (executor returns, commits visible, SUMMARY.md exists), STOP.
- Report what the wave delivered with concrete pointers (commits, files, FINDINGS.md row updates).
- Ask the user to verify and then say "go" / "next wave" / equivalent before spawning the next wave's executor.
- AUTO_MODE preference in gsd-config does NOT override this — that flag is about within-plan checkpoint auto-approval (decision/human-verify), not wave-to-wave pacing.
- This also applies to invocations where the user said "work without stopping" — those refer to clarifying micro-questions, not to v1.2's explicit user-piloted-step contract. See [[feedback-workflow-gates-vs-terse-directive]].
- Plan-internal checkpoint:decision (option-a auto-selection) is still fine; just don't auto-cross wave boundaries.

**Trigger phases:** Phase 20 and any subsequent v1.2 phase whose ROADMAP entry references PROC-01 (Phases 21–28). Phase 29 (capstone) — TBD; ask first.
