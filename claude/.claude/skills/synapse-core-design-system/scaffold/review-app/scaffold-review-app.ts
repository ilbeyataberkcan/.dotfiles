#!/usr/bin/env bun
/**
 * scaffold-review-app — stands up the LIVE, interactive fidelity-review route in a
 * host Next.js app, and reverses it. The skill's `review` sub-skill EXECUTES this
 * (it replaces the retired build-review-surface / capture-renders static pipeline).
 *
 * It is the ONE generator: deterministic copy + marker-guarded patch + feedback
 * init. The only judgment knobs are the two recipes (states + screens). See
 * REVIEW-APP-DESIGN.md §7 and EXECUTION-SPEC.md §3 (the SPEC's verified corrections
 * OVERRIDE the design wherever they differ).
 *
 * WHAT IT DOES (in order):
 *   1. Copies the review-app template files → <target>/<route>/ (page.dev.tsx)
 *      and <target>/<route>/_components/ (the 16 shell parts incl. ScreenModal.tsx + review.css + det-id.ts + useReviewMode.ts), binding the
 *      __PLACEHOLDER__ tokens the templates author for the target's registry /
 *      seed (import + export name) / event-grid / recipe paths / swatch names /
 *      reference base / surface-id.
 *   2. Copies the recipes INTO the route (states-recipe.json augmented with the
 *      text/logo Stage-1 specimens if the source lacks them; screen-recipes.json
 *      verbatim) so the catalog imports them relatively — self-contained on dev.
 *   3. Copies the --reference images into <target>/public/<route-url>/reference/
 *      (Next serves them at __REFERENCE_BASE__ = /<route-url>/reference) and
 *      REGENERATES the screen-id → best-fit-image marked block inside the copied
 *      _components/reference-map.ts (the recipe-named refs do not exist on disk).
 *   4. PATCHES 4 host files (idempotent, marker-guarded, exact anchors):
 *        app/layout.tsx · app/globals.css · next.config.ts · package.json
 *      The layout patch MOUNTS the PACKAGE font loader (ThemeFontLinks), NOT a
 *      next/font + bridge-CSS rig — and NEVER double-mounts (see FONT LOADER below).
 *   5. Inits <target>/<route>/review-feedback.json (schema synapse-review/2, round 1).
 *   6. Prints a summary (no file dumps).
 *
 *   --uninstall reverses everything: removes the route dir + the public reference
 *   dir + every marked patch block (incl. the layout ThemeFontLinks mount),
 *   restoring the host (mirrors the pageExtensions ternary reversal).
 *
 * FONT LOADER, IDEMPOTENTLY (SPEC §0 override of design File 14/15 + Patch 1):
 * fonts are loaded by the design-system's seed-driven <ThemeFontLinks> (a Server
 * Component that emits the <link>/<style> markup making the bare family names in
 * the injected token CSS (<ThemeInjector>) resolve) — NOT by next/font + a fonts.css bridge + an
 * <html className>. So: NO app/fonts.ts / app/fonts.css are copied; globals.css gets
 * ONLY the two @source lines (NO @import './fonts.css'); layout.tsx is patched to
 * import { ThemeFontLinks } from the design-system ROOT + the seed, and render
 * <ThemeFontLinks fonts={<seed>.fonts} /> in the root — each inside synapse-review
 * markers. The patch is GUARDED so it NEVER double-mounts: if a synapse-review
 * marked block already mounts ThemeFontLinks (e.g. tmmaf, where the font-loader fix
 * already added it) the existing marked block is REPLACED in place; an UNMARKED
 * hand-mount of ThemeFontLinks is detected and left untouched (no second mount).
 *
 * THE PLACEHOLDER CONTRACT (templates author these; the scaffold binds them):
 *   __REGISTRY_IMPORT__   host registry module      → @/lib/registry        (from --registry)
 *   __SEED_IMPORT__       theme-seed module         → @/lib/theme-seed      (from --seed)
 *   __SEED_EXPORT__       seed export name          → TMMAF_SEED            (--seed-export / parsed)
 *   __EVENT_GRID_IMPORT__ out-of-engine grid module → @/lib/host-blocks/EventSelectionGrid (--event-grid / derived)
 *   __STATES_IMPORT__     states recipe (in-route)  → ../states-recipe.json
 *   __SCREENS_IMPORT__    screens recipe (in-route) → ../screen-recipes.json
 *   __SWATCH_NAMES__      --color-* names           → quoted list parsed from --theme
 *   __REFERENCE_BASE__    public URL base           → /<route-url>/reference
 *   __SURFACE_ID__        stable surface id         → tmmaf-citizenship-slice (from --surface-id)
 *   __LOGO_SRC__          host-fed brand logo url   → /tmmaf-logo.png (from --logo-src; '' → text mark)
 *
 * IDEMPOTENT / REVERSIBLE:
 *   - Host patches are wrapped in /* synapse-review:start *​/ … /* synapse-review:end *​/
 *     (CSS/JS) or inline /* … *​/ (JSX attr) markers. A re-run REPLACES the marked
 *     block in place — char-precise, never duplicates, never touches hand-edited
 *     content outside the markers. package.json (JSON, no comments) is tracked by
 *     an exact additive key the uninstaller removes. The reference-map.ts block is
 *     a `synapse-review:start reference-map` marker the scaffold rewrites in place.
 *   - Copied template files carry a content hash in <route>/.synapse-review-manifest.json.
 *     On re-run an UNCHANGED file is overwritten with the fresh template; a file
 *     edited since scaffold is SKIPPED with a warning unless --force (operator
 *     shell edits to the shell survive a re-scaffold).
 *
 *   bun scaffold-review-app.ts \
 *     --target     /abs/project/root \
 *     --route      app/review                       # default app/review \
 *     --registry   lib/registry.ts                   # host registry the catalog mounts \
 *     --seed       lib/theme-seed.ts                  # font roles + mode-pair source \
 *     --seed-export TMMAF_SEED                        # seed export name (default: parsed, else TMMAF_SEED) \
 *     --theme      app/theme.generated.css            # swatch (--color-*) source \
 *     --states     "$SKILL/recipes/states-recipe.json" \
 *     --screens    "$SKILL/recipes/screen-recipes.json" \
 *     --reference  docs/.../screenshots               # mockup popup images \
 *     --event-grid lib/host-blocks/EventSelectionGrid # out-of-engine grid (default: derived from --registry) \
 *     --surface-id tmmaf-citizenship-slice \
 *     [--logo-src /tmmaf-logo.png]                  # host-fed brand logo url for the reviewer chrome + logo specimen ('' → text mark) \
 *     [--stage 1]                                   # 1 (default) = foundations only; 2 = append building blocks/screens (run LATER) \
 *     [--dev-save-route]                            # emit <route>/api/save/route.ts + wire SAVE_ROUTE (dev-only direct write) \
 *     [--uninstall] [--force]
 *
 * STAGE-INCREMENTAL GENERATION: stages are BUILT one after another, NOT pre-generated.
 *   --stage 1 (default) copies ONLY the Stage-1 surface (foundations: fonts + swatches
 *   + atoms) + the shared infra; it OMITS StageScreens.tsx, ScreenModal.tsx,
 *   catalog-screens.ts, and the screen-recipes.json copy, and records stage=1 in the
 *   manifest. Generate Stage 2 by RE-RUNNING this scaffold with --stage 2 once Stage 1
 *   is finished/approved — that run APPENDS those four artifacts and re-emits nothing
 *   that would un-build Stage 1.
 */

