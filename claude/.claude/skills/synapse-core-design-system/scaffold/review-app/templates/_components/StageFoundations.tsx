'use client';

/*
 * StageFoundations — Stage 1 of the review surface (always visible; the gate).
 *
 * Three sections, top-to-bottom, in the ACTIVE theme mode:
 *   S1.1  Font specimens — one block per seed font role (catalog.fonts), one line
 *          per declared weight, painted with `font-family: var(--font-<role>)`.
 *          This is where a broken font bridge shows up as serif.
 *   S1.2  Token swatches — one chip per `--color-*` NAME (catalog.swatches, grouped
 *          family→ramp). The VALUE is read live via getComputedStyle(<html>) — the single
 *          [data-theme] source (next-themes attribute mode) — keyed off the PAINTED
 *          data-theme attribute (MutationObserver), not the React mode string, so a flip
 *          settles every swatch in lockstep with the atom specimens (no stale wrong-mode value).
 *   S1.3  Atom cards — the four atoms {text, button, logo, card} (catalog.atoms),
 *          each live via SpecimenCard (renderComponentNode). `text` enumerates its
 *          7 variants (prop `content`, already encoded in the recipe by the scaffold).
 *
 * Only the stage pane scrolls (the shell owns the 100dvh grid); this component
 * fits its content into that pane and never reaches off-screen.
 */

import { useEffect, useMemo, useState } from 'react';
import { useReviewMode } from './useReviewMode';
import { catalog, ATOM_KEYS, type SpecimenDescriptor } from './catalog-foundations';
import { detId } from './det-id';
import { SpecimenCard } from './SpecimenCard';
import { ScreenModal, type ScreenModalSpecimen } from './ScreenModal';
import { ReviewAnnotatable } from './ReviewAnnotatable';

const SPECIMEN_TEXT = 'Sphinx of black quartz, judge my vow — 0123456789';

// ScreenModalSpecimen.naturalWidth is REQUIRED; atoms render 1x so they zoom at this default.
const ZOOM_DEFAULT_WIDTH = 420;

/* Read every catalog `--color-*` swatch NAME off <html> in ONE getComputedStyle pass.
 * <html> is the single [data-theme] source (next-themes attribute mode), so reading the
 * document element directly avoids a stale cached fragment scope. Caller forces a layout
 * flush first so the [data-theme] cascade has painted before we read. */
function readSwatchValues(names: readonly string[]): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const cs = getComputedStyle(document.documentElement);
  const out: Record<string, string> = {};
  for (const name of names) out[name] = cs.getPropertyValue(name).trim();
  return out;
}

/* Build the type:'standard' node SpecimenCard renders from a recipe specimen.
 * The node id is DETERMINISTIC (detId of the captureId) so the engine's stamped
 * id={node.id} is identical on the server and the first client render (hydration). */
function specimenNode(spec: SpecimenDescriptor) {
  return {
    id: detId(`node:atom/${spec.captureId}`),
    parentId: null,
    type: 'standard' as const,
    componentType: spec.componentType,
    props: spec.props,
    children: [],
  } as unknown as Parameters<typeof SpecimenCard>[0]['node'];
}

