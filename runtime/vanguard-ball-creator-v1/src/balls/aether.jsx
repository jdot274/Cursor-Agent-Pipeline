import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { NOISE_GLSL, CHORD_GLSL, RAW_VERT, VARYINGS_FRAG_HEADER } from './shaderLib.js'

const R = 0.75

function useAetherUniforms(accent, engine) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAccent: { value: new THREE.Color(accent) },
      uMagenta: { value: new THREE.Color('#c44dff') },
      uCyan: { value: new THREE.Color('#00d4ff') },
      uIntensity: { value: 1 },
      uGlow: { value: 1.2 },
      uNoise: { value: 2.8 },
      uScan: { value: 1 },
      uRim: { value: 2.4 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  uniforms.uAccent.value.set(accent)
  if (engine) {
    uniforms.uIntensity.value = engine.intensity ?? 1
    uniforms.uGlow.value = engine.glow ?? 1.2
    uniforms.uNoise.value = engine.noiseScale ?? 2.8
    uniforms.uScan.value = engine.scanSpeed ?? 1
    uniforms.uRim.value = engine.rimPower ?? 2.4
  }
  return uniforms
}

/**
 * AETHER — ethereal AI-orb: raymarched cyan/magenta fluid volume,
 * additive orbital rings, soft halo, faint god-ray.
 * Additive iteration (does not replace Cyan Vault).
 */
