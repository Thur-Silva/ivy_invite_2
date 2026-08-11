'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { DoubleSide, Shape, ShapeGeometry, type Group } from 'three';

/**
 * Pads are placed in normalized screen space (-1..1 on both axes) and mapped to
 * world units from the R3F viewport, so the composition holds from a 360px
 * phone to a desktop window without magic numbers per breakpoint.
 */
const PADS = [
  { x: -0.72, y: -0.52, z: 0.4, size: 1.0, tint: '#2e7d5b', phase: 0 },
  { x: 0.68, y: -0.74, z: 0.5, size: 0.76, tint: '#3fa07a', phase: 1.6 },
  { x: -0.5, y: 0.62, z: 0.3, size: 0.54, tint: '#256b4d', phase: 3.1 },
  { x: 0.8, y: 0.4, z: 0.35, size: 0.64, tint: '#2e7d5b', phase: 4.4 },
  { x: 0.08, y: -0.92, z: 0.6, size: 0.44, tint: '#3fa07a', phase: 5.2 },
] as const;

/**
 * The classic lily-pad silhouette: a disc with a wedge cut out of it.
 * Built once and shared by every pad instance.
 */
function createLilyPadGeometry(): ShapeGeometry {
  const shape = new Shape();
  const notch = Math.PI * 0.16;
  shape.absarc(0, 0, 1, notch, Math.PI * 2 - notch, false);
  shape.lineTo(0, 0);
  shape.closePath();
  return new ShapeGeometry(shape, 24);
}

export function LilyPads() {
  const group = useRef<Group>(null);
  const viewport = useThree((state) => state.viewport);
  const geometry = useMemo(() => createLilyPadGeometry(), []);

  const unit = Math.min(viewport.width, viewport.height) * 0.13;

  useFrame((state) => {
    const container = group.current;
    if (container === null) return;

    const elapsed = state.clock.elapsedTime;
    container.children.forEach((pad, index) => {
      const config = PADS[index];
      if (config === undefined) return;
      // Absolute, not incremental: a pad on still water must not drift away.
      pad.position.y =
        (config.y * viewport.height) / 2 + Math.sin(elapsed * 0.5 + config.phase) * 0.06;
      pad.rotation.z = Math.sin(elapsed * 0.28 + config.phase) * 0.12;
    });
  });

  return (
    <group ref={group}>
      {PADS.map((pad) => (
        <mesh
          key={`${pad.x}:${pad.y}`}
          geometry={geometry}
          position={[(pad.x * viewport.width) / 2, (pad.y * viewport.height) / 2, pad.z]}
          scale={pad.size * unit}
        >
          <meshBasicMaterial color={pad.tint} transparent opacity={0.5} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
