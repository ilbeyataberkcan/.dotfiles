---
name: no-gh-cli-use-ssh
description: Never use the gh CLI or token-based HTTPS for GitHub ops — use git over SSH so the user gates each action
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 05e0613a-641d-48e2-aee9-938c042f8cd3
---

Never use the `gh` CLI for GitHub operations. It is blocked in `~/.claude/settings.json` (`permissions.deny: "Bash(gh:*)"`, added 2026-06-04) — the harness will reject `gh ...` calls.

**Why:** `gh` authenticates with a stored token, giving me standing, unsupervised, direct access to the user's GitHub that they cannot approve per-action. Pushing over **SSH** routes every operation through the user's Bitwarden SSH agent, so the user controls/approves what actually executes. This is a deliberate least-standing-privilege / human-in-the-loop security boundary, and the user is firm on it.

**How to apply:** For pushes and other GitHub remote ops, use `git` over SSH: `SSH_AUTH_SOCK=$HOME/.bitwarden-ssh-agent.sock git push origin <branch>`. Do NOT use `gh`, and do NOT use the token-based HTTPS fallback either (`git -c credential.helper='!gh auth git-credential' push https://...`) — that also uses the standing token and bypasses the user's control; it is the same risk by another route. If SSH fails (e.g. the `~/.ssh/config` github.com block pins `IdentityFile github_auth.pub` with `IdentitiesOnly yes` and the matching key isn't loaded in the agent), surface the failure and let the USER push/merge — do not reach for the token. Merges, PR status, etc. are likewise the user's to run via gh. See [[user_ssh_bitwarden]].
