---
name: SSH keys live in Bitwarden Desktop's built-in SSH agent
description: User stores SSH private keys in Bitwarden Desktop. Tool subshells must point SSH_AUTH_SOCK at ~/.bitwarden-ssh-agent.sock to reach it.
type: user
originSessionId: ef888003-8e69-4a61-9767-237e01eeddb6
---
User uses **Bitwarden Desktop's built-in SSH agent** for all SSH keys (no
private keys exist on disk under `~/.ssh/` — that directory only has
`known_hosts`).

**Socket location:** `~/.bitwarden-ssh-agent.sock`

**Why git/ssh in Claude Code subshells fails by default:** the user's
interactive shell environment leaks `SSH_AUTH_SOCK=/run/user/1000/ssh-agent.sock`
(systemd-user's socket, which doesn't exist on this machine). SSH then
falls back to default identity files and finds none → "Permission denied
(publickey)".

**Fix for any session:** depends on the shell environment.

- **2026-05-15 update:** user reports that manually setting
  `SSH_AUTH_SOCK=$HOME/.bitwarden-ssh-agent.sock` in tool subshells now causes
  Bitwarden Desktop to refuse the operation silently (no popup, "agent refused
  operation" from `ssh-add -l`). The native `git push` with NO explicit
  `SSH_AUTH_SOCK` override DOES trigger the Bitwarden prompt correctly.
  Likely cause: the shell's inherited env now carries a value that Bitwarden
  recognizes, and the explicit `~/.bitwarden-ssh-agent.sock` override hits a
  different / stale socket path.
- **Default behavior:** run `git push` / `ssh ...` directly. Do NOT pre-export
  `SSH_AUTH_SOCK` unless you've verified the inherited value is broken.
- **Only if direct invocation fails:** then try the explicit
  `SSH_AUTH_SOCK=$HOME/.bitwarden-ssh-agent.sock` override, but expect it may
  not work either.

- **2026-08-18 update — stop retrying, hand the push to the user.** In one
  session BOTH forms failed from tool subshells (`Permission denied
  (publickey)`): the explicit `SSH_AUTH_SOCK` override AND the bare `git push`
  with no override. Minutes earlier the user ran `git push` in their OWN
  interactive shell against the same remote and it succeeded. Bitwarden appears
  to approve the key for the user's foreground shell only. One earlier push in
  that same session did succeed from a subshell with the override, so it is
  inconsistent rather than a hard rule.
  **Apply:** try a push at most twice, then hand it over — tell the user to run
  `! git push …` in their own prompt. tmmaf's CLAUDE.md already states "the user
  pushes (Bitwarden gates the SSH key)"; treat that as the default for both
  repos rather than something to work around.

**Three independent gates inside Bitwarden Desktop must all be on for
the agent to serve a key:**
1. Settings → Security → "SSH agent" toggle
2. Vault is unlocked
3. The SSH key entry has "Use for SSH agent" enabled

A stale socket file can persist after a Bitwarden Desktop crash/restart;
if `ssh-add -l` against the socket says "Connection refused," restart
Bitwarden Desktop.

**Reboot-related caveat:** after a reboot the user's interactive shell
may pick up the correct `SSH_AUTH_SOCK` automatically (systemd user
service or shell init), but tool subshells launched from older parent
processes can still inherit the stale value. When in doubt, set it
explicitly.
