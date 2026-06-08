'use client';

/*
 * AnnotationOverlay — the positioned DOM pin layer (no <canvas>, no postMessage).
 *
 * Sits over the live stage tree as an absolutely-positioned layer and:
 *   - tracks the [data-rv-id] element UNDER THE CURSOR (live hover) and draws an
 *     outline + a label naming it (kind · level · componentType/variant) so the
 *     operator SEES exactly what a click will target before clicking — DIRECT, not
 *     positional selection (Fix 3);
 *   - resolves any click to that same INNERMOST `[data-rv-id]` via
 *     `event.target.closest('[data-rv-id]')`, reads the element's `data-rv-*` to build
 *     the annotation `target`, and computes a normalized `{xPct,yPct}` of the element
 *     box from the click point;
 *   - opens <AnnotationPopover> ANCHORED to the clicked element (a Radix anchor box
 *     measured over the target rect) — the popover is collision-aware (auto flip/shift
 *     to stay in the viewport), so it never overflows the bottom of the screen (Fix 1);
 *   - renders each existing pin as a NUMBERED DOT re-anchored every frame by
 *     re-resolving its `selector` ([data-rv-id='…']) and re-measuring the element box —
 *     so pins survive resize / re-render / mode flip;
 *   - draws the same outline + label on the hovered/active pin;
 *   - supports an OPTIONAL drag-box region (markKind:'box') as the only extension
 *     beyond click-pin.
 *
 * TWO LEVELS (Fix 3): each specimen carries a 'card' boundary (the whole preview card
 * = "overall change to this component") AND an inner 'part' boundary (the live render =
 * "a specific part"). Because we resolve the INNERMOST `[data-rv-id]`, hovering the
 * card chrome (caption / meta / padding) highlights the whole card and hovering the
 * rendered element highlights that part — the label says which. Picking the level is
 * just a matter of WHERE you hover.
 *
 * CLICK RESOLUTION: the overlay LAYER is `pointer-events:none` (set in review.css) so
 * clicks AND moves pass THROUGH it to the live specimens beneath — which are the
 * elements carrying `[data-rv-id]`. The hover / click / drag handlers are therefore
 * bound to the STAGE PANE (the overlay's parentElement, whose descendants are the
 * specimens), NOT to the overlay layer. `event.target` is then a real specimen
 * descendant and `closest('[data-rv-id]')` resolves the annotatable box. Only the PINS
 * and the popover opt back into pointer events (review.css) so they stay interactive.
 *
 * We render in-process, so we borrow open-design's TARGET-DERIVATION logic, not its
 * cross-frame transport. The pin geometry is normalized (0–100% of the element box) so
 * it stays glued across the responsive scale.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  useReviewFeedback,
  addAnnotation,
  updateAnnotation,
  requestEditAnnotation,
  useEditRequest,
  clearEditRequest,
  type ReviewAnnotation,
  type ReviewStage,
  type ReviewMode,
} from './feedback-store';
import { AnnotationPopover, type AnnotationDraft } from './AnnotationPopover';
import type { ReviewAnnotatableKind, ReviewAnnotatableLevel } from './ReviewAnnotatable';

export interface AnnotationOverlayProps {
  /** Which stage's pins to show / new pins to file under. */
  stage: ReviewStage;
  /** The ACTIVE theme mode — stamped on each new pin at placement. */
  mode: ReviewMode;
  /** When false the overlay is transparent to clicks (operator is browsing, not annotating). */
  active?: boolean;
}

/** Resolved geometry of a live pin (re-measured each frame from the stage). All
 *  coordinates are LAYER-LOCAL (relative to the overlay box) so render stays pure —
 *  no getBoundingClientRect reads during render. `box` is the target element's
 *  rectangle in the same layer-local space for the outline highlight. */
interface PinBox {
  anno: ReviewAnnotation;
  /** the numbered-dot position (anchor point within the target box). */
  left: number;
  top: number;
  /** the target element box for the outline highlight, or null if unresolved. */
  box: { left: number; top: number; width: number; height: number } | null;
}

/** A layer-local rectangle for the live HOVER outline + its target metadata/label. */
interface HoverBox {
  left: number;
  top: number;
  width: number;
  height: number;
  kind: ReviewAnnotatableKind;
  level: ReviewAnnotatableLevel;
  label: string;
}

interface PendingPin {
  /** Layer-local rect of the clicked element — the Radix popover anchor box. */
  anchorBox: { left: number; top: number; width: number; height: number };
  target: ReviewAnnotation['target'];
  anchor: { xPct: number; yPct: number };
  markKind: 'click' | 'box';
}

