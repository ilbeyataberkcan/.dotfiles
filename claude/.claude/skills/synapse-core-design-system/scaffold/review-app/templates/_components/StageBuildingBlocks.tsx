'use client';

/*
 * StageBuildingBlocks — Stage 2 of the review surface ("Building Blocks").
 *
 * The foundational MOLECULES that REUSE a default cve-component, grouped into panes
 * (Form inputs / Selection & lists / Status & feedback / Data display / Navigation).
 * Each block renders LIVE through SpecimenCard (renderComponentNode) — the same engine
 * path the app uses — at intrinsic 1x like the Stage-1 atoms (no naturalWidth).
 *
 * Mirrors StageFoundations' atom-card section: a per-group rv-section, each specimen a
 * SpecimenCard with deterministic ids (detId, never crypto.randomUUID) so SSR markup
 * matches the first client render. Stage-3 screen plumbing (ScreenModal, ReferencePopup,
 * scale-to-fit) is intentionally dropped — these are 1x atoms-of-molecules.
 */

import { useState } from 'react';
import { useReviewMode } from './useReviewMode';
import { buildingBlocksCatalog } from './catalog-buildingblocks';
import type { SpecimenDescriptor } from './catalog-foundations';
import { detId } from './det-id';
import { SpecimenCard } from './SpecimenCard';
import { ScreenModal, type ScreenModalSpecimen } from './ScreenModal';

// ScreenModalSpecimen.naturalWidth is REQUIRED; a 1x atom (no intrinsicWidth) zooms at this default.
const ZOOM_DEFAULT_WIDTH = 420;

/* type:'standard' node SpecimenCard renders from a recipe specimen. The node id is
 * DETERMINISTIC (detId of the captureId, `bb/` prefix so it never collides with the
 * Stage-1 `atom/` ids) — the engine stamps id={node.id} identically server + client. */
function specimenNode(spec: SpecimenDescriptor) {
  return {
    id: detId(`node:bb/${spec.captureId}`),
    parentId: null,
    type: 'standard' as const,
    componentType: spec.componentType,
    props: spec.props,
    children: [],
  } as unknown as Parameters<typeof SpecimenCard>[0]['node'];
}

export function StageBuildingBlocks() {
  const { mode } = useReviewMode();
  // Click-to-zoom modal — inspect any block at a chosen scale, still annotatable. null === closed.
  const [zoomed, setZoomed] = useState<ScreenModalSpecimen | null>(null);

  return (
    <div className="rv-stage rv-stage-buildingblocks">
      <header className="rv-stage-head">
        <h2 className="rv-stage-title">Stage 2 · Building Blocks</h2>
        <p className="rv-stage-sub">
          Foundational molecules — inputs, selection, status, data display, and nav — painted
          in the live <strong>{mode}</strong> mode through the render engine.
        </p>
      </header>

      {buildingBlocksCatalog.groups.map((group) => (
        <section key={group.title} className="rv-section" aria-label={group.title}>
          <h3 className="rv-section-title">{group.title}</h3>
          {/* Full-width groups (siteHeader / rows / tables) route to the single-column grid
              so the wide render conforms to its own ratio instead of sharing a narrow cell. */}
          <div
            className={
              group.fullWidth ? 'rv-specimen-grid rv-specimen-grid--full' : 'rv-specimen-grid'
            }
          >
            {group.blocks.map((spec) => {
              const rvId = detId(`bb-rv/${spec.captureId}`);
              const node = specimenNode(spec);
              return (
                <div key={spec.captureId} className="rv-specimen-cell">
                  <SpecimenCard
                    rvId={rvId}
                    kind="component"
                    captureId={spec.captureId}
                    caption={spec.name}
                    node={node}
                    variant={spec.name}
                    naturalWidth={spec.intrinsicWidth ?? null}
                    force={spec.force}
                  />
                  <button
                    type="button"
                    className="rv-zoom-btn"
                    title="Inspect closely"
                    onClick={() =>
                      setZoomed({
                        rvId,
                        kind: 'component',
                        captureId: spec.captureId,
                        caption: spec.name,
                        node,
                        variant: spec.name,
                        naturalWidth: spec.intrinsicWidth ?? ZOOM_DEFAULT_WIDTH,
                      })
                    }
                  >
                    ⤢ Zoom
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Click-to-zoom modal (Radix Dialog): inspect any block larger / at a chosen scale.
          Building Blocks files annotations under the 'screens' StageState (ReviewShell Fork G). */}
      <ScreenModal specimen={zoomed} stage="screens" mode={mode} onClose={() => setZoomed(null)} />
    </div>
  );
}
