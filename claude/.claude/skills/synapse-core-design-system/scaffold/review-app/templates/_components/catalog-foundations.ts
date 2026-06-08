/**
 * catalog-foundations — the Stage-1 (FOUNDATIONS) half of the deterministic catalog.
 *
 * Stages are BUILT one-after-another, not pre-generated-and-gated. This module is the
 * ONLY catalog surface Stage 1 imports: fonts + swatches + atoms + axes. It NEVER
 * imports the screens recipe and NEVER builds molecules/screens — those live in
 * catalog-screens.ts (Stage 2), which is generated/imported only AFTER Stage 1 is
 * finished (re-run the scaffold at --stage 2).
 *
 * Shared types + helpers (FontBlock/SwatchGroup/SpecimenDescriptor, the seed/recipe
 * readers, det-id tree builder, schema introspection) live here as the single source of
 * truth; catalog-screens.ts imports them so there is no drift.
 *
 * NO directive: a plain module imported by the `'use client'` stage panes. Swatch
 * VALUES are NOT baked here — they are read at runtime off the nearest [data-theme]
 * ancestor, which with the host's single cve <ThemeMode> provider (attribute mode) is <html>.
 * This module only emits the NAME list + grouping.
 *
 * SCAFFOLD PARAMS (substituted on copy):
 *   __REGISTRY_IMPORT__   — host registry module (e.g. '@/lib/registry').
 *   __SEED_IMPORT__       — theme-seed module  (e.g. '@/lib/theme-seed').
 *   __SEED_EXPORT__       — the seed export name (e.g. 'TMMAF_SEED').
 *   __STATES_IMPORT__     — states-recipe.json path.
 *   __SWATCH_NAMES__      — parsed ordered --color-* NAME list.
 */

import type { ComponentNode } from '@synapsys-integrated/cve-core';
import { detId } from './det-id';
import { hostRegistry } from '__REGISTRY_IMPORT__';
import { __SEED_EXPORT__ as seed } from '__SEED_IMPORT__';
import statesRecipe from '__STATES_IMPORT__';
// The axis-key union is owned by the feedback-store (type-only import — erased at
// build, no runtime coupling to the 'use client' module). One source of truth for
// the legend keys, the popover draft, and the persisted annotation.
import type { ReviewAxis } from './feedback-store';

// ── the Stage-1 atom allowlist (DESIGN §2) ───────────────────────────────────
// `text` + `logo` are added to states-recipe.json by the scaffold (§0k); `button`
// + `card` ship in the recipe. Everything else is a Stage-2 molecule.
const ATOM_KEYS = ['text', 'button', 'logo', 'card'] as const;
type AtomKey = (typeof ATOM_KEYS)[number];

// ── types the catalog emits ──────────────────────────────────────────────────

export interface FontBlock {
  /** seed role: sans | display | mono. */
  role: string;
  family: string;
  /** the CSS var the specimen renders with: `var(--font-<role>)`. */
  cssVar: string;
  weights: number[];
}

export interface SwatchGroup {
  /** family prefix, e.g. 'accent-primary', 'status-success', 'neutral'. */
  family: string;
  /** the `--color-*` names in family→ramp order; VALUES read at runtime off scope. */
  names: string[];
}

export interface SpecimenDescriptor {
  /** componentType/recipe-name — the stable capture id for annotations. */
  captureId: string;
  componentType: string;
  /** recipe specimen name (or Text variant). */
  name: string;
  props: Record<string, unknown>;
  /** a forced interactive paint (data-force), if the recipe pins one. */
  force: string | null;
  /** the specimen's natural render width (px) so the card sizes to the component,
   *  not the grid track. Omit for true 1x atoms; the presentation layer defaults
   *  it per group and passes it through SpecimenCard as `naturalWidth`. */
  intrinsicWidth?: number;
}

export type RenderMode = 'engine' | 'direct';

export interface AxisDescriptor {
  /** the axis key — a `ReviewAxis` (owned by the feedback-store; one source of truth). */
  key: ReviewAxis;
  name: string;
  hint: string;
}

export interface FoundationsCatalog {
  fonts: FontBlock[];
  swatches: SwatchGroup[];
  /** the full ordered swatch NAME list (flat) — the runtime reads values for these. */
  swatchNames: string[];
  atoms: Record<AtomKey, SpecimenDescriptor[]>;
  axes: AxisDescriptor[];
}

// ── zod-v4 schema introspection (repurposed from build-review-surface) ─────────
// Pure read; never throws on an unfamiliar node — unknown shapes degrade to {}.

