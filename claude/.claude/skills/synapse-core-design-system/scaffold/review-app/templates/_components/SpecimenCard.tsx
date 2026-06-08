'use client';

/*
 * SpecimenCard — one live specimen in the review surface.
 *
 * Renders a CVE ComponentNode through `renderComponentNode` using the EXACT call
 * shape the EXECUTION-SPEC §0b pins (two positional args; all five ctx fields):
 *
 *   renderComponentNode(node, {
 *     componentRegistry: hostRegistry,  // NOT bare componentRegistry — only the host
 *                                       // superset resolves the kebab `tmmaf-*` keys
 *     strategyRegistry,                 // real flex/grid/stack
 *     animationRegistry: {},            // empty object is valid
 *     maxTreeDepth: 25,                 // engine has NO default — caller MUST pass
 *     depth: 0,                         // ROOT starts at 0
 *   })
 *
 * CVEProvider is already mounted by ReviewShell; the card needs only the engine
 * call. The engine itself wraps each node in <CVEErrorBoundary> and renders
 * <ValidationFailedWarning> inline on a bad prop instead of crashing — we add an
 * OUTER <CVEErrorBoundary> as belt-and-suspenders so a throw in the specimen shows
 * inline rather than taking down the stage.
 *
 * The card shows: caption (recipe `name`) · the registry `componentType` label ·
 * a tokens-used chip row read off the LIVE element's computed style, reverse-matched
 * to the active-mode `--color-*`/`--font-*`/`--radius-*`/`--shadow-*` token names.
 * The token VALUES are read from <html> — the single [data-theme] source (next-themes
 * attribute mode) — keyed off the PAINTED data-theme attribute (MutationObserver), so the
 * chips re-derive in lockstep with StageFoundations' swatches on a mode flip.
 */

import {
  renderComponentNode,
  CVEErrorBoundary,
  type ComponentNode,
  type StrategyRegistryRuntime,
} from '@synapsys-integrated/cve-core';
import { strategyRegistry } from '@synapsys-integrated/cve-components/registries';
import { hostRegistry } from /*__REGISTRY_IMPORT__*/ '@/lib/registry';
import { useEffect, useRef, useState } from 'react';
import { ReviewAnnotatable, type ReviewAnnotatableKind } from './ReviewAnnotatable';
import { detId } from './det-id';

export interface TokenChip {
  /** The CSS custom-property name, e.g. `--color-accent-primary-600`. */
  name: string;
  /** The resolved value in the active mode (read off the scope element). */
  value: string;
  /** Which CSS property surfaced it, e.g. `color` / `background-color` / `border-radius`. */
  property: string;
}

export interface SpecimenCardProps {
  /** Stamped onto the annotatable wrapper; mint with crypto.randomUUID. */
  rvId: string;
  /** Annotation target kind for this specimen (`component` for atoms/molecules, `screen` for pages). */
  kind?: ReviewAnnotatableKind;
  /** Specimen id `componentType/recipe-name` (or screen id). */
  captureId: string;
  /** Caption shown above the render (the recipe `name`). */
  caption: string;
  /** The CVE node to render. Must be type:'standard' with a UUID id. */
  node: ComponentNode;
  /** Recipe specimen name / variant label, surfaced on the annotation target. */
  variant?: string | null;
  /**
   * Stage-2 SCALE-TO-FIT: the specimen's NATURAL design width (e.g. 1400 / 420 from the
   * recipe). When set, the live render is laid out at this width then CSS-transform
   * scaled DOWN to fit the card column — devtools-style — so nothing is condensed or
   * overlapping. Omit (the default) for Stage-1 atoms, which render unscaled at 1x.
   */
  naturalWidth?: number | null;
  /**
   * When set, the render scales to EXACTLY this factor (the modal's 1x / device-width
   * paths) instead of fitting the column. `naturalWidth` still pins the layout width.
   */
  forceScale?: number | null;
  /** Hide the caption + meta/chip chrome (the modal supplies its own header). */
  bare?: boolean;
  /** Replay an interactive paint the recipe pins (`hover`/`focus`); stamped as data-rv-force on the render host. */
  force?: string | null;
}

/** Token-backed CSS properties we reverse-match a chip for. */
const TOKEN_PROPERTIES = [
  'color',
  'background-color',
  'border-color',
  'border-top-color',
  'border-radius',
  'border-top-left-radius',
  'font-family',
  'font-weight',
  'box-shadow',
] as const;

