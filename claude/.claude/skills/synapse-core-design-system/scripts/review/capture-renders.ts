#!/usr/bin/env bun
/**
 * capture-renders — Stage 6 (review) mechanical capture. SKILL-DESIGN §6 row 7, L16.
 *
 * Drives a headless browser (Firefox by default) over the static `review.html`
 * that build-review-surface emitted, and screenshots every `data-capture-id`
 * across every mode and viewport listed in `manifest.json`. The output is a tree
 * of PNGs plus a `capture-report.json` of paths + console errors.
 *
 * This is CAPTURE ONLY (L16). It emits ZERO verdict: no pass/fail, no "looks
 * right", no fidelity judgment of any kind. A sub-agent is permitted to RUN this
 * step precisely because it cannot judge — it just produces the imagery that
 * impeccable (via the Skill tool) and the operator look at. Any process that
 * tried to return a PASS/FAIL on these screenshots would be substituting a
 * sub-agent verdict for the operator's sign-off, which is the one thing the
 * review stage exists to prevent. So this script's contract is: shoot, record,
 * report errors, exit — never opine.
 *
 * Reuse-first: it resolves `playwright`/`playwright-core` from the TARGET app's
 * node_modules first (so the browser build matches the app's toolchain), then
 * falls back to a bare specifier / the globally-installed browsers. Nothing is
 * hardcoded to a project path; the surface URL and output dir are flags.
 *
 *   bun capture-renders.ts \
 *     --url   <path-or-file-url to review.html> \
 *     --out   <shots dir> \
 *     [--manifest <manifest.json>]      # default: <url dir>/manifest.json \
 *     [--modes light,dark]              # default: from manifest \
 *     [--viewports desktop,tablet,mobile] \
 *     [--browser firefox|chromium|webkit]   # default: firefox \
 *     [--full]                          # also shoot a full-page frame per mode
 *
 * Exit code: 0 if every capture-id was shot; 1 only if the browser could not
 * launch, the surface failed to load, or a capture-id was missing from the DOM
 * (a structural failure, NOT a fidelity verdict). Console errors on the page are
 * recorded in the report and DO mark a nonzero exit, because a render error
 * means the surface itself is broken — again, a mechanical fact, not a judgment.
 */

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function die(msg: string): never {
  console.error(`capture-renders: ${msg}`);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const urlArg = typeof args.url === 'string' ? args.url : null;
if (!urlArg) die('--url <review.html path or file:// url> is required');

// Normalize to a file:// URL if a path was given.
const isUrl = /^[a-z]+:\/\//i.test(urlArg);
const localPath = isUrl ? null : resolve(urlArg);
if (localPath && !existsSync(localPath)) die(`--url file not found: ${localPath}`);
const pageUrl = isUrl ? urlArg : pathToFileURL(localPath!).href;

const outDir = typeof args.out === 'string' ? resolve(args.out) : null;
if (!outDir) die('--out <shots dir> is required');
mkdirSync(outDir, { recursive: true });

const manifestPath =
  typeof args.manifest === 'string'
    ? resolve(args.manifest)
    : localPath
      ? join(dirname(localPath), 'manifest.json')
      : null;

type Manifest = { modes?: string[]; captures?: { captureId: string; mode: string; panel: string }[] };
const manifest: Manifest =
  manifestPath && existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

const modes = ((args.modes as string) ?? (manifest.modes ?? ['light', 'dark']).join(','))
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const VIEWPORTS: Record<string, { width: number; height: number }> = {
  desktop: { width: 1280, height: 1024 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
};
const viewports = ((args.viewports as string) ?? 'desktop,mobile')
  .split(',')
  .map((s) => s.trim())
  .filter((v) => VIEWPORTS[v]);
if (viewports.length === 0) die('no valid --viewports (choose from desktop,tablet,mobile)');

const browserName = ((args.browser as string) ?? 'firefox').toLowerCase();
if (!['firefox', 'chromium', 'webkit'].includes(browserName))
  die(`--browser must be firefox|chromium|webkit (got ${browserName})`);

// The capture-ids to shoot: prefer the manifest's list (authoritative), else
// discover them from the DOM after load.
const manifestIds = manifest.captures
  ? Array.from(new Set(manifest.captures.map((c) => c.captureId)))
  : null;

// ── resolve Playwright from the target toolchain, then fall back ─────────────
// Resolution order (reuse-first, never a hardcoded project path):
//   1. $PLAYWRIGHT_PATH  — explicit operator override (a dir or a module file)
//   2. target node_modules (relative to --out, the surface dir, cwd)
//   3. bare specifier (Bun's own resolution)
//   4. the Bun install cache (~/.bun/install/cache/playwright@*) — works in a
//      monorepo that has the package cached but not linked, with no install.
async function loadPlaywright(): Promise<any> {
  const bases = [outDir, localPath ? dirname(localPath) : process.cwd(), process.cwd()];

  if (process.env.PLAYWRIGHT_PATH) {
    try {
      return await import(resolve(process.env.PLAYWRIGHT_PATH));
    } catch (e) {
      console.error(`capture-renders: $PLAYWRIGHT_PATH set but unimportable (${(e as Error).message})`);
    }
  }

  for (const spec of ['playwright', 'playwright-core']) {
    for (const base of bases) {
      try {
        const url = import.meta.resolveSync
          ? import.meta.resolveSync(spec, pathToFileURL(join(base, 'x')).href)
          : spec;
        return await import(url);
      } catch {
        /* next */
      }
    }
    try {
      return await import(spec);
    } catch {
      /* next */
    }
  }

  const fromCache = await loadFromBunCache();
  if (fromCache) return fromCache;

  die(
    'could not resolve playwright — set $PLAYWRIGHT_PATH, install it in the target app, or `bun add playwright` so the browsers in ~/.cache/ms-playwright are usable.'
  );
}

async function loadFromBunCache(): Promise<any | null> {
  const cacheRoot = join(process.env.HOME ?? '', '.bun', 'install', 'cache');
  if (!existsSync(cacheRoot)) return null;
  let names: string[];
  try {
    names = (await import('node:fs')).readdirSync(cacheRoot);
  } catch {
    return null;
  }
  // prefer the highest-versioned `playwright@*` entry, then `playwright-core@*`
  for (const prefix of ['playwright@', 'playwright-core@']) {
    const hits = names
      .filter((n) => n.startsWith(prefix))
      .sort()
      .reverse();
    for (const h of hits) {
      try {
        const mod = await import(join(cacheRoot, h));
        if (mod.firefox || mod.chromium) return mod;
      } catch {
        /* next */
      }
    }
  }
  return null;
}

const pw = await loadPlaywright();
const browserType = pw[browserName];
if (!browserType?.launch) die(`playwright build has no \`${browserName}\` browser type`);

let browser: any;
try {
  browser = await browserType.launch({ headless: true });
} catch (e) {
  die(`could not launch ${browserName}: ${(e as Error).message}`);
}

function safeName(id: string): string {
  return id.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_|_$/g, '');
}

function truncate(s: string, n = 160): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

type Shot = { captureId: string; mode: string; viewport: string; file: string };
const shots: Shot[] = [];
// Page/runtime errors (a broken surface — these DO flip the exit code).
const consoleErrors: { mode: string; viewport: string; text: string }[] = [];
// Per-shot soft skips (recorded, NON-fatal — a wide mockup that won't fit a
// scroll heuristic is not a broken surface, and never a fidelity verdict).
const skipped: { captureId: string; mode: string; viewport: string; text: string }[] = [];
const missing: { captureId: string; mode: string; viewport: string }[] = [];

try {
  for (const viewport of viewports) {
    for (const mode of modes) {
      const context = await browser.newContext({
        viewport: VIEWPORTS[viewport],
        colorScheme: mode === 'dark' ? 'dark' : 'light',
        reducedMotion: 'reduce', // capture stills; motion would smear the frame
      });
      const page = await context.newPage();
      page.on('console', (m: any) => {
        if (m.type() === 'error') consoleErrors.push({ mode, viewport, text: m.text() });
      });
      page.on('pageerror', (err: Error) => consoleErrors.push({ mode, viewport, text: String(err.message) }));

      await page.goto(pageUrl, { waitUntil: 'networkidle' });

      // Pin the surface to THIS mode so only the matching .rv-mode-panel is laid
      // out (the chrome hides the other via the root's data-theme). Shooting the
      // single visible panel keeps wide mockups on-screen and screenshot-stable —
      // targeting a display:none sibling was the earlier stability hang.
      await page.evaluate((m: string) => {
        document.documentElement.setAttribute('data-theme', m);
        const root = document.querySelector('.rv-root');
        if (root) root.setAttribute('data-theme', m);
      }, mode);

      // Which ids to shoot in this pass: the manifest ids, or—if no manifest—
      // every data-capture-id present in the DOM.
      const idsForMode =
        manifestIds ??
        (await page.evaluate(() =>
          Array.from(new Set(Array.from(document.querySelectorAll('[data-capture-id]')).map((e) => e.getAttribute('data-capture-id')!)))
        ));

      for (const id of idsForMode) {
        // The unit lives in either the SOLO or MOCKUP section; the chrome shows
        // exactly one via the `.rv-mode.is-active` class (an inactive section is
        // display:none, collapsing its units to 0×0). Activate the unit's
        // section the same way the chrome's setMode() does — toggle is-active on
        // the matching [data-mode-panel] — so its article lays out before we
        // shoot. The capture-id prefix (SOLO/ vs MOCKUP/) tells us which.
        const section = id.startsWith('MOCKUP') ? 'mockup' : 'solo';
        await page.evaluate((s: string) => {
          for (const el of [document.documentElement, document.querySelector('.rv-root')]) {
            if (el) el.setAttribute('data-mode', s);
          }
          for (const m of Array.from(document.querySelectorAll('.rv-mode'))) {
            m.classList.toggle('is-active', m.getAttribute('data-mode-panel') === s);
          }
        }, section);

        // Prefer the per-mode panel inside the unit (the meaningful single-mode
        // still). Fall back to the whole .rv-unit when the panel is absent OR
        // renders zero-sized (a width-locked mockup panel can lay out 0×0 when
        // its mode isn't the active one — screenshotting that would hang waiting
        // for a stable box that never arrives). The article is always laid out.
        const handle = await page.evaluateHandle(
          ({ id, mode }: { id: string; mode: string }) => {
            const unit = document.querySelector(`[data-capture-id="${CSS.escape(id)}"]`);
            if (!unit) return null;
            const panel = unit.querySelector(`.rv-mode-panel[data-mode="${mode}"]`);
            if (panel) {
              const r = panel.getBoundingClientRect();
              if (r.width > 0 && r.height > 0) return panel;
            }
            return unit;
          },
          { id, mode }
        );
        const element = handle.asElement();
        if (!element) {
          missing.push({ captureId: id, mode, viewport });
          await handle.dispose();
          continue;
        }
        const file = join(outDir, `${safeName(id)}__${mode}__${viewport}.png`);
        // Best-effort scroll: a width-locked mockup may not satisfy the scroll
        // heuristic, but element.screenshot scrolls on its own — so a scroll
        // timeout must NOT block the shot. Swallow it and proceed.
        try {
          await element.scrollIntoViewIfNeeded({ timeout: 3000 });
        } catch {
          /* proceed — the screenshot call scrolls as needed */
        }
        try {
          // Bounded per-shot timeout + disabled animations: one stubborn element
          // can't abort the run, and stills stay crisp (no mid-transition smear).
          await element.screenshot({ path: file, timeout: 15000, animations: 'disabled' });
          shots.push({ captureId: id, mode, viewport, file: relForOut(file) });
        } catch (e) {
          // A single failed shot is a SOFT skip recorded in the report — not a
          // run-ending error, and never a fidelity verdict (L16).
          skipped.push({ captureId: id, mode, viewport, text: truncate((e as Error).message) });
        }
        await handle.dispose();
      }

      if (args.full) {
        const file = join(outDir, `_fullpage__${mode}__${viewport}.png`);
        await page.screenshot({ path: file, fullPage: true });
        shots.push({ captureId: `_fullpage`, mode, viewport, file: relForOut(file) });
      }

      await context.close();
    }
  }
} finally {
  await browser.close();
}

function relForOut(p: string): string {
  const r = p.startsWith(outDir) ? p.slice(outDir.length + 1) : p;
  return isAbsolute(r) ? p : r;
}

// ── report: paths + mechanical errors. NO verdict (L16). ─────────────────────
const report = {
  generatedAt: new Date().toISOString(),
  url: pageUrl,
  browser: browserName,
  modes,
  viewports,
  counts: {
    shots: shots.length,
    consoleErrors: consoleErrors.length,
    skipped: skipped.length,
    missing: missing.length,
  },
  shots,
  consoleErrors,
  skipped,
  missing,
  note:
    'CAPTURE ONLY (L16). This report carries screenshot paths + mechanical errors. It does NOT and must NOT contain a fidelity verdict — impeccable (via the Skill tool) and the operator judge these screenshots.',
};
writeFileSync(join(outDir, 'capture-report.json'), JSON.stringify(report, null, 2), 'utf8');

// Mechanical exit: nonzero ONLY when the SURFACE is broken — a page/runtime
// error or a capture-id that isn't in the DOM. Per-shot soft skips (a wide
// mockup the scroll heuristic balks at) are recorded but non-fatal, and none of
// this is ever a fidelity verdict.
const broken = missing.length > 0 || consoleErrors.length > 0;
console.error(
  `capture-renders: ${shots.length} shot(s) across ${modes.length} mode(s) × ${viewports.length} viewport(s)` +
    (consoleErrors.length ? `, ${consoleErrors.length} page error(s)` : '') +
    (skipped.length ? `, ${skipped.length} soft skip(s)` : '') +
    (missing.length ? `, ${missing.length} missing capture-id(s)` : '') +
    `. Wrote ${join(outDir, 'capture-report.json')}. No verdict emitted (L16).`
);
process.stdout.write(JSON.stringify({ report: join(outDir, 'capture-report.json'), counts: report.counts }, null, 2) + '\n');
process.exit(broken ? 1 : 0);