import {
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  copyFileSync,
  rmSync,
} from 'node:fs';
import { dirname, resolve, join, isAbsolute, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// ── locate this script's own template/recipe roots (skill-relative) ──────────
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(SCRIPT_DIR, 'templates');
const SKILL_RECIPES_DIR = resolve(SCRIPT_DIR, '..', '..', 'recipes');

// design-system ROOT specifier — ThemeFontLinks is re-exported from the barrel
// (`export * from './theme/index.js'`), so the root import is valid and matches the
// host's already-working font-loader mount.
const DESIGN_SYSTEM_ROOT = '@synapsys-integrated/cve-design-system';

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
  console.error(`scaffold-review-app: ${msg}`);
  process.exit(2);
}

const MARKER_START = 'synapse-review:start';
const MARKER_END = 'synapse-review:end';
const PKG_KEY = 'dev:review'; // additive package.json script (JSON has no comment markers)
// The review-app's only runtime dependency: Radix's collision-aware popover (the
// AnnotationPopover positioner). Public npm; added idempotently so the surface is
// self-sufficient and reusable across hosts. Tracked by exact key for the uninstaller.
const REVIEW_DEP_KEY = '@radix-ui/react-popover';
const REVIEW_DEP_RANGE = '^1.1.16';
const MANIFEST_NAME = '.synapse-review-manifest.json';

// ── path helpers ─────────────────────────────────────────────────────────────
function rel(targetRoot: string, p: string): string {
  return relative(targetRoot, p) || '.';
}

/** Turn a target-relative module path into a `@/`-aliased, extension-stripped import. */
function aliasImport(targetRoot: string, abs: string): string {
  const r = rel(targetRoot, abs).replace(/\\/g, '/');
  const noExt = r.replace(/\.(ts|tsx|js|jsx)$/, '');
  return `@/${noExt}`;
}

function sha(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex').slice(0, 16);
}

// ── the template files (relative to TEMPLATES_DIR), authored separately ──────
// page.dev.tsx at the route root; 16 parts under _components/ (incl. ScreenModal.tsx + review.css + det-id.ts + useReviewMode.ts). NO fonts.ts/fonts.css
// (fonts come from the package <ThemeFontLinks> loader — SPEC §0 override). NO
// route.dev.ts (persistence is localStorage + download via feedback-store).
// reference-map.ts is copied THEN its marked block regenerated per target.
// STAGE-INCREMENTAL GENERATION (the operator's hard constraint): stages are BUILT one
// after another, NOT pre-generated-and-gated. --stage 1 copies ONLY the Stage-1 surface
// (foundations) + shared infra; the Stage-2 files (StageScreens.tsx, ScreenModal.tsx,
// catalog-screens.ts) and the screen-recipes.json copy are OMITTED. --stage 2 — run LATER,
// after Stage 1 is approved — APPENDS those files. The manifest records `stage` so a
// re-run knows what is already present.
const ROUTE_TEMPLATES = ['page.dev.tsx'];

// Shared infra + the Stage-1 (foundations) surface — copied at EVERY stage.
const STAGE1_COMPONENT_TEMPLATES = [
  '_components/ReviewShell.tsx',
  '_components/StageFoundations.tsx',
  '_components/SpecimenCard.tsx',
  '_components/ReviewAnnotatable.tsx',
  '_components/AnnotationOverlay.tsx',
  '_components/AnnotationPopover.tsx',
  '_components/FeedbackPanel.tsx',
  '_components/ReferencePopup.tsx',
  '_components/ThemeModeToggle.tsx',
  '_components/useReviewMode.ts', // bridge onto the host's cve ThemeMode provider via useThemeMode
  '_components/catalog-foundations.ts', // Stage-1 catalog: fonts + swatches + atoms + axes (no screens)
  '_components/feedback-store.ts',
  '_components/reference-map.ts',
  '_components/det-id.ts', // deterministic UUID-format ids (the hydration fix)
  '_components/review.css', // the review-surface chrome stylesheet (host-style; L17)
];

// Stage-2 (BUILDING BLOCKS) — appended ONLY by --stage 2, after Stage 1 is finished.
// Never copied during a --stage 1 generation. The shipped ReviewShell template renders
// Stage 1 ONLY (no Stage-2 tab/import); --stage 2 ALSO rewires that copied ReviewShell
// to add the 2nd tab + gated pane + footer verdict branch (wireStage2Shell).
const STAGE2_COMPONENT_TEMPLATES = [
  '_components/StageBuildingBlocks.tsx', // Stage-2 pane: foundational molecules (REUSE cve components)
  '_components/catalog-buildingblocks.ts', // Stage-2 catalog: re-partition of states-recipe.json
];

// Stage-3 (SCREENS) draft — the composed-screens surface. NOT generated yet (no --stage 3
// path); the template files are KEPT so the draft survives, but they are not required by
// --stage 2 and never copied until Stage 3 is built.
const STAGE3_COMPONENT_TEMPLATES = [
  '_components/StageScreens.tsx',
  '_components/ScreenModal.tsx', // click-to-zoom inspector (Radix Dialog); no placeholders
  '_components/catalog-screens.ts', // Stage-3 catalog: molecules + screen forests (imports screen-recipes.json)
];

// ── Stage-2 ReviewShell rewire ────────────────────────────────────────────────
// The ReviewShell template is Stage-1 only (renders StageFoundations, single "Approve
// foundations" footer, no Stage-2 tab). On --stage 2 we add the "Building Blocks" tab +
// gated pane + footer verdict branch by inserting/replacing marker-guarded blocks into
// the just-copied ReviewShell — idempotent (the inserts carry unique sentinels replaced
// in place; the replacements swap a stable Stage-1 literal whose copy-restore re-arms the
// next run). The Stage-1 template is the SOURCE OF TRUTH; this only ADDS the gated Stage-2
// surface (Building Blocks reuses the existing `screens` StageState — Fork G).
//
// replaceManaged: swap a canonical Stage-1 literal for a marker-wrapped Stage-2 block,
// guarded by both the marked-block sentinel (re-run after a copy-restore) and the literal
// (a hand-edited shell that lacks the literal is left untouched — safe no-op).
function replaceManaged(content: string, literal: string, block: string, sentinel: string): string {
  if (findMarkedBlock(content, sentinel)) return content; // already wired (no copy-restore this run)
  if (!content.includes(literal)) return content; // literal gone (hand-edited) → no-op
  return content.replace(literal, block);
}

