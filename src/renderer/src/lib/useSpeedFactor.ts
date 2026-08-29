import { useSettingsStore } from '../store/settingsStore'

/** 动画速度档位到 CSS 变量 --speed-factor 的映射（App.tsx 全局应用，动画组件读取） */
export const ANIMATION_SPEED_FACTOR = { elegant: 1.5, balanced: 1, fast: 0.5 } as const

export function useSpeedFactor(): number {
  const animationSpeed = useSettingsStore((s) => s.animationSpeed)
  return ANIMATION_SPEED_FACTOR[animationSpeed]
}
