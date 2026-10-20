---
name: project_vps_decommission_and_dashboard_tenant
description: "tmmaf VPS decommission prep (2026-11-06) — a second user's dashboard is wired into our live/staging DBs and our Caddy"
metadata:
  node_type: memory
  type: project
  originSessionId: a7925b9c-d38c-42b7-8439-503af569c4cf
  modified: 2026-11-06T14:47:37.772Z
---

2026-11-06: user asked for a command that removes all Synapsys property from the tmmaf VPS (`srv.mmaevent.com`, ssh alias `tmmaf_turhost`) and leaves only the database to the federation. Script drafted at `~/tmmaf-vps-decommission.sh` (inventory by default, `--execute` to act). NOT run yet; awaiting rulings.

Read-only inspection found a second tenant: user `obalci` (sudo+docker) runs `fighterscore-dashboard` (`/home/obalci/Git/FighterScoreSecondDashboard`, .NET api + nginx web + own postgres on 127.0.0.1:15433). Its api is attached to `tmmaf-live_internal` AND `tmmaf-staging_internal` and reads both DBs as role `orkun`; our Caddy serves it at `d.fighterscore.com` → `172.17.0.1:8090` (marked TEMPORARY in the Caddyfile).

**Why:** removing our proxy/DB/networks breaks that dashboard, and `docker network rm` on our internal nets fails while it is attached.
**How to apply:** any teardown must decide the dashboard's fate first; live DB also has our `ilbey` role to drop on handover. Related: [[tmmaf-deploy-hostnames]].

**Full backup taken + restore-verified 2026-11-07:** `~/tmmaf-backups/20261107-1718/` (9.6 GB, unencrypted, chmod 700; `RESTORE.md` + `SHA256SUMS` inside). Both DBs, file volumes, caddy, /srv incl .env, systemd units, the 6 deployed images + postgres/caddy base images. Restored locally under projects `tmmaf-restoretest-{live,staging}` (no-egress override in `~/tmmaf-restoretest/`): per-table md5 identical, files sha256 identical, apps healthy. Decommission script still NOT run.

**Handover package built 2026-11-09:** `~/tmmaf-handover/TMMAF_Veri_Teslimi_07.11.2026/` (xlsx 26 sheets + CSV + Belgeler + Sözleşme Metinleri + OKUYUN + SHA256SUMS; unencrypted). Rebuild with `bash ~/tmmaf-handover/build/build.sh`, check with `verify.sh`; source is container `tmmaf-handover-db` (`--network none`, pristine dump). **Never build from `tmmaf-restoretest-live-db-1`: the restore-test app boot wrote 2 audit rows into it.** Consent `checksum` columns are empty system-wide — never claim text hashes. Open ruling: drop 16 test accounts (mailinator + 2 synapsysintegrated staff; 11 athletes, 16 registrations, 41 docs, 0 TL collected)?

**Server teardown EXECUTED 2026-11-09 19:40-19:45 (user-approved):** all tmmaf app/staging/proxy containers removed, 92 ghcr image tags (90 images) + caddy image + 5.16 GB build cache deleted, staging + caddy volumes and networks removed, /srv files shredded/deleted, ghcr logout, operator home emptied. KEPT by ruling (federation's data): stopped container `tmmaf-live-db-1` (restart=no) + volumes `tmmaf-live_pgdata`/`tmmaf-live_filedata` + network `tmmaf-live_internal` (obalci's api still attached). Sites are offline. Needs operator sudo: remove `/etc/systemd/system/tmmaf-*.service` (+ wants links) and the 3 empty `/srv/*` dirs.

**Ruling 2026-11-09:** the server and the app secrets (Stripe, Twilio, reCAPTCHA, Corpenza) belong to the federation — no rotation needed. Only Resend is ours to revoke (user does it in the Resend console). The VPS GHCR pull token is a Synapsys GitHub credential, so revoking it is still on our side.
