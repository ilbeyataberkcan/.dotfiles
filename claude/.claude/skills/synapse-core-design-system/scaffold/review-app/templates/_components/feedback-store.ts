'use client';

/**
 * feedback-store — the `synapse-review/2` review-feedback contract + persistence.
 *
 * EXECUTION-SPEC File 13 / DESIGN §6. One document, both stages, both verdicts. The
 * store is the click-resolution sink for the annotation layer and the gate source
 * for the two-stage shell; the skill reads `app/review/review-feedback.json` each
 * round and routes every `status:"fix"` annotation by `target.kind`.
 *
 * It is a SELF-PERSISTING REACTIVE SINGLETON (a tiny external store consumed via
 * useSyncExternalStore through `useReviewFeedback()`), so every component — the
 * shell chrome (gate state / verdicts / round / open-fixes), the annotation overlay
 * (writes new pins), and the feedback panel (edits / deletes) — reads and mutates
 * the SAME live document without prop-drilling it through the tree. Each mutator
 * writes through to localStorage and notifies subscribers; the chrome re-renders.
 *
 * Persistence is dual:
 *   - localStorage (live, reload-safe) under `STORAGE_KEY` — survives a refresh.
 *   - the on-disk `review-feedback.json` via `serialize()` → `saveToDisk()`, which
 *     first POSTs to the DEV-ONLY save route (`SAVE_ROUTE`) when one is wired, and
 *     falls back to a browser DOWNLOAD otherwise. A generic scaffolded host ships
 *     download-first (`__SAVE_ROUTE__` substitutes to `''`); pass --dev-save-route to
 *     emit the route file and wire `SAVE_ROUTE` so "Save feedback" writes directly.
 *
 * `'use client'`: the singleton + the hook touch browser APIs. All of them are
 * guarded so the module still imports cleanly under SSR (the snapshot is the empty
 * document until the client hydrates and the first subscribe re-reads localStorage).
 *
 * SCAFFOLD PARAMS (substituted on copy):
 *   __SURFACE_ID__  — the stable surface id literal (CLI `--surface-id`).
 *   __SAVE_ROUTE__  — dev save-route URL, or `''` for download-only (CLI `--dev-save-route`).
 */

import { useSyncExternalStore } from 'react';

// ── the contract: synapse-review/2 ───────────────────────────────────────────

export const REVIEW_SCHEMA = 'synapse-review/2' as const;

/** Stable surface id (project + slice). Parameterized by the scaffold. */
export const SURFACE_ID = '__SURFACE_ID__';

const STORAGE_KEY = `synapse-review:${SURFACE_ID}`;

export type ReviewStage = 'foundations' | 'screens';
export type Verdict = 'approved' | 'changes-requested' | 'pending';
export type ReviewMode = 'light' | 'dark';
export type AnnotationStatus = 'fix' | 'keep';
/** How the pin was placed: a single click point or a dragged box region. */
export type MarkKind = 'click' | 'box';

/** The 11 deterministic axis KEYS (states-recipe.json:axes) — the single source of
 *  truth the popover legend, the overlay, and the persisted annotation all share.
 *  `catalog.axes[i].key` is a `ReviewAxis` at runtime. Kept in LOCKSTEP with
 *  catalog-foundations.ts AXIS_KEYS and states-recipe.json axes.items. */
export type ReviewAxis =
  | 'voice'
  | 'elevation'
  | 'media-drama'
  | 'rhythm'
  | 'color-budget'
  | 'both-mode-parity'
  | 'geometry'
  | 'typography'
  | 'ramp-step'
  | 'prominence'
  | 'container-fit'
  | 'broken';

/** A tagged axis on an annotation, or `null` when none was chosen. */
export type Axis = ReviewAxis | null;

/** What kind of specimen a pin is attached to (the click-resolution boundary). */
export type TargetKind = 'font' | 'token' | 'component' | 'screen';

/** Targeting GRANULARITY: the whole specimen card vs an inner rendered part (Fix 3).
 *  Recorded on the note so the fix loop knows "overall change to this component"
 *  ('card') from "a specific part" ('part'). Optional for back-compat with pins dropped
 *  before the two-level targeting landed (they default to 'card'). */
export type TargetLevel = 'card' | 'part';