export function defaultValue(s: unknown): unknown {
  const d = (s as { _def?: Record<string, unknown> })?._def;
  if (d && (d.type === 'default' || d.typeName === 'ZodDefault')) {
    const dv = d.defaultValue;
    try {
      return typeof dv === 'function' ? (dv as () => unknown)() : dv;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function schemaDefaults(schema: unknown): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  const s = schema as { shape?: unknown; _def?: { shape?: unknown } };
  const rawShape = (typeof s?.shape === 'object' ? s.shape : s?._def?.shape) as unknown;
  const shape =
    typeof rawShape === 'function' ? (rawShape as () => Record<string, unknown>)() : rawShape;
  if (!shape || typeof shape !== 'object') return defaults;
  for (const [key, prop] of Object.entries(shape as Record<string, unknown>)) {
    const dv = defaultValue(prop);
    if (dv !== undefined) defaults[key] = dv;
  }
  return defaults;
}

/** The flat shape of a Zod object schema (or {} for an unfamiliar node). */
function schemaShape(schema: unknown): Record<string, unknown> {
  const s = schema as { shape?: unknown; _def?: { shape?: unknown } };
  const rawShape = (typeof s?.shape === 'object' ? s.shape : s?._def?.shape) as unknown;
  const shape =
    typeof rawShape === 'function' ? (rawShape as () => Record<string, unknown>)() : rawShape;
  return shape && typeof shape === 'object' ? (shape as Record<string, unknown>) : {};
}

/** Unwrap a Zod node past optional/nullable/default wrappers to its base type name
 *  ('string' | 'number' | …); returns whether it was optional/has a default. */
function unwrapType(prop: unknown): { base: string; optional: boolean; hasDefault: boolean } {
  let node = prop;
  let optional = false;
  let hasDefault = false;
  // Walk a small fixed number of wrappers — zod nests optional/nullable/default.
  for (let i = 0; i < 6 && node; i++) {
    const d = (node as { _def?: Record<string, unknown> })?._def;
    if (!d) break;
    const t = (d.type ?? d.typeName) as string | undefined;
    if (t === 'default' || t === 'ZodDefault') {
      hasDefault = true;
      node = d.innerType;
      continue;
    }
    if (t === 'optional' || t === 'ZodOptional' || t === 'nullable' || t === 'ZodNullable') {
      optional = true;
      node = d.innerType;
      continue;
    }
    const base = (t ?? '').replace(/^Zod/, '').toLowerCase();
    return { base, optional, hasDefault };
  }
  return { base: '', optional, hasDefault };
}

/** Title-case a camelCase / kebab prop name into readable placeholder text:
 *  'currentPrice' → 'Current Price', 'ctaPrimary' → 'Cta Primary'. */
function titleCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Synthesize visible placeholder values for REQUIRED string/number props that have
 *  no schema default, so a missing-recipe key degrades to a readable specimen rather
 *  than a ValidationFailedWarning. Strings get the title-cased prop name; numbers a 1. */
function schemaPlaceholders(schema: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, prop] of Object.entries(schemaShape(schema))) {
    const { base, optional, hasDefault } = unwrapType(prop);
    if (optional || hasDefault) continue;
    if (base === 'string') out[key] = titleCase(key);
    else if (base === 'number') out[key] = 1;
  }
  return out;
}

// ── recipe expansion (repurposed from build-review-surface.soloSpecimensFor) ───

type RecipeSpecimen = { name?: string; props?: Record<string, unknown>; force?: string };
export const recipeComponents: Record<string, RecipeSpecimen[]> =
  (statesRecipe as { components?: Record<string, RecipeSpecimen[]> }).components ?? {};

export function specimensFor(key: string): SpecimenDescriptor[] {
  const fromRecipe = recipeComponents[key];
  const entry = (hostRegistry as Record<string, { schema?: unknown }>)[key];
  if (Array.isArray(fromRecipe) && fromRecipe.length > 0) {
    return fromRecipe.map((s, i) => ({
      captureId: `${key}/${slugify(s.name ?? String(i))}`,
      componentType: key,
      name: String(s.name ?? 'default'),
      props: s.props ?? {},
      force: s.force ?? null,
    }));
  }
  // Fallback: one specimen from schema defaults so coverage has no silent holes
  // (states-recipe.json:8 `_fallback`). `logo` may land here if the scaffold's
  // recipe augmentation only added `text`. Required-no-default string/number props are
  // back-filled with readable placeholders so the specimen stays VISIBLE, not a
  // ValidationFailedWarning (defaults win over placeholders for any shared key).
  const defaults = entry?.schema ? schemaDefaults(entry.schema) : {};
  const placeholders = entry?.schema ? schemaPlaceholders(entry.schema) : {};
  return [
    {
      captureId: `${key}/default`,
      componentType: key,
      name: 'default',
      props: { ...placeholders, ...defaults },
      force: null,
    },
  ];
}

