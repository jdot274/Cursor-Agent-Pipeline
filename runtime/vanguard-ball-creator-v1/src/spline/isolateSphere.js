/**
 * Full isolation for Threshold Dark Ambient.
 * Prefer Three.js `_scene` traverse — app.getAllObjects() / some findObjectByName
 * targets (Particle Emitter) throw on this .splinecode.
 */

const KEEP_NAME_RE =
  /^(Sphere|Camera|Directional Light|Default Ambient Light|Ambient Light|Point Light|Spot Light|Hemisphere Light|Scene)/i

function collectKeepSet(scene) {
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

/**
 * Isolate Sphere-only via Spline runtime Application.
 * Uses app._scene (Three graph). Safe — no getAllObjects.
 */
export function isolateSphereViaRuntime(app) {
  const scene = app?._scene
  if (!scene?.traverse) {
    return isolateViaFindNames(app)
  }

  const keep = collectKeepSet(scene)
  let foundSphere = false
  let hidden = 0
  let kept = 0
  const hiddenNames = []

  scene.traverse((obj) => {
    if (obj === scene) return
    const name = obj.name || ''
    if (/sphere/i.test(name)) foundSphere = true

    if (keep.has(obj)) {
      obj.visible = true
      kept += 1
      return
    }
    if (obj.visible !== false) {
      obj.visible = false
      hidden += 1
      if (name) hiddenNames.push(name)
    } else {
      obj.visible = false
    }
  })

  // Also poke SPEObject API for Sphere / known leftovers (best-effort)
  try {
    const sphere = app.findObjectByName?.('Sphere')
    if (sphere) {
      sphere.visible = true
      sphere.show?.()
      foundSphere = true
    }
  } catch {
    /* ignore */
  }

  for (const name of [
    'Particle Emitter',
    'Particle Emitter 2',
    'button',
    'button Instance',
    'button Instance 2',
    'button Instance 3',
    'button label',
    'button bg',
    'label',
    'CTA',
    'Group',
    'Group 2',
    'Group 3',
    'Group 4',
    'AA Fixer',
  ]) {
    try {
      const obj = app.findObjectByName?.(name)
      // Never hide Sphere ancestors via SPE API if name is Group — Three traverse already handled
      if (!obj) continue
      if (/sphere/i.test(name)) continue
      if (name.startsWith('Group')) {
        // Only hide via Three graph; SPE Group hide can collapse sphere parent
        continue
      }
      obj.visible = false
      obj.hide?.()
    } catch {
      /* Particle Emitter findObjectByName throws — expected */
    }
  }

  return {
    ok: true,
    kept,
    hidden,
    hiddenNames: [...new Set(hiddenNames)].slice(0, 80),
    foundSphere,
    via: 'scene-traverse',
  }
}

/** Fallback if `_scene` missing — name list only (never Particle Emitter). */
function isolateViaFindNames(app) {
  if (!app?.findObjectByName) {
    return { ok: false, kept: 0, hidden: 0, foundSphere: false }
  }
  const hideNames = [
    'Text',
    'Text 2',
    'Text 7',
    'Text 8',
    'Text 9',
    'Rectangle',
    'Rectangle 2',
    'Rectangle 3',
    'Rectangle 5',
    'Ellipse',
    'Ellipse 2',
    'Ellipse 3',
    'Ellipse 4',
    'Ellipse 5',
    'Ellipse 6',
    'Ellipse 7',
    'Ellipse 8',
    'Ellipse 10',
    'Cube',
    'Cube 2',
    'AA Fixer',
    'CTA',
    'button',
    'button Instance',
    'button Instance 2',
    'button Instance 3',
    'button label',
    'button bg',
    'label',
  ]
  let hidden = 0
  for (const name of hideNames) {
    try {
      const obj = app.findObjectByName(name)
      if (obj) {
        obj.visible = false
        obj.hide?.()
        hidden += 1
      }
    } catch {
      /* skip */
    }
  }
  let foundSphere = false
  try {
    const sphere = app.findObjectByName('Sphere')
    if (sphere) {
      sphere.visible = true
      sphere.show?.()
      foundSphere = true
    }
  } catch {
    /* skip */
  }
  return { ok: true, kept: foundSphere ? 1 : 0, hidden, foundSphere, via: 'find-names' }
}

/**
 * Isolate Sphere-only on a Three.js Object3D graph (SplineLoader / R3F path).
 * Mutates in place — do not clone Spline entities.
 */
export function isolateSphereViaThree(root) {
  if (!root) return { foundSphere: false, hidden: 0 }
  const keep = collectKeepSet(root)
  let foundSphere = false
  let hidden = 0

  root.traverse((obj) => {
    if (/sphere/i.test(obj.name || '')) foundSphere = true
    if (obj === root) return
    if (keep.has(obj)) {
      obj.visible = true
      return
    }
    obj.visible = false
    hidden += 1
  })

  return { foundSphere, hidden }
}

export function shouldKeepSplineObject(name = '') {
  const n = String(name).trim()
  if (!n) return true
  return KEEP_NAME_RE.test(n) || /sphere|light|camera/i.test(n)
}
