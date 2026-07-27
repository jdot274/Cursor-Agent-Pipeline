import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import CustomShaderMaterial from 'three-custom-shader-material'
import {
  NOISE_GLSL,
  DIMPLE_GLSL,
  GLINT_GLSL,
  CHORD_GLSL,
  VARYINGS_VERT,
  VARYINGS_FRAG_HEADER,
  RAW_VERT,
} from './shaderLib.js'

const R = 0.75 // shared ball radius

function useAccent(accent) {
  return useMemo(() => new THREE.Color(accent), [accent])
}

function useTimeUniforms(accent) {
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uAccent: { value: new THREE.Color(accent) } }),
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

/* helper: view-space normal assignment used by every dimpled CSM material */
const VIEW_NORMAL_GLSL = /* glsl */ `
  vec3 toViewNormal(vec3 worldN) {
    return normalize((viewMatrix * vec4(worldN, 0.0)).xyz);
  }
`

/* ═══ 1. VANGUARD EMERALD — dimpled tournament ball, fbm depth banding,
       flake-glint BRDF, fresnel rim ═══ */
function EmeraldBall({ accent, speed }) {
  const uniforms = useTimeUniforms(accent)
  useClock(uniforms, speed)
  return (
    <mesh castShadow>
      <sphereGeometry args={[R, 128, 128]} />
      <CustomShaderMaterial
        baseMaterial={THREE.MeshPhysicalMaterial}
        uniforms={uniforms}
        vertexShader={VARYINGS_VERT}
        fragmentShader={/* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform float uTime;
          uniform vec3 uAccent;
          ${NOISE_GLSL}
          ${DIMPLE_GLSL}
          ${GLINT_GLSL}
          ${VIEW_NORMAL_GLSL}
          void main() {
            vec3 n = normalize(vObjPos);
            mat3 nMat = V_MODEL_ROT;
            vec3 wN = vDimpleNormal(n, normalize(vWorldNormal), 9.0, 0.028, nMat);
            vec3 V = normalize(cameraPosition - vWorldPos);

            // deep emerald body with slow fbm marbling
            float band = vFbm3Hi(n * 3.2 + vec3(0.0, uTime * 0.05, 0.0));
            vec3 deep = vec3(0.004, 0.055, 0.028);
            vec3 mid = vec3(0.012, 0.19, 0.09);
            vec3 base = mix(deep, mid, smoothstep(0.3, 0.75, band));
            base = mix(base, uAccent * 0.35, smoothstep(0.72, 0.95, band));

            float fres = pow(1.0 - clamp(dot(wN, V), 0.0, 1.0), 3.0);
            float glint = vGlint(vObjPos, wN, V, 42.0, 0.75, uTime);

            csm_DiffuseColor = vec4(base, 1.0);
            csm_Emissive = uAccent * (fres * 0.55) + vec3(1.0, 1.0, 0.9) * glint * 4.0;
            csm_Roughness = mix(0.34, 0.16, band) + vDimpleH(n, 9.0) * -0.08;
            csm_FragNormal = toViewNormal(wN);
          }
        `}
        clearcoat={1}
        clearcoatRoughness={0.1}
        metalness={0.08}
        roughness={0.3}
        color="#0a3320"
      />
    </mesh>
  )
}

/* ═══ 2. GHOST GLASS — backside-refracted frosted shell, drifting spark
       motes sealed inside, breathing crystal core ═══ */
function GhostParticles({ accent, speed }) {
  const uniforms = useTimeUniforms(accent)
  useClock(uniforms, speed)
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const N = 260
    const pos = new Float32Array(N * 3)
    const seed = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      // uniform-ish in sphere
      const v = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      )
      v.normalize().multiplyScalar(0.58 * Math.cbrt(Math.random()))
      pos.set([v.x, v.y, v.z], i * 3)
      seed[i] = Math.random()
    }
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
          varying float vTw;
          void main() {
            vec3 p = position;
            float t = uTime * 0.25 + aSeed * 6.28;
            p += vec3(sin(t + p.y * 8.0), cos(t * 0.8 + p.x * 7.0), sin(t * 1.2 + p.z * 6.0)) * 0.035;
            vTw = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (1.5 + aSeed * 2.0) + aSeed * 40.0), 3.0);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = (2.4 + aSeed * 3.2) * (280.0 / -mv.z) * 0.01;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uAccent;
          varying float vTw;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.05, d) * vTw;
            gl_FragColor = vec4(mix(vec3(1.0), uAccent, 0.6) * 2.2, a);
          }
        `,
      }),
    [uniforms]
  )
  return <points geometry={geo} material={mat} />
}

function GhostBall({ accent, speed }) {
  const core = useRef()
  const accentColor = useAccent(accent)
  useFrame((state) => {
    if (core.current) {
      const t = state.clock.elapsedTime * speed
      core.current.material.emissiveIntensity = 1.8 + Math.sin(t * 1.9) * 0.7
      core.current.rotation.y = t * 0.35
      core.current.rotation.z = Math.sin(t * 0.3) * 0.25
    }
  })
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[R, 128, 128]} />
        <MeshTransmissionMaterial
          samples={8}
          resolution={768}
          backside
          backsideThickness={0.28}
          thickness={0.7}
          roughness={0.08}
          transmission={1}
          ior={1.45}
          chromaticAberration={0.08}
          anisotropicBlur={0.3}
          distortion={0.32}
          distortionScale={0.55}
          temporalDistortion={0.1}
          attenuationDistance={2.2}
          attenuationColor="#cfeee0"
          color="#eafff5"
        />
      </mesh>
      <GhostParticles accent={accent} speed={speed} />
      <mesh ref={core} scale={0.3}>
        <icosahedronGeometry args={[R, 0]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={2}
          roughness={0.25}
          flatShading
        />
      </mesh>
    </group>
  )
}

/* ═══ 3. OIL SLICK — physical thin-film over black chrome with flowing
       oil-surface normals and spectral fresnel shimmer ═══ */
function OilSlickBall({ accent, speed }) {
  const uniforms = useTimeUniforms(accent)
  useClock(uniforms, speed)
  return (
    <mesh castShadow>
      <sphereGeometry args={[R, 128, 128]} />
      <CustomShaderMaterial
        baseMaterial={THREE.MeshPhysicalMaterial}
        uniforms={uniforms}
        vertexShader={VARYINGS_VERT}
        fragmentShader={/* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform float uTime;
          uniform vec3 uAccent;
          ${NOISE_GLSL}
          ${VIEW_NORMAL_GLSL}
          void main() {
            vec3 n = normalize(vObjPos);
            // flowing oil film: animated fbm gradient perturbs the normal
            float t = uTime * 0.12;
            vec3 fp = n * 4.0 + vec3(t, -t * 0.7, t * 0.4);
            float e = 0.05;
            vec3 up = abs(n.y) > 0.94 ? vec3(1,0,0) : vec3(0,1,0);
            vec3 T1 = normalize(cross(n, up));
            vec3 T2 = normalize(cross(n, T1));
            float g1 = vFbm3(fp + T1.xyz * e) - vFbm3(fp - T1.xyz * e);
            float g2 = vFbm3(fp + T2.xyz * e) - vFbm3(fp - T2.xyz * e);
            vec3 pn = normalize(n - (T1 * g1 + T2 * g2) * 1.4);
            vec3 wN = normalize(V_MODEL_ROT * pn);
            vec3 V = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - clamp(dot(wN, V), 0.0, 1.0), 2.2);
            // spectral shimmer keyed by view angle + flow
            float hue = dot(wN, V) * 2.2 + vFbm3(fp) * 1.6;
            vec3 spectral = vPalette(hue, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
            csm_DiffuseColor = vec4(vec3(0.015, 0.015, 0.02), 1.0);
            csm_Emissive = spectral * fres * 0.32 + uAccent * fres * fres * 0.18;
            csm_Roughness = 0.14 + vFbm3(fp * 2.0) * 0.1;
            csm_FragNormal = toViewNormal(wN);
          }
        `}
        color="#08080b"
        metalness={0.9}
        roughness={0.16}
        iridescence={1}
        iridescenceIOR={1.9}
        iridescenceThicknessRange={[120, 780]}
        clearcoat={1}
        clearcoatRoughness={0.06}
      />
    </mesh>
  )
}

