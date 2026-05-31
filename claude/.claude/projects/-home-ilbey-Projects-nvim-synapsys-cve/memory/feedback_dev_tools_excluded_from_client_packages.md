---
name: dev-tools-excluded-from-client-packages
description: "Codegen, CLIs, build scripts, and other dev tools must stay out of the built/published runtime package. Use tsconfig.build.json exclude to keep them in source-only."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b1c4f5be-475f-4525-997c-dca65f400103
---

Developer-side tools (codegens, CLIs, build scripts, scaffolding utilities) must NOT ship inside the published tarball of a runtime/client-facing package. They bloat the tarball, expose Node-only code paths next to React/runtime code, and conflate two different audiences (developers running tools vs. clients running the runtime).

**Why:** User explicitly corrected this twice during the Phase 20.6 design pivot. First objection: "I don't want this cli tool to be shipped to the clients. Actually many of these developer side tools should be kept out of the client packages." Second objection (when I overcorrected by proposing a separate package): "I didn't mean put the codegen in a new and seperate package. That doesn't make sense. I just want it to be out of the built package that will be deployed for the clients." So the correct shape is: dev tools live in the SAME package's source repo, but are EXCLUDED from the published build output.

**How to apply:**
1. Dev tools live under `packages/<pkg>/src/<tool-name>/` alongside runtime code in source — same workspace, same versioning, same git history.
2. `packages/<pkg>/tsconfig.build.json` adds `"src/<tool-name>/**/*"` to the `exclude` array. The tool never compiles to `dist/`, so it's automatically excluded from the package's `files: ["dist", ...]` glob.
3. Do NOT add a `bin` entry for the tool. Bins only resolve to files inside the published tarball — dev tools that aren't published can't be exposed as bins.
4. Do NOT create a subpath export for the tool. The tool isn't part of the package's public API.
5. Hosts in the same monorepo invoke the tool via direct workspace path: `bun ../../packages/<pkg>/src/<tool-name>/cli.ts --args ...`. Bun's TS loader runs the .ts source directly.
6. External hosts (consuming from registry without the workspace) don't get the tool. Either:
   - Document a "copy the CLI source" workaround in capstone docs (Phase 29 for synapsys-cve)
   - Or ship the tool as a separate dev-only package IF the dev/runtime split has structural reasons beyond "keep tarball small"
7. The default rule: dev tools that aren't large/complex live in the same source repo; the default for "small, package-local utility" is source-only-not-published, NOT a separate package.

When NOT to apply: tools that ARE meant to be invoked by external consumers (like drizzle-kit, like `next` itself) DO get bin entries and DO ship in tarballs — they're products, not internal dev tools. Apply this rule to internal utilities that the package's developers need but consumers don't.

Related: [[feedback_never_work_around_root_cause]] · [[feedback_no_helper_for_static_placeholder]]