export function AetherBall({ accent, speed, engine }) {
  const uniforms = useAetherUniforms(accent, engine)
  const rings = useRef()
  const volume = useRef()
  const group = useRef()

  useFrame((_, dt) => {
    const s = (speed ?? 1) * (engine?.scanSpeed ?? 1)
    uniforms.uTime.value += dt * s
    const t = uniforms.uTime.value
    if (rings.current) {
      rings.current.children.forEach((c, i) => {
        c.rotation.x = Math.sin(t * (0.25 + i * 0.07) + i) * 0.35 + i * 0.4
        c.rotation.y = t * (0.18 + i * 0.05) * (i % 2 === 0 ? 1 : -1)
        c.rotation.z = Math.cos(t * 0.2 + i * 1.3) * 0.25
      })
    }
    if (group.current) group.current.rotation.y = t * 0.05
  })

  // Interior fluid volume — Beer-Lambert raymarch with soft metaball density
  const volumeMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide, // render from inside for fuller volume
        vertexShader: RAW_VERT,
        fragmentShader: /* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform float uTime;
          uniform vec3 uAccent;
          uniform vec3 uMagenta;
          uniform vec3 uCyan;
          uniform float uIntensity;
          uniform float uGlow;
          uniform float uNoise;
          ${NOISE_GLSL}
          ${CHORD_GLSL}

          // soft metaball field: 3 orbiting blobs + fbm envelope
          float field(vec3 p, float t) {
            vec3 a = p - vec3(sin(t*0.7)*0.28, cos(t*0.55)*0.22, sin(t*0.4)*0.18);
            vec3 b = p - vec3(cos(t*0.5)*0.32, sin(t*0.9)*0.18, cos(t*0.65)*0.24);
            vec3 c = p - vec3(sin(t*0.35+1.5)*0.15, 0.05, cos(t*0.45)*0.2);
            float d1 = length(a);
            float d2 = length(b);
            float d3 = length(c);
            float blobs = 0.22/max(d1, 0.04) + 0.18/max(d2, 0.04) + 0.14/max(d3, 0.05);
            float env = 1.0 - smoothstep(0.55, 1.05, length(p));
            float n = vFbm3Hi(p * uNoise + vec3(0.0, t * 0.08, 0.0));
            return blobs * env * (0.55 + n * 0.7);
          }

          void main() {
            float r = ${(R * 0.98).toFixed(4)};
            // enter from backface → march toward camera through volume
            vec3 E = vWorldPos;
            vec3 D = normalize(cameraPosition - vWorldPos);
            float chord = vChord(E, D, vCenter, r);
            const int STEPS = 28;
            float dt = chord / float(STEPS);
            float trans = 1.0;
            vec3 col = vec3(0.0);
            float t = uTime;

            for (int i = 0; i < STEPS; i++) {
              vec3 wp = E + D * (dt * (float(i) + 0.5));
              vec3 q = (wp - vCenter) / r;
              float dens = field(q, t);
              dens = max(dens - 0.85, 0.0) * 1.4;
              // color by density + position (magenta core, cyan shell)
              float core = exp(-length(q) * 2.8);
              vec3 emit = mix(uCyan, uAccent, dens * 0.5);
              emit = mix(emit, uMagenta, core * dens);
              col += emit * dens * trans * dt * 3.2 * uGlow;
              trans *= exp(-dens * dt * 2.6);
              if (trans < 0.02) break;
            }
            // soft rim of the volume sphere
            vec3 V = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - abs(dot(normalize(vWorldNormal), V)), 2.0);
            col += uCyan * fres * 0.25 * uGlow;

            float a = clamp(length(col) * 0.55, 0.0, 1.0) * uIntensity;
            gl_FragColor = vec4(col * uIntensity, a);
          }
        `,
      }),
    [uniforms]
  )

  // Front-side softer shell for silhouette
  const shellMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
        vertexShader: RAW_VERT,
        fragmentShader: /* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform vec3 uCyan;
          uniform vec3 uAccent;
          uniform float uGlow;
          uniform float uIntensity;
          uniform float uRim;
          uniform float uTime;
          ${NOISE_GLSL}
          void main() {
            vec3 N = normalize(vWorldNormal);
            vec3 V = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - abs(dot(N, V)), uRim);
            float n = vFbm3(normalize(vObjPos) * 3.0 + uTime * 0.1);
            vec3 col = mix(uCyan, uAccent, n * 0.4) * fres * 1.6 * uGlow;
            gl_FragColor = vec4(col, fres * 0.55 * uIntensity);
          }
        `,
      }),
    [uniforms]
  )

  // Orbital ring shader — thin bright additive torus with fuzzy noise edge
  const ringMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying vec3 vWorldPos;
          uniform float uTime;
          ${NOISE_GLSL}
          void main() {
            vUv = uv;
            // subtle radius jitter for fuzzy vibration
            vec3 p = position;
            float n = vNoise3(normalize(position) * 8.0 + uTime * 0.5);
            p *= 1.0 + (n - 0.5) * 0.04;
            vWorldPos = (modelMatrix * vec4(p, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          uniform vec3 uCyan;
          uniform vec3 uAccent;
          uniform float uGlow;
          uniform float uIntensity;
          uniform float uTime;
          void main() {
            // torus UV: concentrate on the tube rim
            float tube = abs(vUv.y - 0.5) * 2.0;
            float core = exp(-tube * tube * 18.0);
            float fringe = exp(-tube * tube * 4.0) * 0.35;
            float pulse = 0.75 + 0.25 * sin(uTime * 2.0 + vUv.x * 12.0);
            vec3 col = mix(uCyan, uAccent, 0.35) * (core * 2.4 + fringe) * pulse * uGlow;
            float a = (core + fringe * 0.5) * uIntensity;
            gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
          }
        `,
      }),
    [uniforms]
  )

  // Soft ambient halo
  const haloMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        vertexShader: RAW_VERT,
        fragmentShader: /* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform vec3 uCyan;
          uniform float uGlow;
          uniform float uIntensity;
          void main() {
            vec3 V = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - abs(dot(normalize(vWorldNormal), V)), 1.6);
            vec3 col = uCyan * fres * 0.55 * uGlow;
            gl_FragColor = vec4(col, fres * 0.35 * uIntensity);
          }
        `,
      }),
    [uniforms]
  )

  // Faint vertical god-ray
  const rayMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          uniform vec3 uCyan;
          uniform float uGlow;
          uniform float uIntensity;
          uniform float uTime;
          void main() {
            float x = abs(vUv.x - 0.5) * 2.0;
            float y = vUv.y;
            float beam = exp(-x * x * 28.0) * smoothstep(0.0, 0.2, y) * (1.0 - y);
            float flicker = 0.85 + 0.15 * sin(uTime * 1.4 + y * 8.0);
            vec3 col = uCyan * beam * 0.9 * flicker * uGlow;
            gl_FragColor = vec4(col, beam * 0.45 * uIntensity);
          }
        `,
      }),
    [uniforms]
  )

  const ringSpecs = useMemo(
    () => [
      { r: R * 1.02, tube: 0.012, scale: 1 },
      { r: R * 1.08, tube: 0.009, scale: 1.02 },
      { r: R * 0.95, tube: 0.01, scale: 0.98 },
      { r: R * 1.14, tube: 0.007, scale: 1.05 },
    ],
    []
  )

  return (
    <group ref={group}>
      {/* ambient halo */}
      <mesh material={haloMat} scale={1.35}>
        <sphereGeometry args={[R, 64, 64]} />
      </mesh>

      {/* fluid volume (backface) + shell (front) */}
      <mesh ref={volume} material={volumeMat}>
        <sphereGeometry args={[R * 0.98, 96, 96]} />
      </mesh>
      <mesh material={shellMat}>
        <sphereGeometry args={[R * 0.99, 96, 96]} />
      </mesh>

      {/* orbital rings */}
      <group ref={rings}>
        {ringSpecs.map((spec, i) => (
          <mesh key={i} material={ringMat} scale={spec.scale}>
            <torusGeometry args={[spec.r, spec.tube, 24, 128]} />
          </mesh>
        ))}
      </group>

      {/* god-ray billboard-ish plane above */}
      <mesh material={rayMat} position={[0, R * 0.55, 0]}>
        <planeGeometry args={[R * 0.55, R * 2.2]} />
      </mesh>
    </group>
  )
}

export const AETHER_PRESET = {
  aether: {
    name: 'Aether Orb',
    tagline: 'raymarched fluid · orbital rings · god-ray halo',
    chip: 'linear-gradient(135deg,#020814,#00d4ff 40%,#c44dff 70%,#e8f7ff)',
    env: 0.35,
    Component: AetherBall,
  },
}
