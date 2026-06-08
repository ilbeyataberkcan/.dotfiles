/*
 * reference-map — screen-id → best-fit reference image filename.
 *
 * The recipe-named PNGs (home-hero.png / event-detail.png / registration.png) do
 * NOT exist on disk; this map points each screen id at the closest available shot
 * in the copied `--reference` dir, or `null` for "reference unavailable". The
 * scaffold's reference-mapping step REGENERATES this file per target from the
 * screen recipes + the actual screenshots dir (it is a deterministic, derived
 * artifact — edit the recipe/refs, re-scaffold, not this file by hand).
 *
 * Default (TMMAF) mapping per DISCOVERY-recipes-refs §2:
 *   registration → m-citizenship.png   (exact 1:1 — two price rows + callout)
 *   event-detail → desktop-profile.png (closest desktop multi-section composition)
 *   home-hero    → null                (no faithful match → "reference unavailable")
 *   dark parity  → mobile-bar-swap.png (any screen, when the mode toggle is dark)
 */

export const REFERENCE_MAP: Record<string, string | null> = {
  /* synapse-review:start reference-map */
  'home-hero': null,
  'event-detail': 'desktop-profile.png',
  registration: 'm-citizenship.png',
  /* synapse-review:end reference-map */
};

/** The single dark-mode parity reference, shown for any screen while in dark mode. */
export const DARK_PARITY_REFERENCE: string | null = 'mobile-bar-swap.png';