/* ═══ 4. NEBULA — true interior volume: Beer-Lambert raymarched galaxy with
       embedded stars, sealed under a clear reflective shell ═══ */
function NebulaBall({ accent, speed }) {
  const uniforms = useTimeUniforms(accent)
  useClock(uniforms, speed)
  const volumeMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: RAW_VERT,
        fragmentShader: /* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform float uTime;
          uniform vec3 uAccent;
          ${NOISE_GLSL}
          ${CHORD_GLSL}
          void main() {
            float r = ${(R * 0.985).toFixed(4)};
            vec3 E = vWorldPos;
            vec3 D = normalize(vWorldPos - cameraPosition);
            float chord = vChord(E, D, vCenter, r);
            float rot = uTime * 0.06;
            mat3 spin = mat3(
              cos(rot), 0.0, sin(rot),
              0.0, 1.0, 0.0,
             -sin(rot), 0.0, cos(rot)
            );

            const int STEPS = 26;
            float dt = chord / float(STEPS);
            float trans = 1.0;
            vec3 col = vec3(0.0);
            vec3 nebB = vec3(0.16, 0.05, 0.42);
            for (int i = 0; i < STEPS; i++) {
              vec3 q = (E + D * (dt * (float(i) + 0.5)) - vCenter) / r; // unit ball coords
              vec3 s = spin * q;
              // disc-biased galaxy density
              float disc = exp(-abs(s.y) * 3.2);
              float swirl = vFbm3Hi(s * vec3(2.6, 4.6, 2.6) + vec3(0.0, 0.0, uTime * 0.02));
              float den = smoothstep(0.42, 0.85, swirl) * disc * (1.0 - length(q) * 0.55);
              // embedded stars: sparse bright cells, parallax-true
              float star = step(0.9982, vHash31(floor(s * 34.0))) * 3.5;
              vec3 dust = mix(nebB, uAccent, smoothstep(0.3, 0.9, swirl));
              vec3 emit = dust * den * 2.4 + vec3(star) * trans;
              col += emit * trans * dt * 2.2;
              trans *= exp(-den * dt * 3.4);
              if (trans < 0.02) break;
            }
            // hot galactic core
            float core = exp(-length((E + D * chord * 0.5) - vCenter) / r * 2.4);
            col += mix(uAccent, vec3(1.0), 0.4) * core * 0.5;
            // deep space floor so it never reads black-hole empty
            col += vec3(0.012, 0.008, 0.03) * trans;
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    [uniforms]
  )
  return (
    <group>
      <mesh material={volumeMat} castShadow>
        <sphereGeometry args={[R * 0.985, 96, 96]} />
      </mesh>
      <mesh>
        <sphereGeometry args={[R, 128, 128]} />
        <meshPhysicalMaterial
          transmission={1}
          thickness={0.1}
          roughness={0.03}
          ior={1.35}
          clearcoat={1}
          clearcoatRoughness={0.05}
          color="#ffffff"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/* ═══ 5. MOLTEN CORE — displaced basalt crust, parallax-deep magma veins,
       pulsing interior heat ═══ */
function MoltenBall({ accent, speed }) {
  const uniforms = useTimeUniforms(accent)
  useClock(uniforms, speed)
  return (
    <mesh castShadow>
      <sphereGeometry args={[R, 160, 160]} />
      <CustomShaderMaterial
        baseMaterial={THREE.MeshStandardMaterial}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec3 vObjPos;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;
          varying vec3 vCenter;
          uniform float uTime;
          ${NOISE_GLSL}
          void main() {
            vObjPos = position;
            vec3 n = normalize(position);
            // crust relief: plates rise, cracks sink
            vec2 vor = vVoronoi3(n * 4.0 + vFbm3(n * 3.0) * 0.6);
            float sink = smoothstep(0.22, 0.02, vor.y);
            float relief = vFbm3(n * 7.0) * 0.03 - sink * 0.045;
            csm_Position = position + normal * relief;
            vWorldPos = (modelMatrix * vec4(csm_Position, 1.0)).xyz;
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            vCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          }
        `}
        fragmentShader={/* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform float uTime;
          uniform vec3 uAccent;
          ${NOISE_GLSL}
          ${VIEW_NORMAL_GLSL}
          void main() {
            vec3 n = normalize(vObjPos);
            vec3 V = normalize(cameraPosition - vWorldPos);
            vec3 wN = normalize(vWorldNormal);
            // parallax: sample the vein layer deeper along the view ray
            vec3 Vt = normalize(V - wN * dot(V, wN) + 1e-5);
            vec3 warp = vec3(vFbm3(n * 3.0)) * 0.6;
            vec2 vSurf = vVoronoi3(n * 4.0 + warp);
            vec3 nDeep = normalize(n - Vt * 0.16);
            vec2 vDeep = vVoronoi3(nDeep * 4.0 + warp);
            float crackS = smoothstep(0.20, 0.03, vSurf.y);
            float crackD = smoothstep(0.30, 0.02, vDeep.y);
            float pulse = 0.7 + 0.3 * sin(uTime * 1.6 + vSurf.x * 8.0);
            float flow = vFbm3Hi(n * 6.0 - vec3(0.0, uTime * 0.22, 0.0));

            vec3 crust = mix(vec3(0.045, 0.038, 0.042), vec3(0.11, 0.10, 0.105), flow);
            crust *= 1.0 - crackS * 0.85;
            vec3 hot = vec3(1.0, 0.26, 0.02);
            vec3 magma = mix(hot, uAccent, 0.22) * (1.1 + flow * 0.9);
            // deep veins glow through even where the surface is closed
            vec3 glow = magma * (crackS * 1.9 + crackD * 0.9) * pulse;
            float rim = pow(1.0 - clamp(dot(wN, V), 0.0, 1.0), 3.5);

            csm_DiffuseColor = vec4(crust, 1.0);
            csm_Emissive = glow + magma * rim * 0.14 * pulse;
            csm_Roughness = mix(0.78, 0.25, crackS);
          }
        `}
        roughness={0.7}
        metalness={0.04}
      />
    </mesh>
  )
}

