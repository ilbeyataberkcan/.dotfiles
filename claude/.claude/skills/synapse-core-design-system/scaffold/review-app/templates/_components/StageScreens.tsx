'use client';

/*
 * StageScreens — Stage 2 of the review surface.
 *
 * REVEALED ONLY after the foundations verdict === "approved" (the shell mounts
 * this component lazily; this file assumes it is only rendered past the gate).
 *
 *   S2.1  Composed blocks — the flat screensCatalog.molecules list: the 19 non-atom recipe
 *          specimens + the 4 KEBAB slice keys ('tmmaf-citizenship'/-category/
 *          -summary/-payment) all rendered via SpecimenCard (renderComponentNode),
 *          PLUS the EventSelectionGrid descriptor flagged renderMode:'direct' which
 *          is NOT registry-resolvable and is rendered DIRECTLY as a React element
 *          (special-cased; EXECUTION-SPEC §0d).
 *   S2.2  Screens — one live SpecimenCard per screensCatalog.screens entry, pinned to the
 *          recipe's referenceWidthPx (1400 / 1400 / 420). The wide screens scroll
 *          horizontally within their frame; the reference popup holds the mapped
 *          image for the screen in view.
 *
 * The host EventSelectionGrid is imported DIRECTLY (special-case) because it has no
 * defineComponent / no schema / no registry key — it cannot go through the engine.
 * The scaffold substitutes its import path (`__EVENT_GRID_IMPORT__`) from --registry's
 * lib dir.
 */

import { useMemo, useState } from 'react';
import { useReviewMode } from './useReviewMode';
import { EventSelectionGrid } from '__EVENT_GRID_IMPORT__';
import { screensCatalog, type MoleculeDescriptor } from './catalog-screens';
import { detId } from './det-id';
import { SpecimenCard } from './SpecimenCard';
import { ReviewAnnotatable } from './ReviewAnnotatable';
import { ReferencePopup } from './ReferencePopup';
import { ScreenModal, type ScreenModalSpecimen } from './ScreenModal';

// Stage-2 composed blocks are flow slices designed at the mobile registration width
// (420px, the same natural width the recipe pins for the narrow screens). They are laid
// out at this width then scaled down to fit the grid column — devtools-style — so their
// sub-elements keep their designed proportions instead of overlapping in a ~220px cell.
const COMPOSED_NATURAL_WIDTH = 420;

/* Build the type:'standard' node SpecimenCard renders from a molecule specimen.
 * Deterministic id (detId of the captureId) — see det-id.ts / the hydration fix. */
function moleculeNode(spec: MoleculeDescriptor) {
  return {
    id: detId(`node:mol/${spec.captureId}`),
    parentId: null,
    type: 'standard' as const,
    componentType: spec.componentType,
    props: spec.props,
    children: [],
    ...(spec.force ? { look: [`force:${spec.force}`] } : {}),
  } as unknown as Parameters<typeof SpecimenCard>[0]['node'];
}

