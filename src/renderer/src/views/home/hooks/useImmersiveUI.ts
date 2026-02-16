import { useEffect, useMemo, useState } from 'react'

export function useImmersiveUI(
  mode: 'pick' | 'group',
  onImmersiveChange?: (immersive: boolean) => void
): {
  immersiveMode: boolean
  immersivePickMode: boolean
  setImmersiveMode: (value: boolean) => void
} {
  const [immersiveMode, setImmersiveMode] = useState(false)
  const immersivePickMode = useMemo(() => immersiveMode && mode === 'pick', [immersiveMode, mode])

  useEffect(() => {
    onImmersiveChange?.(immersivePickMode)
    return () => onImmersiveChange?.(false)
  }, [immersivePickMode, onImmersiveChange])

  return {
    immersiveMode,
    immersivePickMode,
    setImmersiveMode
  }
}