/** Token name prefixes we surface as chips. */
const TOKEN_PREFIXES = ['--color-', '--font-', '--radius-', '--shadow-'] as const;

/**
 * Read every `--*` custom property + value off <html> — the SINGLE [data-theme] source
 * (next-themes attribute mode), where the live oklch values resolve. Reading the document
 * element directly (not a cached fragment ancestor) is the same source of truth StageFoundations
 * uses, so atom chips and swatches reverse-match against identical values in the active mode.
 */
function readScopeTokens(): Map<string, string> {
  const map = new Map<string, string>();
  const cs = getComputedStyle(document.documentElement);
  for (const prefix of TOKEN_PREFIXES) {
    // getComputedStyle does not enumerate custom props on every browser; probe the
    // known names the catalog already derived would be ideal, but for a self-contained
    // card we read the property list off the style declaration where available.
    for (let i = 0; i < cs.length; i += 1) {
      const prop = cs.item(i);
      if (prop.startsWith(prefix)) map.set(prop, cs.getPropertyValue(prop).trim());
    }
  }
  return map;
}

/**
 * Reverse-match the element's painted values to token names. For each token-backed
 * property we read the element's computed value and find the `--*` token on the
 * scope whose resolved value equals it. Same algorithm as S1.2, per element.
 */
function deriveTokenChips(el: HTMLElement): TokenChip[] {
  const scopeTokens = readScopeTokens();
  const chips = new Map<string, TokenChip>();
  const walk = (node: HTMLElement, depth: number) => {
    if (depth > 4) return;
    const cs = getComputedStyle(node);
    for (const property of TOKEN_PROPERTIES) {
      const painted = cs.getPropertyValue(property).trim();
      if (!painted || painted === 'none' || painted === 'normal') continue;
      for (const [name, value] of scopeTokens) {
        if (!value) continue;
        if (value === painted && !chips.has(name)) {
          chips.set(name, { name, value, property });
        }
      }
    }
    for (const child of Array.from(node.children)) {
      if (child instanceof HTMLElement) walk(child, depth + 1);
    }
  };
  walk(el, 0);
  return Array.from(chips.values());
}

