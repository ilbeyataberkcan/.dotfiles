---
name: project_tmmaf_release_versioning_convention
description: "tmmaf tracks updates by package.json semver + a matching annotated v<semver> git tag on the staging merge commit — started at v0.7.0, 2026-08-09; the package.json bump is the step that gets skipped, so verify it against the newest tag"
metadata: 
  node_type: memory
  type: project
  originSessionId: a5006746-e261-4020-bc9e-080b034854b2
  modified: 2026-08-13T16:53:34.323Z
---

**Operator ruling, 2026-08-09:** "From now on we will keep track of updates with update tags
and package.json version." Before this the app version sat unused at 0.6.0 and the repo had
**zero** git tags.

**The convention, as established by the first release:**

1. Bump `package.json` with the existing script — `bun run version:patch|minor|major`
   (`scripts/bump-version.ts`). It does a targeted regex replace so the rest of the manifest is
   never reformatted. The major/minor/patch call is human: breaking → major, feature → minor,
   fix → patch. The build already stamps the commit SHA, so semver is only for meaning.
2. Commit the bump on its own as `chore(release): vX.Y.Z …`.
3. Merge the work branch into `staging` with `--no-ff`.
4. **Annotated** tag `vX.Y.Z` on the MERGE COMMIT (not the branch tip), with a body that lists
   what the release covers and any deploy prerequisite (reseeds, migrations).
5. Push branch, `staging`, and the tag. **One `git push` takes several refs** —
   `git push origin staging v0.8.2` when the work landed directly on `staging` and there is no
   feature branch, or `git push origin <branch> staging vX.Y.Z` when there is. Three separate
   invocations were never required; that was just how the first release happened to run.

**The bump step gets skipped — verify it, never assume it.** By v0.8.2 (2026-08-13)
`package.json` had sat at **0.7.3 through both v0.8.0 and v0.8.1**: the tags moved, the manifest
did not. So `bun run version:patch` computes from a stale base and produces the wrong number
(0.7.4, not 0.8.2). Read the version and `git tag --sort=-v:refname | head -1` together before
bumping; when they disagree, hand-edit `package.json` to the intended release and say so in the
commit body.

**First release: `v0.7.0` on staging merge `90f32b2b`** (branch tip `c90a519d`). Chosen as a
minor because mail content, board presentation and operator-facing vocabulary all changed
behaviour without breaking anything. It retroactively covers the earlier merge `6601dbb4`,
which shipped while the version was still 0.6.0.

**Gotchas that cost time on the first run:**
- `git status --porcelain --cached` is not a flag; use `git diff --cached --name-only`.
- The push may fail with `sign_and_send_pubkey ... agent refused operation` — that is Bitwarden
  gating the SSH key, not a repo problem. See [[feedback_bitwarden_ssh_agent]].
- The main checkout at `/home/ilbey/Projects/nvim/tmmaf` is where `staging` lives; the worktree
  cannot check it out. Merge from the main checkout. Its `graphify-out/manifest.json` is often
  dirty with pure mtime churn (identical `ast_hash`) — safe to `git checkout --` before merging.
- Let the `graphify` post-commit hook finish before committing `graphify-out/`, or the refresh
  lands in the wrong commit.

Related: [[project_tmmaf_drizzle_migration_ops]], [[project_mail_kvkk_masking_corpus]].
