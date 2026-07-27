// Shared GLSL chunks — Vanguard lineage (same hash/fbm family as VanguardNoise.hlsl).
export const NOISE_GLSL = /* glsl */ `
  float vHash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; return fract(p * (p + p)); }
  float vHash31(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  vec3 vHash33(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
  }
  float vNoise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(vHash31(i), vHash31(i + vec3(1,0,0)), u.x),
          mix(vHash31(i + vec3(0,1,0)), vHash31(i + vec3(1,1,0)), u.x), u.y),
      mix(mix(vHash31(i + vec3(0,0,1)), vHash31(i + vec3(1,0,1)), u.x),
          mix(vHash31(i + vec3(0,1,1)), vHash31(i + vec3(1,1,1)), u.x), u.y), u.z);
  }
  float vFbm3(vec3 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 4; i++) { s += a * vNoise3(p); p = p * 2.02 + 17.7; a *= 0.5; }
    return s;
  }
  float vFbm3Hi(vec3 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 6; i++) { s += a * vNoise3(p); p = p * 2.07 + 13.1; a *= 0.5; }
    return s;
  }
  vec2 vVoronoi3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    float f1 = 8.0, f2 = 8.0;
    for (int x = -1; x <= 1; x++)
    for (int y = -1; y <= 1; y++)
    for (int z = -1; z <= 1; z++) {
      vec3 g = vec3(float(x), float(y), float(z));
      vec3 o = vHash33(i + g);
      float d = length(g + o - f);
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
    }
    return vec2(f1, f2 - f1);
  }
  // iq cosine palette
  vec3 vPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
  }
`

// ── Golf-ball dimple field ────────────────────────────────────────────────
// Height field from spherical voronoi cells; normal from numeric tangent gradient.
export const DIMPLE_GLSL = /* glsl */ `
  float vDimpleH(vec3 n, float density) {
    float d = vVoronoi3(n * density).x;
    // concave dimple inside each cell, flat land between
    return -smoothstep(0.46, 0.05, d) * 1.0;
  }
  // returns perturbed world normal
  vec3 vDimpleNormal(vec3 objN, vec3 worldN, float density, float strength, mat3 nMat) {
    vec3 up = abs(objN.y) > 0.94 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 T1 = normalize(cross(objN, up));
    vec3 T2 = normalize(cross(objN, T1));
    float e = 0.012;
    float h0 = vDimpleH(normalize(objN + T1 * e), density) - vDimpleH(normalize(objN - T1 * e), density);
    float h1 = vDimpleH(normalize(objN + T2 * e), density) - vDimpleH(normalize(objN - T2 * e), density);
    vec3 pn = normalize(objN - (T1 * h0 + T2 * h1) * (strength / (2.0 * e)));
    return normalize(nMat * pn);
  }
`

// ── View-dependent glint BRDF (automotive flake technique) ────────────────
export const GLINT_GLSL = /* glsl */ `
  float vGlint(vec3 objP, vec3 worldN, vec3 V, float density, float sparsity, float uTime) {
    vec3 cell = floor(objP * density);
    vec3 rnd = vHash33(cell);
    // per-flake micro normal
    vec3 fN = normalize(worldN + (rnd - 0.5) * 0.9);
    vec3 L = normalize(vec3(0.35, 1.0, 0.25));
    vec3 H = normalize(V + L);
    float spec = pow(clamp(dot(fN, H), 0.0, 1.0), 220.0);
    float gate = step(sparsity, rnd.x);
    float twinkle = 0.55 + 0.45 * sin(uTime * 3.0 + rnd.y * 40.0);
    return spec * gate * twinkle;
  }
`

// ── Sphere chord for interior volume raymarch ─────────────────────────────
// entry E (world), view dir D (world, normalized), center C, radius r
// returns exit distance along D from E (chord length)
export const CHORD_GLSL = /* glsl */ `
  float vChord(vec3 E, vec3 D, vec3 C, float r) {
    vec3 m = E - C;
    float b = dot(m, D);
    float c = dot(m, m) - r * r;
    float disc = max(b * b - c, 0.0);
    return max(-b + sqrt(disc), 0.0);
  }
`

// Varyings for CSM materials (vCenter = world-space ball center).
export const VARYINGS_VERT = /* glsl */ `
  varying vec3 vObjPos;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vCenter;
  void main() {
    vObjPos = position;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  }
`

export const VARYINGS_FRAG_HEADER = /* glsl */ `
  varying vec3 vObjPos;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vCenter;
`

// Standalone (non-CSM) ShaderMaterial vertex stage with the same varyings.
export const RAW_VERT = /* glsl */ `
  varying vec3 vObjPos;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vCenter;
  void main() {
    vObjPos = position;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