export interface AnnotationTarget {
  kind: TargetKind;
  /** specimen id (componentType/recipe-name) or screen id. */
  captureId: string;
  /** registry key; null for font/token targets. */
  componentType: string | null;
  /** recipe name / Text variant / font weight; null if n/a. */
  variant: string | null;
  /** present for token / tokens-used-chip targets, else null. */
  token: string | null;
  /** the granularity the operator picked — 'card' (whole) vs 'part' (inner). */
  level?: TargetLevel;
  /** re-anchors the pin on reload. A capture-id-rooted structural path resolving the
   *  EXACT clicked element, e.g. `[data-rv-capture-id='…'] > div:nth-of-type(2) > button`.
   *  (Older pins stored a coarse `[data-rv-id='…']` — still valid, still resolves.) */
  selector: string;
  /** the clicked element's tag (e.g. 'button'), for display. Optional for back-compat. */
  elementTag?: string;
  /** the clicked element's live `id` if any (an unstable per-render UUID — DISPLAY only,
   *  never the anchor). null when the element has no id. Optional for back-compat. */
  elementId?: string | null;
}

export interface ReviewAnnotation {
  id: string;
  stage: ReviewStage;
  /** ACTIVE mode when the pin dropped. */
  mode: ReviewMode;
  target: AnnotationTarget;
  /** pin position as % of the target element box. */
  anchor: { xPct: number; yPct: number };
  /** click point or dragged box region. */
  markKind: MarkKind;
  note: string;
  status: AnnotationStatus;
  axis: Axis;
  createdAt: string;
}

export interface StageState {
  verdict: Verdict;
  decidedAt: string | null;
  mode: ReviewMode | null;
}

export interface ReviewSummary {
  /** annotations with status:"fix" not yet resolved. */
  openFixes: number;
  byStage: Partial<Record<ReviewStage, number>>;
}

export interface ReviewFeedback {
  schema: typeof REVIEW_SCHEMA;
  surfaceId: string;
  generatedAt: string;
  round: number;
  stages: Record<ReviewStage, StageState>;
  annotations: ReviewAnnotation[];
  summary: ReviewSummary;
}

// ── factory + normalization ──────────────────────────────────────────────────

function emptyStage(): StageState {
  return { verdict: 'pending', decidedAt: null, mode: null };
}

export function emptyFeedback(): ReviewFeedback {
  return {
    schema: REVIEW_SCHEMA,
    surfaceId: SURFACE_ID,
    generatedAt: new Date().toISOString(),
    round: 1,
    stages: { foundations: emptyStage(), screens: emptyStage() },
    annotations: [],
    summary: { openFixes: 0, byStage: {} },
  };
}

/** Coerce any stored/loaded shape back to a valid `ReviewFeedback`. Defensive:
 *  an older round, a partial file, or a hand-edit never crashes the store. */
function normalize(raw: unknown): ReviewFeedback {
  const base = emptyFeedback();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<ReviewFeedback>;
  const stages = {
    foundations: { ...emptyStage(), ...(r.stages?.foundations ?? {}) },
    screens: { ...emptyStage(), ...(r.stages?.screens ?? {}) },
  };
  const annotations = Array.isArray(r.annotations) ? (r.annotations as ReviewAnnotation[]) : [];
  return {
    schema: REVIEW_SCHEMA,
    surfaceId: typeof r.surfaceId === 'string' ? r.surfaceId : SURFACE_ID,
    generatedAt: typeof r.generatedAt === 'string' ? r.generatedAt : base.generatedAt,
    round: typeof r.round === 'number' && r.round > 0 ? r.round : 1,
    stages,
    annotations,
    summary: deriveSummary(annotations),
  };
}

// ── summary derivation (the skill reads this at a glance) ─────────────────────

export function deriveSummary(annotations: ReviewAnnotation[]): ReviewSummary {
  const byStage: Partial<Record<ReviewStage, number>> = {};
  let openFixes = 0;
  for (const a of annotations) {
    if (a.status === 'fix') {
      openFixes++;
      byStage[a.stage] = (byStage[a.stage] ?? 0) + 1;
    }
  }
  return { openFixes, byStage };
}

