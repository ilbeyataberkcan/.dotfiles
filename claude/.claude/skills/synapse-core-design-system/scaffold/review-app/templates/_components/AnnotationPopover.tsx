'use client';

/*
 * AnnotationPopover — the note input that appears anchored to the clicked element.
 *
 * Positioning is delegated to @radix-ui/react-popover (Fix 1): the popover is anchored
 * to a zero-size box laid over the clicked element's rect, and Radix's collision-aware
 * positioner auto-FLIPS (side) and SHIFTS (align) to keep it in the viewport — so it
 * never overflows the bottom (or any) edge of the screen, unlike the old hand-rolled
 * fixed `left/top` placement. The content is PORTALED to <body> so the overlay's
 * pointer-events:none + z-index never clip it.
 *
 * A textarea, a fix/keep toggle, and an OPTIONAL axis tag drawn from the deterministic
 * axes (`states-recipe.json:axes`, surfaced through the catalog — the chip list
 * auto-iterates whatever axes the catalog exposes, so a larger set just wraps). On save
 * it emits the note/status/axis triple; the overlay merges in the resolved `target` +
 * `anchor`. When `editing` is set the popover seeds from an existing annotation and
 * re-labels its header + Save action to "Update".
 */

import { useEffect, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { catalog } from './catalog-foundations';
import type { ReviewAxis } from './feedback-store';
import type { AnnotationTarget } from './feedback-store';

/** The axis legend (labels + hints) is sourced from the catalog, which reads it from
 *  `states-recipe.json:axes`. The list auto-iterates, so it renders/wraps for any size
 *  set. The axis KEY union (`ReviewAxis`) is owned by the feedback-store so the popover,
 *  the overlay, and the persisted annotation share one source of truth —
 *  `catalog.axes[i].key` is a `ReviewAxis` at runtime. */
const axes = catalog.axes;

export interface AnnotationDraft {
  note: string;
  status: 'fix' | 'keep';
  axis: ReviewAxis | null;
}

export interface AnnotationPopoverProps {
  /** Layer-local rect of the clicked element — Radix anchors + collision-flips off it. */
  anchorBox: { left: number; top: number; width: number; height: number };
  /** The annotation target (drives the header label + level chip). */
  target: AnnotationTarget;
  /** Pre-fill when editing an existing annotation. */
  initial?: Partial<AnnotationDraft>;
  /** Edit mode (seeded from an existing pin): re-labels the header + Save action. */
  editing?: boolean;
  onSave: (draft: AnnotationDraft) => void;
  onCancel: () => void;
}

export function AnnotationPopover({ anchorBox, target, initial, editing = false, onSave, onCancel }: AnnotationPopoverProps) {
  const [note, setNote] = useState(initial?.note ?? '');
  const [status, setStatus] = useState<'fix' | 'keep'>(initial?.status ?? 'fix');
  const [axis, setAxis] = useState<ReviewAxis | null>(initial?.axis ?? null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  // Portal the content INTO `.rv-shell` (not <body>) so it inherits the live theme
  // tokens and flips with the mode. Tokens cascade from <html>'s data-theme
  // (the host's single cve <ThemeMode> provider, attribute mode), so any descendant — including `.rv-shell`
  // (position:fixed inset:0) — carries every --color-* var. Portaling into the shell
  // also keeps the dialog inside the chrome's stacking/styling context.
  // Resolved post-mount (the shell exists by then); falls back to <body> if missing.
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setContainer(document.querySelector<HTMLElement>('.rv-shell'));
  }, []);

  // Cmd/Ctrl+Enter saves (Escape is handled by Radix's onOpenChange → onCancel).
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (note.trim()) onSave({ note: note.trim(), status, axis });
    }
  };

  // Name the PRECISE element when we have its tag; fall back to the semantic context.
  const context = target.token ?? target.variant ?? target.componentType ?? target.captureId;
  const headerLabel = target.elementTag ? `${target.elementTag} · ${context}` : context;
  const level = target.level ?? 'card';

  return (
    <Popover.Root open onOpenChange={(o) => !o && onCancel()}>
      {/* The anchor is a zero-content box laid over the clicked element's rect (inside
          the pointer-events:none overlay layer). Radix measures it for collision-aware
          flip/shift; pointer-events:none so it never eats clicks. */}
      <Popover.Anchor asChild>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: anchorBox.left,
            top: anchorBox.top,
            width: anchorBox.width,
            height: anchorBox.height,
            pointerEvents: 'none',
          }}
        />
      </Popover.Anchor>
      <Popover.Portal container={container}>
        <Popover.Content
          className="rv-popover"
          role="dialog"
          aria-label={`${editing ? 'Edit annotation on' : 'Annotate'} ${headerLabel}`}
          side="right"
          align="start"
          sideOffset={10}
          collisionPadding={12}
          avoidCollisions
          onKeyDown={onKeyDown}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            taRef.current?.focus();
          }}
        >
          <header className="rv-popover__header" data-mode={editing ? 'edit' : 'create'}>
            <span className="rv-popover__kind">{editing ? `edit · ${target.kind}` : target.kind}</span>
            <span className="rv-popover__level" data-level={level}>
              {level === 'card' ? 'whole component' : 'a part'}
            </span>
            <code className="rv-popover__target">{headerLabel}</code>
          </header>

          <textarea
            ref={taRef}
            className="rv-popover__note"
            placeholder="What's off here? (⌘/Ctrl+Enter to save)"
            value={note}
            rows={3}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="rv-popover__status" role="group" aria-label="verdict">
            <button
              type="button"
              className="rv-popover__seg"
              aria-pressed={status === 'fix'}
              onClick={() => setStatus('fix')}
            >
              Fix
            </button>
            <button
              type="button"
              className="rv-popover__seg"
              aria-pressed={status === 'keep'}
              onClick={() => setStatus('keep')}
            >
              Keep
            </button>
          </div>

          <fieldset className="rv-popover__axes">
            <legend className="rv-popover__axes-legend">Axis (optional)</legend>
            <div className="rv-popover__axes-list">
              {axes.map((a) => {
                // a.key is `string` on AxisDescriptor but is one of the 6 ReviewAxis keys
                // at runtime (sourced from states-recipe.json:axes).
                const key = a.key as ReviewAxis;
                return (
                  <button
                    key={key}
                    type="button"
                    className="rv-popover__axis"
                    aria-pressed={axis === key}
                    title={a.hint}
                    onClick={() => setAxis(axis === key ? null : key)}
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <footer className="rv-popover__footer">
            <button type="button" className="rv-popover__cancel" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="button"
              className="rv-popover__save"
              disabled={!note.trim()}
              onClick={() => onSave({ note: note.trim(), status, axis })}
            >
              {editing ? 'Update' : 'Save'}
            </button>
          </footer>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