/* ═══ 6. ROYAL PEARL — dimpled nacre: sheen, angular rainbow shimmer,
       soft subsurface ═══ */
function PearlBall({ accent, speed }) {
  const uniforms = useTimeUniforms(accent)
  useClock(uniforms, speed)
  return (
    <mesh castShadow>
      <sphereGeometry args={[R, 128, 128]} />
      <CustomShaderMaterial
        baseMaterial={THREE.MeshPhysicalMaterial}
        uniforms={uniforms}
        vertexShader={VARYINGS_VERT}
        fragmentShader={/* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform float uTime;
          uniform vec3 uAccent;
          ${NOISE_GLSL}
          ${DIMPLE_GLSL}
          ${VIEW_NORMAL_GLSL}
          void main() {
            vec3 n = normalize(vObjPos);
            mat3 nMat = V_MODEL_ROT;
            vec3 wN = vDimpleNormal(n, normalize(vWorldNormal), 9.0, 0.022, nMat);
            vec3 V = normalize(cameraPosition - vWorldPos);
            float nv = clamp(dot(wN, V), 0.0, 1.0);
            float fres = pow(1.0 - nv, 2.4);
            // nacre interference shimmer sweeps with view angle
            float layer = vFbm3(n * 5.0) * 0.8;
            vec3 nacre = vPalette(nv * 1.4 + layer, vec3(0.5), vec3(0.22),
                                  vec3(1.0), vec3(0.0, 0.33, 0.67));
            csm_DiffuseColor = vec4(vec3(0.94, 0.92, 0.88), 1.0);
            csm_Emissive = nacre * fres * 0.35 + uAccent * fres * fres * 0.22;
            csm_Roughness = 0.3 + vDimpleH(n, 9.0) * -0.06;
            csm_FragNormal = toViewNormal(wN);
          }
        `}
        color="#f4f1ea"
        roughness={0.3}
        metalness={0}
        sheen={1}
        sheenRoughness={0.35}
        sheenColor="#dfe8ff"
        iridescence={0.45}
        iridescenceIOR={1.3}
        iridescenceThicknessRange={[80, 340]}
        clearcoat={1}
        clearcoatRoughness={0.2}
        transmission={0.1}
        thickness={0.9}
      />
    </mesh>
  )
}

/* ═══ 7. LIQUID CHROME — dimpled mirror, breathing ripple, anisotropic
       highlight, accent fresnel edge ═══ */
function ChromeBall({ accent, speed }) {
  const uniforms = useTimeUniforms(accent)
  useClock(uniforms, speed)
  return (
    <mesh castShadow>
      <sphereGeometry args={[R, 192, 192]} />
      <CustomShaderMaterial
        baseMaterial={THREE.MeshPhysicalMaterial}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec3 vObjPos;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;
          varying vec3 vCenter;
          uniform float uTime;
          ${NOISE_GLSL}
          void main() {
            vObjPos = position;
            float ripple = vFbm3(normalize(position) * 3.2 + vec3(0.0, uTime * 0.3, 0.0));
            csm_Position = position + normal * (ripple - 0.5) * 0.05;
            vWorldPos = (modelMatrix * vec4(csm_Position, 1.0)).xyz;
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            vCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          }
        `}
        fragmentShader={/* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform float uTime;
          uniform vec3 uAccent;
          ${NOISE_GLSL}
          ${DIMPLE_GLSL}
          ${VIEW_NORMAL_GLSL}
          void main() {
            vec3 n = normalize(vObjPos);
            mat3 nMat = V_MODEL_ROT;
            vec3 wN = vDimpleNormal(n, normalize(vWorldNormal), 9.0, 0.03, nMat);
            vec3 V = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - clamp(dot(wN, V), 0.0, 1.0), 3.2);
            csm_Emissive = uAccent * fres * 0.3;
            csm_Roughness = 0.045
              + vFbm3(n * 9.0 + uTime * 0.08) * 0.05
              + vDimpleH(n, 9.0) * -0.04;
            csm_FragNormal = toViewNormal(wN);
          }
        `}
        metalness={1}
        roughness={0.05}
        anisotropy={0.5}
        clearcoat={0.7}
        clearcoatRoughness={0.08}
        color="#eef1f4"
      />
    </mesh>
  )
}

/* ═══ 8. HOLO GRID — additive hologram shell (scanlines, lat/lon grid,
       glitch bands), spinning equator ring, wire core ═══ */
function HoloBall({ accent, speed }) {
  const uniforms = useTimeUniforms(accent)
  useClock(uniforms, speed)
  const wire = useRef()
  const ring = useRef()
  const accentColor = useAccent(accent)
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed
    if (wire.current) wire.current.rotation.y = -t * 0.3
    if (ring.current) {
      ring.current.rotation.z = t * 0.45
      ring.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.4) * 0.22
    }
  })
  const holoMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        vertexShader: RAW_VERT,
        fragmentShader: /* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform float uTime;
          uniform vec3 uAccent;
          ${NOISE_GLSL}
          void main() {
            vec3 p = normalize(vObjPos);
            vec3 V = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - abs(dot(normalize(vWorldNormal), V)), 1.7);
            // glitch: whole latitude bands shear sideways for a frame
            float band = floor(p.y * 14.0);
            float glitchGate = step(0.94, vHash11(band + floor(uTime * 9.0) * 91.7));
            float lon = atan(p.z, p.x) + glitchGate * 0.55;
            float lat = asin(clamp(p.y, -1.0, 1.0));
            float scan = smoothstep(0.5, 1.0, 0.5 + 0.5 * sin(p.y * 64.0 - uTime * 3.4)) * 0.45;
            float grid = smoothstep(0.93, 1.0, cos(lon * 28.0)) + smoothstep(0.93, 1.0, cos(lat * 28.0));
            float dataRain = smoothstep(0.85, 1.0,
              vNoise3(vec3(lon * 6.0, lat * 6.0 - uTime * 0.9, 3.7))) * 0.6;
            float a = fres * 0.85 + scan + grid * 0.4 + dataRain + glitchGate * 0.25;
            vec3 col = uAccent * (0.55 + fres * 1.8) + vec3(0.4, 1.0, 0.9) * dataRain * 0.6;
            gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * 0.8);
          }
        `,
      }),
    [uniforms]
  )
  return (
    <group>
      <mesh ref={wire} scale={0.52}>
        <icosahedronGeometry args={[R, 1]} />
        <meshBasicMaterial color={accentColor} wireframe transparent opacity={0.65} />
      </mesh>
      <mesh ref={ring}>
        <torusGeometry args={[R * 1.18, 0.008, 8, 128]} />
        <meshBasicMaterial color={accentColor} toneMapped={false} transparent opacity={0.8} />
      </mesh>
      <mesh material={holoMat}>
        <sphereGeometry args={[R, 128, 128]} />
      </mesh>
    </group>
  )
}

import { COLLAGE_PRESETS } from './collage.jsx'
import { VAULT_PRESET } from './vault.jsx'
import { AETHER_PRESET } from './aether.jsx'

export const PRESETS = {
  emerald: {
    name: 'Vanguard Emerald',
    tagline: 'dimpled tournament ball · flake glints · fbm depths',
    chip: 'linear-gradient(135deg,#02180c,#0f8a4d 55%,#3aff8e)',
    env: 1.0,
    Component: EmeraldBall,
  },
  ghost: {
    name: 'Ghost Glass',
    tagline: 'backside refraction · spark motes · crystal core',
    chip: 'linear-gradient(135deg,#233030,#9fc9bd 60%,#eafff6)',
    env: 1.15,
    Component: GhostBall,
  },
  oilslick: {
    name: 'Oil Slick',
    tagline: 'thin-film interference · flowing oil normals',
    chip: 'linear-gradient(135deg,#0b0b10,#3b2a63 40%,#1d6a5a 75%,#7a2a4e)',
    env: 1.35,
    Component: OilSlickBall,
  },
  nebula: {
    name: 'Nebula',
    tagline: 'raymarched interior galaxy · parallax stars',
    chip: 'linear-gradient(135deg,#050214,#4b0d8a 50%,#c04df0)',
    env: 0.55,
    Component: NebulaBall,
  },
  molten: {
    name: 'Molten Core',
    tagline: 'displaced crust · parallax magma veins · heat pulse',
    chip: 'linear-gradient(135deg,#150d0b,#8a2b05 55%,#ffb02e)',
    env: 0.7,
    Component: MoltenBall,
  },
  pearl: {
    name: 'Royal Pearl',
    tagline: 'dimpled nacre · angular rainbow · silk sheen',
    chip: 'linear-gradient(135deg,#d8d2c8,#fdfbf7 55%,#c9d8ff)',
    env: 1.25,
    Component: PearlBall,
  },
  chrome: {
    name: 'Liquid Chrome',
    tagline: 'dimpled mirror · breathing ripple · anisotropy',
    chip: 'linear-gradient(135deg,#54595e,#d8dee2 55%,#8e979e)',
    env: 1.4,
    Component: ChromeBall,
  },
  holo: {
    name: 'Holo Grid',
    tagline: 'hologram shell · glitch bands · data rain · orbit ring',
    chip: 'linear-gradient(135deg,#001410,#00ffd0 65%,#8affff)',
    env: 0.5,
    Component: HoloBall,
  },
  ...COLLAGE_PRESETS,
  ...VAULT_PRESET,
  ...AETHER_PRESET,
}
