---
name: hall-screens-redesign-r3
description: "Round 3 hall-screen redesign (mat + medal ceremony) from the Claude Design bundle — orchestration state, brief location, eval URLs, decisions flagged to the operator"
metadata: 
  node_type: memory
  type: project
  originSessionId: 91162fee-896d-4460-be19-593a948c057e
  modified: 2026-09-05T03:39:17.286Z
---

Started 2026-09-05. Bundle: `docs/design/Match mat and medal screens redesign.zip`, extracted to
`docs/design/tmmaf-hall-screens/`. The two `.dc.html` files are the ground truth; `uploads/*.png`
are captures of the CURRENT implementation fed to the designer, NOT targets.

Orchestrator brief for agents: `docs/design/tmmaf-hall-screens/IMPLEMENTATION-BRIEF.md`
(sizing model `--u = 100vw/1920 | /390`, hex→token map, element map, data changes, decisions).

Order: mat screen → browser eval → podium → browser eval. Eval agent = Fable 5.1 if the Agent
tool accepts it, else Opus 5.

**Decisions taken by the orchestrator and flagged to the operator**
- Logo stays `tmmaf-logo-dark.png` (design HTML references the black-wordmark PNG, unreadable on dark).
- Stepper fills go NEUTRAL (design: "no scoring leak"); well round-flash deleted; state wave neutral for corner tones.
- Weight chip added to the ring payload (`weightKg` from `FighterCard.weight`).
- Verdict word `KAZANDI` → `KAZANAN` above the full name; finished label `SÜRE DOLDU`; foot `DÖVÜŞ SÜRESİ` shown in every bout state.
- Podium: club standings are NOT in the design → kept, rendered in the footer's empty right cell (TV only).
- Design uses 1px hairlines on bands/columns/flag frames; followed because it is the operator's own design.

**Eval plumbing**
- Design served: `python3 -m http.server 8787` in the bundle folder (`http://127.0.0.1:8787/Mat%20Ekran%C4%B1.dc.html`).
- Dev server is HTTPS on `:3000` (`curl -k https://localhost:3000`). Tokens minted with
  `bun /tmp/mint-display-token.ts <eventId>` (throwaway script importing `lib/display/display-token`).
- Idle rings: event `7926c362-…5c2` (Saha Testi — Maç Günü), rings `fc6e3dc6…` Oktagon 1, `33bc1b3e…` Oktagon 2.
- Live bout: event `d54e0d96-e836-4a8d-b878-5baf5d25d108`, ring `a59a11c4-e583-4603-826c-440a475520af`.
- DB tables live in schema `tmmaf_competition` (`set search_path` first); container psql user via `$POSTGRES_USER`, db `tmmaf`.

**Status 2026-09-05 (later):** BOTH screens implemented, reviewed twice each (browser eval + adversarial
code review), all findings fixed; typecheck/lint/3 display suites green; UNCOMMITTED. Awaiting operator
visual confirmation. States NOT browser-verified (no DB rows): live/paused/rest/verdict on the mat,
awarding + mixed on the podium — covered by tests + CSS reading only.
Extra decisions during fixes: HAZIR lights the upcoming round bar (design state table); decided result
slot text = `MAÇ SONUÇLANDI`; club standings moved to the IDLE body as a board (awarding footer empty —
the ~780u cell could not hold a strip); weight chip = DECLARED weight (operator to rule declared vs approved).
Open for operator: `countryLine`/KKTC branch is unreachable now (tests pinned) — delete with permission;
podium "podyum oluşmadı" can be false when winner names are null (state.ts, out of scope).

**Browser pass 2026-09-05 (t3 preview, all states):** unreachable states were driven by patching
`window.fetch` on the live page so `/api/display/state` returns a crafted frame with a higher
`version`, then `window.dispatchEvent(new Event('focus'))` triggers the hook's reconcile (skip the
`since=2147483647` time probe). Clock phases come from `clockMarks` relative to `Date.now()`; a
`round-end` exactly on the round deadline is treated as paid and lands in READY, so use an early end.
Two fixes came out of the pass: the surname cap must NOT subtract well padding (`cqw` already
excludes it), and `.disp-next-idle .disp-next-sub` is uppercase like the design.
