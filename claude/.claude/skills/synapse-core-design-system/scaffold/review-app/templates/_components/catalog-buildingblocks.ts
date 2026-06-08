/**
 * catalog-buildingblocks — the Stage-2 (BUILDING BLOCKS) half of the deterministic catalog.
 *
 * Stage 2 re-partitions the SAME states-recipe.json the Stage-1 catalog reads into the
 * foundational MOLECULES (inputs, selection chips, status/feedback, data display, nav) —
 * every block REUSES a default cve-component and renders through the RenderEngine, exactly
 * like the app. No `tmmaf-*` domain slices, no hero/event lockups, no EventSelectionGrid
 * (those are the Stage-3 screens draft in catalog-screens.ts).
 *
 * Shared types + helpers (SpecimenDescriptor, the recipe reader, specimensFor) are imported
 * from catalog-foundations so there is no drift — this module only declares the GROUPING.
 *
 * NO directive: a plain module imported by the `'use client'` StageBuildingBlocks pane.
 */

import { specimensFor, type SpecimenDescriptor } from './catalog-foundations';

export interface BuildingBlockGroup {
  /** Pane section header. */
  title: string;
  /** Registry componentType keys in this group; each expands via specimensFor(). */
  keys: string[];
  /** The expanded specimens (recipe entries, or one schema-default fallback per key). */
  blocks: SpecimenDescriptor[];
  /** This group holds a full-width block (siteHeader / selectableRow / table / lineItemsCard) → route to the 1-col grid. */
  fullWidth: boolean;
}

export interface BuildingBlocksCatalog {
  groups: BuildingBlockGroup[];
}

// CONFORM-to-component widths (#8/#18): each block is laid out at its intrinsic design
// width then scaled to fit, so it renders at its own ratio instead of squishing into a
// ~220px cell. Keyed by componentType; absent keys are true small atoms that render 1x.
const INTRINSIC_WIDTH: Record<string, number> = {
  // Navigation — a full-bleed site header needs near-desktop width to read.
  siteHeader: 960,
  // Full-width rows / tables — wide enough that columns + actions don't wrap.
  selectableRow: 520,
  table: 560,
  lineItemsCard: 480,
  uploadStateRow: 480,
  // Other wide composed blocks — the registration-flow slice width.
  input: 420,
  select: 420,
  textarea: 420,
  checkbox: 420,
  switch: 420,
  callout: 420,
  statusIconTile: 420,
  statusTimeline: 420,
  dialog: 420,
  tabs: 420,
  stepRail: 420,
  // OMITTED (render 1x): priceDisplay, statBlock, chipSelect, formField, label — small atoms.
};

// Groups whose blocks span the column — route to the single-column (full) grid so the
// wide render isn't crammed beside a sibling.
const FULL_WIDTH_KEYS = new Set(['siteHeader', 'selectableRow', 'table', 'lineItemsCard']);

// ── group → registry keys (Fork-H/-I cut list + siteHeader nav, operator opted in) ──
// EXCLUDED (Stage-3 / domain): hero, overlayBadge, statusStrap, dateBadgeLockup, all
// tmmaf-*, EventSelectionGrid. `text`/`button`/`logo`/`card` stay Stage-1 atoms.
const GROUP_KEYS: { title: string; keys: string[] }[] = [
  { title: 'Form inputs', keys: ['input', 'select', 'textarea', 'checkbox', 'switch', 'label', 'formField'] },
  { title: 'Selection & lists', keys: ['chipSelect', 'selectableRow', 'tabs', 'stepRail'] },
  { title: 'Status & feedback', keys: ['callout', 'statusIconTile', 'statusTimeline', 'dialog'] },
  { title: 'Data display', keys: ['priceDisplay', 'statBlock', 'table', 'lineItemsCard', 'uploadStateRow'] },
  { title: 'Navigation', keys: ['siteHeader'] },
];

function buildGroups(): BuildingBlockGroup[] {
  return GROUP_KEYS.map(({ title, keys }) => ({
    title,
    keys,
    // Layer the per-group intrinsicWidth onto each expanded specimen (omitted keys stay 1x).
    blocks: keys.flatMap((key) =>
      specimensFor(key).map((spec) => ({
        ...spec,
        intrinsicWidth: INTRINSIC_WIDTH[key] ?? spec.intrinsicWidth,
      })),
    ),
    fullWidth: keys.some((key) => FULL_WIDTH_KEYS.has(key)),
  }));
}

export const buildingBlocksCatalog: BuildingBlocksCatalog = {
  groups: buildGroups(),
};
