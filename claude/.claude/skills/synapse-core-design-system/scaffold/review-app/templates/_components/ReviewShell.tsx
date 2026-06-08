'use client';

/*
 * ReviewShell — the full-height chrome of the review surface.
 *
 * A 100dvh grid (top bar / main / footer) wrapping the active stage in the CVE engine
 * provider. Only the inner panes scroll; nothing reaches off-screen.
 *
 *   top bar   — brand · Stage 1▸2 tabs · ☀/☾ mode toggle · review round
 *   main      — the active stage pane (scrolls) + the collapsible annotation list
 *   footer    — open-fixes count · Approve-stage [GATED] · Save feedback
 *
 * THEME — ONE PROVIDER, THE HOST'S: the review surface owns NO theme provider. The host
 * app already mounts a single cve <ThemeMode defaultMode="light"> (attribute mode) that
 * flips `data-theme` on <html> (app/layout.tsx). The review previously wrapped its stage
 * in a SECOND provider (a redundant <ThemeMode>/ThemeScope, plus a data-theme="light"
 * scope-root div) — two providers competing for the same `data-theme` attribute, which is
 * exactly why the ☀/☾ toggle flipped nothing. That wrapper is GONE. The toggle now drives
 * the host provider through `useReviewMode()` (a thin cve `useThemeMode` bridge); setting
 * data-theme on <html> re-resolves the `<ThemeInjector>`-emitted <style> block's
 * [data-theme] token blocks for the WHOLE document, so the live specimens AND the `.rv-*`
 * chrome (which paint from the same tokens) flip together. We keep only the CVE engine
 * provider — it has nothing to do with the theme attribute.
 *
 * STAGE-INCREMENTAL: stages are BUILT one-after-another, not pre-generated-and-gated.
 * Only Stage 1 (foundations) exists/renders right now — Stage 2 (StageScreens) is NOT
 * generated until Stage 1 is finished, so it is not imported here. Re-running the
 * scaffold at --stage 2 (after Stage 1 is approved) appends StageScreens + wires the
 * Stage-2 tab/lazy import back in. Until then there is no Stage-2 tab and the footer is
 * a single "Approve foundations" action.
 *
 * The store is a self-persisting singleton (same dialect AnnotationOverlay writes
 * through); `useReviewFeedback()` is the reactive snapshot that re-renders the
 * chrome on every pin / verdict / round change.
 *
 * Scaffold-substituted: `__REGISTRY_IMPORT__` (from --registry) → host `@/lib/registry`.
 * (The seed/theme imports are gone — the host's cve <ThemeMode> provider owns the theme.)
 */

import { CVEProvider, type StrategyRegistryRuntime } from '@synapsys-integrated/cve-core';
import { strategyRegistry } from '@synapsys-integrated/cve-components/registries';
import { hostRegistry } from '__REGISTRY_IMPORT__';

import { StageFoundations } from './StageFoundations';
import { FeedbackPanel } from './FeedbackPanel';
import { ThemeModeToggle } from './ThemeModeToggle';
import { useReviewMode } from './useReviewMode';
import { AnnotationOverlay } from './AnnotationOverlay';
import { useReviewFeedback, setVerdict, serialize, saveToDisk } from './feedback-store';

const SURFACE_ID = '__SURFACE_ID__'; // scaffold-substituted from --surface-id
const LOGO_SRC = '__LOGO_SRC__'; // scaffold-substituted from --logo-src ('' → text fallback)

export function ReviewShell() {
  // NO theme provider here — the host's cve <ThemeMode> (attribute mode) on <html> is the
  // single source of truth. We mount ONLY the CVE engine provider; the chrome and
  // specimens both paint from the <ThemeInjector>-emitted <style> block's [data-theme]
  // tokens, which the host attribute already drives across the whole document.
  return (
    <CVEProvider
      componentRegistry={hostRegistry}
      // Registry contravariance: the registry exports strict per-strategy settings
      // types; the provider wants the runtime index-signature shape. Cast at the
      // call site (never the export site) — a known TS limitation, not a bug.
      strategyRegistry={strategyRegistry as unknown as StrategyRegistryRuntime}
      animationRegistry={{}}
      maxTreeDepth={25}
    >
      <ReviewShellInner />
    </CVEProvider>
  );
}

function ReviewShellInner() {
  const { mode } = useReviewMode();
  // Stage 1 ONLY: Stage 2 is not generated yet, so there is one stage here.
  const stage = 'foundations' as const;
  // Reactive read of the whole feedback snapshot so the chrome (verdict, round,
  // open-fixes) re-renders on every store mutation.
  const feedback = useReviewFeedback();

  const round = feedback.round;
  const foundationsVerdict = feedback.stages.foundations.verdict;
  const openFixes = feedback.summary.openFixes;

  const approveDisabled = foundationsVerdict === 'approved';

  const onApproveStage = () => {
    setVerdict('foundations', 'approved', mode);
  };

  const onSave = () => {
    // Persist the live document to app/review/review-feedback.json: saveToDisk POSTs
    // the dev save route first and falls back to a browser download if it's gone/refuses.
    void saveToDisk(serialize(feedback));
  };

  return (
    <div className="rv-shell">
      {/* ── top bar ─────────────────────────────────────────────────────── */}
      <header className="rv-topbar">
        <div className="rv-brand">
          {LOGO_SRC ? (
            <img className="rv-brand-logo" src={LOGO_SRC} alt="" aria-hidden />
          ) : (
            <span className="rv-brand-mark" aria-hidden>◇</span>
          )}
          <span className="rv-brand-name">Synapse Review</span>
          <code className="rv-brand-surface">{SURFACE_ID}</code>
        </div>

        {/* Stage 1 ONLY — no Stage-2 tab; Stage 2 is generated later (scaffold --stage 2). */}
        <nav className="rv-stage-tabs" aria-label="Stages">
          <span className="rv-stage-tab rv-stage-tab-on" aria-current="true">
            <span className="rv-stage-tab-num">1</span> Foundations
            {foundationsVerdict === 'approved' ? (
              <span className="rv-stage-tab-ok" aria-hidden>✓</span>
            ) : null}
          </span>
        </nav>

        <div className="rv-topbar-right">
          <ThemeModeToggle />
          <span className="rv-round" title="Review round">round {round}</span>
        </div>
      </header>

      {/* ── main: stage pane + annotation list ──────────────────────────── */}
      <main className="rv-main">
        <section className="rv-stage-pane">
          {/* Stage 1 ONLY — Stage 2 (StageScreens) is not generated yet. */}
          <StageFoundations />
          {/* The DOM pin layer sits over the stage pane, scoped to the active stage. */}
          <AnnotationOverlay stage={stage} mode={mode} />
        </section>

        <FeedbackPanel stage={stage} />
      </main>

      {/* ── footer ──────────────────────────────────────────────────────── */}
      <footer className="rv-footer">
        <span className="rv-footer-fixes">
          {openFixes} open fix{openFixes === 1 ? '' : 'es'}
        </span>

        <div className="rv-footer-actions">
          <button
            type="button"
            className="rv-btn rv-btn-approve"
            disabled={approveDisabled}
            title={approveDisabled ? 'Already approved' : undefined}
            onClick={onApproveStage}
          >
            Approve foundations
          </button>

          <button type="button" className="rv-btn rv-btn-save" onClick={onSave}>
            Save feedback
          </button>
        </div>
      </footer>
    </div>
  );
}
