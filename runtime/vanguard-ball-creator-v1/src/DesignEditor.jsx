import { useEffect, useRef } from 'react'
import { Pane } from 'tweakpane'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'
import { ENGINE_DEFAULTS, PRESET_KNOBS, saveEngine } from './engine.js'

const KNOB_META = {
  intensity: { min: 0, max: 2, step: 0.01, label: 'intensity' },
  roughness: { min: 0, max: 1, step: 0.01, label: 'roughness' },
  metalness: { min: 0, max: 1, step: 0.01, label: 'metalness' },
  displacement: { min: 0, max: 0.45, step: 0.005, label: 'displace' },
  noiseScale: { min: 0.5, max: 12, step: 0.1, label: 'noise scale' },
  glow: { min: 0, max: 3, step: 0.01, label: 'glow' },
  thickness: { min: 0.05, max: 2, step: 0.01, label: 'thickness' },
  iridescence: { min: 0, max: 1, step: 0.01, label: 'iridescence' },
  dimple: { min: 0, max: 0.08, step: 0.001, label: 'dimple' },
  scanSpeed: { min: 0, max: 3, step: 0.05, label: 'anim speed' },
  rimPower: { min: 0.5, max: 6, step: 0.05, label: 'rim power' },
}

/**
 * Live design editor — engine-feel Tweakpane docked bottom-left.
 * Syncs into React state so shaders/uniforms re-render immediately.
 */
export default function DesignEditor({ preset, engine, setEngine }) {
  const host = useRef(null)
  const paneRef = useRef(null)
  const paramsRef = useRef({ ...engine })

  useEffect(() => {
    paramsRef.current = { ...engine }
  }, [engine])

  useEffect(() => {
    if (!host.current) return
    const pane = new Pane({
      container: host.current,
      title: 'VANGUARD ENGINE',
      expanded: true,
    })
    pane.registerPlugin(EssentialsPlugin)
    paneRef.current = pane

    const p = paramsRef.current

    const studio = pane.addFolder({ title: 'Studio', expanded: true })
    studio.addBinding(p, 'exposure', { min: 0.4, max: 2.2, step: 0.01 })
    studio.addBinding(p, 'bloom', { min: 0, max: 1.5, step: 0.01 })
    studio.addBinding(p, 'ao', { min: 0, max: 3, step: 0.01 })
    studio.addBinding(p, 'grain', { min: 0, max: 1, step: 0.01 })
    studio.addBinding(p, 'autoRotate')
    studio.addBinding(p, 'rotateSpeed', { min: 0, max: 3, step: 0.05 })
    studio.addBinding(p, 'float')

    const mat = pane.addFolder({ title: 'Material', expanded: true })
    const knobs = PRESET_KNOBS[preset] ?? Object.keys(KNOB_META)
    for (const key of knobs) {
      const meta = KNOB_META[key]
      if (!meta) continue
      mat.addBinding(p, key, meta)
    }

    const io = pane.addFolder({ title: 'I/O', expanded: false })
    io.addButton({ title: 'Save engine state' }).on('click', () => {
      saveEngine({ ...paramsRef.current })
    })
    io.addButton({ title: 'Reset defaults' }).on('click', () => {
      Object.assign(paramsRef.current, ENGINE_DEFAULTS)
      pane.refresh()
      setEngine({ ...ENGINE_DEFAULTS })
    })
    io.addButton({ title: 'Copy JSON' }).on('click', async () => {
      try {
        await navigator.clipboard.writeText(JSON.stringify(paramsRef.current, null, 2))
      } catch {
        /* ignore */
      }
    })

    const flush = () => setEngine({ ...paramsRef.current })
    pane.on('change', flush)

    return () => {
      pane.dispose()
      paneRef.current = null
    }
    // rebuild when preset changes so Material knobs match
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset])

  return <div className="engine-pane" ref={host} />
}