export function slugify(s: string): string {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── ComponentNode tree builder (DETERMINISTIC ids — the hydration fix §0e) ─────
// Node ids are `z.string().uuid()` AND must be byte-identical on the server and the
// first client render (the engine stamps id={node.id} on the painted element). So
// they are derived deterministically (detId) from the node's TREE PATH — never
// crypto.randomUUID(), which diverges across the two renders and breaks hydration.
// Lives here (Stage-1 surface) because catalog-screens.ts (Stage 2) reuses it.

export type RecipeNode = {
  componentType: string;
  props?: Record<string, unknown>;
  layout?: { type: string; settings: Record<string, unknown> };
  look?: string[];
  children?: RecipeNode[];
};

export function toComponentNode(n: RecipeNode, parentId: string | null, path: string): ComponentNode {
  const id = detId(`node:${path}`);
  const children = (n.children ?? []).map((c, i) => toComponentNode(c, id, `${path}/${i}`));
  // Emit ONLY type:'standard' nodes (§0/D2 §2 — no symlinks).
  const node = {
    id,
    parentId,
    type: 'standard' as const,
    componentType: n.componentType,
    props: n.props ?? {},
    children,
    ...(n.layout ? { layoutStrategy: n.layout } : {}),
    ...(n.look ? { look: n.look } : {}),
  };
  return node as unknown as ComponentNode;
}

// ── font blocks (deterministic from the seed) ─────────────────────────────────

function buildFonts(): FontBlock[] {
  const fonts = (seed as { fonts?: Record<string, { family: string; weights: number[] }> }).fonts ?? {};
  // sans→--font-sans, display→--font-display, mono→--font-mono (D1 §6 / D2 §5d).
  return Object.entries(fonts).map(([role, def]) => ({
    role,
    family: def.family,
    cssVar: `--font-${role}`,
    weights: [...def.weights],
  }));
}

// ── swatch NAME list (parsed from theme.generated.css; values read at runtime) ─
// The theme is parameterized as a side-channel: the scaffold inlines the parsed
// `--color-*` name list here so the catalog has zero filesystem access at runtime.
// All blocks (:root / [data-theme=light] / [data-theme=dark]) carry the same 118
// names (D1 §0.5), so the NAME LIST is mode-invariant; only VALUES vary by scope.

// The scaffold replaces the slot below with the parsed ordered name list (one
// `--color-*` per entry) read from --theme app/theme.generated.css. Until then it
// is empty (the dev render simply shows no swatches — never a crash).
const SWATCH_NAMES: string[] = [
  __SWATCH_NAMES__
];

function familyOf(name: string): string {
  // '--color-accent-primary-600' → 'accent-primary'; '--color-canvas' → 'canvas'.
  const body = name.replace(/^--color-/, '');
  const m = body.match(/^(.*?)-(\d+|surface|fg)$/);
  return m ? m[1] : body;
}

function buildSwatches(names: string[]): SwatchGroup[] {
  const groups = new Map<string, string[]>();
  for (const name of names) {
    const fam = familyOf(name);
    const list = groups.get(fam) ?? [];
    list.push(name);
    groups.set(fam, list);
  }
  return Array.from(groups.entries()).map(([family, groupNames]) => ({ family, names: groupNames }));
}

// ── axes legend (deterministic, NOT a knob) ───────────────────────────────────

const AXIS_KEYS: readonly ReviewAxis[] = [
  'voice',
  'elevation',
  'media-drama',
  'rhythm',
  'color-budget',
  'both-mode-parity',
  'geometry',
  'typography',
  'ramp-step',
  'prominence',
  'container-fit',
  'broken',
];

function buildAxes(): AxisDescriptor[] {
  const items =
    (statesRecipe as { axes?: { items?: Array<{ key: string; name?: string; hint?: string }> } })
      .axes?.items ?? [];
  // Keep only the 11 contract keys; the name/hint stay recipe-driven. A malformed or
  // re-keyed recipe degrades to the known set rather than leaking a stray axis tag.
  return items
    .filter((a): a is { key: ReviewAxis; name?: string; hint?: string } =>
      (AXIS_KEYS as readonly string[]).includes(a.key),
    )
    .map((a) => ({ key: a.key, name: String(a.name ?? a.key), hint: String(a.hint ?? '') }));
}

// ── atoms partition ───────────────────────────────────────────────────────────

function buildAtoms(): Record<AtomKey, SpecimenDescriptor[]> {
  const out = {} as Record<AtomKey, SpecimenDescriptor[]>;
  for (const key of ATOM_KEYS) out[key] = specimensFor(key);
  return out;
}

// ── the single deterministic Stage-1 build (NO molecules/screens) ─────────────

export const catalog: FoundationsCatalog = {
  fonts: buildFonts(),
  swatchNames: SWATCH_NAMES,
  swatches: buildSwatches(SWATCH_NAMES),
  atoms: buildAtoms(),
  axes: buildAxes(),
};

// Re-export the atom allowlist so the stage panes share the SAME source of truth
// (no string drift between catalog and renderer).
export { ATOM_KEYS };
export type { AtomKey };
