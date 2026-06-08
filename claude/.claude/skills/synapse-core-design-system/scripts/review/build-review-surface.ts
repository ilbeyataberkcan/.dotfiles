#!/usr/bin/env bun
/**
 * build-review-surface — Stage 6 (review) generator. SKILL-DESIGN §6 row 6, §7.
 *
 * Introspects a TARGET design-system package (its registry + theme CSS), expands
 * the two brand-overridable RECIPES (states + screens), renders every specimen
 * and screen through the real RenderEngine (SSR → static markup), compiles the
 * Tailwind utilities the markup uses against the target's own preset + generated
 * theme, and fills the assets/review-surface.template.html shell into ONE
 * self-contained `review.html` (+ `manifest.json`). The result is `file://`-
 * openable — no dev server — so impeccable + the operator judge fidelity (L16).
 *
 * SOLO   — every component × its design-relevant states (states-recipe.json),
 *          rendered light + dark stacked, each beside its reference slice (or the
 *          written intent note when no crop exists).
 * MOCKUP — recipe screens composed the way the mockup composes them, pinned
 *          side-by-side with the reference screenshot under an A/B-wipe divider.
 *
 * This script is DETERMINISTIC: same registry + recipes + reference ⇒ same
 * surface structure, coverage, and manifest. The ONLY judgment is the recipes
 * (which states are design-relevant, which screens to reconstruct). It emits a
 * surface to be JUDGED — never a verdict (capture-renders does the shooting;
 * impeccable + the operator do the judging).
 *
 * Reuse-first: it imports nothing from this skill's own copy of the package —
 * the registry, RenderEngine, preset.css, theme.generated.css, and the Tailwind
 * compiler all resolve from the TARGET passed via flags, so the surface always
 * reflects the package under review, never a stale fork.
 *
 *   bun build-review-surface.ts \
 *     --registry <pkg/registries/index.ts>   # the componentRegistry module \
 *     --states   <states-recipe.json>         # SOLO matrix (default: ../../recipes) \
 *     --screens  <screen-recipes.json>        # MOCKUP screens (default: ../../recipes) \
 *     --reference <dir>                        # reference screenshots/crops \
 *     --intent   <design-intent.md>            # the intent file (notes when no crop) \
 *     --theme    <theme.generated.css>         # target generated theme (both modes) \
 *     --globals  <globals.css>                 # target app css entry (imports preset+theme) \
 *     --out      <dir>                         # output dir for review.html + manifest \
 *     [--dump]                                 # print the registry (replaces dump-registry); no render
 *     [--modes light,dark] [--panels solo,mockup]
 *
 * Notes:
 *   - --globals is optional; if omitted, a minimal entry is synthesized that
 *     @imports tailwindcss + the target preset.css (resolved next to --theme's
 *     package) + --theme. Supplying the real app globals is preferred (it carries
 *     the app's @source globs and any host custom CSS).
 *   - --dump enumerates the registry (keys, meta, schema-derived variant props)
 *     as JSON and exits — the cheap inventory the recompose stage maps against.
 */

import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, resolve, join, relative, isAbsolute, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

// ── tiny arg parser (no deps) ────────────────────────────────────────────────
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
  console.error(`build-review-surface: ${msg}`);
  process.exit(2);
}

const args = parseArgs(process.argv.slice(2));
const registryPath = typeof args.registry === 'string' ? resolve(args.registry) : null;
if (!registryPath) die('--registry <pkg registries module> is required');
if (!existsSync(registryPath)) die(`--registry not found: ${registryPath}`);

// ── load the TARGET registry from its own package (reuse-first) ──────────────
// The registry module re-exports componentRegistry; we import it by file URL so
// Bun resolves the package's own dependency tree (cve-core RenderEngine, zod).
type RegEntry = {
  component: unknown;
  schema: { safeParse: (v: unknown) => { success: boolean; data?: unknown } } & Record<string, unknown>;
  meta?: { label?: string; description?: string; category?: string; tags?: string[] };
};
type Registry = Record<string, RegEntry>;

