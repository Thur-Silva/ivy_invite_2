'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Browser capability hooks, modelled as **subscriptions to external stores**
 * rather than `useEffect` + `setState`.
 *
 * That is not a lint workaround: the media-query list and the document's
 * visibility genuinely are external state that React does not own, and
 * `useSyncExternalStore` is the API for reading it without tearing — plus it
 * gives an explicit server snapshot instead of a hydration flash.
 */

/** Subscribe function for values that are read once and never change. */
const noopSubscribe = () => () => {};

export function useMediaQuery(query: string, serverFallback = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)', true);
}

/** True while the tab is in the foreground. Used to stop rendering WebGL. */
export function useIsDocumentVisible(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => document.visibilityState === 'visible',
    () => true,
  );
}

/**
 * Coarse "can this device afford WebGL?" signal.
 *
 * `hardwareConcurrency <= 2` is a blunt instrument, but it is the only hint
 * available everywhere and it errs on the safe side: a cheap phone gets the
 * static gradient, which still looks like an enchanted pond.
 */
export function useIsLowPoweredDevice(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => (navigator.hardwareConcurrency ?? 4) <= 2,
    () => true,
  );
}
