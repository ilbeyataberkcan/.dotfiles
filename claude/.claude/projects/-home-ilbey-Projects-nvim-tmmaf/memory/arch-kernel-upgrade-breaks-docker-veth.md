---
name: arch-kernel-upgrade-breaks-docker-veth
description: "On this Arch box, a pacman -Syu that bumps the kernel breaks Docker networking until reboot — veth pair creation fails with \"operation not supported\""
metadata: 
  node_type: memory
  type: project
  originSessionId: 2631afd8-1925-4e1f-b05a-5c81d3ec8dbc
  modified: 2026-08-07T16:10:20.498Z
---

`docker compose up` failing with `failed to add the host (vethX) <=> sandbox (vethY) pair
interfaces: operation not supported` on this machine means the running kernel's module tree is
gone, not that Docker is broken.

**Why:** upgrading the `linux` package replaces `/usr/lib/modules/<version>/` for the *new*
version and deletes the old one. The still-running kernel can then load no module that isn't
already in memory — `veth` included — so Docker cannot create the container network endpoint.
Hit on 2026-08-07: booted 18:47 into 7.0.12-arch1-1, `pacman -Syu` at 18:51 moved it to
7.1.6.arch1-1, and every `db:up`/`mail:up` failed until reboot.

**How to apply:** confirm with `ls -d /usr/lib/modules/$(uname -r)` — "No such file or directory"
is the tell; `lsmod | grep -w veth` shows it unloaded. Fix is `sudo reboot`. Only if a reboot is
impossible, restore the running kernel's modules from the pacman cache
(`sudo tar -I zstd -xf /var/cache/pacman/pkg/linux-<running-ver>-x86_64.pkg.tar.zst -C /
usr/lib/modules/<running-ver>` then `sudo depmod <running-ver>`) — never `pacman -U` that file,
which downgrades the kernel. Only `linux` is installed here, no `linux-lts` to fall back to.

This blocks the DB-backed test suite, which needs `tmmaf_pg` + `tmmaf_mailpit` up — see
[[tmmaf-test-baseline-needs-docker]].
