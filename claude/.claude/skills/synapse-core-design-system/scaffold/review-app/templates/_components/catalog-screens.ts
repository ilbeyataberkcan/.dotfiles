/**
 * catalog-screens — the Stage-2 (BUILDING BLOCKS / SCREENS) half of the catalog.
 *
 * Stages are BUILT one-after-another. This module is GENERATED + imported ONLY after
 * Stage 1 (foundations) is finished — re-run the scaffold at --stage 2. Importing it
 * is what builds the molecules + screen forests (and pulls in the screens recipe);
 * Stage 1 never touches this file, so no Stage-2 generation runs during Stage 1.
 *
 * It reuses the Stage-1 catalog primitives (specimensFor, toComponentNode, recipe
 * readers, types) from catalog-foundations.ts so there is one source of truth.
 *
 * SCAFFOLD PARAMS (substituted on copy):
 *   __SCREENS_IMPORT__    — screen-recipes.json path.
 *   __EVENT_GRID_IMPORT__ — direct EventSelectionGrid module (out-of-engine, §0d).
 */

import type { ComponentNode } from '@synapsys-integrated/cve-core';
import {
  ATOM_KEYS,
  recipeComponents,
  specimensFor,
  toComponentNode,
  type RecipeNode,
  type SpecimenDescriptor,
  type RenderMode,
} from './catalog-foundations';
import screensRecipe from '__SCREENS_IMPORT__';

// ── the recomposed slice keys — KEBAB, not camelCase (§0c) ────────────────────
// The camelCase identifiers are the defineComponent const names; the registry keys
// are the kebab strings. Using camelCase returns <UnregisteredComponentWarning>.
const SLICE_KEYS = [
  'tmmaf-citizenship',
  'tmmaf-category',
  'tmmaf-summary',
  'tmmaf-payment',
] as const;
type SliceKey = (typeof SLICE_KEYS)[number];

// Static mock props for the flow-driven slice blocks (DISCOVERY-recipes-refs §3).
// They carry no demonstrative defaults, so the catalog supplies content props.
const SLICE_MOCK_PROPS: Record<SliceKey, Record<string, unknown>> = {
  'tmmaf-citizenship': { instanceId: 'review-mock' },
  'tmmaf-category': {
    instanceId: 'review-mock',
    divisions: [
      {
        id: 'd1',
        label: 'Bantamweight · Male',
        discipline: 'MMA',
        genderCategory: 'male',
        weightClass: 'bantam',
        minWeightKg: 57,
        maxWeightKg: 61,
        eligible: true,
      },
      {
        id: 'd2',
        label: 'Flyweight · Male',
        discipline: 'MMA',
        genderCategory: 'male',
        weightClass: 'fly',
        minWeightKg: 53,
        maxWeightKg: 57,
        eligible: false,
      },
    ],
  },
  'tmmaf-summary': {
    instanceId: 'review-mock',
    paymentAmount: { amountMinor: 145000, currency: 'TRY', label: 'Katılım Ücreti' },
  },
  'tmmaf-payment': {
    paymentAmount: { amountMinor: 145000, currency: 'TRY', label: 'Katılım Ücreti' },
  },
};

// EventSelectionGrid mock items (§0d / DISCOVERY-recipes-refs §3). Rendered via a
// direct import path, NOT through renderComponentNode.
const EVENT_GRID_ITEMS = [
  {
    id: 'e1',
    name: 'Ankara Open',
    eventDate: '2026-05-24T00:00:00.000Z',
    venueName: 'Ankara Spor Salonu',
    lifecycleState: null,
  },
  {
    id: 'e2',
    name: 'Istanbul Grand Prix',
    eventDate: '2026-09-14T00:00:00.000Z',
    venueName: 'Sinan Erdem',
    lifecycleState: null,
    imageUrl: '/some-event.jpg',
  },
];

// ── types the screens catalog emits ──────────────────────────────────────────

export interface MoleculeDescriptor extends SpecimenDescriptor {
  /** 'engine' = renderComponentNode; 'direct' = special-cased import (§0d). */
  renderMode: RenderMode;
}

export interface ScreenDescriptor {
  id: string;
  name: string;
  /** the live render root (one ComponentNode forest, all ids = UUID). */
  node: ComponentNode;
  /** pin the live render to this width; the 1400 screens scroll horizontally. */
  referenceWidthPx: number;
}

export interface ScreensCatalog {
  molecules: MoleculeDescriptor[];
  screens: ScreenDescriptor[];
  /** the OUT-OF-ENGINE EventSelectionGrid descriptor (§0d). */
  eventGrid: { captureId: string; renderMode: 'direct'; items: typeof EVENT_GRID_ITEMS };
}

// ── molecules: 19 non-atom recipe keys + 4 kebab slices + EventSelectionGrid ───

function buildMolecules(): MoleculeDescriptor[] {
  const out: MoleculeDescriptor[] = [];
  // Every states-recipe.json key NOT in the atom allowlist (engine-rendered).
  for (const key of Object.keys(recipeComponents)) {
    if ((ATOM_KEYS as readonly string[]).includes(key)) continue;
    for (const spec of specimensFor(key)) {
      out.push({ ...spec, renderMode: 'engine' });
    }
  }
  // The 4 recomposed slice blocks — KEBAB keys, engine-rendered with mock props.
  for (const key of SLICE_KEYS) {
    out.push({
      captureId: `${key}/recomposed`,
      componentType: key,
      name: 'recomposed',
      props: SLICE_MOCK_PROPS[key],
      force: null,
      renderMode: 'engine',
    });
  }
  // EventSelectionGrid — OUT-OF-ENGINE, flagged renderMode:'direct' (§0d). It has
  // no registry key; the stage pane special-cases it via the direct import path.
  out.push({
    captureId: 'EventSelectionGrid/direct',
    componentType: 'EventSelectionGrid',
    name: 'event selection grid',
    props: { items: EVENT_GRID_ITEMS },
    force: null,
    renderMode: 'direct',
  });
  return out;
}

// ── screens: 3 recipe entries → ComponentNode forests at their widths ─────────

function buildScreens(): ScreenDescriptor[] {
  const defaults = (screensRecipe as { defaults?: { referenceWidthPx?: number } }).defaults ?? {};
  const screens = (screensRecipe as { screens?: Array<Record<string, unknown>> }).screens ?? [];
  return screens.map((screen) => {
    const id = String(screen.id ?? screen.name);
    return {
      id,
      name: String(screen.name ?? screen.id),
      // Path-keyed deterministic ids so the whole forest is SSR/client-stable.
      node: toComponentNode(screen.tree as RecipeNode, null, `screen/${id}`),
      referenceWidthPx: Number(screen.referenceWidthPx ?? defaults.referenceWidthPx ?? 420),
    };
  });
}

// ── the single deterministic Stage-2 build ────────────────────────────────────

export const screensCatalog: ScreensCatalog = {
  molecules: buildMolecules(),
  screens: buildScreens(),
  eventGrid: { captureId: 'EventSelectionGrid/direct', renderMode: 'direct', items: EVENT_GRID_ITEMS },
};

// Re-export the kebab slice keys so the Stage-2 pane shares the SAME source of truth.
export { SLICE_KEYS };
export type { SliceKey };
