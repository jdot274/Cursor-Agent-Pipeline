import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import useSpline from '@splinetool/r3f-spline'

/** Official Spline export for Threshold Dark Ambient UI */
export const THRESHOLD_SPLINE =
  'https://prod.spline.design/SjNY5eqeMhj-USkx/scene.splinecode'

/**
 * Isolated Threshold Sphere — correct path for transparent / Tauri / level use:
 * 1. Load .splinecode with @splinetool/r3f-spline (never the public iframe)
 * 2. Mount ONLY nodes.Sphere + Sphere Material
 * 3. Drop all UI text, CTAs, nav, particles, rectangles
 * 4. No <color background> — caller owns alpha / clear
 */
function ThresholdSphereMesh({
  url = THRESHOLD_SPLINE,
  scale = 1,
  castShadow = true,
  receiveShadow = true,
}) {
  const { nodes, materials } = useSpline(url)
  const root = useRef()

  const geo = nodes?.Sphere?.geometry
  const mat = materials?.['Sphere Material']

  useLayoutEffect(() => {
    if (!root.current || !geo) return
    // temporary mesh to measure authored bounds
    const tmp = new THREE.Mesh(geo)
    const box = new THREE.Box3().setFromObject(tmp)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maxDim = Math.max(size.x, size.y, size.z, 1e-3)
    const s = (1.5 / maxDim) * scale
    root.current.scale.setScalar(s)
    root.current.position.set(-center.x * s, -center.y * s, -center.z * s)
  }, [geo, scale])

  if (!geo || !mat) return null

  return (
    <group name="ThresholdSphereIsolated">
      <group ref={root}>
        <mesh
          name="Sphere"
          geometry={geo}
          material={mat}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      </group>
    </group>
  )
}

export function ThresholdSphere(props) {
  return (
    <Suspense fallback={null}>
      <ThresholdSphereMesh {...props} />
    </Suspense>
  )
}

/** Lights-only companion for transparent windows (no scene background). */
export function ThresholdSphereTransparent({ intensity = 1.1, ...props }) {
  const lights = useMemo(
    () => (
      <>
        <hemisphereLight intensity={0.55 * intensity} color="#eaeaea" groundColor="#050505" />
        <directionalLight castShadow intensity={1.21 * intensity} position={[0, 2, 1.2]} />
      </>
    ),
    [intensity]
  )
  return (
    <group>
      {lights}
      <ThresholdSphere {...props} />
    </group>
  )
}

/** Ball Lab preset adapter */
export function ThresholdBall() {
  return (
    <group>
      <hemisphereLight intensity={0.45} color="#eaeaea" groundColor="#040605" />
      <directionalLight intensity={1.15} position={[0.35, 2.1, 1.35]} />
      <ThresholdSphere />
    </group>
  )
}
