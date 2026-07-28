/**
 * Minimal keep-set helper — copy into projects that only need the algorithm.
 * Full production helper lives in runtime/vanguard-ball-creator-v1/src/spline/isolateSphere.js
 */
export function collectKeepSet(scene) {
  const KEEP_NAME_RE =
    /^(Sphere|Camera|Directional Light|Default Ambient Light|Ambient Light|Point Light|Spot Light|Hemisphere Light|Scene)/i
  const keep = new Set([scene])
  scene.traverse((obj) => {
    const name = obj.name || ''
    const isKeeper =
      KEEP_NAME_RE.test(name) ||
      /sphere/i.test(name) ||
      obj.isLight === true ||
      obj.isCamera === true
    if (!isKeeper) return
    let p = obj
    while (p) {
      keep.add(p)
      p = p.parent
    }
  })
  return keep
}

export function isolateViaScene(app) {
  const scene = app?._scene
  if (!scene?.traverse) throw new Error('app._scene missing')
  const keep = collectKeepSet(scene)
  let foundSphere = false
  let hidden = 0
  scene.traverse((obj) => {
    if (obj === scene) return
    if (/sphere/i.test(obj.name || '')) foundSphere = true
    if (keep.has(obj)) {
      obj.visible = true
    } else {
      obj.visible = false
      hidden += 1
    }
  })
  return { foundSphere, hidden, via: 'scene-traverse' }
}