export function StageFoundations() {
  const { mode } = useReviewMode();
  const [values, setValues] = useState<Record<string, string>>({});
  // Click-to-zoom modal — inspect any atom at a chosen scale, still annotatable. null === closed.
  const [zoomed, setZoomed] = useState<ScreenModalSpecimen | null>(null);

  // Every `--color-*` NAME we read this pass: the swatch names PLUS the derived fg name
  // for each surface chip. Read in one getComputedStyle(document.documentElement) sweep.
  const readNames = useMemo(() => {
    const set = new Set<string>(catalog.swatchNames);
    for (const name of catalog.swatchNames) {
      if (/surface|background|bg|canvas/.test(name)) {
        // action `-bg`/`-bg-hover`/`-bg-active` → `-text` (exists, white) BEFORE surface→fg.
        set.add(name.replace(/-bg(-hover|-active)?$/, '-text').replace(/(surface|background|canvas)/, 'fg'));
      }
    }
    return Array.from(set);
  }, []);

  // Swatch VALUES key off the PAINTED <html>[data-theme] attribute, not the `mode` string.
  // next-themes flips the attribute on <html>; React's `mode` can update a render BEFORE
  // that attribute commits and the [data-theme] cascade repaints, so reading on `mode`
  // yields the previous mode's value. A MutationObserver on documentElement's data-theme
  // (mirroring SpecimenCard) re-reads AFTER the flip paints — so swatches + atom specimens
  // settle in lockstep. We flush layout (offsetHeight) before getComputedStyle, and coalesce
  // a burst of mutations into one re-read via rAF so a single flip triggers one settle.
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const recompute = () => {
      frame = 0;
      void root.offsetHeight; // force a style/layout flush so the cascade has painted
      setValues(readSwatchValues(readNames));
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(recompute);
    };
    schedule(); // initial read after mount (post-paint, correct mode)
    const mo = new MutationObserver(schedule);
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      mo.disconnect();
    };
  }, [readNames]);

  // Stable rvIds for the deterministic font / token targets (per mode for tokens).
  // detId (not crypto.randomUUID) so the SSR markup and the first client render carry
  // the SAME data-rv-id — otherwise every wrapper mismatches and hydration warns.
  const fontRvIds = useMemo(
    () => Object.fromEntries(catalog.fonts.map((f) => [f.role, detId(`font/${f.role}`)])),
    [],
  );

  return (
    <div className="rv-stage rv-stage-foundations">
      <header className="rv-stage-head">
        <h2 className="rv-stage-title">Stage 1 · Foundations</h2>
        <p className="rv-stage-sub">
          Type, color tokens, and atoms in the live <strong>{mode}</strong> mode. Approve this
          stage to unlock the composed screens.
        </p>
      </header>

      {/* ── S1.1 — font specimens ─────────────────────────────────────────── */}
      <section className="rv-section" aria-label="Font specimens">
        <h3 className="rv-section-title">S1.1 · Font specimens</h3>
        <div className="rv-font-grid">
          {catalog.fonts.map((font) => (
            <ReviewAnnotatable
              key={font.role}
              rvId={fontRvIds[font.role]}
              kind="font"
              captureId={`font/${font.role}`}
              variant={font.family}
            >
              <article className="rv-font-block">
                <div className="rv-font-meta">
                  <span className="rv-font-role">{font.role}</span>
                  <span className="rv-font-family">{font.family}</span>
                  <code className="rv-font-var">var({font.cssVar})</code>
                </div>
                <div className="rv-font-lines">
                  {font.weights.map((weight) => (
                    <p
                      key={weight}
                      className="rv-font-line"
                      style={{ fontFamily: `var(${font.cssVar})`, fontWeight: weight }}
                    >
                      <span className="rv-font-weight-tag">{weight}</span>
                      {SPECIMEN_TEXT}
                    </p>
                  ))}
                </div>
              </article>
            </ReviewAnnotatable>
          ))}
        </div>
      </section>

      {/* ── S1.2 — color-token swatches WITH names ────────────────────────── */}
      <section className="rv-section" aria-label="Color token swatches">
        <h3 className="rv-section-title">
          S1.2 · Color tokens <span className="rv-count">({catalog.swatchNames.length})</span>
        </h3>
        {catalog.swatches.map((group) => (
          <div key={group.family} className="rv-swatch-family">
            <h4 className="rv-swatch-family-name">{group.family}</h4>
            <div className="rv-swatch-grid">
              {group.names.map((name) => {
                const value = values[name] ?? '';
                // Surface/fg pair → render the matching fg name on this surface.
                const isSurface = /surface|background|bg|canvas/.test(name);
                // action `-bg*` → `-text` (exists, white) BEFORE surface→fg; mirrors the readNames builder.
                const fgName = name.replace(/-bg(-hover|-active)?$/, '-text').replace(/(surface|background|canvas)/, 'fg');
                const fgValue = isSurface ? values[fgName] ?? '' : '';
                return (
                  <ReviewAnnotatable
                    key={name}
                    rvId={`${name}::${mode}`}
                    kind="token"
                    captureId={`token/${name}`}
                    token={name}
                  >
                    <figure className="rv-swatch">
                      <div
                        className="rv-swatch-chip"
                        style={{ background: value || 'transparent', color: fgValue || undefined }}
                      >
                        {isSurface ? <span className="rv-swatch-fg-sample">Aa</span> : null}
                      </div>
                      <figcaption className="rv-swatch-cap">
                        <code className="rv-swatch-name">{name}</code>
                        <span className="rv-swatch-value">{value || '—'}</span>
                      </figcaption>
                    </figure>
                  </ReviewAnnotatable>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* ── S1.3 — atom cards ─────────────────────────────────────────────── */}
      <section className="rv-section" aria-label="Atoms">
        <h3 className="rv-section-title">S1.3 · Atoms</h3>
        {ATOM_KEYS.map((key) => (
          <div key={key} className="rv-atom-group">
            <h4 className="rv-atom-key">{key}</h4>
            <div className="rv-specimen-grid">
              {catalog.atoms[key].map((spec) => {
                const rvId = detId(`atom-rv/${spec.captureId}`);
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
          </div>
        ))}
      </section>

      {/* Click-to-zoom modal (Radix Dialog): inspect any atom larger / at a chosen scale. */}
      <ScreenModal specimen={zoomed} stage="foundations" mode={mode} onClose={() => setZoomed(null)} />
    </div>
  );
}