const regMod = (await import(pathToFileURL(registryPath).href)) as Record<string, unknown>;
const componentRegistry = (regMod.componentRegistry ?? regMod.default) as Registry | undefined;
const strategyRegistry = regMod.strategyRegistry as Record<string, unknown> | undefined;
const animationRegistry = (regMod.animationRegistry as Record<string, unknown> | undefined) ?? {};
if (!componentRegistry) die(`module at --registry exports no \`componentRegistry\`: ${registryPath}`);

// ── zod-v4 schema introspection → variant props per component ────────────────
// Powers --dump and the recipe-default fallback. Pure read, never throws on an
// unfamiliar node — unknown shapes degrade to {} so a new schema can't break the
// inventory.
function unwrap(s: any): any {
  // peel optional/default/nullable/describe wrappers to the inner type
  let cur = s;
  for (let guard = 0; guard < 12 && cur?._def; guard++) {
    const t = cur._def.type ?? cur._def.typeName;
    if (t === 'optional' || t === 'nullable' || t === 'default' || t === 'catch' || t === 'readonly') {
      cur = cur._def.innerType ?? cur.unwrap?.() ?? cur;
    } else break;
  }
  return cur;
}
function enumOptions(s: any): string[] | null {
  const inner = unwrap(s);
  const def = inner?._def;
  if (!def) return null;
  if (Array.isArray(inner.options)) return inner.options.map(String);
  if (def.entries) return Object.values(def.entries).map(String);
  if (def.values) return (Array.isArray(def.values) ? def.values : Object.values(def.values)).map(String);
  return null;
}
function defaultValue(s: any): unknown {
  const d = s?._def;
  if (d && (d.type === 'default' || d.typeName === 'ZodDefault')) {
    const dv = d.defaultValue;
    return typeof dv === 'function' ? safeCall(dv) : dv;
  }
  return undefined;
}
function safeCall(fn: () => unknown): unknown {
  try {
    return fn();
  } catch {
    return undefined;
  }
}
function describeSchema(schema: any): { variantProps: Record<string, string[]>; defaults: Record<string, unknown> } {
  const variantProps: Record<string, string[]> = {};
  const defaults: Record<string, unknown> = {};
  const shape = typeof schema?.shape === 'object' ? schema.shape : schema?._def?.shape ? evalShape(schema._def.shape) : null;
  if (!shape) return { variantProps, defaults };
  for (const [key, prop] of Object.entries<any>(shape)) {
    const opts = enumOptions(prop);
    if (opts && opts.length > 1) variantProps[key] = opts;
    const dv = defaultValue(prop);
    if (dv !== undefined) defaults[key] = dv;
  }
  return { variantProps, defaults };
}
function evalShape(shape: unknown): Record<string, any> | null {
  try {
    return typeof shape === 'function' ? (shape as () => Record<string, any>)() : (shape as Record<string, any>);
  } catch {
    return null;
  }
}

function dumpRegistry(): void {
  const entries = Object.entries(componentRegistry!).map(([key, entry]) => {
    const { variantProps, defaults } = describeSchema(entry.schema);
    return {
      key,
      label: entry.meta?.label ?? key,
      category: entry.meta?.category ?? 'Uncategorized',
      description: entry.meta?.description ?? '',
      tags: entry.meta?.tags ?? [],
      variantProps,
      defaults,
    };
  });
  process.stdout.write(JSON.stringify({ count: entries.length, components: entries }, null, 2) + '\n');
}

if (args.dump) {
  dumpRegistry();
  process.exit(0);
}