// ── the reactive singleton (external store, consumed via useSyncExternalStore) ─

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Read the persisted document from localStorage (reload-safe). */
function readStorage(): ReviewFeedback {
  if (!hasStorage()) return emptyFeedback();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyFeedback();
    return normalize(JSON.parse(raw));
  } catch {
    return emptyFeedback();
  }
}

/** Write the live document to localStorage (best-effort; in-memory stays truth). */
function writeStorage(doc: ReviewFeedback): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch {
    /* quota / private mode — the in-memory document is still authoritative */
  }
}

// In-memory authoritative snapshot. Lazily hydrated from localStorage on the
// client; SSR sees the stable empty document (referentially constant so the
// server snapshot never changes between renders).
const SERVER_SNAPSHOT: ReviewFeedback = emptyFeedback();
let snapshot: ReviewFeedback = SERVER_SNAPSHOT;
let hydrated = false;
const listeners = new Set<() => void>();

function ensureHydrated(): void {
  if (hydrated || !hasStorage()) return;
  hydrated = true;
  snapshot = readStorage();
}

function emit(): void {
  for (const l of listeners) l();
}

/** Replace the snapshot, persist it, and notify subscribers. Always re-derives
 *  `summary` so the document is internally consistent before it is observed. */
function commit(next: ReviewFeedback): void {
  snapshot = { ...next, summary: deriveSummary(next.annotations) };
  writeStorage(snapshot);
  emit();
}

