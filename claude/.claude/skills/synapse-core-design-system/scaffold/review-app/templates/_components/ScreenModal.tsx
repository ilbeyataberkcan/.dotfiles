'use client';

/*
 * ScreenModal — the click-to-zoom inspector for a Stage-2 specimen.
 *
 * Stage-2 specimens (composed blocks + full screens) are laid out at their NATURAL
 * design width and SCALED DOWN to fit their card column (devtools-style) so nothing is
 * condensed/overlapping. The card render is great for the grid but small; clicking a
 * specimen opens THIS modal to inspect it closely — like opening a devtools responsive
 * frame at a chosen scale.
 *
 * It is a Radix Dialog (@radix-ui/react-dialog, available via cve-components' deps):
 *   - portaled INTO `.rv-shell` (not <body>) so it inherits the LIVE theme tokens and
 *     flips with the ☀/☾ mode, exactly like AnnotationPopover. No second
 *     provider; the modal paints from the same [data-theme] cascade.
 *   - a SCALE picker — 1x · Fit · device widths (390 / 768 / 1280) — drives the inner
 *     SpecimenCard's `forceScale`/`naturalWidth`. "Fit" lets the card measure the modal
 *     body and scale itself; the fixed factors pin an exact zoom.
 *   - STILL ANNOTATABLE inside: it renders the SAME SpecimenCard (its `data-rv-*`
 *     boundaries intact) over its OWN AnnotationOverlay scoped to the modal body, so the
 *     operator can pin notes on the zoomed specimen without leaving the modal.
 *
 * SEPARATION = ELEVATION: the overlay scrim + the dialog panel lift via shade + shadow,
 * never a resting hairline — matching the rest of the review chrome.
 */

import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { SpecimenCard, type SpecimenCardProps } from './SpecimenCard';
import { AnnotationOverlay } from './AnnotationOverlay';
import { detId } from './det-id';
import type { ReviewStage, ReviewMode } from './feedback-store';

/** What the modal needs to re-render the specimen at zoom — a SpecimenCard descriptor. */
export interface ScreenModalSpecimen {
  rvId: string;
  kind: SpecimenCardProps['kind'];
  captureId: string;
  caption: string;
  node: SpecimenCardProps['node'];
  variant?: string | null;
  /** Natural design width to lay the render out at before scaling. */
  naturalWidth: number;
}

export interface ScreenModalProps {
  /** The specimen to inspect, or null when the modal is closed. */
  specimen: ScreenModalSpecimen | null;
  /** Stage to file any in-modal annotations under. */
  stage: ReviewStage;
  /** Active theme mode — stamped on in-modal pins; the modal flips with it. */
  mode: ReviewMode;
  onClose: () => void;
}

/** The scale options. `null` value === "Fit" (let the card measure the modal body). */
const SCALE_OPTIONS: Array<{ id: string; label: string; scale: number | null; width?: number }> = [
  { id: 'fit', label: 'Fit', scale: null },
  { id: '1x', label: '1×', scale: 1 },
  { id: 'mobile', label: '390', scale: null, width: 390 },
  { id: 'tablet', label: '768', scale: null, width: 768 },
  { id: 'desktop', label: '1280', scale: null, width: 1280 },
];

export function ScreenModal({ specimen, stage, mode, onClose }: ScreenModalProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [optionId, setOptionId] = useState('fit');

  // Portal into `.rv-shell` so the modal inherits the live theme tokens.
  useEffect(() => {
    setContainer(document.querySelector<HTMLElement>('.rv-shell'));
  }, []);

  // Reset the scale picker each time a new specimen opens.
  useEffect(() => {
    if (specimen) setOptionId('fit');
  }, [specimen?.rvId]);

  const option = useMemo(
    () => SCALE_OPTIONS.find((o) => o.id === optionId) ?? SCALE_OPTIONS[0],
    [optionId],
  );

  if (!specimen) return null;

  // A device-width option renders at THAT width (then Fit-scales it to the body); the
  // 1× / Fit options use the specimen's own natural width.
  const layoutWidth = option.width ?? specimen.naturalWidth;
  // A fresh rvId for the in-modal instance so its pins don't collide with the card's.
  const modalRvId = detId(`modal/${specimen.rvId}`);

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="rv-modal__scrim" />
        <Dialog.Content
          className="rv-modal"
          aria-label={`Inspect ${specimen.caption}`}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <header className="rv-modal__head">
            <div className="rv-modal__id">
              <span className="rv-modal__name">{specimen.caption}</span>
              <code className="rv-modal__meta">
                {specimen.captureId} · {specimen.naturalWidth}px
              </code>
            </div>
            <div className="rv-modal__scales" role="group" aria-label="zoom">
              {SCALE_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="rv-modal__scale"
                  aria-pressed={o.id === optionId}
                  onClick={() => setOptionId(o.id)}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <Dialog.Close asChild>
              <button type="button" className="rv-modal__close" aria-label="Close">
                ×
              </button>
            </Dialog.Close>
          </header>

          {/* The zoom body scrolls both axes; the specimen scales to fit (or to the
              pinned factor) inside it, and its OWN overlay keeps it annotatable. */}
          <div className="rv-modal__body rv-stage-pane">
            <SpecimenCard
              key={`${modalRvId}-${option.id}`}
              rvId={modalRvId}
              kind={specimen.kind}
              captureId={specimen.captureId}
              caption={specimen.caption}
              node={specimen.node}
              variant={specimen.variant ?? null}
              naturalWidth={layoutWidth}
              forceScale={option.scale}
              bare
            />
            <AnnotationOverlay stage={stage} mode={mode} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
