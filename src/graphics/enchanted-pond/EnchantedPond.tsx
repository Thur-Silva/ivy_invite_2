'use client';

import { Canvas } from '@react-three/fiber';
import { cn } from '@/ui/cn';
import {
  useIsDocumentVisible,
  useIsLowPoweredDevice,
  usePrefersReducedMotion,
} from '@/ui/hooks/use-environment';
import { Fireflies } from './Fireflies';
import { LilyPads } from './LilyPads';
import { WaterSurface } from './WaterSurface';

/**
 * Decorative WebGL backdrop for the whole invitation.
 *
 * Progressive enhancement, three tiers (ADR-0005):
 *  1. server render / no JS  -> CSS gradient only, zero bytes of WebGL;
 *  2. reduced motion or a weak device -> the gradient stays, canvas never mounts;
 *  3. everything else -> animated pond, capped dpr, and rendering paused while
 *     the tab is in the background so a phone in a pocket stops burning battery.
 *
 * Purely decorative: `aria-hidden`, never focusable, and it never carries
 * information that is not also written in the DOM.
 */
export function EnchantedPond({ className }: { className?: string }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isLowPowered = useIsLowPoweredDevice();
  const isVisible = useIsDocumentVisible();

  const canRenderPond = !prefersReducedMotion && !isLowPowered;

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-0 -z-10',
        // Tier 1 fallback, always painted underneath the canvas.
        'bg-[radial-gradient(120%_80%_at_50%_-10%,#17513c_0%,#0b2e23_45%,#04140f_100%)]',
        className,
      )}
    >
      {canRenderPond ? (
        <Canvas
          // Capped dpr: retina sharpness is invisible on a soft gradient and
          // costs four times the fragments.
          dpr={[1, 1.6]}
          frameloop={isVisible ? 'always' : 'never'}
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: false, powerPreference: 'low-power' }}
        >
          <WaterSurface />
          <LilyPads />
          <Fireflies />
        </Canvas>
      ) : null}
    </div>
  );
}