// ── remaining required inputs for a full surface build ───────────────────────
const SKILL_DIR = resolve(dirname(new URL(import.meta.url).pathname), '..', '..');
const statesPath = resolve(
  (args.states as string) ?? join(SKILL_DIR, 'recipes', 'states-recipe.json')
);
const screensPath = resolve(
  (args.screens as string) ?? join(SKILL_DIR, 'recipes', 'screen-recipes.json')
);
const referenceDir = typeof args.reference === 'string' ? resolve(args.reference) : null;
const intentPath = typeof args.intent === 'string' ? resolve(args.intent) : null;
const themePath = typeof args.theme === 'string' ? resolve(args.theme) : null;
const globalsPath = typeof args.globals === 'string' ? resolve(args.globals) : null;
const outDir = typeof args.out === 'string' ? resolve(args.out) : null;
if (!themePath) die('--theme <theme.generated.css> is required (carries both mode blocks)');
if (!existsSync(themePath)) die(`--theme not found: ${themePath}`);
if (!outDir) die('--out <dir> is required');

const modes = ((args.modes as string) ?? 'light,dark')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);
const panels = ((args.panels as string) ?? 'solo,mockup')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

const statesRecipe = readJson(statesPath, { components: {}, defaults: {} });
const screensRecipe = readJson(screensPath, { screens: [], defaults: {} });

function readJson<T>(p: string, fallback: T): T {
  if (!existsSync(p)) return fallback;
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as T;
  } catch (e) {
    die(`could not parse JSON ${p}: ${(e as Error).message}`);
  }
}

// ── SSR a ComponentNode tree through the TARGET's RenderEngine ───────────────
// We import RenderEngine, React, and react-dom/server resolved RELATIVE TO the
// registry's package, so the surface renders with the same engine + the same
// React singleton the package was built against — never a fork or a mismatched
// copy from this script's own cache (the cause of "Cannot find package 'react'").
const registryBase = pathToFileURL(registryPath).href;
function resolveFromRegistry(spec: string, fallback = spec): string {
  try {
    return import.meta.resolveSync ? import.meta.resolveSync(spec, registryBase) : fallback;
  } catch {
    return fallback;
  }
}
const React = (await import(resolveFromRegistry('react'))) as {
  createElement: (...a: unknown[]) => unknown;
};
const ReactDOMServer = (await import(resolveFromRegistry('react-dom/server'))) as {
  renderToStaticMarkup: (node: unknown) => string;
};
const { RenderEngine } = (await import(
  resolveFromRegistry('@synapsys-integrated/cve-core')
)) as { RenderEngine: (props: Record<string, unknown>) => unknown };

// Minimal ComponentNode builder: recipe trees use a compact {componentType,
// props, layout?, look?, children?} shape; we mint UUIDs + parent links and pass
// the result straight to RenderEngine (its Zod gate validates every node).
let uid = 0;
function nodeId(): string {
  return `rev-${(uid++).toString(36)}-${Date.now().toString(36)}`;
}
type RecipeNode = {
  componentType: string;
  props?: Record<string, unknown>;
  layout?: { type: string; settings: Record<string, unknown> };
  look?: string[];
  children?: RecipeNode[];
};
function toComponentNode(n: RecipeNode, parentId: string | null): Record<string, unknown> {
  const id = nodeId();
  const children = (n.children ?? []).map((c) => toComponentNode(c, id));
  return {
    id,
    parentId,
    type: 'standard',
    componentType: n.componentType,
    props: n.props ?? {},
    children,
    ...(n.layout ? { layoutStrategy: n.layout } : {}),
    ...(n.look ? { look: n.look } : {}),
  };
}

function renderTree(tree: RecipeNode): string {
  const rootNode = toComponentNode(tree, null);
  const el = React.createElement(RenderEngine, {
    rootNode,
    componentRegistry,
    strategyRegistry: strategyRegistry ?? {},
    animationRegistry: animationRegistry ?? {},
  });
  try {
    return ReactDOMServer.renderToStaticMarkup(el);
  } catch (e) {
    return `<div data-render-error>${escapeHtml((e as Error).message)}</div>`;
  }
}

