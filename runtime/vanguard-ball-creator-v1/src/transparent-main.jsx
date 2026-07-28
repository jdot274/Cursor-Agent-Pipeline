import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Spline from '@splinetool/react-spline'
import { THRESHOLD_SPLINE } from './spline/thresholdUrl.js'
import { isolateSphereViaRuntime } from './spline/isolateSphere.js'
import './transparent.css'

/**
 * Fully isolated Threshold Sphere host:
 * - Official @splinetool/react-spline
 * - onLoad: hide UI chrome by name (never getAllObjects — crashes this scene)
 * - Keep Sphere + lights visible
 */
function onSplineLoad(app) {
  let result = { ok: false }
  try {
    result = isolateSphereViaRuntime(app)
  } catch (err) {
    result = { ok: false, error: String(err?.message || err) }
  }
  try {
    app.setBackgroundColor?.('#000000')
  } catch {
    /* ignore */
  }
  try {
    app.requestRender?.()
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.__splineApp = app
    window.__thresholdIsolate = result
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="transparent-root" style={{ width: '100%', height: '100%', background: '#000' }}>
      <Spline
        scene={THRESHOLD_SPLINE}
        style={{ width: '100%', height: '100%' }}
        onLoad={onSplineLoad}
      />
    </div>
  </StrictMode>
)