function wireStage2Shell(routeDir: string, log: string[]): void {
  const shellPath = join(routeDir, '_components', 'ReviewShell.tsx');
  if (!existsSync(shellPath)) {
    log.push('  stage 2 — ReviewShell.tsx not found; skipped Stage-2 rewire');
    return;
  }
  let content = readFileSync(shellPath, 'utf8');

  // 1. lazy import (next/dynamic) + the activeStage hook + the gate helper.
  if (!findMarkedBlock(content, "import('./StageBuildingBlocks')")) {
    const importBlock = wrap(
      "import { useState } from 'react';\n" +
        "import dynamic from 'next/dynamic';\n" +
        "const StageBuildingBlocks = dynamic(() => import('./StageBuildingBlocks').then((m) => m.StageBuildingBlocks), { ssr: false });\n" +
        "import { canAdvanceToScreens } from './feedback-store';",
      'line',
    );
    content = insertAfterAnchor(content, "from './AnnotationOverlay'", importBlock, "import('./StageBuildingBlocks')");
  }

  // 2. activeStage state + the Building-Blocks gate; the ReviewStage passed to the store /
  //    overlay / panel maps 'buildingblocks' → the reused 'screens' bucket (Fork G).
  const stageConstLiteral =
    "  // Stage 1 ONLY: Stage 2 is not generated yet, so there is one stage here.\n" +
    "  const stage = 'foundations' as const;";
  const stageStateBlock = wrap(
    "  const [activeStage, setActiveStage] = useState<'foundations' | 'buildingblocks'>('foundations');\n" +
      "  // Fork G: Building Blocks reuses the 'screens' StageState; map the UI stage onto it.\n" +
      "  const stage = activeStage === 'buildingblocks' ? ('screens' as const) : ('foundations' as const);",
    'line',
  );
  content = replaceManaged(content, stageConstLiteral, stageStateBlock, 'const [activeStage, setActiveStage]');

  // 3. compute the gate inside ReviewShellInner (after the feedback snapshot read).
  if (!findMarkedBlock(content, 'const blocksUnlocked')) {
    const gateBlock = wrap('  const blocksUnlocked = canAdvanceToScreens();', 'line');
    content = insertAfterAnchor(content, /const openFixes = feedback\.summary\.openFixes;/, gateBlock, 'const blocksUnlocked');
  }

  // 4. the stage tabs: drive the Foundations tab's active class off activeStage and add the
  //    2nd "Building Blocks" tab (a real <button> so it can be :disabled until unlocked).
  const foundationsTabLiteral =
    '        {/* Stage 1 ONLY — no Stage-2 tab; Stage 2 is generated later (scaffold --stage 2). */}\n' +
    '        <nav className="rv-stage-tabs" aria-label="Stages">\n' +
    '          <span className="rv-stage-tab rv-stage-tab-on" aria-current="true">\n' +
    '            <span className="rv-stage-tab-num">1</span> Foundations\n' +
    '            {foundationsVerdict === \'approved\' ? (\n' +
    '              <span className="rv-stage-tab-ok" aria-hidden>✓</span>\n' +
    '            ) : null}\n' +
    '          </span>\n' +
    '        </nav>';
  const stageTabsBlock =
    '        {/* Stage tabs: Foundations (1) + Building Blocks (2, gated until foundations approved). */}\n' +
    '        {/* ' + MARKER_START + ' */}\n' +
    '        <nav className="rv-stage-tabs" aria-label="Stages">\n' +
    '          <button\n' +
    '            type="button"\n' +
    "            className={`rv-stage-tab ${activeStage === 'foundations' ? 'rv-stage-tab-on' : ''}`}\n" +
    "            aria-current={activeStage === 'foundations'}\n" +
    "            onClick={() => setActiveStage('foundations')}\n" +
    '          >\n' +
    '            <span className="rv-stage-tab-num">1</span> Foundations\n' +
    "            {foundationsVerdict === 'approved' ? (\n" +
    '              <span className="rv-stage-tab-ok" aria-hidden>✓</span>\n' +
    '            ) : null}\n' +
    '          </button>\n' +
    '          <button\n' +
    '            type="button"\n' +
    "            className={`rv-stage-tab ${activeStage === 'buildingblocks' ? 'rv-stage-tab-on' : ''}`}\n" +
    "            aria-current={activeStage === 'buildingblocks'}\n" +
    '            disabled={!blocksUnlocked}\n' +
    "            title={blocksUnlocked ? undefined : 'Approve foundations to unlock'}\n" +
    "            onClick={() => setActiveStage('buildingblocks')}\n" +
    '          >\n' +
    '            <span className="rv-stage-tab-num">2</span> Building Blocks\n' +
    '            {blocksUnlocked ? null : (\n' +
    '              <span className="rv-stage-tab-lock" aria-hidden>🔒</span>\n' +
    '            )}\n' +
    '          </button>\n' +
    '        </nav>\n' +
    '        {/* ' + MARKER_END + ' */}';
  content = replaceManaged(content, foundationsTabLiteral, stageTabsBlock, 'rv-stage-tab-lock');

  // 5. render the Stage-2 pane behind the gate, replacing the Stage-1-only render.
  const stage1Render =
    '          {/* Stage 1 ONLY — Stage 2 (StageScreens) is not generated yet. */}\n          <StageFoundations />';
  const stage2Render =
    '          {/* ' + MARKER_START + ' */}\n' +
    "          {activeStage === 'buildingblocks' && blocksUnlocked ? <StageBuildingBlocks /> : <StageFoundations />}\n" +
    '          {/* ' + MARKER_END + ' */}';
  content = replaceManaged(content, stage1Render, stage2Render, 'StageBuildingBlocks /> : <StageFoundations');

  // 6. footer: a per-stage Approve branch — "Approve building blocks" sets the reused
  //    'screens' verdict (gated on blocksUnlocked); else the existing "Approve foundations".
  const approveBtnLiteral =
    '          <button\n' +
    '            type="button"\n' +
    '            className="rv-btn rv-btn-approve"\n' +
    '            disabled={approveDisabled}\n' +
    "            title={approveDisabled ? 'Already approved' : undefined}\n" +
    '            onClick={onApproveStage}\n' +
    '          >\n' +
    '            Approve foundations\n' +
    '          </button>';
  const approveBranchBlock =
    '          {/* ' + MARKER_START + ' */}\n' +
    "          {activeStage === 'buildingblocks' ? (\n" +
    '            <button\n' +
    '              type="button"\n' +
    '              className="rv-btn rv-btn-approve"\n' +
    "              disabled={!blocksUnlocked || feedback.stages.screens.verdict === 'approved'}\n" +
    "              title={blocksUnlocked ? undefined : 'Approve foundations first'}\n" +
    "              onClick={() => setVerdict('screens', 'approved', mode)}\n" +
    '            >\n' +
    '              Approve building blocks\n' +
    '            </button>\n' +
    '          ) : (\n' +
    '            <button\n' +
    '              type="button"\n' +
    '              className="rv-btn rv-btn-approve"\n' +
    '              disabled={approveDisabled}\n' +
    "              title={approveDisabled ? 'Already approved' : undefined}\n" +
    '              onClick={onApproveStage}\n' +
    '            >\n' +
    '              Approve foundations\n' +
    '            </button>\n' +
    '          )}\n' +
    '          {/* ' + MARKER_END + ' */}';
  content = replaceManaged(content, approveBtnLiteral, approveBranchBlock, 'Approve building blocks');

  writeFileSync(shellPath, content);
  log.push('  stage 2 — ReviewShell rewired: Building Blocks tab + gated pane + footer verdict (idempotent)');
}

const REFERENCE_MAP_TEMPLATE = '_components/reference-map.ts';

// OPTIONAL dev-save-route artifact (emitted only with --dev-save-route). It lands at
// <route>/api/save/route.ts — a dev-only POST that writes review-feedback.json directly.
// When absent, the template feedback-store stays download-first (__SAVE_ROUTE__ → '').
const SAVE_ROUTE_TEMPLATE = 'api/save/route.ts';

/** The template keys to copy for a given stage (cumulative: each stage includes the prior). */
function templateKeysForStage(stage: number): string[] {
  const components = [
    ...STAGE1_COMPONENT_TEMPLATES,
    ...(stage >= 2 ? STAGE2_COMPONENT_TEMPLATES : []),
    ...(stage >= 3 ? STAGE3_COMPONENT_TEMPLATES : []),
  ];
  return [...ROUTE_TEMPLATES, ...components];
}

// ── reference map (0i / D3 §2): recipe-named refs DO NOT exist; map to best fit ─
// screen-id → best-available shot. home-hero has no faithful match (popup shows
// "reference unavailable"). mobile-bar-swap is the dark-mode parity reference.
const REFERENCE_MAP: Record<string, string | null> = {
  registration: 'm-citizenship.png',
  'event-detail': 'desktop-profile.png',
  'home-hero': null, // no faithful match → "reference unavailable"
};
const DARK_PARITY_REFERENCE = 'mobile-bar-swap.png';
const REFMAP_MARKER_START = 'synapse-review:start reference-map';
const REFMAP_MARKER_END = 'synapse-review:end reference-map';

// ── recipe augmentation (3c / 0k): add the text + logo Stage-1 specimens the ──
// shipped states-recipe.json lacks. Kept IN the recipe (a brand-overridable knob),
// not hard-coded in the catalog. text uses prop `content` (0f), 7 variants (0c).
const TEXT_VARIANTS = ['heading', 'subheading', 'body', 'caption', 'label', 'display', 'eyebrow'] as const;

