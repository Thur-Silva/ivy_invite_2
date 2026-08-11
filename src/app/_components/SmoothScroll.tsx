'use client';

import { ReactLenis } from 'lenis/react';
import type { ReactNode } from 'react';

/**
 * Inertial scrolling for the invitation.
 *
 * `syncTouch: false` on purpose: hijacking touch scrolling on a phone fights
 * the platform and feels laggy, so mobile keeps native momentum and only
 * pointer/wheel devices get the eased scroll. The native scrollbar and
 * `scroll-behavior` fallback stay intact if this component never mounts.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.11, wheelMultiplier: 0.9, syncTouch: false }}>
      {children}
    </ReactLenis>
  );
}
