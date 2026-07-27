// Vanguard Ball Engine — shared design state.
// One source of truth for Tweakpane + shaders + persistence.

export const ENGINE_KEY = 'vanguardBallEngine.v1'

export const ENGINE_DEFAULTS = {
  // global
  exposure: 1.15,
  bloom: 0.55,
  ao: 1.35,
  grain: 0.28,
  autoRotate: true,
  rotateSpeed: 0.7,
  float: true,
  // material knobs (consumed by active preset)
  intensity: 1.0,
  roughness: 0.25,
  metalness: 0.1,
  displacement: 0.12,
  noiseScale: 3.2,
  glow: 1.0,
  thickness: 0.7,
  iridescence: 0.5,
  dimple: 0.028,
  scanSpeed: 1.0,
  rimPower: 3.0,
}

export function loadEngine() {
  try {
    const raw = JSON.parse(localStorage.getItem(ENGINE_KEY))
    if (raw && raw.v === 1) return { ...ENGINE_DEFAULTS, ...raw.params }
  } catch {
    /* ignore */
  }
  return { ...ENGINE_DEFAULTS }
}

export function saveEngine(params) {
  try {
    localStorage.setItem(ENGINE_KEY, JSON.stringify({ v: 1, params }))
    return true
  } catch {
    return false
  }
}

/** Per-preset which knobs matter — keeps the editor focused */
export const PRESET_KNOBS = {
  emerald: ['intensity', 'glow', 'dimple', 'noiseScale', 'rimPower', 'roughness'],
  ghost: ['intensity', 'thickness', 'glow', 'noiseScale'],
  oilslick: ['intensity', 'iridescence', 'noiseScale', 'roughness', 'rimPower'],
  nebula: ['intensity', 'glow', 'noiseScale', 'scanSpeed'],
  molten: ['intensity', 'glow', 'displacement', 'noiseScale', 'scanSpeed'],
  pearl: ['intensity', 'iridescence', 'dimple', 'roughness', 'rimPower'],
  chrome: ['intensity', 'dimple', 'displacement', 'roughness', 'rimPower'],
  holo: ['intensity', 'glow', 'scanSpeed', 'rimPower'],
  organic: ['intensity', 'displacement', 'noiseScale', 'glow', 'rimPower'],
  plasma: ['intensity', 'glow', 'noiseScale', 'scanSpeed'],
  points: ['intensity', 'glow', 'noiseScale', 'scanSpeed'],
  topo: ['intensity', 'noiseScale', 'glow', 'rimPower'],
  cel: ['intensity', 'glow', 'rimPower', 'roughness'],
  energy: ['intensity', 'glow', 'noiseScale', 'scanSpeed', 'displacement'],
}
