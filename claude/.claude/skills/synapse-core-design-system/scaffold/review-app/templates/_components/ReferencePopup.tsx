'use client';

/*
 * ReferencePopup — the floating, draggable mockup reference.
 *
 * Holds the best-fit reference screenshot for the screen currently in view, so
 * the operator judges composition against the actual mockup without leaving the
 * dev server. Collapses to a CORNER CHIP (a tiny ▣ thumbnail) so it never blocks
 * the live render; clicking the chip expands it back to the floating panel.
 *
 * The screen-id → image-filename map is supplied by the scaffold's reference
 * step (the recipe-named PNGs do not exist on disk; the scaffold maps each screen
 * id to the closest available shot, or to `null` for "reference unavailable").
 * In dark mode a single dark-parity reference is offered for any screen.
 *
 * Images are served from the copied reference dir under the route; the scaffold
 * substitutes the public-URL base for `__REFERENCE_BASE__`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { REFERENCE_MAP, DARK_PARITY_REFERENCE } from './reference-map';

const REFERENCE_BASE = '__REFERENCE_BASE__'; // e.g. '/review/reference' — scaffold-substituted

export interface ReferencePopupProps {
  /** The screen-recipe id whose reference image to show. */
  screenId: string;
  /** Active theme mode — switches to the dark-parity reference when dark. */
  mode: 'light' | 'dark';
}

interface Point {
  x: number;
  y: number;
}

export function ReferencePopup({ screenId, mode }: ReferencePopupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [pos, setPos] = useState<Point>({ x: 24, y: 96 });
  const dragRef = useRef<{ origin: Point; start: Point } | null>(null);

  // Resolve the image: dark mode shows the single dark-parity shot; otherwise the
  // per-screen best-fit. `null` filename → "reference unavailable" for that screen.
  const fileName =
    mode === 'dark'
      ? DARK_PARITY_REFERENCE
      : (REFERENCE_MAP[screenId] ?? null);
  const src = fileName ? `${REFERENCE_BASE}/${fileName}` : null;

  const onPointerMove = useCallback((e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setPos({
      x: Math.max(0, d.origin.x + (e.clientX - d.start.x)),
      y: Math.max(0, d.origin.y + (e.clientY - d.start.y)),
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const startDrag = (e: React.PointerEvent) => {
    dragRef.current = { origin: { ...pos }, start: { x: e.clientX, y: e.clientY } };
  };

  // Collapsed: a fixed corner chip (never moves) so it can always be found.
  if (collapsed) {
    return (
      <button
        type="button"
        className="rv-ref-chip"
        title="Show reference mockup"
        onClick={() => setCollapsed(false)}
      >
        <span aria-hidden className="rv-ref-chip-icon">▣</span>
        <span className="rv-ref-chip-label">Reference</span>
      </button>
    );
  }

  return (
    <aside
      className="rv-ref-popup"
      style={{ left: pos.x, top: pos.y }}
      aria-label="Reference mockup"
    >
      <header className="rv-ref-head" onPointerDown={startDrag}>
        <span className="rv-ref-grip" aria-hidden>⠿</span>
        <span className="rv-ref-title">{screenId || 'reference'}</span>
        <span className="rv-ref-mode">{mode}</span>
        <button
          type="button"
          className="rv-ref-collapse"
          title="Collapse to corner"
          onClick={() => setCollapsed(true)}
        >
          –
        </button>
      </header>
      <div className="rv-ref-body">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- dev-only review surface
          <img className="rv-ref-img" src={src} alt={`Reference: ${screenId}`} draggable={false} />
        ) : (
          <div className="rv-ref-empty">
            <strong>reference unavailable</strong>
            <span>No faithful mockup exists for “{screenId}”.</span>
          </div>
        )}
      </div>
    </aside>
  );
}