/** An EDIT session opened from a pin click or the sidebar pencil: the existing pin's
 *  id + its seeded draft, anchored to the pin's re-measured box (or viewport-centered
 *  when the target isn't mounted / the selector doesn't resolve). */
interface EditingPin {
  id: string;
  anchorBox: { left: number; top: number; width: number; height: number };
  target: ReviewAnnotation['target'];
  initial: Partial<AnnotationDraft>;
}

/** The root selector that anchors a path: prefer the STABLE `data-rv-capture-id`
 *  (survives re-render), fall back to the per-render `data-rv-id` only if absent. */
function rootSelector(root: HTMLElement): string {
  const captureId = root.getAttribute('data-rv-capture-id');
  if (captureId) return `[data-rv-capture-id='${captureId}']`;
  return `[data-rv-id='${root.getAttribute('data-rv-id') ?? ''}']`;
}

/**
 * Build a selector that uniquely resolves `el` UNDER `root`. Walk from `el` up to
 * (excluding) `root`, prepending `tag:nth-of-type(k)` segments (k = 1-based index among
 * same-tag siblings), prefixed with the root's stable selector. Then VERIFY the path
 * resolves to exactly one element in the document; if not, fall back to the element's
 * own `id` (`#…`) when present. Dependency-free.
 */
function cssPathWithin(el: HTMLElement, root: HTMLElement): string {
  const base = rootSelector(root);
  if (el === root) return base;

  const segments: string[] = [];
  let node: HTMLElement = el;
  while (node !== root) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent) break;
    // 1-based index among same-tag siblings (mirrors :nth-of-type semantics).
    const siblings: Element[] = Array.from(parent.children);
    let k = 0;
    for (const sib of siblings) {
      if (sib.tagName === node.tagName) {
        k++;
        if (sib === node) break;
      }
    }
    segments.unshift(`${node.tagName.toLowerCase()}:nth-of-type(${k})`);
    node = parent;
  }

  const sel = `${base} ${segments.join(' > ')}`.trim();
  // Uniqueness check: the structural path must resolve to exactly the clicked element.
  try {
    const matches = document.querySelectorAll(sel);
    if (matches.length === 1 && matches[0] === el) return sel;
    if (el.id) return `#${CSS.escape(el.id)}`;
  } catch {
    if (el.id) return `#${CSS.escape(el.id)}`;
  }
  return sel;
}

/** Read the semantic `data-rv-*` bag off the stable ROOT plus the PRECISE element into
 *  an annotation target. `el` is the actual clicked element; `root` is its nearest
 *  `[data-rv-capture-id]` ancestor (the stable anchor). */
function targetFromElement(el: HTMLElement, root: HTMLElement): ReviewAnnotation['target'] {
  return {
    kind: (root.getAttribute('data-rv-kind') as ReviewAnnotatableKind) ?? 'component',
    captureId: root.getAttribute('data-rv-capture-id') ?? '',
    componentType: root.getAttribute('data-rv-component-type'),
    variant: root.getAttribute('data-rv-variant'),
    token: root.getAttribute('data-rv-token'),
    level: (root.getAttribute('data-rv-level') as ReviewAnnotatableLevel) ?? 'card',
    selector: cssPathWithin(el, root),
    elementTag: el.tagName.toLowerCase(),
    elementId: el.id || null,
  };
}

/** The human label shown on the hover/pin outline — the element's own tag plus the most
 *  specific semantic name from its stable root. `el` is the actual hovered element. */
function labelForElement(el: HTMLElement, root: HTMLElement): string {
  const context =
    root.getAttribute('data-rv-token') ??
    root.getAttribute('data-rv-variant') ??
    root.getAttribute('data-rv-component-type') ??
    root.getAttribute('data-rv-capture-id') ??
    'element';
  const tag = el.tagName.toLowerCase();
  return el === root ? context : `${tag} · ${context}`;
}

