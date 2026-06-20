---
name: project_test_host_live_e2e_harness
description: "How to drive the live cve-test-host app from the tool sandbox — own dev server against the host's reachable Postgres, scripted Playwright Firefox. Network topology gotcha included."
metadata: 
  node_type: memory
  type: project
  originSessionId: 437fca5d-336c-4d75-88e1-223e0dbdd427
---

Driving the running `apps/cve-test-host` for live UAT from inside the tool sandbox.

**Network topology (the non-obvious part):** the tool Bash sandbox has its OWN net namespace — full outbound internet, but it CANNOT reach the host's bare-process loopback (e.g. the user's `next dev` on `127.0.0.1:3000` → connection refused). It CAN reach the Docker-published ports because docker's DNAT crosses the namespace: Postgres `:5432`, Mailpit `:1025`/`:8025`, Drizzle Studio `:4983` are all OPEN from the sandbox. (Test reachability with `bash -c 'echo > /dev/tcp/127.0.0.1/PORT'` — zsh lacks `/dev/tcp`, so a zsh probe gives a false negative; `curl` also worked once a server was up.)

**Consequence:** don't try to reach the user's host server. Start your OWN server in the sandbox pointed at the host's reachable Postgres:
```
cd apps/cve-test-host
DATABASE_URL='postgres://cve:cve@localhost:5432/cve_test_host' PORT=3000 bun run dev   # run_in_background
```
`.env.local` exists and Next auto-loads it (no Infisical needed; there is no `.infisical.json` so `infisical run` fails with "run infisical init"). Override `DATABASE_URL` on the CLI so it points at the reachable loopback. Postgres creds (non-secret) live in `apps/cve-test-host/docker-compose.yml`: user/pass/db = `cve`/`cve`/`cve_test_host`. The DB already holds the seeded flows (`demo-flow@2` unguarded, `create-user@2` guarded) and the superadmin row — your sandbox server shares that exact state.

**Browser harness:** `~/cve-e2e/` (shared home dir, alongside the Playwright cache). `npm i playwright@1.60.0` with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` reuses the cached `firefox-1522` (`~/.cache/ms-playwright`). `lib.mjs` exports `browser()` (=`firefox.launch`), `digest(page)` (inputs+buttons+bodyText), `BASE`. Scripts write JSON to `out/` and PNGs to `shots/` — text-only results keep the main context clean WITHOUT needing subagents for image absorption. The Playwright MCP defaults to Chrome (unusable here) and would need an `.mcp.json` `--browser firefox` edit + reconnect — avoided entirely by this scripted approach.

**DB introspection:** `docker exec cve_test_host_pg psql -U cve -d cve_test_host -c '...'` works from the sandbox. Instances: `cve_flows.flow_instances` (cols include `id, current_step_id, owner_id, status, history, accumulated_state, created_at`; there is NO `definition_id` col). Guest demo owners are `guest:<uuid>`.

Related: [[project_phase07_6_flow_uat_remaining]], [[feedback_verify_code_not_just_tests]], [[feedback_studio_smoke_not_reference]].
