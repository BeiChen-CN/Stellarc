import { useEffect, useLayoutEffect, useMemo, useState, useCallback } from 'react'

export type ImmersivePhase = 'normal' | 'ball' | 'menu' | 'island'

export function useImmersiveUI(
  mode: 'pick' | 'group',
  onImmersiveChange?: (immersive: boolean) => void
): {
  immersiveMode: boolean
  immersivePickMode: boolean
  immersivePhase: ImmersivePhase
  setImmersiveMode: (value: boolean) => void
  setImmersivePhase: (phase: ImmersivePhase) => void
} {
  const [immersivePhase, setImmersivePhaseState] = useState<ImmersivePhase>('normal')
  const effectiveImmersivePhase = mode === 'pick' ? immersivePhase : 'normal'
  const immersivePickMode = useMemo(
    () => effectiveImmersivePhase !== 'normal',
    [effectiveImmersivePhase]
  )
  const immersiveMode = immersivePickMode

  const setImmersivePhase = useCallback(
    (phase: ImmersivePhase) => {
      setImmersivePhaseState(mode === 'pick' ? phase : 'normal')
    },
    [mode]
  )

  const setImmersiveMode = useCallback(
    (value: boolean) => {
      setImmersivePhaseState(value && mode === 'pick' ? 'ball' : 'normal')
    },
    [mode]
  )

  useLayoutEffect(() => {
    onImmersiveChange?.(immersivePickMode)
    return () => onImmersiveChange?.(false)
  }, [immersivePickMode, onImmersiveChange])

  useEffect(() => {
    if (mode !== 'pick' && immersivePhase !== 'normal') {
      setImmersivePhaseState('normal')
    }
  }, [mode, immersivePhase])

  useEffect(() => {
    void window.electronAPI.setImmersiveWindowPhase(effectiveImmersivePhase).catch(() => undefined)
  }, [effectiveImmersivePhase])

  return {
    immersiveMode,
    immersivePickMode,
    immersivePhase: effectiveImmersivePhase,
    setImmersiveMode,
    setImmersivePhase
  }
}
