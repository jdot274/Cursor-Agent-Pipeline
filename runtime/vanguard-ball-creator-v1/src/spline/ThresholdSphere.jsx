import { Suspense, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import SplineLoader from '@splinetool/loader'
import { THRESHOLD_SPLINE, SPLINE_EXPORT_CAMERA } from './thresholdUrl.js'
import { isolateSphereViaThree } from './isolateSphere.js'

export { THRESHOLD_SPLINE, SPLINE_EXPORT_CAMERA }

/** Fit wrapper group so Spline scene sits at Ball Lab pedestal scale. */
export function fitObjectToSize(object, targetSize = 1.5) {
  if (!object) return 1
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) return 1
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)
  const maxDim = Math.max(size.x, size.y, size.z, 1e-3)
  const s = targetSize / maxDim
  object.scale.setScalar(s)
  const box2 = new THREE.Box3().setFromObject(object)
  const center2 = new THREE.Vector3()
  box2.getCenter(center2)
  object.position.sub(center2)
  return s
}

/**
 * Ball Lab path: SplineLoader via R3F useLoader (no clone — clone crashes Spline entities).
 * Fully isolates Sphere + lights; fits to lab scale.
 */
function ThresholdSplineScene({
  url = THRESHOLD_SPLINE,
  framing = 'lab',
  targetSize = 1.5,
  isolate = true,
}) {
  const splineScene = useLoader(SplineLoader, url)
  const wrap = useRef(null)
  const didIsolate = useRef(false)

  useLayoutEffect(() => {
    if (isolate && !didIsolate.current) {
      isolateSphereViaThree(splineScene)
      didIsolate.current = true
    }
    if (!wrap.current) return
    wrap.current.position.set(0, 0, 0)
    wrap.current.rotation.set(0, 0, 0)
    wrap.current.scale.set(1, 1, 1)
    if (framing === 'lab') {
      fitObjectToSize(wrap.current, targetSize)
    }
  }, [splineScene, framing, targetSize, isolate])

  return (
    <group ref={wrap} name="ThresholdSplineRoot">
      <primitive object={splineScene} />
    </group>
  )
}

export function ThresholdSphere(props) {
  return (
    <Suspense fallback={null}>
      <ThresholdSplineScene framing="lab" targetSize={1.5} {...props} />
    </Suspense>
  )
}

/** @deprecated Prefer react-spline host for transparent.html */
export function ThresholdSphereTransparent(props) {
  return (
    <Suspense fallback={null}>
      <ThresholdSplineScene framing="spline" isolate {...props} />
    </Suspense>
  )
}

export function SplineExportCameraRig() {
  return null
}

/** Ball Lab preset adapter */
export function ThresholdBall() {
  return (
    <group>
      <hemisphereLight intensity={0.45} color="#eaeaea" groundColor="#040605" />
      <directionalLight intensity={1.15} position={[0.35, 2.1, 1.35]} />
      <ThresholdSphere framing="lab" targetSize={1.5} />
    </group>
  )
}