function augmentStatesRecipe(raw: string): { json: string; added: string[] } {
  let recipe: any;
  try {
    recipe = JSON.parse(raw);
  } catch (e) {
    die(`--states is not valid JSON: ${(e as Error).message}`);
  }
  recipe.components ??= {};
  const added: string[] = [];

  if (!recipe.components.text) {
    recipe.components.text = TEXT_VARIANTS.map((v) => ({
      name: `${v}`,
      // prop is `content` for the Text componentType — NEVER `text` (0f).
      props: { content: `Text — ${v}`, variant: v },
    }));
    added.push('text');
  }
  if (!recipe.components.logo) {
    recipe.components.logo = [
      { name: 'default', props: {} },
      { name: 'mark only', props: { variant: 'mark' } },
      { name: 'wordmark', props: { variant: 'wordmark' } },
    ];
    added.push('logo');
  }
  return { json: JSON.stringify(recipe, null, 2) + '\n', added };
}

// ── placeholder substitution ─────────────────────────────────────────────────
// Templates author the brand-agnostic __PLACEHOLDER__ tokens; the script binds
// them per-target. A template that contains none is copied verbatim. Keys are bare
// names (e.g. REGISTRY_IMPORT); the wrapper rewrites each as __REGISTRY_IMPORT__.
function substitute(content: string, vars: Record<string, string>): string {
  let out = content;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`__${k}__`).join(v);
  }
  return out;
}

// ── parse the ordered, de-duped --color-* NAME list from the theme CSS ────────
// The :root / [data-theme] blocks all carry the same 118 names (D1 §0.5), so the
// NAME LIST is mode-invariant; the catalog reads VALUES at runtime off the scope.
function parseSwatchNames(themeCss: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  const re = /(--color-[A-Za-z0-9-]+)\s*:/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(themeCss)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      names.push(m[1]);
    }
  }
  return names;
}

/** Render the swatch names as the indented quoted list the catalog template expects. */
function renderSwatchList(names: string[]): string {
  return names.map((n) => `  '${n}',`).join('\n');
}

/** Best-effort parse of the seed's export const name from the seed module source. */
function parseSeedExport(seedSrc: string): string | null {
  // matches `export const TMMAF_SEED` / `export const seed =` (first const export)
  const m = seedSrc.match(/export\s+const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[:=]/);
  return m ? m[1] : null;
}

/**
 * Regenerate the screen-id → image block inside the copied reference-map.ts,
 * replacing ONLY the `synapse-review:start/end reference-map` marked region (the
 * rest of the file — types, dark-parity const, comments — is preserved).
 */
function regenerateReferenceMap(
  src: string,
  entries: Record<string, string | null>,
  darkParity: string | null,
): string {
  const body = Object.entries(entries)
    .map(([id, img]) => {
      const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(id) ? id : `'${id}'`;
      return `  ${key}: ${img === null ? 'null' : `'${img}'`},`;
    })
    .join('\n');
  const block = `  /* ${REFMAP_MARKER_START} */\n${body}\n  /* ${REFMAP_MARKER_END} */`;
  let out = src;
  const s = out.indexOf(REFMAP_MARKER_START);
  if (s !== -1) {
    const lineStart = out.lastIndexOf('\n', s) + 1;
    const e = out.indexOf(REFMAP_MARKER_END, s);
    if (e !== -1) {
      const close = out.indexOf('*/', e);
      let lineEnd = out.indexOf('\n', close);
      lineEnd = lineEnd === -1 ? out.length : lineEnd;
      out = out.slice(0, lineStart) + block + out.slice(lineEnd);
    }
  }
  // also rebind the dark-parity const if present
  out = out.replace(
    /export const DARK_PARITY_REFERENCE: string \| null = [^;]+;/,
    `export const DARK_PARITY_REFERENCE: string | null = ${darkParity === null ? 'null' : `'${darkParity}'`};`,
  );
  return out;
}

// ── manifest of scaffolded files (content-hash for the idempotency contract) ──
// `stage` records the HIGHEST stage generated so far (1 = foundations only, 2 = screens
// appended). A --stage 2 re-run reads it to know Stage 1 is already present.
type ScaffoldManifest = {
  schema: 'synapse-review-manifest/1';
  stage: number;
  files: Record<string, string>;
};

function loadManifest(routeDir: string): ScaffoldManifest {
  const p = join(routeDir, MANIFEST_NAME);
  if (existsSync(p)) {
    try {
      const m = JSON.parse(readFileSync(p, 'utf8'));
      if (m?.schema === 'synapse-review-manifest/1' && m.files) {
        return { schema: 'synapse-review-manifest/1', stage: typeof m.stage === 'number' ? m.stage : 1, files: m.files };
      }
    } catch {
      /* fall through to a fresh manifest */
    }
  }
  return { schema: 'synapse-review-manifest/1', stage: 1, files: {} };
}

function saveManifest(routeDir: string, m: ScaffoldManifest): void {
  writeFileSync(join(routeDir, MANIFEST_NAME), JSON.stringify(m, null, 2) + '\n');
}

/**
 * Copy one rendered file with the idempotency contract:
 *  - absent              → write, record hash
 *  - present, hash==prev → overwrite with fresh template, record new hash
 *  - present, hash!=prev → SKIP with warning (operator edit) unless force
 */
function copyManaged(
  destAbs: string,
  rendered: string,
  manifestKey: string,
  manifest: ScaffoldManifest,
  force: boolean,
  log: string[],
): 'written' | 'skipped' {
  mkdirSync(dirname(destAbs), { recursive: true });
  const recorded = manifest.files[manifestKey];
  if (existsSync(destAbs)) {
    const current = sha(readFileSync(destAbs, 'utf8'));
    if (recorded && current !== recorded && !force) {
      log.push(`  skip (edited since scaffold): ${manifestKey} — re-run with --force to overwrite`);
      return 'skipped';
    }
  }
  writeFileSync(destAbs, rendered);
  manifest.files[manifestKey] = sha(rendered);
  return 'written';
}

// ── marker-guarded host patches ──────────────────────────────────────────────
type PatchKind = 'line' | 'jsx';

/** Wrap an insertion in the right marker style for the file kind. */
function wrap(insertion: string, kind: PatchKind, indent = ''): string {
  if (kind === 'jsx') {
    return `${indent}{/* ${MARKER_START} */}\n${insertion}\n${indent}{/* ${MARKER_END} */}`;
  }
  return `${indent}/* ${MARKER_START} */\n${insertion}\n${indent}/* ${MARKER_END} */`;
}

/** Has this file already got a synapse-review marker block? */
function hasMarker(content: string): boolean {
  return content.includes(MARKER_START);
}

/**
 * Insert `block` after the first line matching `afterAnchor`, but ONLY if no
 * marker block already exists for this insertion point. Idempotent: a marked
 * block is detected by a unique sentinel inside it and replaced in place.
 */
function insertAfterAnchor(
  content: string,
  afterAnchor: string | RegExp,
  block: string,
  sentinel: string,
): string {
  // already present → replace the existing marked block carrying this sentinel.
  // Preserve the trailing newline the precise span swallowed for whole-line blocks.
  const existing = findMarkedBlock(content, sentinel);
  if (existing) {
    const tail = content[existing.end - 1] === '\n' && !block.endsWith('\n') ? '\n' : '';
    return content.slice(0, existing.start) + block + tail + content.slice(existing.end);
  }
  const lines = content.split('\n');
  const idx = lines.findIndex((l) => (afterAnchor instanceof RegExp ? afterAnchor.test(l) : l.includes(afterAnchor)));
  if (idx === -1) return content; // anchor missing → caller reports
  lines.splice(idx + 1, 0, block);
  return lines.join('\n');
}

