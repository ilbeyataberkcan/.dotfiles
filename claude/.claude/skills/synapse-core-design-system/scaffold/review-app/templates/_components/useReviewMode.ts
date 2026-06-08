'use client';

/*
 * useReviewMode — the ONE bridge between the review chrome and the HOST's theme.
 *
 * The host mounts the cve design-system runtime in app/layout.tsx: <ThemeInjector seed>
 * emits the (swappable) token VALUES as a real <style> block (`:root` + `[data-theme]`),
 * and <ThemeMode> (attribute mode) flips `data-theme` on <html> on the client. The review
 * surface must NOT own a second provider — it reads/writes that single provider through
 * the design-system's own `useThemeMode()` hook (no raw next-themes).
 *
 * WHY THIS FLIPS EVERYTHING: the injected `[data-theme="light"]` / `[data-theme="dark"]`
 * blocks redefine every `--color-*` / `--font-*` / `--radius-*` / `--shadow-*` token.
 * ThemeMode writes the attribute on <html>, so one flip recomputes the WHOLE document —
 * the live specimens AND the `.rv-*` chrome (which paints from the same tokens).
 *
 * HYDRATION: ThemeMode resolves the persisted preference in a mount effect, so `mode` is
 * the deterministic host default ('light') on the server and first client paint, then
 * settles post-mount — markup matches byte-for-byte across SSR → first client render. We
 * mirror a local `mounted` flag so the toggle icon can avoid a first-paint flash.
 *
 * Returns the same shape every consumer used (`mode`, `toggle`, `setMode`, `mounted`),
 * so the swap is a one-line change here and nothing at the call sites.
 */

import { useEffect, useState } from 'react';
import { useThemeMode } from '@synapsys-integrated/cve-design-system';
import type { ReviewMode } from './feedback-store';

export interface ReviewModeApi {
  /** The live resolved mode ('light' before mount, then the host provider's mode). */
  mode: ReviewMode;
  /** Flip the HOST provider between light and dark (drives data-theme on <html>). */
  toggle: () => void;
  /** Set the HOST provider's mode explicitly. */
  setMode: (mode: ReviewMode) => void;
  /** False until the mount effect runs — render the deterministic default until then. */
  mounted: boolean;
}

export function useReviewMode(): ReviewModeApi {
  const { mode, setMode, toggle } = useThemeMode();
  // `mounted` only ever flips in an effect (post-commit), so the first client paint
  // matches the server — never read a client-only source during render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return {
    // `mode` is ThemeModeValue ('light' | 'dark') — identical to ReviewMode.
    mode,
    mounted,
    setMode: (next) => setMode(next),
    toggle,
  };
}
