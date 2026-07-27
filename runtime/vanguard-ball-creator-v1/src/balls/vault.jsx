import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import CustomShaderMaterial from 'three-custom-shader-material'
import { NOISE_GLSL, RAW_VERT, VARYINGS_FRAG_HEADER } from './shaderLib.js'

const R = 0.75

function useEngineUniforms(accent, engine) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAccent: { value: new THREE.Color(accent) },
      uGlow: { value: 1 },
      uIntensity: { value: 1 },
      uNoise: { value: 3.2 },
      uScan: { value: 1 },
      // open the top enough that nested bowls read from the studio camera
      uCut: { value: 0.42 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  uniforms.uAccent.value.set(accent)
  if (engine) {
    uniforms.uGlow.value = engine.glow ?? 1
    uniforms.uIntensity.value = engine.intensity ?? 1
    uniforms.uNoise.value = engine.noiseScale ?? 3.2
    uniforms.uScan.value = engine.scanSpeed ?? 1
  }
  return uniforms
}

function CutawayShell({ radius, uniforms, color, metalness = 0.95, roughness = 0.14, thicknessHint = 0 }) {
  return (
    <mesh castShadow>
      <sphereGeometry args={[radius, 128, 128]} />
      <CustomShaderMaterial
        baseMaterial={THREE.MeshPhysicalMaterial}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec3 vObjPos;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;
          void main() {
            vObjPos = position;
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
          }
        `}
        fragmentShader={/* glsl */ `
          varying vec3 vObjPos;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;
          uniform float uCut;
          uniform vec3 uAccent;
          uniform float uGlow;
          void main() {
            vec3 p = normalize(vObjPos);
            if (p.y > uCut) discard;
            float lip = 1.0 - smoothstep(uCut - 0.05, uCut, p.y);
            vec3 V = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - clamp(dot(normalize(vWorldNormal), V), 0.0, 1.0), 2.6);
            float seam = smoothstep(0.035, 0.0, abs(p.y + 0.02));
            vec3 base = mix(vec3(0.015, 0.06, 0.18), uAccent * 0.2, 0.15 + seam * 0.35);
            csm_DiffuseColor = vec4(base, 1.0);
            csm_Emissive = mix(uAccent, vec3(0.45, 0.85, 1.0), 0.4) * fres * (0.4 + ${thicknessHint.toFixed(2)}) * uGlow * lip;
            csm_Roughness = mix(${roughness.toFixed(2)}, 0.32, seam);
            csm_Metalness = ${metalness.toFixed(2)} * lip;
          }
        `}
        color={color}
        metalness={metalness}
        roughness={roughness}
        clearcoat={1}
        clearcoatRoughness={0.08}
        envMapIntensity={1.5}
      />
    </mesh>
  )
}

/**
 * CYAN VAULT — nested cutaway relic (reference match):
 * polished metal outer bowl, nested glass/metal shells, swirl fluid, hot core.
 */
export function CyanVaultBall({ accent, speed, engine }) {
  const uniforms = useEngineUniforms(accent, engine)
  const swirlA = useRef()
  const swirlB = useRef()
  const core = useRef()
  const group = useRef()

  useFrame((_, dt) => {
    const s = (speed ?? 1) * (engine?.scanSpeed ?? 1)
    uniforms.uTime.value += dt * s
    const t = uniforms.uTime.value
    if (swirlA.current) swirlA.current.rotation.y = t * 0.22
    if (swirlB.current) swirlB.current.rotation.y = -t * 0.35
    if (core.current?.material) {
      core.current.material.emissiveIntensity = 1.6 + Math.sin(t * 1.6) * 0.5
    }
    if (group.current) group.current.rotation.y = t * 0.06
  })

  const swirlMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        vertexShader: RAW_VERT,
        fragmentShader: /* glsl */ `
          ${VARYINGS_FRAG_HEADER}
          uniform float uTime;
          uniform vec3 uAccent;
          uniform float uGlow;
          uniform float uIntensity;
          uniform float uNoise;
          uniform float uCut;
          ${NOISE_GLSL}
          void main() {
            vec3 p = normalize(vObjPos);
            if (p.y > uCut - 0.02) discard;
            float lip = smoothstep(uCut, uCut - 0.1, p.y);

            float lon = atan(p.z, p.x);
            float lat = asin(clamp(p.y, -1.0, 1.0));
            float swirl = lon * 2.4 + lat * 4.0 + uTime * 0.65;
            float n = vFbm3Hi(vec3(cos(swirl), sin(swirl), lat * 1.4) * (uNoise * 0.6)
                              + vec3(0.0, uTime * 0.15, 0.0));
            float bands = smoothstep(0.32, 0.88, n) * lip;

            vec3 deep = vec3(0.01, 0.04, 0.16);
            vec3 mid = mix(vec3(0.04, 0.32, 0.82), uAccent, 0.6);
            vec3 hot = vec3(0.65, 0.92, 1.0);
            vec3 col = mix(deep, mid, bands);
            col = mix(col, hot, pow(bands, 2.0) * 0.7);

            vec3 V = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - abs(dot(normalize(vWorldNormal), V)), 2.2);
            col += mix(uAccent, hot, 0.55) * fres * 1.2 * uGlow;

            float a = (0.28 + bands * 0.6 + fres * 0.3) * lip * uIntensity;
            gl_FragColor = vec4(col, clamp(a, 0.0, 0.88));
          }
        `,
      }),
    [uniforms]
  )

  const accentColor = useMemo(() => new THREE.Color(accent), [accent])
  const blueA = useMemo(() => new THREE.Color('#083a8c'), [])
  const blueB = useMemo(() => new THREE.Color('#0c4cb0'), [])
  const blueC = useMemo(() => new THREE.Color('#1560c8'), [])

  return (
    <group ref={group}>
      {/* outer metal vault */}
      <CutawayShell radius={R} uniforms={uniforms} color={blueA} metalness={0.96} roughness={0.12} thicknessHint={0.15} />

      {/* nested metal bowl 2 */}
      <CutawayShell radius={R * 0.9} uniforms={uniforms} color={blueB} metalness={0.9} roughness={0.16} thicknessHint={0.25} />

      {/* nested metal bowl 3 */}
      <CutawayShell radius={R * 0.8} uniforms={uniforms} color={blueC} metalness={0.88} roughness={0.18} thicknessHint={0.35} />

      {/* equatorial seam */}
      <mesh rotation-x={Math.PI / 2} position={[0, -0.02, 0]}>
        <torusGeometry args={[R * 0.992, 0.01, 10, 96]} />
        <meshPhysicalMaterial color="#041428" metalness={1} roughness={0.18} clearcoat={1} />
      </mesh>

      {/* glass transmission nest */}
      <mesh scale={0.72}>
        <sphereGeometry args={[R, 96, 96]} />
        <MeshTransmissionMaterial
          samples={7}
          resolution={640}
          backside
          backsideThickness={0.25}
          thickness={engine?.thickness ?? 0.55}
          roughness={0.05}
          transmission={1}
          ior={1.4}
          chromaticAberration={0.06}
          anisotropicBlur={0.18}
          distortion={0.12}
          distortionScale={0.28}
          temporalDistortion={0.05}
          attenuationDistance={1.2}
          attenuationColor="#1a6ab8"
          color="#8fd4ff"
        />
      </mesh>

      {/* counter-rotating swirl fluids */}
      <mesh ref={swirlA} material={swirlMat} scale={0.84}>
        <sphereGeometry args={[R, 112, 112]} />
      </mesh>
      <mesh ref={swirlB} material={swirlMat} scale={0.66}>
        <sphereGeometry args={[R, 96, 96]} />
      </mesh>

      {/* core — bright but not blown */}
      <mesh ref={core} scale={0.3}>
        <sphereGeometry args={[R, 64, 64]} />
        <meshStandardMaterial
          color="#f2faff"
          emissive={accentColor}
          emissiveIntensity={1.8}
          roughness={0.2}
          metalness={0.05}
          toneMapped={false}
        />
      </mesh>

      {/* studio catchlight */}
      <mesh position={[-0.2, 0.32, 0.38]} scale={0.055}>
        <sphereGeometry args={[R, 20, 20]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  )
}

export const VAULT_PRESET = {
  vault: {
    name: 'Cyan Vault',
    tagline: 'cutaway metal shell · glass swirl layers · hot core',
    chip: 'linear-gradient(135deg,#020b22,#0a4aaa 45%,#6ad0ff 75%,#ffffff)',
    env: 1.4,
    Component: CyanVaultBall,
  },
}