/**
 * Char-precise span of the marked region whose START sits at `startIdx`.
 * Finds the comment-OPEN that precedes MARKER_START (`/*` or `{/*`) and the
 * comment-CLOSE that follows MARKER_END (`*​/` or `*​/}`), then:
 *  - WHOLE-LINE (block) markers — only whitespace before the open on its line AND
 *    only whitespace/EOL after the close → remove the entire line(s) incl. the
 *    trailing newline (restores the file as if the insert never happened).
 *  - INLINE markers (mid-line, e.g. the <html> className) — remove exactly from
 *    the comment-open to the comment-close, plus ONE leading space if present, so
 *    the surrounding host line is left byte-identical.
 */
function spanOf(content: string, startIdx: number): { open: number; close: number } {
  // comment-open immediately before MARKER_START
  const slashStar = content.lastIndexOf('/*', startIdx);
  let open = slashStar;
  if (slashStar > 0 && content[slashStar - 1] === '{') open = slashStar - 1; // {/*
  // comment-close immediately after MARKER_END
  const endIdx = content.indexOf(MARKER_END, startIdx);
  let close = content.indexOf('*/', endIdx);
  close = close + 2; // past the */
  if (content[close] === '}') close += 1; // */}

  const lineStart = content.lastIndexOf('\n', open) + 1;
  const beforeOnLine = content.slice(lineStart, open);
  const afterClose = content.slice(close);
  const eol = afterClose.indexOf('\n');
  const afterOnLine = eol === -1 ? afterClose : afterClose.slice(0, eol);

  const wholeLine = beforeOnLine.trim() === '' && afterOnLine.trim() === '';
  if (wholeLine) {
    const blockEnd = eol === -1 ? content.length : close + eol + 1; // incl. trailing \n
    return { open: lineStart, close: blockEnd };
  }
  // inline: also swallow ONE leading space we inserted before the comment-open
  const trimOpen = open > 0 && content[open - 1] === ' ' ? open - 1 : open;
  return { open: trimOpen, close };
}

/** Find a marked block that contains `sentinel`; returns its precise char span or null. */
function findMarkedBlock(content: string, sentinel: string): { start: number; end: number } | null {
  let from = 0;
  while (true) {
    const s = content.indexOf(MARKER_START, from);
    if (s === -1) return null;
    const e = content.indexOf(MARKER_END, s);
    if (e === -1) return null;
    const span = spanOf(content, s);
    if (content.slice(span.open, span.close).includes(sentinel)) {
      return { start: span.open, end: span.close };
    }
    from = e + MARKER_END.length;
  }
}

