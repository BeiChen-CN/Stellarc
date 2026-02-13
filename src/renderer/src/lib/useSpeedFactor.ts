import { useSettingsStore } from '../store/settingsStore'

const SPEED_MAP = { elegant: 1.5, balanced: 1, fast: 0.5 } as const

export function useSpeedFactor(): number {
  const animationSpeed = useSettingsStore((s) => s.animationSpeed)
  return SPEED_MAP[animationSpeed]
}

export function getSpeedFactor(): number {
  const animationSpeed = useSettingsStore.getState().animationSpeed
  return SPEED_MAP[animationSpeed]
}
