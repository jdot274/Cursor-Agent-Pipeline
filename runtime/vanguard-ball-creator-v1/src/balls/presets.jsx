import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import CustomShaderMaterial from 'three-custom-shader-material'
import { NOISE_GLSL, VARYINGS_VERT, VARYINGS_FRAG_HEADER } from './shaderLib.js'

const R = 0.75 // ball radius shared by every preset

function useAccent(accent) {
  return useMemo(() => new THREE.Color(accent), [accent])
}

function useTimeUniforms(accent, extra = {}) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAccent: { value: new THREE.Color(accent) },
      ...extra,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  uniforms.uAccent.value.set(accent)
  return uniforms
}

function useClock(uniforms, speed) {
  useFrame((_, dt) => {
    uniforms.uTime.value += dt * speed
  })
}

/* ── 1. VANGUARD EMERALD — fbm banding + fresnel rim + sparkle flecks over clearcoat PBR ── */
function EmeraldBall({ accent, speed }) {
  const uniforms = useTimeUniforms(accent)
  useClock(uniforms, speed)
  return (
    <mesh castShadow>
      <sphereGeometry args={[R, 96, 96]} />
      <CustomShaderMaterial
        baseMaterial={THREE.MeshPhysicalMaterial}
        uniforms={uniforms}
        vertexShader={VARYINGS_VERT}
        fragmentShader={/* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform float uTime;
          uniform vec3 uAccent;
          ${NOISE_GLSL}
          void main() {
            vec3 p = normalize(vObjPos);
            float band = vFbm3(p * 3.0 + vec3(0.0, uTime * 0.08, 0.0));
            vec3 deep = vec3(0.008, 0.10, 0.05);
            vec3 base = mix(deep, uAccent * 0.55, smoothstep(0.25, 0.85, band));
            vec3 V = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - clamp(dot(normalize(vWorldNormal), V), 0.0, 1.0), 2.6);
            // sparkle flecks: sparse hashed cells, twinkling
            float cell = vHash31(floor(vObjPos * 26.0));
            float glint = step(0.982, cell) * (0.5 + 0.5 * sin(uTime * 4.0 + cell * 80.0));
            csm_DiffuseColor = vec4(base, 1.0);
            csm_Emissive = uAccent * (fres * 0.9 + glint * 3.0);
            csm_Roughness = mix(0.32, 0.12, band);
          }
        `}
        clearcoat={1}
        clearcoatRoughness={0.12}
        metalness={0.1}
        roughness={0.3}
        color="#0a3320"
      />
    </mesh>
  )
}

/* ── 2. GHOST GLASS — frosted transmission shell around a glowing core ── */
function GhostBall({ accent, speed }) {
  const core = useRef()
  const accentColor = useAccent(accent)
  useFrame((state) => {
    if (core.current) {
      const t = state.clock.elapsedTime * speed
      core.current.material.emissiveIntensity = 2.2 + Math.sin(t * 2.1) * 0.9
      core.current.rotation.y = t * 0.4
    }
  })
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[R, 96, 96]} />
        <MeshTransmissionMaterial
          samples={6}
          resolution={512}
          thickness={0.8}
          roughness={0.14}
          transmission={1}
          ior={1.4}
          chromaticAberration={0.06}
          anisotropicBlur={0.35}
          distortion={0.4}
          distortionScale={0.5}
          temporalDistortion={0.12}
          color="#dfeee8"
        />
      </mesh>
      <mesh ref={core} scale={0.36}>
        <icosahedronGeometry args={[R, 1]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={2.5}
          roughness={0.3}
          flatShading
        />
      </mesh>
    </group>
  )
}

/* ── 3. OIL SLICK — thin-film iridescence over near-black clearcoat metal ── */
function OilSlickBall({ accent }) {
  const accentColor = useAccent(accent)
  return (
    <mesh castShadow>
      <sphereGeometry args={[R, 96, 96]} />
      <meshPhysicalMaterial
        color="#08080b"
        metalness={0.92}
        roughness={0.16}
        iridescence={1}
        iridescenceIOR={1.9}
        iridescenceThicknessRange={[120, 780]}
        clearcoat={1}
        clearcoatRoughness={0.08}
        sheen={0.4}
        sheenColor={accentColor}
      />
    </mesh>
  )
}

/* ── 4. NEBULA — animated fbm galaxy core sealed inside a clear glass shell ── */
function NebulaBall({ accent, speed }) {
  const uniforms = useTimeUniforms(accent)
  useClock(uniforms, speed)
  const nebulaMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: /* glsl */ `
          varying vec3 vObjPos;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;
          void main() {
            vObjPos = position;
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec3 vObjPos;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;
          uniform float uTime;
          uniform vec3 uAccent;
          ${NOISE_GLSL}
          void main() {
            vec3 p = normalize(vObjPos);
            float t = uTime * 0.05;
            float n1 = vFbm3(p * 2.6 + vec3(t, -t * 0.6, t * 0.3));
            float n2 = vFbm3(p * 5.2 - vec3(t * 0.8, t, -t * 0.5));
            vec3 space = vec3(0.012, 0.008, 0.035);
            vec3 dust = mix(vec3(0.30, 0.06, 0.55), uAccent, n2);
            vec3 col = space + dust * smoothstep(0.35, 0.95, n1) * 1.6;
            // pin-prick stars
            float star = step(0.9965, vHash31(floor(vObjPos * 42.0)));
            col += star * vec3(2.2);
            // hot core through the poles axis
            float core = pow(1.0 - abs(p.y), 3.0);
            col += uAccent * core * 0.35;
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    [uniforms]
  )
  return (
    <group>
      <mesh material={nebulaMat} scale={0.94}>
        <sphereGeometry args={[R, 80, 80]} />
      </mesh>
      <mesh castShadow>
        <sphereGeometry args={[R, 96, 96]} />
        <meshPhysicalMaterial
          transmission={1}
          thickness={0.35}
          roughness={0.04}
          ior={1.45}
          color="#ffffff"
          transparent
        />
      </mesh>
    </group>
  )
}

/* ── 5. MOLTEN CORE — basalt crust split by pulsing voronoi magma channels ── */
function MoltenBall({ accent, speed }) {
  const uniforms = useTimeUniforms(accent)
  useClock(uniforms, speed)
  return (
    <mesh castShadow>
      <sphereGeometry args={[R, 96, 96]} />
      <CustomShaderMaterial
        baseMaterial={THREE.MeshStandardMaterial}
        uniforms={uniforms}
        vertexShader={VARYINGS_VERT}
        fragmentShader={/* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform float uTime;
          uniform vec3 uAccent;
          ${NOISE_GLSL}
          void main() {
            vec3 p = normalize(vObjPos);
            vec2 vor = vVoronoi3(p * 4.0 + vFbm3(p * 3.0) * 0.6);
            float crack = smoothstep(0.16, 0.02, vor.y);
            float pulse = 0.65 + 0.35 * sin(uTime * 1.8 + vor.x * 9.0);
            float flow = vFbm3(p * 6.0 - vec3(0.0, uTime * 0.25, 0.0));
            vec3 crust = mix(vec3(0.055, 0.045, 0.05), vec3(0.10, 0.09, 0.095), flow);
            vec3 magma = mix(vec3(1.0, 0.28, 0.02), uAccent, 0.25) * (1.2 + flow);
            csm_DiffuseColor = vec4(mix(crust, magma * 0.2, crack), 1.0);
            csm_Emissive = magma * crack * pulse * 2.6;
            csm_Roughness = mix(0.75, 0.3, crack);
          }
        `}
        roughness={0.7}
        metalness={0.05}
      />
    </mesh>
  )
}

