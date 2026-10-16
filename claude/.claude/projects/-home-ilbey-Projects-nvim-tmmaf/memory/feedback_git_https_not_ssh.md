---
name: git-https-not-ssh
description: "All git remote operations (push, PR, clone) go over HTTPS with the gh token, never SSH — the user asked twice on 2026-09-05"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 91162fee-896d-4460-be19-593a948c057e
  modified: 2026-09-05T06:08:15.056Z
---

Use HTTPS for every git remote operation in this repo: pushes, PR creation, fetches. Never SSH.
`origin` is already `https://github.com/synapsys-integrated/tmmaf.git`; `gh config git_protocol`
is set to `https`. When a push needs credentials, feed the gh token through a one-shot helper:

```
git -c credential.helper= -c 'credential.helper=!f() { echo username=x-access-token; echo password=$(gh auth token); }; f' push origin <branch>
```

**Why:** the SSH key is gated by Bitwarden and needs the user at the keyboard; HTTPS with the gh
token lets the agent push and open PRs unattended. The user said "use https not ssh" twice in one
session, so any SSH default (gh git_protocol, an `git@github.com:` remote) is a mistake to fix, not
a preference to keep.

**How to apply:** check `git remote get-url origin` and `gh config get git_protocol` before the
first push of a session; convert an SSH remote URL to HTTPS rather than handing the push back.
Supersedes [[bitwarden-ssh-agent]] ("hand the push to the user").
