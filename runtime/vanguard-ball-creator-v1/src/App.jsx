import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Studio from './Studio.jsx'
import { PRESETS } from './balls/presets.jsx'
import { loadBallConfig, saveBallConfig } from './store.js'

const SWATCHES = ['#3aff8e', '#00e5ff', '#ff9d2e', '#c04df0', '#ff4d6d', '#f4f0e6']

export default function App() {
  const [config, setConfig] = useState(loadBallConfig)
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)

  useEffect(() => {
    // test/automation hook, same convention as the game's RelayVanguardGolf API
    window.RelayBallLab = {
      getConfig: () => ({ ...config }),
      setPreset: (preset) => setConfig((c) => ({ ...c, preset })),
      setAccent: (accent) => setConfig((c) => ({ ...c, accent })),
      save: () => saveBallConfig(config),
    }
    return () => {
      delete window.RelayBallLab
    }
  }, [config])

  function update(patch) {
    setConfig((c) => ({ ...c, ...patch }))
  }

  function showToast(msg) {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2200)
  }

  function saveAndPlay() {
    const ok = saveBallConfig(config)
    if (!ok) {
      showToast('Could not save (storage blocked)')
      return
    }
    // deployed layout: game at /, creator at /creator/
    if (window.location.pathname.includes('/creator')) {
      window.location.href = '../'
    } else {
      showToast('Ball saved — it will appear in Vanguard Golf')
    }
  }

  return (
    <div className="app">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.15, 4.4], fov: 38 }}
        gl={{ antialias: true }}
      >
        <Studio config={config} />
      </Canvas>

      <header className="brand">
        <h1>
          VANGUARD <span>BALL LAB</span>
        </h1>
        <p>craft your tournament ball</p>
      </header>

      <aside className="panel">
        <label className="field">
          <span className="label">Ball name</span>
          <input
            value={config.name}
            maxLength={18}
            onChange={(e) => update({ name: e.target.value.toUpperCase() })}
            spellCheck={false}
          />
        </label>

        <div className="label">Material</div>
        <div className="presets">
          {Object.entries(PRESETS).map(([id, p]) => (
            <button
              key={id}
              className={`preset ${config.preset === id ? 'active' : ''}`}
              onClick={() => update({ preset: id })}
            >
              <span className="chip" style={{ background: p.chip }} />
              <span className="meta">
                <strong>{p.name}</strong>
                <em>{p.tagline}</em>
              </span>
            </button>
          ))}
        </div>

        <div className="label">Accent</div>
        <div className="swatches">
          {SWATCHES.map((c) => (
            <button
              key={c}
              className={`swatch ${config.accent === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => update({ accent: c })}
              aria-label={`accent ${c}`}
            />
          ))}
          <input
            type="color"
            value={config.accent}
            onChange={(e) => update({ accent: e.target.value })}
            aria-label="custom accent"
          />
        </div>

        <label className="field">
          <span className="label">
            Animation <b>{config.speed.toFixed(2)}×</b>
          </span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={config.speed}
            onChange={(e) => update({ speed: parseFloat(e.target.value) })}
          />
        </label>

        <button className="cta" onClick={saveAndPlay}>
          SAVE &amp; PLAY
        </button>
      </aside>

      {toast && <div className="toast">{toast}</div>}

      <footer className="foot">
        <span>{PRESETS[config.preset]?.name ?? ''}</span>
        <span>drag to orbit · scroll to zoom</span>
      </footer>
    </div>
  )
}