/* ── 6. ROYAL PEARL — sheen + soft iridescence + faint subsurface glow ── */
function PearlBall({ accent }) {
  const accentColor = useAccent(accent)
  return (
    <mesh castShadow>
      <sphereGeometry args={[R, 96, 96]} />
      <meshPhysicalMaterial
        color="#f6f3ee"
        roughness={0.32}
        metalness={0}
        sheen={1}
        sheenRoughness={0.4}
        sheenColor={accentColor}
        iridescence={0.4}
        iridescenceIOR={1.3}
        iridescenceThicknessRange={[80, 320]}
        clearcoat={0.9}
        clearcoatRoughness={0.25}
        transmission={0.12}
        thickness={0.8}
      />
    </mesh>
  )
}

/* ── 7. LIQUID CHROME — mirror metal with slow breathing surface ripple ── */
function ChromeBall({ accent, speed }) {
  const uniforms = useTimeUniforms(accent)
  useClock(uniforms, speed)
  return (
    <mesh castShadow>
      <sphereGeometry args={[R, 160, 160]} />
      <CustomShaderMaterial
        baseMaterial={THREE.MeshPhysicalMaterial}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec3 vObjPos;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;
          uniform float uTime;
          ${NOISE_GLSL}
          void main() {
            vObjPos = position;
            float ripple = vFbm3(normalize(position) * 3.5 + vec3(0.0, uTime * 0.35, 0.0));
            csm_Position = position + normal * (ripple - 0.5) * 0.055;
            vWorldPos = (modelMatrix * vec4(csm_Position, 1.0)).xyz;
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
          }
        `}
        fragmentShader={/* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform float uTime;
          uniform vec3 uAccent;
          ${NOISE_GLSL}
          void main() {
            vec3 V = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - clamp(dot(normalize(vWorldNormal), V), 0.0, 1.0), 3.0);
            csm_Emissive = uAccent * fres * 0.35;
            csm_Roughness = 0.05 + vFbm3(normalize(vObjPos) * 8.0 + uTime * 0.1) * 0.06;
          }
        `}
        metalness={1}
        roughness={0.06}
        clearcoat={0.6}
        clearcoatRoughness={0.1}
        color="#e8ecef"
      />
    </mesh>
  )
}

