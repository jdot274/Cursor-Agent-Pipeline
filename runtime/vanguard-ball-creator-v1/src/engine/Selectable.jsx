import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { TransformControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'

const EngineCtx = createContext(null)

export function useEngineSelection() {
  return useContext(EngineCtx)
}

export function EngineProvider({ children, enabled = true, mode = 'translate', onDragging }) {
  const [selected, setSelected] = useState(null)
  const value = useMemo(
    () => ({ selected, setSelected, enabled, mode, onDragging }),
    [selected, enabled, mode, onDragging]
  )
  return <EngineCtx.Provider value={value}>{children}</EngineCtx.Provider>
}

export function Selectable({ id, children, onSelect }) {
  const ctx = useEngineSelection()
  const ref = useRef()
  const [object, setObject] = useState(null)
  const { controls } = useThree()

  useLayoutEffect(() => {
    setObject(ref.current)
  }, [])

  if (!ctx?.enabled) {
    return <group ref={ref}>{children}</group>
  }

  const active = ctx.selected === id

  return (
    <group
      ref={ref}
      onClick={(e) => {
        e.stopPropagation()
        ctx.setSelected(id)
        onSelect?.(id)
      }}
    >
      {children}
      {active && object && (
        <TransformControls
          object={object}
          mode={ctx.mode}
          size={0.9}
          onMouseDown={() => {
            if (controls) controls.enabled = false
            ctx.onDragging?.(true)
          }}
          onMouseUp={() => {
            if (controls) controls.enabled = true
            ctx.onDragging?.(false)
          }}
        />
      )}
    </group>
  )
}

export function DeselectOnMiss({ children }) {
  const ctx = useEngineSelection()
  return (
    <group
      onPointerMissed={() => {
        if (ctx?.enabled) ctx.setSelected(null)
      }}
    >
      {children}
    </group>
  )
}
