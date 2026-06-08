'use client';

/*
 * FeedbackPanel — the annotation list pane (the right rail of the shell).
 *
 * A flat list of the pins for the CURRENT stage: each row shows its number, the
 * target (componentType / token / font / screen), the note, and the fix/keep +
 * axis tags. Clicking a row focuses its target (scrolls + flashes the dashed
 * highlight via the overlay's shared `focusAnnotationTarget`). The pencil opens the
 * full PRE-FILLED popover (note + status + axis) via the shared edit channel; the row
 * can also be deleted.
 *
 * Collapses to a thin rail (count + open-fixes badge) so the stage pane gets the
 * full width when the operator wants to look, not annotate.
 *
 * Reads the store reactively via `useReviewFeedback()` (the singleton snapshot the
 * overlay also writes through) and mutates via the singleton `requestEditAnnotation` /
 * `removeAnnotation` (self-persisting; same dialect as AnnotationOverlay).
 */

import { useState } from 'react';
import {
  useReviewFeedback,
  requestEditAnnotation,
  removeAnnotation,
  focusAnnotationTarget,
  type ReviewStage,
} from './feedback-store';

export interface FeedbackPanelProps {
  /** The stage whose pins to list. */
  stage: ReviewStage;
}

export function FeedbackPanel({ stage }: FeedbackPanelProps) {
  const feedback = useReviewFeedback();
  const [collapsed, setCollapsed] = useState(false);

  const annotations = feedback.annotations.filter((a) => a.stage === stage);
  const openFixes = feedback.summary.openFixes;
  const stageCount = annotations.length;

  if (collapsed) {
    return (
      <aside className="rv-panel rv-panel-collapsed" aria-label="Annotations (collapsed)">
        <button
          type="button"
          className="rv-panel-expand"
          title="Expand annotations"
          onClick={() => setCollapsed(false)}
        >
          <span className="rv-panel-rail-icon" aria-hidden>›</span>
          <span className="rv-panel-rail-count">{stageCount}</span>
          {openFixes > 0 ? <span className="rv-panel-rail-fixes">{openFixes} fix</span> : null}
        </button>
      </aside>
    );
  }

  return (
    <aside className="rv-panel" aria-label="Annotations">
      <header className="rv-panel-head">
        <h3 className="rv-panel-title">
          Annotations <span className="rv-count">({stageCount})</span>
        </h3>
        <span className="rv-panel-fixes" title="Open fixes across all stages">
          {openFixes} open fix{openFixes === 1 ? '' : 'es'}
        </span>
        <button
          type="button"
          className="rv-panel-collapse"
          title="Collapse to rail"
          onClick={() => setCollapsed(true)}
        >
          ‹
        </button>
      </header>

      {stageCount === 0 ? (
        <p className="rv-panel-empty">
          No annotations yet. Click any specimen, swatch, or screen to drop a pin.
        </p>
      ) : (
        <ol className="rv-panel-list">
          {annotations.map((a, i) => (
            <li key={a.id} className="rv-panel-row">
              <button
                type="button"
                className="rv-panel-row-main"
                onClick={() => focusAnnotationTarget(a.id)}
                title="Focus this target"
              >
                <span className="rv-panel-row-num">{i + 1}</span>
                <span className="rv-panel-row-body">
                  <span className="rv-panel-row-target">
                    {a.target.componentType ?? a.target.token ?? a.target.captureId}
                    {a.target.variant ? (
                      <em className="rv-panel-row-variant"> · {a.target.variant}</em>
                    ) : null}
                  </span>
                  <span className="rv-panel-row-note">{a.note}</span>
                  <span className="rv-panel-row-tags">
                    <span
                      className={a.status === 'fix' ? 'rv-tag rv-tag-fix' : 'rv-tag rv-tag-keep'}
                    >
                      {a.status}
                    </span>
                    {a.axis ? <span className="rv-tag rv-tag-axis">{a.axis}</span> : null}
                  </span>
                </span>
              </button>
              <span className="rv-panel-row-actions">
                <button
                  type="button"
                  className="rv-panel-row-btn"
                  title="Edit annotation"
                  onClick={() => requestEditAnnotation(a.id)}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="rv-panel-row-btn rv-panel-row-del"
                  title="Delete annotation"
                  onClick={() => removeAnnotation(a.id)}
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