/** Remove EVERY synapse-review marked block from the content (char-precise). */
function stripAllMarkedBlocks(content: string): string {
  let out = content;
  while (true) {
    const s = out.indexOf(MARKER_START);
    if (s === -1) break;
    const span = spanOf(out, s);
    out = out.slice(0, span.open) + out.slice(span.close);
  }
  return out;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════
const args = parseArgs(process.argv.slice(2));

if (typeof args.target !== 'string') die('--target <project root> is required');
const target: string = resolve(args.target as string);
if (!existsSync(target)) die(`--target not found: ${target}`);

const routeRel = (typeof args.route === 'string' ? args.route : 'app/review').replace(/^\/+|\/+$/g, '');
const routeDir = join(target, routeRel);
const componentsDir = join(routeDir, '_components');
const force = args.force === true;
const uninstall = args.uninstall === true;
// OPTIONAL: emit the dev-only save route + wire feedback-store's SAVE_ROUTE so the
// "Save feedback" button writes review-feedback.json directly. Off by default — a
// generic host stays download-first. (Uninstall removes the route dir wholesale.)
const devSaveRoute = args['dev-save-route'] === true;

// STAGE-INCREMENTAL GENERATION: --stage N selects WHICH stage's files to generate.
//   --stage 1 (default) → Stage-1 surface (foundations) + shared infra ONLY; the
//     Stage-2 files + screen-recipes.json copy are OMITTED. Generate Stage 2 LATER, by
//     re-running this scaffold with --stage 2 once Stage 1 is finished/approved — that
//     run APPENDS StageScreens.tsx / ScreenModal.tsx / catalog-screens.ts and copies
//     screen-recipes.json. The manifest records the stage so each run is idempotent.
const stageRaw = typeof args.stage === 'string' ? Number.parseInt(args.stage, 10) : 1;
const stage = stageRaw === 2 ? 2 : 1; // only 1 | 2 are valid; anything else → 1
const isStage2 = stage === 2;

// route URL: strip a leading "app/" (App Router) → URL path
const routeUrl = '/' + routeRel.replace(/^app\//, '');
// public asset dir + URL base for the copied reference images
const publicRefDir = join(target, 'public', routeUrl.replace(/^\//, ''), 'reference');
const referenceBase = `${routeUrl}/reference`;

// ── UNINSTALL ────────────────────────────────────────────────────────────────
if (uninstall) {
  const log: string[] = [];
  // 1. remove the route dir wholesale (page + components + recipes + feedback + manifest)
  if (existsSync(routeDir)) {
    rmSync(routeDir, { recursive: true, force: true });
    log.push(`  removed route dir: ${rel(target, routeDir)}/`);
  }
  // 2. remove the copied public reference dir
  if (existsSync(publicRefDir)) {
    rmSync(publicRefDir, { recursive: true, force: true });
    log.push(`  removed reference dir: ${rel(target, publicRefDir)}/`);
  }
  // 3. strip marked blocks from the comment-bearing host files (incl. the layout
  //    ThemeFontLinks import + mount blocks).
  for (const hostRel of ['app/layout.tsx', 'app/globals.css', 'next.config.ts']) {
    const p = join(target, hostRel);
    if (!existsSync(p)) continue;
    const before = readFileSync(p, 'utf8');
    if (!hasMarker(before)) continue;
    writeFileSync(p, stripAllMarkedBlocks(before));
    log.push(`  unpatched: ${hostRel}`);
  }
  // 4. remove the additive package.json script key + the review-app dependency we added.
  const pkgPath = join(target, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    let pkgChanged = false;
    if (pkg.scripts && PKG_KEY in pkg.scripts) {
      delete pkg.scripts[PKG_KEY];
      log.push(`  removed package.json script: "${PKG_KEY}"`);
      pkgChanged = true;
    }
    if (pkg.dependencies && REVIEW_DEP_KEY in pkg.dependencies) {
      delete pkg.dependencies[REVIEW_DEP_KEY];
      log.push(`  removed package.json dependency: "${REVIEW_DEP_KEY}"`);
      pkgChanged = true;
    }
    if (pkgChanged) writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
  console.log(`scaffold-review-app: UNINSTALLED from ${target}`);
  console.log(log.length ? log.join('\n') : '  (nothing to remove — host already clean)');
  process.exit(0);
}

// ── INSTALL ─ validate the inputs that drive the placeholders ────────────────
function requirePath(flag: string, p: unknown): string {
  if (typeof p !== 'string') die(`--${flag} <path> is required`);
  const abs = isAbsolute(p) ? p : resolve(target, p);
  if (!existsSync(abs)) die(`--${flag} not found: ${abs}`);
  return abs;
}

const registryAbs = requirePath('registry', args.registry);
const seedAbs = requirePath('seed', args.seed);
const themeAbs = requirePath('theme', args.theme);
const statesAbs = typeof args.states === 'string' ? requirePath('states', args.states) : join(SKILL_RECIPES_DIR, 'states-recipe.json');
const screensAbs = typeof args.screens === 'string' ? requirePath('screens', args.screens) : join(SKILL_RECIPES_DIR, 'screen-recipes.json');
if (!existsSync(statesAbs)) die(`states recipe not found: ${statesAbs}`);
if (!existsSync(screensAbs)) die(`screens recipe not found: ${screensAbs}`);
const referenceAbs = typeof args.reference === 'string' ? requirePath('reference', args.reference) : null;
const surfaceId = typeof args['surface-id'] === 'string' ? (args['surface-id'] as string) : 'review-surface';
// LOGO_SRC: host-fed brand logo URL for the reviewer chrome + logo specimen.
// Empty by default — the template renders a text mark when absent (brand stays
// host-fed; the generic template carries no host-specific path).
const logoSrc = typeof args['logo-src'] === 'string' ? (args['logo-src'] as string) : '';

// verify the templates the script needs are present (authored separately)
const stageTemplateKeys = templateKeysForStage(stage);
const requiredTemplateKeys = devSaveRoute ? [...stageTemplateKeys, SAVE_ROUTE_TEMPLATE] : stageTemplateKeys;
const missingTemplates = requiredTemplateKeys.filter((k) => !existsSync(join(TEMPLATES_DIR, k)));
if (missingTemplates.length) {
  die(
    `missing ${missingTemplates.length} template file(s) under ${TEMPLATES_DIR}:\n  ` +
      missingTemplates.join('\n  '),
  );
}

// ── build the placeholder bindings ───────────────────────────────────────────
// Recipes are COPIED INTO the route, so the catalog imports them by a stable
// relative specifier — self-contained, dev-server resolvable, no skill path leak.
// Keys map 1:1 to the __TOKEN__ the templates author (substitute() wraps each key
// in __…__). These short tokens match the file header doc + every template file.
//
// EVENT_GRID_IMPORT (§0d): EventSelectionGrid is OUT-OF-ENGINE — the catalog/Stage-2
// import it directly, never via a registry key. Resolve from --event-grid, else
// derive host-blocks/EventSelectionGrid beside the --registry module (it is an import
// specifier — no on-disk check; aliasImport strips the extension).
const eventGridAbs =
  typeof args['event-grid'] === 'string'
    ? (isAbsolute(args['event-grid'] as string)
        ? (args['event-grid'] as string)
        : resolve(target, args['event-grid'] as string))
    : join(dirname(registryAbs), 'host-blocks', 'EventSelectionGrid.tsx');
const eventGridImport = aliasImport(target, eventGridAbs); // e.g. @/lib/host-blocks/EventSelectionGrid

// SEED_EXPORT (catalog.ts `import { __SEED_EXPORT__ as seed }` + the layout
// ThemeFontLinks mount): honor --seed-export, else parse the seed's first
// `export const NAME` (e.g. TMMAF_SEED), else default to TMMAF_SEED. Always a NAMED
// export (the templates + the layout mount both use a named import).
const seedExport =
  typeof args['seed-export'] === 'string'
    ? (args['seed-export'] as string)
    : parseSeedExport(readFileSync(seedAbs, 'utf8')) ?? 'TMMAF_SEED';

// the @/-aliased seed specifier (e.g. @/lib/theme-seed) — used by both the catalog
// placeholder and the layout ThemeFontLinks-mount patch.
const seedAlias = aliasImport(target, seedAbs);

// SWATCH_NAMES (§0h): the ordered, de-duped --color-* NAME list parsed from --theme,
// rendered as the indented quoted list the catalog template's placeholder slot expects.
// VALUES are NOT baked — the catalog reads them at runtime off the theme scope element.
const swatchNamesList = renderSwatchList(parseSwatchNames(readFileSync(themeAbs, 'utf8')));

// SAVE_ROUTE (--dev-save-route): the dev save-route URL the feedback-store POSTs to, or
// '' for a download-only host. ROUTE_REL: the route dir target-relative (the route file
// resolves <cwd>/<ROUTE_REL>/review-feedback.json as its deliberate write target).
const saveRouteUrl = devSaveRoute ? `${routeUrl}/api/save` : '';

const placeholders: Record<string, string> = {
  REGISTRY_IMPORT: aliasImport(target, registryAbs), // e.g. @/lib/registry
  SEED_IMPORT: seedAlias, // e.g. @/lib/theme-seed
  SEED_EXPORT: seedExport, // e.g. TMMAF_SEED
  STATES_IMPORT: '../states-recipe.json', // copied into the route (from _components/)
  SCREENS_IMPORT: '../screen-recipes.json',
  EVENT_GRID_IMPORT: eventGridImport, // out-of-engine direct import (§0d)
  SWATCH_NAMES: swatchNamesList, // parsed --color-* name list (§0h)
  REFERENCE_BASE: referenceBase, // public URL base, e.g. /review/reference
  SURFACE_ID: surfaceId,
  LOGO_SRC: logoSrc, // host-fed brand logo URL or '' (--logo-src → text mark)
  SAVE_ROUTE: saveRouteUrl, // dev save-route URL or '' (--dev-save-route)
  ROUTE_REL: routeRel, // route dir, target-relative (e.g. app/review)
};

const manifest = loadManifest(routeDir);
const copyLog: string[] = [];
let tplWritten = 0;
let tplSkipped = 0;
let recipeWritten = 0;
let recipeSkipped = 0;

mkdirSync(componentsDir, { recursive: true });

// ── 1. copy reference images into public/<route-url>/reference (BEFORE templates,
//       so the reference-map.ts regeneration can null-out any mapped-but-missing
//       shot — the popup then never 404s). The recipe-named refs don't exist on
//       disk, so the screen→image map (REFERENCE_MAP, §0i) is mandatory.
const screensRaw = readFileSync(screensAbs, 'utf8');
let copiedImages = 0;
if (referenceAbs) {
  mkdirSync(publicRefDir, { recursive: true });
  for (const f of readdirSync(referenceAbs)) {
    if (!/\.(png|jpg|jpeg|webp|avif|gif)$/i.test(f)) continue;
    copyFileSync(join(referenceAbs, f), join(publicRefDir, f));
    copiedImages++;
  }
}

function screenIdsFromRecipe(): string[] {
  try {
    const j = JSON.parse(screensRaw);
    return Array.isArray(j.screens) ? j.screens.map((s: any) => s.id) : [];
  } catch {
    return [];
  }
}

/** screen-id → reference filename, nulled if the mapped shot was not copied. */
function refMapEntries(): Record<string, string | null> {
  const ids = new Set([...screenIdsFromRecipe(), ...Object.keys(REFERENCE_MAP)]);
  const out: Record<string, string | null> = {};
  for (const id of ids) {
    const mapped = id in REFERENCE_MAP ? REFERENCE_MAP[id] : null;
    out[id] = mapped !== null && existsSync(join(publicRefDir, mapped)) ? mapped : null;
  }
  return out;
}

function refDarkParity(): string | null {
  return existsSync(join(publicRefDir, DARK_PARITY_REFERENCE)) ? DARK_PARITY_REFERENCE : null;
}

// ── 2. copy route + component templates (all land under <target>/<route>/...) ─
//       reference-map.ts has its marked block regenerated per target after the
//       placeholder substitution; everything else is copy-as-rendered.
function destFor(templateKey: string): string {
  return join(routeDir, templateKey); // page.dev.tsx → <route>/; _components/* → <route>/_components/
}

for (const key of stageTemplateKeys) {
  const src = readFileSync(join(TEMPLATES_DIR, key), 'utf8');
  let rendered = substitute(src, placeholders);
  if (key === REFERENCE_MAP_TEMPLATE) {
    rendered = regenerateReferenceMap(rendered, refMapEntries(), refDarkParity());
  }
  const result = copyManaged(destFor(key), rendered, key, manifest, force, copyLog);
  if (result === 'written') tplWritten++;
  else tplSkipped++;
}

// ── 2b. OPTIONAL: emit the dev-only save route (--dev-save-route) ─────────────
// Lands at <route>/api/save/route.ts; feedback-store's SAVE_ROUTE was wired to its URL
// above. Without the flag the route is absent and the store stays download-first. The
// uninstaller removes it with the route dir wholesale (no separate cleanup needed).
if (devSaveRoute) {
  const src = readFileSync(join(TEMPLATES_DIR, SAVE_ROUTE_TEMPLATE), 'utf8');
  const rendered = substitute(src, placeholders);
  const result = copyManaged(destFor(SAVE_ROUTE_TEMPLATE), rendered, SAVE_ROUTE_TEMPLATE, manifest, force, copyLog);
  if (result === 'written') tplWritten++;
  else tplSkipped++;
}

// ── 2c. STAGE 2: rewire the copied ReviewShell to add the Building Blocks tab + gated
//       pane + footer verdict. (No-op at --stage 1 — the shell stays Stage-1 only.)
if (isStage2) {
  wireStage2Shell(routeDir, copyLog);
}

// ── 3. copy the recipes into the route (states-recipe AUGMENTED) ─────────────
const statesRaw = readFileSync(statesAbs, 'utf8');
const { json: statesAugmented, added: addedKeys } = augmentStatesRecipe(statesRaw);
const statesDest = join(routeDir, 'states-recipe.json');
if (copyManaged(statesDest, statesAugmented, 'states-recipe.json', manifest, force, copyLog) === 'written') recipeWritten++;
else recipeSkipped++;

// screen-recipes.json is a Stage-3 artifact (catalog-screens.ts imports it). It is copied
// ONLY at --stage 3 — Stage 1 (atoms) and Stage 2 (building blocks) both read only
// states-recipe.json, which is always copied.
if (stage >= 3) {
  const screensDest = join(routeDir, 'screen-recipes.json');
  if (copyManaged(screensDest, screensRaw, 'screen-recipes.json', manifest, force, copyLog) === 'written') recipeWritten++;
  else recipeSkipped++;
}

// ── 4. PATCH the 4 host files (idempotent, marker-guarded, exact anchors) ─────
const patchLog: string[] = [];
const patchWarnings: string[] = [];

function readHost(relPath: string): { abs: string; content: string } | null {
  const abs = join(target, relPath);
  if (!existsSync(abs)) {
    patchWarnings.push(`  skip patch — not found: ${relPath}`);
    return null;
  }
  return { abs, content: readFileSync(abs, 'utf8') };
}

// Patch 1 — app/layout.tsx: DETECT-EXISTING-AND-ADAPT, then MOUNT only what's
// missing (SPEC §0 override of design Patch 1). We adopt into EXISTING apps, so this
// reads the host root layout before patching and mounts only the gaps:
//   • PROVIDER: we NEVER inject a theme provider. The canonical host owns mode through
//     the design-system runtime — <ThemeInjector seed> (the swappable token <style>
//     block) + <ThemeMode> (attribute mode, flips data-theme on <html>) — and the review
//     toggle drives THAT provider via useThemeMode(). So the host keeps ONE provider and
//     the mode switch never breaks from two providers fighting over data-theme. A legacy
//     host on raw next-themes is detected too; either way the scaffold adds no competing
//     provider — it is detected here only to be reported.
//   • FONTS: mount the seed-driven package <ThemeFontLinks> loader (NOT next/font + a
//     fonts.css bridge + an <html className>), GUARDED so it NEVER double-mounts:
//       - a synapse-review MARKED ThemeFontLinks block already present → replace it in
//         place (idempotent re-run; e.g. tmmaf, where the font-loader fix added it);
//       - an UNMARKED hand-mount of <ThemeFontLinks ...> present → reuse it: leave the
//         file byte-identical, add nothing (no second mount);
//       - neither → add the marked import (ThemeFontLinks from the design-system ROOT
//         + the seed) and the marked <ThemeFontLinks fonts={SEED.fonts}/> mount.
{
  const host = readHost('app/layout.tsx');
  if (host) {
    let { content } = host;
    // DETECT existing theme wiring (report-only; we never add a competing provider).
    // A real adoption keeps ONE provider — recognize the design-system runtime
    // (<ThemeMode>/<ThemeInjector>) as well as a legacy next-themes/<ThemeProvider> host;
    // the review toggle drives it through useThemeMode() and the surface adds none.
    const hasHostProvider =
      /\bThemeMode\b|\bThemeInjector\b|\bThemeProvider\b|from\s+['"]next-themes['"]/.test(content);
    // sentinels that uniquely identify our two marked blocks (import vs mount).
    const SENTINEL_IMPORT = 'import { ThemeFontLinks }';
    const SENTINEL_MOUNT = '<ThemeFontLinks';
    const markedImport = findMarkedBlock(content, SENTINEL_IMPORT);
    const markedMount = findMarkedBlock(content, SENTINEL_MOUNT);
    const alreadyMarked = !!markedImport || !!markedMount;
    const hasUnmarkedMount = !alreadyMarked && content.includes('<ThemeFontLinks');

    // report the provider detection (we add none — the review toggle drives the host's).
    // The review template calls useThemeMode(), so it REQUIRES a host <ThemeMode>; when
    // none is found we warn (rather than silently break) instead of claiming a self-scope.
    if (hasHostProvider) {
      patchLog.push(
        '  app/layout.tsx — host theme provider detected (ThemeMode/ThemeInjector or next-themes); the review toggle drives it via useThemeMode (ONE provider, none injected)',
      );
    } else {
      patchWarnings.push(
        '  app/layout.tsx — ⚠ no host theme provider found; the review surface needs the host to mount <ThemeInjector seed> + <ThemeMode> (the design-system runtime). Add it to app/layout.tsx, then re-run.',
      );
    }

    if (hasUnmarkedMount) {
      patchLog.push('  app/layout.tsx — ThemeFontLinks already mounted (unmarked); left as-is (no double-mount)');
    } else {
      // 1a. imports: ThemeFontLinks from the design-system ROOT + the seed (named).
      const importBlock = wrap(
        `import { ThemeFontLinks } from '${DESIGN_SYSTEM_ROOT}';\nimport { ${seedExport} } from '${seedAlias}';`,
        'line',
      );
      const lines = content.split('\n');
      let lastImport = -1;
      lines.forEach((l, i) => {
        if (/^\s*import\b/.test(l)) lastImport = i;
      });
      // insertAfterAnchor replaces the existing marked import block in place via the
      // SENTINEL_IMPORT; otherwise it inserts after the last import line.
      const importAnchor = markedImport ? /import\b/ : lastImport !== -1 ? lines[lastImport] : null;
      if (importAnchor !== null) {
        content = insertAfterAnchor(content, importAnchor, importBlock, SENTINEL_IMPORT);
      } else {
        patchWarnings.push('  app/layout.tsx — no import line to anchor the ThemeFontLinks import');
      }

      // 1b. mount <ThemeFontLinks fonts={SEED.fonts}/> at the top of <body>.
      const mountBlock = wrap(`        <ThemeFontLinks fonts={${seedExport}.fonts} />`, 'jsx', '        ');
      const existingMount = findMarkedBlock(content, SENTINEL_MOUNT);
      if (existingMount) {
        const tail = content[existingMount.end - 1] === '\n' && !mountBlock.endsWith('\n') ? '\n' : '';
        content = content.slice(0, existingMount.start) + mountBlock + tail + content.slice(existingMount.end);
      } else {
        const bodyRe = /(<body\b[^>]*>)/;
        if (bodyRe.test(content)) {
          content = content.replace(bodyRe, `$1\n${mountBlock}`);
        } else {
          patchWarnings.push('  app/layout.tsx — <body> open tag not found (ThemeFontLinks not mounted)');
        }
      }
      writeFileSync(host.abs, content);
      patchLog.push('  patched: app/layout.tsx (ThemeFontLinks import + mount — idempotent, no double-mount)');
    }
  }
}

// Patch 2 — app/globals.css: the two @source lines ONLY (NO @import fonts.css —
// fonts come from the package loader, SPEC §0 override). Without these @source globs
// the host-block + review-app utility classes are tree-shaken out of the build.
{
  const host = readHost('app/globals.css');
  if (host) {
    let { content } = host;
    const reviewGlob = routeUrl.replace(/^\//, ''); // e.g. review
    const sourceBlock = wrap(
      `@source "../lib/**/*.{ts,tsx}";\n@source "./${reviewGlob}/**/*.{ts,tsx}";`,
      'line',
    );
    content = insertAfterAnchor(content, /@source\s+["'].*cve-components\/dist/, sourceBlock, '@source "../lib/**/*.{ts,tsx}"');
    writeFileSync(host.abs, content);
    patchLog.push('  patched: app/globals.css (2 @source lines — no fonts.css import)');
  }
}

// Patch 3 — next.config.ts: isDev const + conditional pageExtensions (prod lever).
{
  const host = readHost('next.config.ts');
  if (host) {
    let { content } = host;
    // 3a. const isDev — anchored after the LAST import line (insertAfterAnchor
    //     replaces our marked block in place on re-run via the sentinel).
    const isDevBlock = wrap(`const isDev = process.env.NODE_ENV !== 'production';`, 'line');
    const lines = content.split('\n');
    let lastImport = -1;
    lines.forEach((l, i) => {
      if (/^import\b/.test(l.trim())) lastImport = i;
    });
    if (lastImport !== -1) {
      content = insertAfterAnchor(content, lines[lastImport], isDevBlock, 'const isDev =');
    } else {
      patchWarnings.push('  next.config.ts — no import line found to anchor `const isDev`');
    }
    // 3b. pageExtensions ternary INSIDE the config literal (anchor: output:"standalone").
    //     If a hand-written pageExtensions exists WITHOUT our marker, leave it alone.
    const peBlock = wrap(
      `  pageExtensions: isDev\n    ? ['tsx', 'ts', 'jsx', 'js', 'dev.tsx', 'dev.ts']\n    : ['tsx', 'ts', 'jsx', 'js'],`,
      'line',
    );
    if (findMarkedBlock(content, 'pageExtensions: isDev') || !content.includes('pageExtensions:')) {
      content = insertAfterAnchor(content, /output:\s*["']standalone["']/, peBlock, 'pageExtensions: isDev');
    } else {
      patchWarnings.push('  next.config.ts — a hand-written `pageExtensions` exists; left as-is (review the .dev.tsx exclusion)');
    }
    writeFileSync(host.abs, content);
    patchLog.push('  patched: next.config.ts (isDev + pageExtensions ternary)');
  }
}

// Patch 4 — package.json: additive dev:review script + the review-app's lone runtime
// dependency (@radix-ui/react-popover, tracked by exact key). The AnnotationPopover
// uses Radix's collision-aware popover positioner (auto flip/shift to stay in the
// viewport) — it is public npm, so any host can resolve it; we ADD it idempotently so
// the surface is self-sufficient and reusable across hosts. Existing entries are left
// as-is (never downgrade a host's pinned range).
{
  const host = readHost('package.json');
  if (host) {
    const pkg = JSON.parse(host.content);
    pkg.scripts ??= {};
    if (!(PKG_KEY in pkg.scripts)) {
      pkg.scripts[PKG_KEY] = 'next dev';
      patchLog.push(`  patched: package.json (added "${PKG_KEY}": "next dev")`);
    } else {
      patchLog.push(`  package.json — "${PKG_KEY}" already present (left as-is)`);
    }
    pkg.dependencies ??= {};
    if (!(REVIEW_DEP_KEY in pkg.dependencies) && !(REVIEW_DEP_KEY in (pkg.devDependencies ?? {}))) {
      pkg.dependencies[REVIEW_DEP_KEY] = REVIEW_DEP_RANGE;
      patchLog.push(`  patched: package.json (added dependency "${REVIEW_DEP_KEY}": "${REVIEW_DEP_RANGE}") — run install`);
    } else {
      patchLog.push(`  package.json — "${REVIEW_DEP_KEY}" already a dependency (left as-is)`);
    }
    writeFileSync(host.abs, JSON.stringify(pkg, null, 2) + '\n');
  }
}

// ── 5. init review-feedback.json (schema synapse-review/2, round 1, pending) ──
const feedbackPath = join(routeDir, 'review-feedback.json');
if (!existsSync(feedbackPath) || force) {
  const feedback = {
    schema: 'synapse-review/2',
    surfaceId,
    generatedAt: new Date().toISOString(),
    round: 1,
    stages: {
      foundations: { verdict: 'pending', decidedAt: null, mode: null },
      screens: { verdict: 'pending', decidedAt: null, mode: null },
    },
    annotations: [],
    summary: { openFixes: 0, byStage: {} },
  };
  writeFileSync(feedbackPath, JSON.stringify(feedback, null, 2) + '\n');
}

// record the highest stage generated, then persist the file-hash manifest so re-runs
// honor the idempotency contract (a --stage 1 re-run after Stage 2 never demotes).
manifest.stage = Math.max(manifest.stage, stage);
saveManifest(routeDir, manifest);

// ── 6. summary (no file dumps) ───────────────────────────────────────────────
const componentCount = stageTemplateKeys.length - ROUTE_TEMPLATES.length;
console.log(`scaffold-review-app: review app scaffolded into ${target} (stage ${stage})`);
console.log('');
console.log(`  templates copied : ${stageTemplateKeys.length} (page.dev.tsx + ${componentCount} _components, stage ${stage}) — ${tplWritten} written, ${tplSkipped} skipped`);
console.log(`  recipes copied   : ${stage >= 3 ? 2 : 1} (states-recipe.json${addedKeys.length ? ` +[${addedKeys.join(', ')}]` : ''}${stage >= 3 ? ', screen-recipes.json' : ' — screen-recipes.json deferred to --stage 3'}) — ${recipeWritten} written, ${recipeSkipped} skipped`);
console.log(`  swatch names     : ${swatchNamesList.split('\n').filter(Boolean).length} --color-* parsed from ${rel(target, themeAbs)}`);
console.log(`  reference images : ${copiedImages} → ${rel(target, publicRefDir)}/  (served at ${referenceBase})`);
console.log(`  host patches     : ${patchLog.length}`);
patchLog.forEach((l) => console.log(l));
if (tplSkipped || recipeSkipped) copyLog.forEach((l) => console.log(l));
if (patchWarnings.length) {
  console.log('  WARNINGS:');
  patchWarnings.forEach((w) => console.log(w));
}
console.log('');
console.log(`  route URL  : ${routeUrl}   (run: bun run ${PKG_KEY}  → open http://localhost:3000${routeUrl})`);
console.log(`  feedback   : ${feedbackPath}`);
console.log(
  devSaveRoute
    ? `  save route : ${routeUrl}/api/save  (dev-only POST writes review-feedback.json directly; prod → 404, download fallback)`
    : `  save route : (none) — "Save feedback" offers a browser download (pass --dev-save-route for a direct dev write)`,
);
console.log(`  fonts      : mounted via <ThemeFontLinks fonts={${seedExport}.fonts}> in app/layout.tsx (package loader; no next/font, no fonts.css bridge)`);
console.log(`  review dep : "${REVIEW_DEP_KEY}": "${REVIEW_DEP_RANGE}" ensured in package.json (collision-aware AnnotationPopover) — run your installer to fetch it`);
console.log(`  idempotent : re-run replaces only /* ${MARKER_START}…${MARKER_END} */ blocks + the "${PKG_KEY}" key; unchanged templates refreshed, edited ones skipped (--force overrides). Reverse with --uninstall.`);
console.log(
  isStage2
    ? `  stage      : 2 (foundations + building blocks) — Stage-2 tab wired (StageBuildingBlocks + catalog-buildingblocks). Stage 3 (screens) is NOT generated yet.`
    : `  stage      : 1 (foundations only) — Stage 2 (building blocks) is NOT generated yet. When Stage 1 is finished/approved, re-run with --stage 2 to append StageBuildingBlocks.tsx + catalog-buildingblocks.ts and wire the Building Blocks tab.`,
);
