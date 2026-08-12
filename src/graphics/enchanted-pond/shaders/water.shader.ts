/**
 * Enchanted pond water. A single full-screen quad.
 *
 * One draw call, no lights, no textures, no post-processing: the whole
 * atmosphere is arithmetic in the fragment shader. That is what keeps the hero
 * affordable on a mid-range Android phone (see ADR-0005).
 */
export const waterVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const waterFragmentShader = /* glsl */ `
  precision mediump float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uGlow;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  /** Three octaves is enough shimmer and cheap enough for 60fps on mobile. */
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) {
      value += amplitude * noise(p);
      p *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;

    // Moonlit surface at the top fading into depth at the bottom.
    float depth = smoothstep(0.0, 1.0, 1.0 - uv.y);
    vec3 color = mix(uShallow, uDeep, depth);

    // Caustic shimmer drifting sideways.
    vec2 q = uv * vec2(3.0, 6.5);
    float caustics = pow(fbm(q + vec2(uTime * 0.045, uTime * 0.075)), 2.2);
    color += uGlow * caustics * 0.26;

    // Concentric rings, as if a frog had just jumped in.
    vec2 splash = vec2(0.5, 0.3);
    float distanceToSplash = length((uv - splash) * vec2(1.0, 1.7));
    float ripple = sin(distanceToSplash * 40.0 - uTime * 1.5) * exp(-distanceToSplash * 5.5);
    color += uGlow * ripple * 0.07;

    // Moon glow behind the title.
    float moon = exp(-length((uv - vec2(0.5, 0.88)) * vec2(1.15, 2.1)) * 3.0);
    color += uGlow * moon * 0.28;

    // Vignette keeps the DOM copy layered on top readable.
    float vignette = smoothstep(1.2, 0.3, length(uv - vec2(0.5)));
    color *= mix(0.5, 1.0, vignette);

    gl_FragColor = vec4(color, 1.0);
  }
`;
