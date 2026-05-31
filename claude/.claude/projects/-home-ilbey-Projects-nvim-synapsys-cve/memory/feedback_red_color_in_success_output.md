---
name: feedback-red-color-in-success-output
description: "When tool output uses red ANSI coloring on lines that are NOT errors (turbo summary lines, etc.), user reads it as failure even when \"18/18 successful.\" Suppress color from non-TTY output or pipe through `cat` to strip ANSI codes."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: e8e5c5ea-4f72-451d-9329-bfbbf532024a
---

User reads ANSI-red text as a failure signal. When the output is all-green (e.g. `Tasks: 18 successful, 18 total`) but rendered through a tool that emits red on summary lines (turbo's TTY-detection can color the totals row red on some terminals/states), the user is misled.

**How to apply:**

- When running `bunx turbo run <task>` for verification gates, prefer one of:
  - `bunx turbo run <task> --no-color` — turbo's explicit flag
  - `bunx turbo run <task> 2>&1 | cat` — pipes through a non-TTY consumer, which strips ANSI escape codes
  - `NO_COLOR=1 bunx turbo run <task>` — env var honored by most modern CLIs (turbo, eslint, vitest, etc.)
- For vitest, eslint, tsc — these honor `NO_COLOR=1` or `--no-color` similarly.
- When reporting the result to the user in chat, surface the success/failure verdict in plain text BEFORE the (possibly red-tinted) raw output, so the user reads the verdict first.

**Example fix:**

Bad:
```
bunx turbo run test --continue 2>&1 | tail -5    # may render red summary even on all-green
```

Better:
```
NO_COLOR=1 bunx turbo run test --continue 2>&1 | tail -5
```

Or:
```
bunx turbo run test --continue --no-color 2>&1 | tail -5
```

**Why this matters:** the user has to context-switch between "this is a failure signal I need to act on" and "this is just terminal coloring." Forcing them to parse-then-discard red lines is friction.

Pairs with [[feedback-check-priors-terse-output]] (terse, signal-first output).
