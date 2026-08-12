'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, type ShaderMaterial } from 'three';
import { waterFragmentShader, waterVertexShader } from './shaders/water.shader';

/**
 * Full-screen animated water plane.
 *
 * Sized from the R3F viewport, so it fills the canvas at any aspect ratio with
 * no resize listener of its own. `uTime` is advanced through the material ref.
 * the imperative escape hatch. Rather than by mutating a memoized object.
 */
export function WaterSurface() {
  const viewport = useThree((state) => state.viewport);
  const material = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: new Color('#04140f') },
      uShallow: { value: new Color('#123f30') },
      uGlow: { value: new Color('#7fd8a8') },
    }),
    [],
  );

  useFrame((_, delta) => {
    const current = material.current;
    if (current === null) return;
    current.uniforms.uTime.value += delta;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        key="water"
        vertexShader={waterVertexShader}
        fragmentShader={waterFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