export function AnnotationOverlay({ stage, mode, active = true }: AnnotationOverlayProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [pinBoxes, setPinBoxes] = useState<PinBox[]>([]);
  const [pending, setPending] = useState<PendingPin | null>(null);
  const [editing, setEditing] = useState<EditingPin | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  /** The [data-rv-id] element currently under the cursor + its layer-local box. */
  const [hoverBox, setHoverBox] = useState<HoverBox | null>(null);
  const dragStart = useRef<{ x: number; y: number; el: HTMLElement } | null>(null);

  // Subscribe to the live store snapshot (same hook ReviewShell/FeedbackPanel use) and
  // derive this stage's pins from it. A delete/add in the panel re-renders here at once,
  // repainting the pins (no mount-only one-shot load — that left deleted pins painted).
  const feedback = useReviewFeedback();
  // Memoize so the derived array keeps a STABLE ref across renders (the store snapshot
  // only changes on a real add/delete). Without this, a fresh array every render makes
  // `reanchor` new every render → its useLayoutEffect re-runs → setPinBoxes → infinite loop.
  const annotations = useMemo(
    () => feedback.annotations.filter((a) => a.stage === stage),
    [feedback.annotations, stage],
  );

  // Re-anchor every pin: re-resolve its selector + re-measure the element box.
  // Runs on layout, and on every resize/scroll so pins stay glued.
  const reanchor = useCallback(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const layerRect = layer.getBoundingClientRect();
    const boxes: PinBox[] = annotations.map((anno) => {
      const el = document.querySelector<HTMLElement>(anno.target.selector);
      if (!el) return { anno, left: -9999, top: -9999, box: null };
      const r = el.getBoundingClientRect();
      // Layer-local box of the target element (for the outline highlight).
      const box = {
        left: r.left - layerRect.left,
        top: r.top - layerRect.top,
        width: r.width,
        height: r.height,
      };
      // The numbered-dot position = the normalized anchor point inside that box.
      const left = box.left + (anno.anchor.xPct / 100) * r.width;
      const top = box.top + (anno.anchor.yPct / 100) * r.height;
      return { anno, left, top, box };
    });
    setPinBoxes(boxes);
  }, [annotations]);

  useLayoutEffect(() => {
    reanchor();
    const ro = new ResizeObserver(reanchor);
    if (layerRef.current?.parentElement) ro.observe(layerRef.current.parentElement);
    window.addEventListener('resize', reanchor);
    window.addEventListener('scroll', reanchor, true);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', reanchor);
      window.removeEventListener('scroll', reanchor, true);
    };
  }, [reanchor]);

  // Layer-local rect of an element (for the hover outline + the Radix anchor box).
  const layerLocalRect = useCallback((el: HTMLElement) => {
    const layer = layerRef.current;
    if (!layer) return null;
    const layerRect = layer.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {
      left: r.left - layerRect.left,
      top: r.top - layerRect.top,
      width: r.width,
      height: r.height,
    };
  }, []);

  // A small layer-local box centered in the overlay — the fallback anchor when an
  // edited annotation's target element isn't mounted (selector doesn't resolve), so the
  // pre-filled popover still opens somewhere sensible instead of off-screen.
  const centeredBox = useCallback(() => {
    const layer = layerRef.current;
    const r = layer?.getBoundingClientRect();
    const w = r?.width ?? window.innerWidth;
    const h = r?.height ?? window.innerHeight;
    return { left: w / 2, top: h / 2, width: 0, height: 0 };
  }, []);

  // Subscribe to the shared edit channel (store contract). A request names an annotation
  // id; if it belongs to THIS stage, open the popover PRE-FILLED from that pin, anchored
  // to its re-measured box (centered fallback when the selector doesn't resolve). The pin
  // click and the sidebar pencil both write this channel via requestEditAnnotation(id).
  const editId = useEditRequest();
  useEffect(() => {
    if (!editId) return;
    const anno = annotations.find((a) => a.id === editId);
    if (!anno) return; // not this stage's pin — leave the request for the owning overlay
    const el = document.querySelector<HTMLElement>(anno.target.selector);
    const box = (el && layerLocalRect(el)) || centeredBox();
    setPending(null);
    setHoverBox(null);
    setEditing({
      id: anno.id,
      anchorBox: box,
      target: anno.target,
      initial: { note: anno.note, status: anno.status, axis: anno.axis },
    });
    clearEditRequest(); // consumed — don't re-fire on the next render
  }, [editId, annotations, layerLocalRect, centeredBox]);

  // Compute normalized {xPct,yPct} of the click point within the element box.
  const normalize = (el: HTMLElement, clientX: number, clientY: number) => {
    const r = el.getBoundingClientRect();
    const xPct = r.width ? ((clientX - r.left) / r.width) * 100 : 0;
    const yPct = r.height ? ((clientY - r.top) / r.height) * 100 : 0;
    return {
      xPct: Math.max(0, Math.min(100, Number(xPct.toFixed(2)))),
      yPct: Math.max(0, Math.min(100, Number(yPct.toFixed(2)))),
    };
  };

  // Live HOVER: track the innermost [data-rv-id] under the cursor and draw its outline
  // + label so selection is DIRECT (you see what you'll target before clicking). Bound
  // to the stage pane (the overlay is pointer-events:none). Cleared when the cursor is
  // off any annotatable or while the popover is open.
  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!active || pending || editing) return;
      // Resolve the ACTUAL element under the cursor, then its STABLE root (nearest
      // [data-rv-capture-id]). Outline hugs the actual element — selection is DIRECT.
      const el = e.target as HTMLElement;
      const root = el.closest<HTMLElement>('[data-rv-capture-id]');
      if (!root) {
        setHoverBox((cur) => (cur ? null : cur));
        return;
      }
      const box = layerLocalRect(el);
      if (!box) return;
      setHoverBox({
        ...box,
        kind: (root.getAttribute('data-rv-kind') as ReviewAnnotatableKind) ?? 'component',
        level: (root.getAttribute('data-rv-level') as ReviewAnnotatableLevel) ?? 'card',
        label: labelForElement(el, root),
      });
    },
    [active, pending, editing, layerLocalRect],
  );
  const onPointerLeavePane = useCallback(() => setHoverBox(null), []);

  // Click-to-place: resolve target, compute anchor, open the popover ANCHORED to the
  // clicked element's box. Bound to the STAGE PANE (not the transparent overlay), so
  // `e.target` is a real specimen and `closest('[data-rv-id]')` resolves the innermost
  // annotatable box. A click on a pin (which stops propagation) or on chrome with no
  // [data-rv-id] ancestor is a no-op.
  const onLayerClick = useCallback(
    (e: MouseEvent) => {
      if (!active || pending || editing) return;
      // Target the ACTUAL clicked element; anchor it to its stable [data-rv-capture-id]
      // root via a structural path. A click with no such root (or a pin) is a no-op.
      const el = e.target as HTMLElement;
      const root = el.closest<HTMLElement>('[data-rv-capture-id]');
      if (!root) return;
      const anchorBox = layerLocalRect(el);
      if (!anchorBox) return;
      const anchor = normalize(el, e.clientX, e.clientY);
      setHoverBox(null);
      setPending({
        anchorBox,
        target: targetFromElement(el, root),
        anchor,
        markKind: 'click',
      });
    },
    [active, pending, editing, layerLocalRect],
  );

  // Optional drag-box (markKind:'box'): pointerdown→move past a threshold opens a box.
  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (!active || pending || editing) return;
      // Store the ACTUAL element; a no-root element is not a drag origin.
      const el = e.target as HTMLElement;
      if (!el.closest('[data-rv-capture-id]')) return;
      dragStart.current = { x: e.clientX, y: e.clientY, el };
    },
    [active, pending, editing],
  );
  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      const start = dragStart.current;
      dragStart.current = null;
      if (!active || !start || pending || editing) return;
      const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      if (dist < 8) return; // below threshold → handled as a click, not a box
      const root = start.el.closest<HTMLElement>('[data-rv-capture-id]');
      if (!root) return;
      const anchorBox = layerLocalRect(start.el);
      if (!anchorBox) return;
      // Box anchor = its top-left, normalized to the target element.
      const x0 = Math.min(start.x, e.clientX);
      const y0 = Math.min(start.y, e.clientY);
      const anchor = normalize(start.el, x0, y0);
      setHoverBox(null);
      setPending({
        anchorBox,
        target: targetFromElement(start.el, root),
        anchor,
        markKind: 'box',
      });
    },
    [active, pending, editing, layerLocalRect],
  );

  // Bind the hover/place/drag handlers to the STAGE PANE (the overlay's parentElement),
  // because the overlay layer is pointer-events:none and never receives the event — the
  // specimens beneath do. The pane is the element whose descendants carry [data-rv-id];
  // binding here is what makes closest('[data-rv-id]') resolve.
  useEffect(() => {
    const pane = layerRef.current?.parentElement;
    if (!pane || !active) return;
    pane.addEventListener('click', onLayerClick);
    pane.addEventListener('pointermove', onPointerMove);
    pane.addEventListener('pointerleave', onPointerLeavePane);
    pane.addEventListener('pointerdown', onPointerDown);
    pane.addEventListener('pointerup', onPointerUp);
    return () => {
      pane.removeEventListener('click', onLayerClick);
      pane.removeEventListener('pointermove', onPointerMove);
      pane.removeEventListener('pointerleave', onPointerLeavePane);
      pane.removeEventListener('pointerdown', onPointerDown);
      pane.removeEventListener('pointerup', onPointerUp);
    };
  }, [active, onLayerClick, onPointerMove, onPointerLeavePane, onPointerDown, onPointerUp]);

  // One save path for both sessions: an open EDIT patches the existing pin, otherwise a
  // pending CREATE mints a new one. No manual refresh — the commit re-renders us via
  // useReviewFeedback → annotations re-derive → reanchor repaints.
  const onPopoverSave = (draft: AnnotationDraft) => {
    if (editing) {
      updateAnnotation(editing.id, { note: draft.note, status: draft.status, axis: draft.axis });
      setEditing(null);
      return;
    }
    if (!pending) return;
    addAnnotation({
      stage,
      mode,
      target: pending.target,
      anchor: pending.anchor,
      markKind: pending.markKind,
      note: draft.note,
      status: draft.status,
      axis: draft.axis,
    });
    setPending(null);
  };

  // The active outline = the pending click's target, else the live hover, else the
  // hovered pin's target. Rendered once so we never double-draw.
  const pendingOutline =
    pending && pending.target
      ? {
          ...pending.anchorBox,
          kind: pending.target.kind,
          level: pending.target.level,
          // Prefer the precise element tag; fall back to the semantic context name.
          label:
            pending.target.elementTag ??
            pending.target.token ??
            pending.target.variant ??
            pending.target.componentType ??
            pending.target.captureId,
        }
      : null;
  const hoverOutline = pendingOutline ?? hoverBox;

  return (
    <div
      ref={layerRef}
      className="rv-overlay"
      data-active={active}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        // The LAYER is always transparent to clicks (review.css also sets this) so they
        // pass THROUGH to the specimens beneath; only the pins + popover opt back in.
        // Hover/place/drag is handled on the stage pane via native listeners (effect).
        pointerEvents: 'none',
      }}
    >
      {/* Live HOVER outline + label naming the target (kind · level · name). Selection
          is DIRECT — the operator sees what a click will target before clicking. */}
      {hoverOutline ? (
        <div
          className="rv-overlay__hover"
          data-level={hoverOutline.level}
          aria-hidden
          style={{
            position: 'absolute',
            left: hoverOutline.left,
            top: hoverOutline.top,
            width: hoverOutline.width,
            height: hoverOutline.height,
            pointerEvents: 'none',
          }}
        >
          <span className="rv-overlay__hover-label">
            <span className="rv-overlay__hover-level">
              {hoverOutline.level === 'card' ? 'whole component' : 'a part'}
            </span>
            <span className="rv-overlay__hover-kind">{hoverOutline.kind}</span>
            <span className="rv-overlay__hover-name">{hoverOutline.label}</span>
          </span>
        </div>
      ) : null}

      {/* Outline + label on the hovered/active pin (existing annotations).
          `box` is already layer-local (cached in reanchor) — no layout read here. */}
      {pinBoxes.map((pb) =>
        pb.box && hoveredId === pb.anno.id ? (
          <div
            key={`hl-${pb.anno.id}`}
            className="rv-overlay__hover"
            data-level={pb.anno.target.level ?? 'card'}
            aria-hidden
            style={{
              position: 'absolute',
              left: pb.box.left,
              top: pb.box.top,
              width: pb.box.width,
              height: pb.box.height,
              pointerEvents: 'none',
            }}
          >
            <span className="rv-overlay__hover-label">
              <span className="rv-overlay__hover-name">
                {pb.anno.target.elementTag ??
                  pb.anno.target.token ??
                  pb.anno.target.variant ??
                  pb.anno.target.captureId}
              </span>
            </span>
          </div>
        ) : null,
      )}

      {/* Numbered dots. */}
      {pinBoxes.map((pb, i) => (
        <button
          key={pb.anno.id}
          type="button"
          className="rv-overlay__pin"
          data-status={pb.anno.status}
          data-mark={pb.anno.markKind}
          title={pb.anno.note}
          style={{
            position: 'absolute',
            left: pb.left,
            top: pb.top,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'auto',
          }}
          onMouseEnter={() => setHoveredId(pb.anno.id)}
          onMouseLeave={() => setHoveredId((cur) => (cur === pb.anno.id ? null : cur))}
          onClick={(e) => {
            // Stop the pane click (which would drop a NEW pin); open the pre-filled
            // editor for this pin via the shared edit channel.
            e.stopPropagation();
            requestEditAnnotation(pb.anno.id);
          }}
        >
          {i + 1}
        </button>
      ))}

      {pending && (
        <AnnotationPopover
          anchorBox={pending.anchorBox}
          target={pending.target}
          onSave={onPopoverSave}
          onCancel={() => setPending(null)}
        />
      )}

      {/* EDIT session — keyed by annotation id so the popover re-seeds per pin. */}
      {editing && (
        <AnnotationPopover
          key={editing.id}
          editing
          anchorBox={editing.anchorBox}
          target={editing.target}
          initial={editing.initial}
          onSave={onPopoverSave}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