// A single specimen is just a one-node tree wrapped in the registry component.
function renderSpecimen(componentType: string, props: Record<string, unknown>, look?: string[]): string {
  return renderTree({ componentType, props, look });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

// ── reference pairing — find a crop for a SOLO unit, or fall back to intent ───
function referenceFor(key: string, specimenName: string): { kind: 'image'; rel: string } | { kind: 'note' } {
  if (!referenceDir || !existsSync(referenceDir)) return { kind: 'note' };
  const files = readdirSync(referenceDir);
  const slug = `${key}-${specimenName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const byExact = files.find((f) => f.toLowerCase().replace(/\.[a-z]+$/, '') === slug);
  const byKey = files.find((f) => f.toLowerCase().startsWith(key.toLowerCase()));
  const hit = byExact ?? byKey;
  if (hit) return { kind: 'image', rel: hit };
  return { kind: 'note' };
}

// ── build the SOLO + MOCKUP unit specs (deterministic from recipes) ──────────
type SoloUnit = {
  captureId: string;
  component: string;
  specimen: string;
  forced: string | null;
  markup: string;
  reference: ReturnType<typeof referenceFor>;
};
type MockupUnit = {
  captureId: string;
  screenId: string;
  name: string;
  referenceImage: string | null;
  referenceWidthPx: number;
  markup: string;
};

const recipeComponents = (statesRecipe as any).components ?? {};

function soloSpecimensFor(key: string): { name: string; props: Record<string, unknown>; force: string | null; look?: string[] }[] {
  const fromRecipe = recipeComponents[key];
  if (Array.isArray(fromRecipe) && fromRecipe.length > 0) {
    return fromRecipe.map((s: any) => ({
      name: String(s.name ?? 'default'),
      props: s.props ?? {},
      force: s.force ?? null,
      look: s.look,
    }));
  }
  // Fallback: one specimen from schema defaults so coverage has no silent holes.
  const { defaults } = describeSchema(componentRegistry![key].schema);
  return [{ name: 'default', props: defaults, force: null }];
}

const soloUnits: SoloUnit[] = [];
if (panels.includes('solo')) {
  for (const key of Object.keys(componentRegistry)) {
    for (const spec of soloSpecimensFor(key)) {
      const captureId = `SOLO/${key}/${slugify(spec.name)}`;
      soloUnits.push({
        captureId,
        component: key,
        specimen: spec.name,
        forced: spec.force,
        markup: renderSpecimen(key, spec.props, spec.look),
        reference: referenceFor(key, spec.name),
      });
    }
  }
}

const mockupUnits: MockupUnit[] = [];
if (panels.includes('mockup')) {
  for (const screen of (screensRecipe as any).screens ?? []) {
    const refImg =
      screen.reference && referenceDir && existsSync(join(referenceDir, screen.reference))
        ? screen.reference
        : null;
    mockupUnits.push({
      captureId: `MOCKUP/${slugify(screen.id ?? screen.name)}`,
      screenId: String(screen.id ?? screen.name),
      name: String(screen.name ?? screen.id),
      referenceImage: refImg,
      referenceWidthPx: Number(
        screen.referenceWidthPx ?? (screensRecipe as any).defaults?.referenceWidthPx ?? 420
      ),
      markup: renderTree(screen.tree),
    });
  }
}

function slugify(s: string): string {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── compile the Tailwind utilities the markup uses (file://-openable) ────────
// Components emit Tailwind v4 utility classes; for a static page with no dev
// server those utilities must exist as real CSS. We resolve the Tailwind
// compiler from the TARGET app's node_modules (it ships @tailwindcss/node), feed
// it the app's globals (which @imports tailwindcss + preset + theme), and build
// only the candidates actually present in the rendered markup. This keeps both
// [data-theme="light"] and [data-theme="dark"] blocks in one stylesheet so the
// surface can show light + dark in the same document.
async function compileCss(allMarkup: string): Promise<string> {
  const candidates = scanCandidates(allMarkup);
  const cssEntry = globalsPath && existsSync(globalsPath) ? readFileSync(globalsPath, 'utf8') : synthEntry();
  const base = dirname(globalsPath ?? themePath!);
  try {
    const twNode = await resolveTailwind(base);
    if (!twNode) return fallbackCss();
    const { compile } = twNode;
    const compiled = await compile(cssEntry, {
      base,
      onDependency: () => {},
    });
    return compiled.build(Array.from(candidates));
  } catch (e) {
    console.error(`build-review-surface: tailwind compile fell back (${(e as Error).message})`);
    return fallbackCss();
  }
}

async function resolveTailwind(
  base: string
): Promise<{ compile: (css: string, opts: Record<string, unknown>) => Promise<{ build: (c: string[]) => string }> } | null> {
  for (const spec of ['@tailwindcss/node', 'tailwindcss']) {
    try {
      const url = import.meta.resolveSync
        ? import.meta.resolveSync(spec, pathToFileURL(join(base, 'x')).href)
        : spec;
      const mod = (await import(url)) as Record<string, unknown>;
      if (typeof mod.compile === 'function') return mod as any;
    } catch {
      /* try next */
    }
  }
  return null;
}

function synthEntry(): string {
  // Minimal entry when no --globals supplied: pull tailwind + the target preset
  // (resolved next to --theme's package) + the generated theme.
  return [
    `@import 'tailwindcss';`,
    `@import '@synapsys-integrated/cve-design-system/preset.css';`,
    `@import '${pathToFileURL(themePath!).href}';`,
  ].join('\n');
}

function fallbackCss(): string {
  // Last resort if the compiler is unreachable: inline the raw theme tokens so
  // at least the OKLCH variables resolve. Utilities won't paint — the manifest
  // flags `cssMode: "tokens-only"` so the operator knows the surface is partial.
  return readFileSync(themePath!, 'utf8');
}

// Conservative candidate scan: every token in class="" plus data-cve-look values
// (the surface-ladder escape hatch is class-like and must be compiled too).
function scanCandidates(html: string): Set<string> {
  const set = new Set<string>();
  for (const m of html.matchAll(/class="([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) if (c) set.add(c);
  }
  return set;
}

// ── fill the assets/ template (the Surface agent owns the chrome) ────────────
// The template's ENTIRE generator contract (documented in its head comment):
//   head placeholders   {{INLINE_THEME_CSS}} {{MANIFEST_JSON}} {{BRAND_NAME}}
//                        {{GENERATED_AT}} {{SURFACE_ID}} {{REGISTRY_PATH}}
//                        {{CATEGORY_OPTIONS}} {{AXIS_LEGEND}}
//   loop regions        <!-- LOOP:SOLO_UNITS -->…<!-- /LOOP:SOLO_UNITS -->
//                        <!-- LOOP:MOCKUP_UNITS -->…
//   per-unit (in loop)   {{UNIT_ID}} {{UNIT_TITLE}} {{UNIT_CATEGORY}} {{UNIT_KEY}}
//                        {{UNIT_SEARCH}} {{REF_PANE}} {{NO_REF}} {{RENDER_PANE}}
//   per-axis (nested)    <!-- LOOP:AXES -->… with {{AXIS_KEY/NAME/HINT}}
// The template is authoritative; this generator only fills these tokens. The
// chrome (review-chrome.js) reads window.__REVIEW__ = {surfaceId, generatedAt,
// axes[], units[<captureId>]} and shows/hides stacked modes via the root's
// data-theme (paired|light|dark). So each unit's render pane stacks BOTH modes
// (.rv-modes-stack → .rv-mode-panel[data-mode][data-theme]) — divergence is then
// visible at a glance, which is the whole point of the paired default.
const TEMPLATE_PATH = join(SKILL_DIR, 'assets', 'review-surface.template.html');
if (!existsSync(TEMPLATE_PATH)) die(`template not found: ${TEMPLATE_PATH} (the Surface agent writes assets/; run after wave B4 assets land)`);

// The deterministic axis list comes from the states recipe's `axes.items` (a
// fixed, intent-derived checklist — NOT a per-run nudge-knob; see determinism.md).
const axes: { key: string; name: string; hint: string }[] =
  (statesRecipe as any).axes?.items?.map((a: any) => ({
    key: String(a.key),
    name: String(a.name ?? a.key),
    hint: String(a.hint ?? ''),
  })) ?? [
    { key: 'voice', name: 'Voice', hint: 'display face · uppercase · tabular figures' },
    { key: 'elevation', name: 'Elevation', hint: 'raised vs recessed — no resting outlines' },
    { key: 'rhythm', name: 'Rhythm', hint: 'spacing · breath · vertical cadence' },
    { key: 'color-budget', name: 'Color budget', hint: 'within the brand accent budget' },
    { key: 'both-mode-parity', name: 'Both-mode parity', hint: 'holds up in light AND dark' },
  ];

// Stack the SSR markup once per mode so the paired view shows both. Each panel
// sets data-theme so the inlined [data-theme="…"] token blocks scope to it; a
// forced interactive state (data-force) is pinned on a wrapper inside .dz-render.
function renderPane(markup: string, forced: string | null, widthPx?: number): string {
  const widthStyle = widthPx ? ` style="width:${widthPx}px"` : '';
  const forceOpen = forced ? `<div data-force="${escapeHtml(forced)}">` : '';
  const forceClose = forced ? `</div>` : '';
  const panels = modes
    .map(
      (m) =>
        `<div class="rv-mode-panel" data-mode="${m}" data-theme="${m}">` +
        `<div class="rv-mode-panel__tag">${m}</div>` +
        `<div class="rv-specimen"${widthStyle}>${forceOpen}${markup}${forceClose}</div>` +
        `</div>`
    )
    .join('');
  return `<div class="rv-modes-stack">${panels}</div>`;
}

function refPane(
  ref: { kind: 'image'; rel: string } | { kind: 'note' },
  altLabel: string,
  noteText: string
): { html: string; noRef: boolean } {
  if (ref.kind === 'image') {
    return {
      html: `<img class="rv-ref-img" src="reference/${escapeHtml(ref.rel)}" alt="reference for ${escapeHtml(altLabel)}" />`,
      noRef: false,
    };
  }
  return {
    html: `<div class="rv-intent-note">${escapeHtml(noteText)}</div>`,
    noRef: true,
  };
}

// Expand one <!-- LOOP:X -->…<!-- /LOOP:X --> region by repeating its body once
// per item, running `fill(body, item)` to substitute the per-iteration tokens.
function expandLoop<T>(html: string, name: string, items: T[], fill: (body: string, item: T) => string): string {
  const open = `<!-- LOOP:${name} -->`;
  const close = `<!-- /LOOP:${name} -->`;
  const start = html.indexOf(open);
  const end = html.indexOf(close);
  if (start === -1 || end === -1) return html; // region absent → leave untouched
  const body = html.slice(start + open.length, end);
  const expanded = items.map((it) => fill(body, it)).join('\n');
  return html.slice(0, start) + expanded + html.slice(end + close.length);
}

function fillAxes(body: string): string {
  return expandLoop(body, 'AXES', axes, (axBody, ax) =>
    axBody
      .replaceAll('{{AXIS_KEY}}', escapeHtml(ax.key))
      .replaceAll('{{AXIS_NAME}}', escapeHtml(ax.name))
      .replaceAll('{{AXIS_HINT}}', escapeHtml(ax.hint))
  );
}

// ── assemble + write ─────────────────────────────────────────────────────────
mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, 'reference'), { recursive: true });

// The chrome + scaffolding load as SIBLING files (href="review.css",
// src="review-chrome.js"); copy them beside review.html so the surface is
// self-contained and file://-openable with no dev server.
const copiedAssets: string[] = [];
for (const asset of ['review.css', 'review-chrome.js']) {
  const src = join(SKILL_DIR, 'assets', asset);
  if (existsSync(src)) {
    writeFileSync(join(outDir, asset), readFileSync(src));
    copiedAssets.push(asset);
  }
}

// Copy reference images into out/reference/ so review.html stays portable.
const copiedRefs: string[] = [];
if (referenceDir && existsSync(referenceDir)) {
  for (const f of readdirSync(referenceDir)) {
    if (/\.(png|jpe?g|webp|gif|svg)$/i.test(f)) {
      try {
        writeFileSync(join(outDir, 'reference', f), readFileSync(join(referenceDir, f)));
        copiedRefs.push(f);
      } catch {
        /* skip unreadable */
      }
    }
  }
}

const allMarkup = [...soloUnits.map((u) => u.markup), ...mockupUnits.map((u) => u.markup)].join('\n');
const compiledCss = await compileCss(allMarkup);
const cssMode = compiledCss === fallbackCss() ? 'tokens-only' : 'compiled';

const categories = Array.from(
  new Set(Object.values(componentRegistry).map((e) => e.meta?.category ?? 'Uncategorized'))
).sort();
const categoryOptions = categories.map((c) => `<option value="${escapeHtml(c)}">`).join('');
const axisLegend = axes.map((a) => a.name).join(' · ');
const brandName = (args.brand as string) ?? deriveBrand(themePath!);
const surfaceId = `${slugify(brandName)}-${Date.now().toString(36)}`;
const generatedAt = new Date().toISOString();

function deriveBrand(p: string): string {
  // best-effort brand label from the target path (…/<brand>/app/theme.generated.css)
  const parts = p.split('/');
  const appIdx = parts.lastIndexOf('app');
  return appIdx > 0 ? parts[appIdx - 1] : 'Design';
}

let html = readFileSync(TEMPLATE_PATH, 'utf8');

// Strip the template's leading documentation comment BEFORE expanding loops: it
// lists the LOOP markers as prose (e.g. "<!-- LOOP:SOLO_UNITS -->...") which
// would otherwise be the first match indexOf finds, expanding the docs instead
// of the real region. The doc block sits before <html> and is generator-only.
html = html.replace(/<!--[\s\S]*?-->\s*(?=<html\b)/i, '');

// Expand the two unit loops (each unit = one .rv-unit article, both modes inside).
html = expandLoop(html, 'SOLO_UNITS', soloUnits, (body, u) => {
  const rp = refPane(u.reference, u.component, `Intent note — no reference crop for "${u.component} · ${u.specimen}". Judge against the design-intent file.`);
  return fillAxes(body)
    .replaceAll('{{UNIT_ID}}', escapeHtml(u.captureId))
    .replaceAll('{{UNIT_TITLE}}', escapeHtml(`${u.component} · ${u.specimen}`))
    .replaceAll('{{UNIT_CATEGORY}}', escapeHtml(componentRegistry[u.component]?.meta?.category ?? 'Uncategorized'))
    .replaceAll('{{UNIT_KEY}}', escapeHtml(u.component))
    .replaceAll('{{UNIT_SEARCH}}', escapeHtml(`${u.component} ${u.specimen} ${componentRegistry[u.component]?.meta?.category ?? ''}`.toLowerCase()))
    .replaceAll('{{NO_REF}}', String(rp.noRef))
    .replaceAll('{{REF_PANE}}', rp.html)
    .replaceAll('{{RENDER_PANE}}', renderPane(u.markup, u.forced));
});

html = expandLoop(html, 'MOCKUP_UNITS', mockupUnits, (body, u) => {
  const ref = u.referenceImage ? ({ kind: 'image', rel: u.referenceImage } as const) : ({ kind: 'note' } as const);
  const rp = refPane(ref, u.name, `No reference screenshot for "${u.name}". Judge composition against the design-intent file.`);
  return fillAxes(body)
    .replaceAll('{{UNIT_ID}}', escapeHtml(u.captureId))
    .replaceAll('{{UNIT_TITLE}}', escapeHtml(u.name))
    .replaceAll('{{UNIT_CATEGORY}}', 'SCREEN')
    .replaceAll('{{UNIT_KEY}}', escapeHtml(u.screenId))
    .replaceAll('{{UNIT_SEARCH}}', escapeHtml(`${u.screenId} ${u.name} screen`.toLowerCase()))
    .replaceAll('{{NO_REF}}', String(rp.noRef))
    .replaceAll('{{REF_PANE}}', rp.html)
    .replaceAll('{{RENDER_PANE}}', renderPane(u.markup, null, u.referenceWidthPx));
});

// ── manifest.json — the serializer's catalogue + the full capture index ──────
// The chrome reads {surfaceId, generatedAt, axes, units} (units = capture-id
// strings, one per .rv-unit). We ALSO carry a richer `captures` index (id × mode
// × reference) so capture-renders has an authoritative, order-stable shot list.
const unitIds = [...soloUnits.map((u) => u.captureId), ...mockupUnits.map((u) => u.captureId)];
const manifest = {
  surfaceId,
  generatedAt,
  registry: relForOut(registryPath),
  theme: relForOut(themePath!),
  cssMode,
  modes,
  panels,
  axes,
  units: unitIds,
  counts: {
    solo: soloUnits.length,
    mockup: mockupUnits.length,
    components: Object.keys(componentRegistry).length,
  },
  reference: { dir: referenceDir ? relForOut(referenceDir) : null, copied: copiedRefs },
  assets: copiedAssets,
  captures: [
    ...soloUnits.flatMap((u) =>
      modes.map((m) => ({
        captureId: u.captureId,
        panel: 'solo',
        component: u.component,
        specimen: u.specimen,
        mode: m,
        forced: u.forced,
        reference: u.reference.kind === 'image' ? `reference/${u.reference.rel}` : null,
      }))
    ),
    ...mockupUnits.flatMap((u) =>
      modes.map((m) => ({
        captureId: u.captureId,
        panel: 'mockup',
        screen: u.screenId,
        mode: m,
        referenceImage: u.referenceImage ? `reference/${u.referenceImage}` : null,
        referenceWidthPx: u.referenceWidthPx,
      }))
    ),
  ],
};

// The chrome only needs the small catalogue; ship that as window.__REVIEW__ and
// keep the full index in manifest.json for capture-renders.
const reviewManifest = { surfaceId, generatedAt, axes, units: unitIds };

// Fill the head placeholders + inline the compiled CSS + the manifest catalogue.
html = html
  .replaceAll('{{BRAND_NAME}}', escapeHtml(brandName))
  .replaceAll('{{GENERATED_AT}}', escapeHtml(generatedAt))
  .replaceAll('{{SURFACE_ID}}', escapeHtml(surfaceId))
  .replaceAll('{{REGISTRY_PATH}}', escapeHtml(relForOut(registryPath)))
  .replaceAll('{{CATEGORY_OPTIONS}}', categoryOptions)
  .replaceAll('{{AXIS_LEGEND}}', escapeHtml(axisLegend))
  .replace('{{INLINE_THEME_CSS}}', () => compiledCss) // fn form: no $-pattern interpretation
  .replace('{{MANIFEST_JSON}}', () => JSON.stringify(reviewManifest));

const reviewHtmlPath = join(outDir, 'review.html');
writeFileSync(reviewHtmlPath, html, 'utf8');
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

function relForOut(p: string): string {
  const r = relative(outDir, p);
  return isAbsolute(r) || r.startsWith('..') ? p : r;
}

const missingAssets = ['review.css', 'review-chrome.js'].filter((a) => !copiedAssets.includes(a));
console.error(
  `build-review-surface: wrote ${reviewHtmlPath} — ${soloUnits.length} solo unit(s), ${mockupUnits.length} mockup screen(s), modes [${modes.join(', ')}], css ${cssMode}.` +
    (missingAssets.length ? ` WARNING: missing assets ${missingAssets.join(', ')} (chrome/styling will be inert).` : '') +
    ` Open it with file:// — impeccable + the operator judge fidelity (this script emits no verdict).`
);
process.stdout.write(
  JSON.stringify(
    { reviewHtml: reviewHtmlPath, manifest: join(outDir, 'manifest.json'), surfaceId, cssMode, counts: manifest.counts },
    null,
    2
  ) + '\n'
);
