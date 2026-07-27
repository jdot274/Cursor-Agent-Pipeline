import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import CustomShaderMaterial from 'three-custom-shader-material'
import {
  NOISE_GLSL,
  VARYINGS_VERT,
  VARYINGS_FRAG_HEADER,
  RAW_VERT,
} from './shaderLib.js'

const R = 0.75

function useTimeUniforms(accent, engine) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAccent: { value: new THREE.Color(accent) },
      uIntensity: { value: 1 },
      uGlow: { value: 1 },
      uNoise: { value: 3.2 },
      uDisplace: { value: 0.12 },
      uRim: { value: 3 },
      uScan: { value: 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  uniforms.uAccent.value.set(accent)
  if (engine) {
    uniforms.uIntensity.value = engine.intensity ?? 1
    uniforms.uGlow.value = engine.glow ?? 1
    uniforms.uNoise.value = engine.noiseScale ?? 3.2
    uniforms.uDisplace.value = engine.displacement ?? 0.12
    uniforms.uRim.value = engine.rimPower ?? 3
    uniforms.uScan.value = engine.scanSpeed ?? 1
  }
  return uniforms
}

function useClock(uniforms, speed, engine) {
  useFrame((_, dt) => {
    const s = (speed ?? 1) * (engine?.scanSpeed ?? 1)
    uniforms.uTime.value += dt * s
  })
}

const VIEW_N = /* glsl */ `
  vec3 toViewNormal(vec3 worldN) {
    return normalize((viewMatrix * vec4(worldN, 0.0)).xyz);
  }
`

/* ═══ ORGANIC BLOB — vertex noise displacement, dual rim glow (collage hero) ═══ */
function OrganicBall({ accent, speed, engine }) {
  const uniforms = useTimeUniforms(accent, engine)
  useClock(uniforms, speed, engine)
  return (
    <mesh castShadow>
      <icosahedronGeometry args={[R, 64]} />
      <CustomShaderMaterial
        baseMaterial={THREE.MeshStandardMaterial}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec3 vObjPos;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;
          varying float vDisp;
          uniform float uTime;
          uniform float uNoise;
          uniform float uDisplace;
          ${NOISE_GLSL}
          void main() {
            vec3 n = normalize(position);
            float d = vFbm3Hi(n * uNoise + vec3(0.0, uTime * 0.35, 0.0));
            float d2 = vFbm3(n * (uNoise * 2.1) - vec3(uTime * 0.2));
            float h = (d * 0.7 + d2 * 0.3 - 0.45) * uDisplace * 2.4;
            vDisp = h;
            csm_Position = position + normal * h;
            vObjPos = csm_Position;
            vWorldPos = (modelMatrix * vec4(csm_Position, 1.0)).xyz;
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
          }
        `}
        fragmentShader={/* glsl */ `
          varying vec3 vObjPos;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;
          varying float vDisp;
          uniform float uTime;
          uniform vec3 uAccent;
          uniform float uIntensity;
          uniform float uGlow;
          uniform float uRim;
          ${NOISE_GLSL}
          void main() {
            vec3 wN = normalize(vWorldNormal);
            vec3 V = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - clamp(dot(wN, V), 0.0, 1.0), uRim);
            float bands = vFbm3(normalize(vObjPos) * 5.0 + uTime * 0.1);
            vec3 deep = vec3(0.02, 0.01, 0.04);
            vec3 mid = mix(vec3(0.35, 0.05, 0.12), uAccent, 0.55);
            vec3 col = mix(deep, mid, smoothstep(-0.05, 0.12, vDisp) * bands);
            // dual-tone rim: warm front, cool back (collage look)
            vec3 rimA = mix(vec3(1.0, 0.25, 0.15), uAccent, 0.3);
            vec3 rimB = vec3(0.2, 0.55, 1.0);
            float side = clamp(dot(wN, vec3(1.0, 0.0, 0.0)) * 0.5 + 0.5, 0.0, 1.0);
            vec3 rim = mix(rimB, rimA, side) * fres * 2.2 * uGlow;
            csm_DiffuseColor = vec4(col * uIntensity, 1.0);
            csm_Emissive = rim + col * max(vDisp, 0.0) * 4.0 * uGlow;
            csm_Roughness = 0.45;
          }
        `}
        roughness={0.45}
        metalness={0.05}
      />
    </mesh>
  )
}

/* ═══ PLASMA — swirling fluid energy sphere ═══ */
function PlasmaBall({ accent, speed, engine }) {
  const uniforms = useTimeUniforms(accent, engine)
  useClock(uniforms, speed, engine)
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: RAW_VERT,
        fragmentShader: /* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform float uTime;
          uniform vec3 uAccent;
          uniform float uIntensity;
          uniform float uGlow;
          uniform float uNoise;
          ${NOISE_GLSL}
          void main() {
            vec3 p = normalize(vObjPos);
            float t = uTime * 0.4;
            float n1 = vFbm3Hi(p * uNoise + vec3(t, -t * 0.6, t * 0.3));
            float n2 = vFbm3(p * (uNoise * 1.8) - vec3(t * 0.8, t, -t * 0.4));
            float flow = sin(n1 * 6.28 + n2 * 4.0);
            vec3 hot = mix(vec3(1.0, 0.35, 0.05), uAccent, 0.4);
            vec3 cool = mix(vec3(0.05, 0.15, 0.9), uAccent * 0.5, 0.3);
            vec3 col = mix(cool, hot, smoothstep(-0.4, 0.6, flow));
            col += hot * pow(max(n2, 0.0), 3.0) * 1.8;
            vec3 V = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - abs(dot(normalize(vWorldNormal), V)), 2.5);
            col += uAccent * fres * 1.4 * uGlow;
            gl_FragColor = vec4(col * uIntensity * 1.2, 1.0);
          }
        `,
      }),
    [uniforms]
  )
  return (
    <mesh material={mat} castShadow>
      <sphereGeometry args={[R, 128, 128]} />
    </mesh>
  )
}