export function StageScreens() {
  const { mode } = useReviewMode();
  const [activeScreenId, setActiveScreenId] = useState<string>(screensCatalog.screens[0]?.id ?? '');
  // The click-to-zoom modal: clicking any Stage-2 specimen (composed block or screen)
  // opens it larger / at a chosen scale, still annotatable inside. null === closed.
  const [zoomed, setZoomed] = useState<ScreenModalSpecimen | null>(null);

  const activeScreen = useMemo(
    () => screensCatalog.screens.find((s) => s.id === activeScreenId) ?? screensCatalog.screens[0] ?? null,
    [activeScreenId],
  );

  // Stable rvIds for the direct (out-of-engine) descriptors that don't go through
  // SpecimenCard (which takes its own). One per molecule captureId. detId — NOT
  // crypto.randomUUID — so the SSR + first client render carry the same data-rv-id.
  const directRvIds = useMemo(
    () =>
      Object.fromEntries(
        screensCatalog.molecules
          .filter((m) => m.renderMode === 'direct')
          .map((m) => [m.captureId, detId(`direct/${m.captureId}`)]),
      ),
    [],
  );
  const screenRvIds = useMemo(
    () => Object.fromEntries(screensCatalog.screens.map((s) => [s.id, detId(`screen-rv/${s.id}`)])),
    [],
  );

  return (
    <div className="rv-stage rv-stage-screens">
      <header className="rv-stage-head">
        <h2 className="rv-stage-title">Stage 2 · Screens</h2>
        <p className="rv-stage-sub">
          Composed blocks and full screens in the live <strong>{mode}</strong> mode, each beside
          its closest reference shot.
        </p>
      </header>

      {/* ── S2.1 — composed blocks (molecules + slice blocks + EventSelectionGrid) ──
          Each block is laid out at COMPOSED_NATURAL_WIDTH and SCALED DOWN to fit its
          column (devtools-style) so sub-elements never overlap; a Zoom affordance opens
          the modal to inspect it closely. The EventSelectionGrid (out-of-engine, §0d) is
          wrapped in the SAME scale viewport by hand. */}
      <section className="rv-section" aria-label="Composed blocks">
        <h3 className="rv-section-title">S2.1 · Composed blocks</h3>
        <div className="rv-specimen-grid rv-specimen-grid-composed">
          {screensCatalog.molecules.map((mol) =>
            mol.renderMode === 'direct' ? (
              // EventSelectionGrid — rendered directly, NOT through the engine (§0d).
              <ReviewAnnotatable
                key={mol.captureId}
                rvId={directRvIds[mol.captureId]}
                kind="component"
                captureId={mol.captureId}
                componentType={mol.componentType}
                variant="direct"
              >
                <figure className="rv-specimen rv-specimen-direct">
                  <figcaption className="rv-specimen__caption">{mol.name}</figcaption>
                  {/* Manual scale viewport — the direct render gets the same fit treatment
                      as engine specimens, without going through SpecimenCard. */}
                  <div className="rv-specimen__render" data-scaled>
                    <div className="rv-specimen__fit rv-specimen__fit-css">
                      <div
                        className="rv-specimen__natural rv-specimen__natural-css"
                        style={{ width: COMPOSED_NATURAL_WIDTH }}
                      >
                        <EventSelectionGrid
                          items={(mol.props as { items: Parameters<typeof EventSelectionGrid>[0]['items'] }).items}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="rv-specimen__meta">
                    <code className="rv-specimen__type">{mol.componentType} · direct</code>
                  </div>
                </figure>
              </ReviewAnnotatable>
            ) : (
              <div key={mol.captureId} className="rv-specimen-cell">
                <SpecimenCard
                  rvId={detId(`mol-rv/${mol.captureId}`)}
                  kind="component"
                  captureId={mol.captureId}
                  caption={mol.name}
                  node={moleculeNode(mol)}
                  variant={mol.name}
                  naturalWidth={COMPOSED_NATURAL_WIDTH}
                />
                <button
                  type="button"
                  className="rv-zoom-btn"
                  title="Inspect closely"
                  onClick={() =>
                    setZoomed({
                      rvId: detId(`mol-rv/${mol.captureId}`),
                      kind: 'component',
                      captureId: mol.captureId,
                      caption: mol.name,
                      node: moleculeNode(mol),
                      variant: mol.name,
                      naturalWidth: COMPOSED_NATURAL_WIDTH,
                    })
                  }
                >
                  ⤢ Zoom
                </button>
              </div>
            ),
          )}
        </div>
      </section>

      {/* ── S2.2 — live screens ───────────────────────────────────────────────
          The tabs SWAP the rendered screen (only the active screen is mounted, not the
          whole stacked list — the old bug was rendering all screens at once so a tab only
          moved the active ring). The selected screen is laid out at its referenceWidthPx
          and scaled DOWN to fit the pane; Zoom opens the modal for close inspection. The
          reference popup tracks the SAME activeScreenId. */}
      <section className="rv-section" aria-label="Screens">
        <h3 className="rv-section-title">S2.2 · Screens</h3>
        <div className="rv-screen-tabs" role="tablist">
          {screensCatalog.screens.map((screen) => (
            <button
              key={screen.id}
              type="button"
              role="tab"
              aria-selected={screen.id === activeScreenId}
              className={
                screen.id === activeScreenId ? 'rv-screen-tab rv-screen-tab-on' : 'rv-screen-tab'
              }
              onClick={() => setActiveScreenId(screen.id)}
            >
              {screen.name}
            </button>
          ))}
        </div>

        {activeScreen ? (
          <div className="rv-screen-list">
            <ReviewAnnotatable
              key={activeScreen.id}
              rvId={screenRvIds[activeScreen.id]}
              kind="screen"
              captureId={`screen/${activeScreen.id}`}
              variant={`${activeScreen.referenceWidthPx}px`}
            >
              <figure className="rv-screen rv-screen-active">
                <figcaption className="rv-screen-cap">
                  <span className="rv-screen-name">{activeScreen.name}</span>
                  <code className="rv-screen-meta">
                    {activeScreen.id} · {activeScreen.referenceWidthPx}px
                  </code>
                  <button
                    type="button"
                    className="rv-zoom-btn rv-zoom-btn-inline"
                    title="Inspect closely"
                    onClick={() =>
                      setZoomed({
                        rvId: `${screenRvIds[activeScreen.id]}-render`,
                        kind: 'screen',
                        captureId: `screen/${activeScreen.id}`,
                        caption: activeScreen.name,
                        node: activeScreen.node,
                        variant: `${activeScreen.referenceWidthPx}px`,
                        naturalWidth: activeScreen.referenceWidthPx,
                      })
                    }
                  >
                    ⤢ Zoom
                  </button>
                </figcaption>
                {/* Scale-to-fit frame — the live render is pinned to its reference width
                    then transform-scaled DOWN to fit the pane, so nothing is condensed. */}
                <div className="rv-screen-scroll">
                  <SpecimenCard
                    rvId={`${screenRvIds[activeScreen.id]}-render`}
                    kind="screen"
                    captureId={`screen/${activeScreen.id}`}
                    caption={activeScreen.name}
                    node={activeScreen.node}
                    variant={`${activeScreen.referenceWidthPx}px`}
                    naturalWidth={activeScreen.referenceWidthPx}
                    bare
                  />
                </div>
              </figure>
            </ReviewAnnotatable>
          </div>
        ) : null}
      </section>

      {/* The floating reference popup tracks the screen currently in view. */}
      <ReferencePopup screenId={activeScreenId} mode={mode} />

      {/* Click-to-zoom modal (Radix Dialog): inspect any Stage-2 specimen larger / at a
          chosen scale, still annotatable inside. */}
      <ScreenModal
        specimen={zoomed}
        stage="screens"
        mode={mode}
        onClose={() => setZoomed(null)}
      />
    </div>
  );
}