/* ── 8. HOLO GRID — additive fresnel hologram shell over a counter-rotating wire core ── */
function HoloBall({ accent, speed }) {
  const uniforms = useTimeUniforms(accent)
  useClock(uniforms, speed)
  const wire = useRef()
  const accentColor = useAccent(accent)
  useFrame((state) => {
    if (wire.current) wire.current.rotation.y = -state.clock.elapsedTime * 0.3 * speed
  })
  const holoMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        vertexShader: /* glsl */ `
          varying vec3 vObjPos;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;
          void main() {
            vObjPos = position;
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec3 vObjPos;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;
          uniform float uTime;
          uniform vec3 uAccent;
          ${NOISE_GLSL}
          void main() {
            vec3 p = normalize(vObjPos);
            vec3 V = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - abs(dot(normalize(vWorldNormal), V)), 1.8);
            // latitude scanlines sweeping upward
            float scan = 0.5 + 0.5 * sin(p.y * 60.0 - uTime * 3.0);
            scan = smoothstep(0.55, 1.0, scan) * 0.5;
            // longitude/latitude dot grid
            float lon = atan(p.z, p.x), lat = asin(clamp(p.y, -1.0, 1.0));
            float grid = smoothstep(0.92, 1.0, cos(lon * 24.0)) + smoothstep(0.92, 1.0, cos(lat * 24.0));
            float glitch = step(0.97, vHash11(floor(uTime * 8.0))) * 0.4;
            float a = fres * 0.9 + scan + grid * 0.35 + glitch;
            gl_FragColor = vec4(uAccent * (0.6 + fres * 1.6), clamp(a, 0.0, 1.0) * 0.85);
          }
        `,
      }),
    [uniforms]
  )
  return (
    <group>
      <mesh ref={wire} scale={0.55}>
        <icosahedronGeometry args={[R, 1]} />
        <meshBasicMaterial color={accentColor} wireframe transparent opacity={0.7} />
      </mesh>
      <mesh material={holoMat}>
        <sphereGeometry args={[R, 96, 96]} />
      </mesh>
    </group>
  )
}

export const PRESETS = {
  emerald: {
    name: 'Vanguard Emerald',
    tagline: 'fbm banding · fresnel rim · sparkle flecks',
    chip: 'linear-gradient(135deg,#02180c,#0f8a4d 55%,#3aff8e)',
    Component: EmeraldBall,
  },
  ghost: {
    name: 'Ghost Glass',
    tagline: 'frosted transmission · glowing core',
    chip: 'linear-gradient(135deg,#233030,#9fc9bd 60%,#eafff6)',
    Component: GhostBall,
  },
  oilslick: {
    name: 'Oil Slick',
    tagline: 'thin-film iridescence · black chrome',
    chip: 'linear-gradient(135deg,#0b0b10,#3b2a63 40%,#1d6a5a 75%,#7a2a4e)',
    Component: OilSlickBall,
  },
  nebula: {
    name: 'Nebula',
    tagline: 'galaxy fbm core · glass shell · stars',
    chip: 'linear-gradient(135deg,#050214,#4b0d8a 50%,#c04df0)',
    Component: NebulaBall,
  },
  molten: {
    name: 'Molten Core',
    tagline: 'voronoi magma cracks · pulsing heat',
    chip: 'linear-gradient(135deg,#150d0b,#8a2b05 55%,#ffb02e)',
    Component: MoltenBall,
  },
  pearl: {
    name: 'Royal Pearl',
    tagline: 'silk sheen · soft iridescence · subsurface',
    chip: 'linear-gradient(135deg,#d8d2c8,#fdfbf7 55%,#c9d8ff)',
    Component: PearlBall,
  },
  chrome: {
    name: 'Liquid Chrome',
    tagline: 'breathing mirror metal · accent fresnel',
    chip: 'linear-gradient(135deg,#54595e,#d8dee2 55%,#8e979e)',
    Component: ChromeBall,
  },
  holo: {
    name: 'Holo Grid',
    tagline: 'additive hologram · scanlines · wire core',
    chip: 'linear-gradient(135deg,#001410,#00ffd0 65%,#8affff)',
    Component: HoloBall,
  },
}
