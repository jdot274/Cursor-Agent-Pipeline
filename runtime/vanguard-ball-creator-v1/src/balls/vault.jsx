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
      uCut: { value: 0.28 },
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

/**
 * CYAN VAULT — nested cutaway relic matching the reference look:
 * polished metal outer shell (open top), glass swirl layers, hot core.
 */
export function CyanVaultBall({ accent, speed, engine }) {
  const uniforms = useEngineUniforms(accent, engine)
  const innerA = useRef()
  const innerB = useRef()
  const core = useRef()
  const group = useRef()

  useFrame((_, dt) => {
    const s = (speed ?? 1) * (engine?.scanSpeed ?? 1)
    uniforms.uTime.value += dt * s
    const t = uniforms.uTime.value
    if (innerA.current) innerA.current.rotation.y = t * 0.18
    if (innerB.current) innerB.current.rotation.y = -t * 0.28
    if (core.current?.material) {
      core.current.material.emissiveIntensity = 2.4 + Math.sin(t * 1.7) * 0.9
    }
    if (group.current) group.current.rotation.y = t * 0.08
  })

  const swirlMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
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
            // open top cutaway — soft rim at the lip
            if (p.y > uCut) discard;
            float lip = smoothstep(uCut, uCut - 0.08, p.y);

            // swirling liquid bands in spherical coords
            float lon = atan(p.z, p.x);
            float lat = asin(clamp(p.y, -1.0, 1.0));
            float swirl = lon * 2.2 + lat * 3.5 + uTime * 0.55;
            float n = vFbm3Hi(vec3(cos(swirl), sin(swirl), lat) * uNoise * 0.55
                              + vec3(0.0, uTime * 0.12, 0.0));
            float bands = smoothstep(0.35, 0.85, n) * lip;

            vec3 deep = vec3(0.01, 0.05, 0.18);
            vec3 mid = mix(vec3(0.05, 0.35, 0.85), uAccent, 0.55);
            vec3 hot = mix(vec3(0.55, 0.9, 1.0), vec3(1.0), 0.35);
            vec3 col = mix(deep, mid, bands);
            col = mix(col, hot, pow(bands, 2.2) * 0.65);

            vec3 V = normalize(cameraPosition - vWorldPos);
            float fres = pow(1.0 - abs(dot(normalize(vWorldNormal), V)), 2.4);
            col += mix(uAccent, hot, 0.5) * fres * 1.35 * uGlow;

            float a = (0.35 + bands * 0.55 + fres * 0.25) * lip * uIntensity;
            gl_FragColor = vec4(col, clamp(a, 0.0, 0.92));
          }
        `,
      }),
    [uniforms]
  )

  const accentColor = useMemo(() => new THREE.Color(accent), [accent])
  const shellBlue = useMemo(() => new THREE.Color('#0a3a8a'), [])

  return (
    <group ref={group}>
      {/* outer cutaway metal shell */}
      <mesh castShadow>
        <sphereGeometry args={[R, 160, 160]} />
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
              // soft bevel at the open lip
              float lip = 1.0 - smoothstep(uCut - 0.06, uCut, p.y);
              vec3 V = normalize(cameraPosition - vWorldPos);
              float fres = pow(1.0 - clamp(dot(normalize(vWorldNormal), V), 0.0, 1.0), 2.8);
              // equatorial seam groove
              float seam = smoothstep(0.04, 0.0, abs(p.y + 0.05));
              csm_DiffuseColor = vec4(mix(vec3(0.02, 0.08, 0.22), uAccent * 0.25, seam * 0.4), 1.0);
              csm_Emissive = mix(uAccent, vec3(0.4, 0.8, 1.0), 0.5) * fres * 0.55 * uGlow * lip;
              csm_Roughness = mix(0.12, 0.35, seam);
              csm_Metalness = 0.92 * lip;
            }
          `}
          color={shellBlue}
          metalness={0.95}
          roughness={0.14}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={1.6}
        />
      </mesh>

      {/* equatorial seam ring */}
      <mesh rotation-x={Math.PI / 2} position={[0, -0.04, 0]}>
        <torusGeometry args={[R * 0.995, 0.012, 12, 96]} />
        <meshPhysicalMaterial
          color="#061830"
          metalness={1}
          roughness={0.2}
          clearcoat={1}
        />
      </mesh>

      {/* glass swirl mid shell */}
      <mesh ref={innerA} material={swirlMat} scale={0.86}>
        <sphereGeometry args={[R, 128, 128]} />
      </mesh>

      {/* clear transmission shell */}
      <mesh scale={0.78} castShadow>
        <sphereGeometry args={[R, 96, 96]} />
        <MeshTransmissionMaterial
          samples={6}
          resolution={512}
          backside
          backsideThickness={0.2}
          thickness={0.45}
          roughness={0.06}
          transmission={1}
          ior={1.42}
          chromaticAberration={0.05}
          anisotropicBlur={0.2}
          distortion={0.15}
          distortionScale={0.3}
          temporalDistortion={0.06}
          attenuationDistance={1.4}
          attenuationColor="#1a6ab8"
          color="#7ec8ff"
        />
      </mesh>

      {/* secondary swirl (counter-rotating) */}
      <mesh ref={innerB} material={swirlMat} scale={0.62}>
        <sphereGeometry args={[R, 96, 96]} />
      </mesh>

      {/* hot core */}
      <mesh ref={core} scale={0.34}>
        <sphereGeometry args={[R, 64, 64]} />
        <meshStandardMaterial
          color="#e8f7ff"
          emissive={accentColor}
          emissiveIntensity={2.8}
          roughness={0.15}
          metalness={0.1}
          toneMapped={false}
        />
      </mesh>

      {/* bright specular highlight orb (fake studio catchlight) */}
      <mesh position={[-0.22, 0.28, 0.35]} scale={0.07}>
        <sphereGeometry args={[R, 24, 24]} />
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
    env: 1.35,
    Component: CyanVaultBall,
  },
}
