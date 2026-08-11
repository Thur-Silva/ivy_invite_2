'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  type ShaderMaterial,
} from 'three';
import { firefliesFragmentShader, firefliesVertexShader } from './shaders/fireflies.shader';

/**
 * Deterministic pseudo-random generator (mulberry32).
 *
 * Seeded on purpose: the swarm looks the same on every reload instead of
 * reshuffling in front of the guest, and the layout stays reviewable.
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Fireflies({ count = 70 }: { count?: number }) {
  const viewport = useThree((state) => state.viewport);
  const dpr = useThree((state) => state.viewport.dpr);
  const material = useRef<ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const random = seededRandom(20260912);
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const offsets = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (random() - 0.5) * 12;
      positions[index * 3 + 1] = (random() - 0.5) * 12;
      positions[index * 3 + 2] = random() * 2.5;
      scales[index] = 0.6 + random() * 1.8;
      offsets[index] = random() * Math.PI * 2;
      speeds[index] = 0.25 + random() * 0.5;
    }

    const buffer = new BufferGeometry();
    buffer.setAttribute('position', new BufferAttribute(positions, 3));
    buffer.setAttribute('aScale', new BufferAttribute(scales, 1));
    buffer.setAttribute('aOffset', new BufferAttribute(offsets, 1));
    buffer.setAttribute('aSpeed', new BufferAttribute(speeds, 1));
    return buffer;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: dpr },
      uColor: { value: new Color('#ffe9a8') },
    }),
    [dpr],
  );

  useFrame((_, delta) => {
    const current = material.current;
    if (current === null) return;
    current.uniforms.uTime.value += delta;
  });

  return (
    <points geometry={geometry} scale={[viewport.width / 10, viewport.height / 10, 1]}>
      <shaderMaterial
        ref={material}
        key="fireflies"
        vertexShader={firefliesVertexShader}
        fragmentShader={firefliesFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
