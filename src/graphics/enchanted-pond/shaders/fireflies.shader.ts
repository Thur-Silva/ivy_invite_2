/**
 * Fireflies (vaga-lumes). One `THREE.Points` draw call.
 *
 * Every firefly's drift and blink is computed on the GPU from per-particle
 * attributes, so the CPU only updates a single `uTime` uniform per frame.
 */
export const firefliesVertexShader = /* glsl */ `
  attribute float aScale;
  attribute float aOffset;
  attribute float aSpeed;

  uniform float uTime;
  uniform float uPixelRatio;

  varying float vGlow;

  void main() {
    vec3 drifted = position;
    drifted.x += sin(uTime * aSpeed + aOffset) * 0.45;
    drifted.y += cos(uTime * aSpeed * 0.75 + aOffset * 1.7) * 0.3;

    vec4 viewPosition = modelViewMatrix * vec4(drifted, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = aScale * uPixelRatio * (18.0 / max(-viewPosition.z, 0.001));

    // Blink: never fully off, so the swarm reads as alive rather than glitchy.
    vGlow = 0.3 + 0.7 * (0.5 + 0.5 * sin(uTime * (1.1 + aSpeed) + aOffset * 3.1));
  }
`;

export const firefliesFragmentShader = /* glsl */ `
  precision mediump float;

  uniform vec3 uColor;
  varying float vGlow;

  void main() {
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    float halo = smoothstep(0.5, 0.05, distanceToCenter);
    float core = smoothstep(0.22, 0.0, distanceToCenter);
    gl_FragColor = vec4(uColor, (halo * 0.55 + core * 0.45) * vGlow);
  }
`;
