import { Suspense } from 'react'
import {
  Environment,
  Lightformer,
  ContactShadows,
  OrbitControls,
  Float,
} from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { PRESETS } from './balls/presets.jsx'

export default function Studio({ config }) {
  const preset = PRESETS[config.preset] ?? PRESETS.emerald
  const Ball = preset.Component
  return (
    <>
      <color attach="background" args={['#040605']} />
      <fog attach="fog" args={['#040605', 9, 18]} />

      <Suspense fallback={null}>
        {/* virtual photo studio: soft boxes + accent rim, black void */}
        <Environment resolution={256} key={config.accent}>
          <color attach="background" args={['#050706']} />
          <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 4, 0]} scale={[9, 9, 1]} form="rect" color="#f2fff8" />
          <Lightformer intensity={1.6} rotation-y={Math.PI / 2} position={[-5, 1, 0]} scale={[6, 1.4, 1]} form="rect" color="#dff5ea" />
          <Lightformer intensity={1.2} rotation-y={-Math.PI / 2} position={[5, 0.6, 0]} scale={[6, 1, 1]} form="rect" color="#ffffff" />
          <Lightformer intensity={2.4} rotation-y={Math.PI} position={[0, 1.2, -5]} scale={[7, 0.8, 1]} form="rect" color={config.accent} />
          <Lightformer intensity={0.8} position={[0, -2.5, 3]} scale={[6, 2, 1]} form="ring" color={config.accent} />
        </Environment>

        <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.5} floatingRange={[-0.04, 0.06]}>
          <group position={[0, 1.02, 0]}>
            <Ball accent={config.accent} speed={config.speed} />
          </group>
        </Float>

        {/* glass pedestal */}
        <mesh position={[0, 0.06, 0]} receiveShadow>
          <cylinderGeometry args={[0.95, 1.05, 0.12, 64]} />
          <meshPhysicalMaterial
            color="#0b1410"
            roughness={0.1}
            metalness={0.2}
            clearcoat={1}
            clearcoatRoughness={0.15}
          />
        </mesh>
        <mesh position={[0, 0.125, 0]} rotation-x={-Math.PI / 2}>
          <torusGeometry args={[0.9, 0.016, 12, 96]} />
          <meshBasicMaterial color={config.accent} toneMapped={false} />
        </mesh>

        <ContactShadows position={[0, 0, 0]} opacity={0.72} scale={8} blur={2.6} far={2.2} resolution={512} color="#000b06" />

        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
          <Vignette eskil={false} offset={0.18} darkness={0.82} />
        </EffectComposer>
      </Suspense>

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={2.4}
        maxDistance={7}
        minPolarAngle={0.35}
        maxPolarAngle={1.65}
        target={[0, 0.95, 0]}
        autoRotate
        autoRotateSpeed={0.7}
      />
    </>
  )
}