function subscribe(listener: () => void): () => void {
  ensureHydrated();
  // A late hydration (storage became available after first paint) must reach
  // every existing subscriber — notify once on first subscribe of the session.
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ReviewFeedback {
  ensureHydrated();
  return snapshot;
}

function getServerSnapshot(): ReviewFeedback {
  return SERVER_SNAPSHOT;
}

/** Reactive read of the whole live feedback document. Re-renders the caller on
 *  every mutation (pin add/edit/delete, verdict, round). */
export function useReviewFeedback(): ReviewFeedback {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Imperative read of the current document (for one-off, non-reactive callers). */
export function load(): ReviewFeedback {
  return getSnapshot();
}

// ── serialize / save to disk (try dev route, fall back to download) ───────────

/** The dev-only POST route that writes `review-feedback.json` to disk. Scaffold-
 *  substituted (`__SAVE_ROUTE__`); empty string ⇒ no route, download-only host. */
const SAVE_ROUTE = '__SAVE_ROUTE__';

/** The exact on-disk `review-feedback.json` string (pretty-printed). Pure — bumps
 *  nothing. `summary` is re-derived so the serialized doc is self-consistent. */
export function serialize(feedback: ReviewFeedback = snapshot): string {
  const out: ReviewFeedback = { ...feedback, summary: deriveSummary(feedback.annotations) };
  return JSON.stringify(out, null, 2);
}

/** Offer the serialized document as a browser download (the generic fallback the
 *  operator drops into `app/review/review-feedback.json`). */
function downloadToDisk(serialized: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  try {
    const blob = new Blob([serialized + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'review-feedback.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    /* download blocked — the localStorage copy remains authoritative */
  }
}

/** Save the serialized document to disk. FIRST tries the dev-only save route (a direct
 *  file write); on any non-2xx / network error (production, or a host without the route)
 *  it falls back to the browser download. localStorage stays authoritative regardless. */
export async function saveToDisk(serialized: string = serialize()): Promise<void> {
  if (typeof window === 'undefined') return;
  if (SAVE_ROUTE) {
    try {
      const res = await fetch(SAVE_ROUTE, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: serialized,
      });
      if (res.ok) return; // written to disk by the dev route — no download needed
    } catch {
      /* route absent / network error — fall through to the download */
    }
  }
  downloadToDisk(serialized);
}

// ── mutations (singleton; each persists + notifies) ───────────────────────────

/** Add a pin. Mints a UUID id + stamps `createdAt`; re-derives `summary`. */
export function addAnnotation(
  annotation: Omit<ReviewAnnotation, 'id' | 'createdAt'>,
): ReviewAnnotation {
  const full: ReviewAnnotation = {
    ...annotation,
    id: `anno_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
  commit({ ...snapshot, annotations: [...snapshot.annotations, full] });
  return full;
}

/** Edit an existing pin's note / status / axis. */
export function updateAnnotation(
  id: string,
  patch: Partial<Pick<ReviewAnnotation, 'note' | 'status' | 'axis'>>,
): void {
  const annotations = snapshot.annotations.map((a) => (a.id === id ? { ...a, ...patch } : a));
  commit({ ...snapshot, annotations });
}

/** Remove a pin. */
export function removeAnnotation(id: string): void {
  commit({ ...snapshot, annotations: snapshot.annotations.filter((a) => a.id !== id) });
}

/** Record a per-stage verdict. Stamps `decidedAt` + the mode it was decided in.
 *  The skill never self-clears a verdict (MEMORY L16) — only the operator flips it. */
export function setVerdict(stage: ReviewStage, verdict: Verdict, mode: ReviewMode): void {
  commit({
    ...snapshot,
    stages: {
      ...snapshot.stages,
      [stage]: {
        verdict,
        decidedAt: verdict === 'pending' ? null : new Date().toISOString(),
        mode: verdict === 'pending' ? null : mode,
      },
    },
  });
}

/** Increment the round (fix → re-review loop). */
export function bumpRound(): void {
  commit({ ...snapshot, round: snapshot.round + 1, generatedAt: new Date().toISOString() });
}

// ── edit-request channel (sidebar pencil / pin click → open pre-filled popover) ─
// A second tiny external store: the FeedbackPanel pencil and the AnnotationOverlay
// pin both call requestEditAnnotation(id); the overlay subscribes via useEditRequest()
// and opens AnnotationPopover seeded from that annotation. Sibling-subtree-safe (no
// shared parent to prop-drill through), mirroring the feedback singleton pattern.

let editRequestId: string | null = null;
const editListeners = new Set<() => void>();

/** Request that the annotation `id` be opened in edit mode (pre-filled popover).
 *  Stamps a fresh ref so a repeat request for the SAME id still notifies. */
export function requestEditAnnotation(id: string): void {
  editRequestId = id;
  for (const l of editListeners) l();
}

/** Clear the pending edit request (the overlay calls this once it has consumed it
 *  or the operator dismisses the popover). */
export function clearEditRequest(): void {
  if (editRequestId === null) return;
  editRequestId = null;
  for (const l of editListeners) l();
}

function subscribeEdit(listener: () => void): () => void {
  editListeners.add(listener);
  return () => {
    editListeners.delete(listener);
  };
}

function getEditSnapshot(): string | null {
  return editRequestId;
}

function getEditServerSnapshot(): string | null {
  return null;
}

/** Reactive read of the currently-requested edit annotation id (or `null`). */
export function useEditRequest(): string | null {
  return useSyncExternalStore(subscribeEdit, getEditSnapshot, getEditServerSnapshot);
}

// ── focus a target (panel row → scroll + flash the annotated element) ─────────

/** Scroll an annotation's target into view and flash a transient highlight on it.
 *  Resolves the element by the stored `selector` ([data-rv-id='…']); a no-op when
 *  the target is not currently mounted (e.g. the pin's stage is not active). */
export function focusAnnotationTarget(annotationId: string): void {
  if (typeof document === 'undefined') return;
  const anno = snapshot.annotations.find((a) => a.id === annotationId);
  if (!anno) return;
  const el = document.querySelector<HTMLElement>(anno.target.selector);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  el.classList.add('rv-focus-flash');
  window.setTimeout(() => el.classList.remove('rv-focus-flash'), 1200);
}

// ── gate helpers (the two-stage gate, DESIGN §6) ──────────────────────────────

/** Stage 1 → 2 gate: foundations must be approved. */
export function canAdvanceToScreens(feedback: ReviewFeedback = snapshot): boolean {
  return feedback.stages.foundations.verdict === 'approved';
}

/** Final approve (G6): BOTH verdicts approved AND no open fixes remain.
 *  (impeccable's critical/major check is the third gate, judged outside this store.) */
export function isFinalApproved(feedback: ReviewFeedback = snapshot): boolean {
  return (
    feedback.stages.foundations.verdict === 'approved' &&
    feedback.stages.screens.verdict === 'approved' &&
    deriveSummary(feedback.annotations).openFixes === 0
  );
}
