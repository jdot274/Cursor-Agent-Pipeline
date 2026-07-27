// Shared contract with the game: game v2 reads this key on load (same origin).
export const BALL_KEY = 'vanguardGolf.ball.v1'

export const DEFAULT_CONFIG = {
  v: 1,
  preset: 'aether',
  accent: '#00d4ff',
  speed: 1.0,
  name: 'AETHER ONE',
}

export function loadBallConfig() {
  try {
    const raw = JSON.parse(localStorage.getItem(BALL_KEY))
    if (raw && raw.v === 1) return { ...DEFAULT_CONFIG, ...raw }
  } catch {
    /* corrupted store falls through to defaults */
  }
  return { ...DEFAULT_CONFIG }
}

export function saveBallConfig(cfg) {
  try {
    localStorage.setItem(BALL_KEY, JSON.stringify({ ...cfg, v: 1 }))
    return true
  } catch {
    return false
  }
}
