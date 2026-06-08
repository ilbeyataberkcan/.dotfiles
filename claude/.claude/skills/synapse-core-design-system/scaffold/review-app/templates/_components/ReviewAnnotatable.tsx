'use client';

/*
 * ReviewAnnotatable — the click-resolution boundary for the review surface.
 *
 * Wraps a single specimen / screen-child and stamps `data-rv-*` attributes onto a
 * host-owned wrapper element. The overlay resolves any click to its annotation
 * target via `event.target.closest('[data-rv-id]')` then reads these attributes —
 * no iframe, no postMessage (we render in-process). The CVE engine already stamps
 * `id={node.id}` + wraps each node in a `<CVEErrorBoundary>` inside `children`;
 * this wrapper adds the review-app identity layer ON TOP without touching it.
 *
 * `rvId` should be a `crypto.randomUUID()` so it doubles as a stable selector that
 * survives re-render (node ids are `z.string().uuid()` in the CVE schema).
 */

import { type ReactNode, useId } from 'react';

export type ReviewAnnotatableKind = 'font' | 'token' | 'component' | 'screen';

/**
 * Targeting LEVEL — the two clear granularities the operator picks between (Fix 3):
 *   'card' — the whole specimen card (the preview hosting the component): an OVERALL
 *            change to this component/specimen.
 *   'part' — an inner rendered element: a SPECIFIC PART of the component.
 * The overlay resolves the INNERMOST `[data-rv-id]` under the cursor, so hovering the
 * card chrome (caption / meta / padding) targets the 'card' boundary, and hovering the
 * live render targets the nested 'part' boundary. The label names which level is hot.
 */
export type ReviewAnnotatableLevel = 'card' | 'part';

export interface ReviewAnnotatableProps {
  /** Stable id (mint with crypto.randomUUID); doubles as the re-anchor selector. */
  rvId: string;
  /** What the target is — routes the fix loop by `target.kind`. */
  kind: ReviewAnnotatableKind;
  /** Specimen id: `componentType/recipe-name`, the font role, the token name, or the screen id. */
  captureId: string;
  /** Registry key (null for font/token targets). */
  componentType?: string | null;
  /** Recipe specimen name / Text variant / font weight / token family (null if n/a). */
  variant?: string | null;
  /** The `--color-*` / `--font-*` token this target is about (token + tokens-used-chip targets). */
  token?: string | null;
  /** Granularity this boundary represents — 'card' (whole) vs 'part' (inner). Default 'card'. */
  level?: ReviewAnnotatableLevel;
  /** The live render (already wrapped by the CVE engine in its own boundary). */
  children: ReactNode;
}

/**
 * Build the `data-rv-*` attribute bag. Exported so the overlay can read the SAME
 * key names back off a resolved element when constructing an annotation `target`.
 */
export function rvDataAttributes(props: Omit<ReviewAnnotatableProps, 'children'>) {
  const attrs: Record<string, string> = {
    'data-rv-id': props.rvId,
    'data-rv-kind': props.kind,
    'data-rv-capture-id': props.captureId,
    'data-rv-level': props.level ?? 'card',
  };
  if (props.componentType != null) attrs['data-rv-component-type'] = props.componentType;
  if (props.variant != null) attrs['data-rv-variant'] = props.variant;
  if (props.token != null) attrs['data-rv-token'] = props.token;
  return attrs;
}

export function ReviewAnnotatable({
  rvId,
  kind,
  captureId,
  componentType = null,
  variant = null,
  token = null,
  level = 'card',
  children,
}: ReviewAnnotatableProps) {
  // A stable React key for the wrapper; the rvId is what the overlay keys off.
  const reactKey = useId();
  // A real (not display:contents) box so the overlay can measure getBoundingClientRect
  // for {xPct,yPct} + the hover/highlight outline. A 'part' boundary stretches to fill
  // its host (the live render) so its box hugs the rendered element; a 'card' boundary
  // stays tight (`width:fit-content`) so it hugs the specimen, not the full row.
  return (
    <div
      key={reactKey}
      className={level === 'part' ? 'rv-annotatable rv-annotatable-part' : 'rv-annotatable rv-annotatable-card'}
      data-rv-target=""
      style={
        level === 'part'
          ? { position: 'relative', width: '100%', height: '100%' }
          : { position: 'relative', width: 'fit-content', maxWidth: '100%' }
      }
      {...rvDataAttributes({ rvId, kind, captureId, componentType, variant, token, level })}
    >
      {children}
    </div>
  );
}