export function SpecimenCard({
  rvId,
  kind = 'component',
  captureId,
  caption,
  node,
  variant = null,
  naturalWidth = null,
  forceScale = null,
  bare = false,
  force = null,
}: SpecimenCardProps) {
  const renderHostRef = useRef<HTMLDivElement>(null);
  const [chips, setChips] = useState<TokenChip[]>([]);

  // SCALE-TO-FIT (devtools-style): a Stage-2 specimen is laid out at its NATURAL width
  // then transform-scaled DOWN to fit the column it lands in, so sub-elements keep their
  // designed proportions instead of being crammed/overlapping. We measure the OUTER
  // viewport (the card column) and divide by the natural width for the fit scale; the
  // modal can pin an exact factor via `forceScale`. The scaled height is RESERVED on the
  // viewport so the transformed (visually shrunk) box does not leave a gap or clip.
  const fitViewportRef = useRef<HTMLDivElement>(null);
  const naturalContentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);
  const scaled = naturalWidth != null;

  useEffect(() => {
    if (!scaled || naturalWidth == null) return;
    const viewport = fitViewportRef.current;
    const content = naturalContentRef.current;
    if (!viewport || !content) return;
    const measure = () => {
      const colWidth = viewport.clientWidth;
      // forceScale wins (modal 1x / device width); else fit = column / natural, capped at 1.
      const next =
        forceScale != null ? forceScale : Math.min(1, colWidth > 0 ? colWidth / naturalWidth : 1);
      setScale(next);
      // Reserve the post-scale height so the column reflows to the shrunk box.
      setScaledHeight(content.offsetHeight * next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    ro.observe(content);
    return () => ro.disconnect();
  }, [scaled, naturalWidth, forceScale, node]);

  // Token chips are read AFTER paint (computed style needs a live element), and re-read
  // when the active mode flips. We key off the PAINTED <html>[data-theme] attribute (the
  // single next-themes source), NOT the React mode string, so chips settle in lockstep
  // with StageFoundations' swatches: a flip mutates data-theme, the [data-theme] cascade
  // repaints, then we re-read. Flush layout (offsetHeight) first and coalesce a burst of
  // mutations into one re-read via rAF so a single flip triggers one consistent settle.
  useEffect(() => {
    const host = renderHostRef.current;
    if (!host) return;
    const firstEl = host.querySelector<HTMLElement>(':scope > *') ?? host;
    const root = document.documentElement;
    let frame = 0;
    const recompute = () => {
      frame = 0;
      void root.offsetHeight; // force a style/layout flush so the cascade has painted
      setChips(deriveTokenChips(firstEl));
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(recompute);
    };
    schedule();
    const mo = new MutationObserver(schedule);
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      mo.disconnect();
    };
  }, [node]);

  // The catalog emits only type:'standard' nodes; narrow once so componentType is
  // safe to read (SymlinkNode has no componentType, and the engine renders null for it).
  const componentType = node.type === 'standard' ? node.componentType : null;

  // The exact §0b render call. The engine stamps id={node.id} and wraps the node in
  // its own <CVEErrorBoundary>; a bad prop yields <ValidationFailedWarning> inline.
  const rendered = renderComponentNode(node, {
    componentRegistry: hostRegistry,
    // Registry contravariance: the registry exports strict per-strategy settings
    // types; the engine's ctx wants the runtime index-signature shape. Cast at the
    // call site (never at the export site) — a known TS limitation, not a bug.
    strategyRegistry: strategyRegistry as unknown as StrategyRegistryRuntime,
    animationRegistry: {},
    maxTreeDepth: 25,
    depth: 0,
  });

  // Two-level targeting (Fix 3): the OUTER boundary is the whole specimen card
  // (level 'card' → "overall change to this component"); the INNER boundary wraps only
  // the live render (level 'part' → "a specific part"). Both carry the same
  // captureId/type/variant so the note binds correctly either way — only the LEVEL
  // (and the box it hugs) differs. The overlay resolves the innermost [data-rv-id], so
  // hovering the caption/meta/padding targets the card and hovering the render targets
  // the part. The part rvId is derived deterministically from the card rvId (det-id).
  const partRvId = detId(`part/${rvId}`);

  // The live render. When `scaled`, it is laid out at the natural width inside a fit
  // viewport and transform-scaled down (origin top-left); the viewport reserves the
  // scaled height. The annotation overlay normalizes anchors to the element box, so pins
  // stay glued through the transform. Atoms (no naturalWidth) render at the intrinsic 1x.
  const renderBody = (
    <div ref={renderHostRef} className="rv-specimen__render" data-scaled={scaled || undefined} data-rv-force={force ?? undefined}>
      {scaled ? (
        <div
          ref={fitViewportRef}
          className="rv-specimen__fit"
          style={scaledHeight != null ? { height: scaledHeight } : undefined}
        >
          <div
            ref={naturalContentRef}
            className="rv-specimen__natural"
            style={{
              width: naturalWidth ?? undefined,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {rendered}
          </div>
        </div>
      ) : (
        rendered
      )}
    </div>
  );

  return (
    <ReviewAnnotatable
      rvId={rvId}
      kind={kind}
      captureId={captureId}
      componentType={componentType}
      variant={variant}
      level="card"
    >
      <figure className={bare ? 'rv-specimen rv-specimen-bare' : 'rv-specimen'}>
        {!bare && <figcaption className="rv-specimen__caption">{caption}</figcaption>}
        {/* Outer boundary: belt-and-suspenders over the engine's per-node boundary. */}
        <CVEErrorBoundary nodeId={node.id}>
          <ReviewAnnotatable
            rvId={partRvId}
            kind={kind}
            captureId={captureId}
            componentType={componentType}
            variant={variant}
            level="part"
          >
            {renderBody}
          </ReviewAnnotatable>
        </CVEErrorBoundary>
        {!bare && (
        <div className="rv-specimen__meta">
          <code className="rv-specimen__type">{componentType}</code>
          {chips.length > 0 && (
            <ul className="rv-specimen__chips" aria-label="tokens used">
              {chips.map((chip) => (
                <li key={chip.name} className="rv-specimen__chip" title={`${chip.property}: ${chip.value}`}>
                  <span
                    className="rv-specimen__chip-swatch"
                    aria-hidden
                    style={
                      chip.name.startsWith('--color-')
                        ? { background: chip.value }
                        : undefined
                    }
                  />
                  <code>{chip.name}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
        )}
      </figure>
    </ReviewAnnotatable>
  );
}
