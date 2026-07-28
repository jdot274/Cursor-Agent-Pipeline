import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ThresholdSphereTransparent } from './spline/ThresholdSphere.jsx'
import './transparent.css'

/**
 * Transparent / Tauri-ready host:
 * - No DOM chrome, no Spline iframe, no UI meshes
 * - Canvas alpha clear (0,0,0,0) for shaped transparent windows
 * - Only the isolated Threshold Sphere from .splinecode
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="transparent-root">
      <Canvas
        camera={{ position: [0, 0.2, 3.2], fov: 40 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          premultipliedAlpha: false,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
        }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <ThresholdSphereTransparent />
        <OrbitControls enablePan={false} minDistance={1.6} maxDistance={6} autoRotate autoRotateSpeed={0.55} />
      </Canvas>
    </div>
  </StrictMode>
)
