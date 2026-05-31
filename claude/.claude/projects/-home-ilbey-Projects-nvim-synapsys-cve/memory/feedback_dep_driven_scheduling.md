---
name: Step-grouped schedule view, but per-phase dep-driven start semantics
description: For multi-phase parallel plans, keep the human-readable step table — but make it explicit that a phase starts when ITS deps merge, not when its step's prereqs all merge.
type: feedback
originSessionId: d8789fe0-f215-4e77-9023-ecec3a9e78af
---
When planning multi-phase parallel work, present the schedule as a step-grouped table (steps = clusters of phases that *can* run concurrently — easy for a human to scan). BUT make it explicit that a phase in step N starts the instant *its specific* dependencies are merged, not when every phase in step N-1 is finished.

**Why:**
- First mistake: I wrote "a step starts only after every phase in the previous step has merged" — that's a synchronisation barrier the user explicitly does not want.
- Second mistake: I overcorrected by replacing the step table with a per-phase eligibility table. User pushed back: "this type of a table doesn't provide good [view] for me, the human developer, to follow to understand which phases can run in parallel or which should wait. The previous table made it easier to understand. I just expected you to provide a subtle change in your plan that a phase can start in a step if its dependencies from the previous step is merged and finished."

**How to apply:**
- Keep the step-based table — it's the right human-readable visualisation.
- In the "Unblocked when" column, list the per-phase dep, not an aggregated "all of step N-1 merged." Example: `Step 3: P13 & P16: P11 merged. P14: P12 merged.`
- Add one short paragraph below the table clarifying: "A phase starts the instant ITS own deps are merged. Steps group phases that *can* run concurrently — they are not synchronisation barriers." Then a concrete example of a phase from step N still running while a phase from step N+1 starts.
- Coordination/tracking docs can keep a "Schedule step" column for orientation, but each session row carries its own branched-from SHA because phases at the same step may launch at different SHAs (their deps merged at different times).