/* ═══ POINT CLOUD ENERGY — glowing particle sphere ═══ */
function PointsBall({ accent, speed, engine }) {
  const uniforms = useTimeUniforms(accent, engine)
  useClock(uniforms, speed, engine)
  const geo = useMemo(() => {
    const N = 4200
    const pos = new Float32Array(N * 3)
    const seed = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      // fibonacci sphere
      const y = 1 - (i / (N - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const theta = Math.PI * (3 - Math.sqrt(5)) * i
      pos[i * 3] = Math.cos(theta) * r * R
      pos[i * 3 + 1] = y * R
      pos[i * 3 + 2] = Math.sin(theta) * r * R
      seed[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime;
          uniform float uDisplace;
          uniform float uNoise;
          varying float vA;
          varying float vSeed;
          ${NOISE_GLSL}
          void main() {
            vSeed = aSeed;
            vec3 n = normalize(position);
            float wave = vFbm3(n * uNoise + vec3(0.0, uTime * 0.5, 0.0));
            vec3 p = position + n * (wave - 0.5) * uDisplace * 1.8;
            float pulse = 0.55 + 0.45 * sin(uTime * (1.2 + aSeed * 2.0) + aSeed * 40.0);
            vA = pulse;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = (2.0 + aSeed * 4.5) * (220.0 / -mv.z) * 0.02;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uAccent;
          uniform float uIntensity;
          uniform float uGlow;
          varying float vA;
          varying float vSeed;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.05, d) * vA;
            vec3 col = mix(vec3(1.0), uAccent, 0.55 + vSeed * 0.35) * 2.4 * uGlow;
            gl_FragColor = vec4(col * uIntensity, a);
          }
        `,
      }),
    [uniforms]
  )
  return (
    <group>
      <points geometry={geo} material={mat} />
      <mesh>
        <sphereGeometry args={[R * 0.35, 32, 32]} />
        <meshBasicMaterial color={accent} transparent opacity={0.25} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ═══ TOPO / ZEBRA — high-contrast procedural bands on sphere ═══ */
function TopoBall({ accent, speed, engine }) {
  const uniforms = useTimeUniforms(accent, engine)
  useClock(uniforms, speed, engine)
  return (
    <mesh castShadow>
      <sphereGeometry args={[R, 160, 160]} />
      <CustomShaderMaterial
        baseMaterial={THREE.MeshStandardMaterial}
        uniforms={uniforms}
        vertexShader={VARYINGS_VERT}
        fragmentShader={/* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform float uTime;
          uniform vec3 uAccent;
          uniform float uIntensity;
          uniform float uGlow;
          uniform float uNoise;
          uniform float uRim;
          ${NOISE_GLSL}
          ${VIEW_N}
          void main() {
            vec3 p = normalize(vObjPos);
            float n = vFbm3Hi(p * uNoise + vec3(0.0, uTime * 0.08, 0.0));
            float bands = sin(n * 48.0);
            float line = smoothstep(0.0, 0.15, abs(bands));
            vec3 ink = vec3(0.02);
            vec3 glow = mix(vec3(0.0, 0.9, 1.0), uAccent, 0.5);
            vec3 col = mix(glow, ink, line);
            vec3 V = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - clamp(dot(normalize(vWorldNormal), V), 0.0, 1.0), uRim);
            csm_DiffuseColor = vec4(col * uIntensity, 1.0);
            csm_Emissive = glow * (1.0 - line) * 0.9 * uGlow + uAccent * fres * 0.5;
            csm_Roughness = 0.35;
          }
        `}
        roughness={0.35}
        metalness={0.1}
      />
    </mesh>
  )
}

/* ═══ CEL / TOON — quantized lighting + bold outline rim ═══ */
function CelBall({ accent, speed, engine }) {
  const uniforms = useTimeUniforms(accent, engine)
  useClock(uniforms, speed, engine)
  return (
    <mesh castShadow>
      <sphereGeometry args={[R, 96, 96]} />
      <CustomShaderMaterial
        baseMaterial={THREE.MeshStandardMaterial}
        uniforms={uniforms}
        vertexShader={VARYINGS_VERT}
        fragmentShader={/* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform vec3 uAccent;
          uniform float uIntensity;
          uniform float uGlow;
          uniform float uRim;
          void main() {
            vec3 N = normalize(vWorldNormal);
            vec3 V = normalize(cameraPosition - vWorldPos);
            vec3 L = normalize(vec3(0.4, 1.0, 0.3));
            float ndl = clamp(dot(N, L), 0.0, 1.0);
            // 4-band quantization
            float band = ndl < 0.2 ? 0.15 : ndl < 0.45 ? 0.4 : ndl < 0.75 ? 0.7 : 1.0;
            vec3 base = mix(uAccent * 0.25, uAccent, band) * uIntensity;
            float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), uRim);
            float outline = smoothstep(0.55, 0.75, rim);
            vec3 col = mix(base, vec3(0.02), outline);
            csm_DiffuseColor = vec4(col, 1.0);
            csm_Emissive = uAccent * (1.0 - outline) * band * 0.25 * uGlow;
            csm_Roughness = 0.55;
          }
        `}
        color={accent}
        roughness={0.55}
      />
    </mesh>
  )
}

/* ═══ ENERGY LATTICE — neon wireframe energy shell + displaced core ═══ */
function EnergyBall({ accent, speed, engine }) {
  const uniforms = useTimeUniforms(accent, engine)
  useClock(uniforms, speed, engine)
  const core = useRef()
  useFrame((state) => {
    if (core.current) {
      const t = state.clock.elapsedTime * (speed ?? 1) * (engine?.scanSpeed ?? 1)
      core.current.rotation.y = t * 0.5
      core.current.rotation.x = Math.sin(t * 0.3) * 0.4
    }
  })
  const shellMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        wireframe: true,
        vertexShader: /* glsl */ `
          varying vec3 vObjPos;
          varying vec3 vWorldNormal;
          uniform float uTime;
          uniform float uDisplace;
          uniform float uNoise;
          ${NOISE_GLSL}
          void main() {
            vec3 n = normalize(position);
            float h = (vFbm3(n * uNoise + uTime * 0.3) - 0.5) * uDisplace * 1.6;
            vec3 p = position + n * h;
            vObjPos = p;
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec3 vObjPos;
          varying vec3 vWorldNormal;
          uniform vec3 uAccent;
          uniform float uIntensity;
          uniform float uGlow;
          uniform float uTime;
          void main() {
            float pulse = 0.6 + 0.4 * sin(uTime * 2.0 + length(vObjPos) * 8.0);
            gl_FragColor = vec4(uAccent * 1.8 * pulse * uGlow * uIntensity, 0.85);
          }
        `,
      }),
    [uniforms]
  )
  return (
    <group>
      <mesh ref={core} scale={0.55}>
        <icosahedronGeometry args={[R, 2]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={(engine?.glow ?? 1) * 1.6}
          roughness={0.3}
          flatShading
        />
      </mesh>
      <mesh material={shellMat} castShadow>
        <icosahedronGeometry args={[R, 3]} />
      </mesh>
    </group>
  )
}

export const COLLAGE_PRESETS = {
  organic: {
    name: 'Organic Blob',
    tagline: 'vertex noise displace · dual rim glow',
    chip: 'linear-gradient(135deg,#1a0510,#c42a4a 50%,#3a7dff)',
    env: 0.9,
    Component: OrganicBall,
  },
  plasma: {
    name: 'Plasma Fluid',
    tagline: 'swirling hot/cold energy field',
    chip: 'linear-gradient(135deg,#0a1040,#ff6a1a 55%,#ffd36a)',
    env: 0.6,
    Component: PlasmaBall,
  },
  points: {
    name: 'Point Energy',
    tagline: 'fibonacci point cloud · additive glow',
    chip: 'linear-gradient(135deg,#041018,#3aff8e 60%,#eafff6)',
    env: 0.45,
    Component: PointsBall,
  },
  topo: {
    name: 'Topo Lines',
    tagline: 'high-contrast procedural zebra bands',
    chip: 'linear-gradient(135deg,#02080c,#00e5ff 50%,#02080c)',
    env: 0.8,
    Component: TopoBall,
  },
  cel: {
    name: 'Cel Shade',
    tagline: 'quantized toon bands · ink outline',
    chip: 'linear-gradient(135deg,#1a1208,#ff9d2e 55%,#ffe0a8)',
    env: 1.1,
    Component: CelBall,
  },
  energy: {
    name: 'Energy Lattice',
    tagline: 'neon wire shell · pulsing crystal core',
    chip: 'linear-gradient(135deg,#050214,#c04df0 55%,#8affff)',
    env: 0.5,
    Component: EnergyBall,
  },
}
