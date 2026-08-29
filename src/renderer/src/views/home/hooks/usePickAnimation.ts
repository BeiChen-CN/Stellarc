import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { AnimationSpeed, AnimationStyle } from '../../../store/settingsStore'
import type { Student } from '../../../types'
import { playBounceTick, playSlowTick, playTick, playTypewriterKey } from '../../../lib/sounds'

/**
 * 抽选动画执行器：拥有 rAF 循环、计时器与音效节奏，Home 只提供
 * 候选集与回调（更新展示名单、降速标记、揭晓完成）。
 */

const ANIMATION_DURATION_MAP = { elegant: 3200, balanced: 2200, fast: 1300 } as const
const ANIMATION_DURATION_REDUCED_MS = 300
const TICK_INTERVAL_MIN_MS = 38
const TICK_INTERVAL_RANGE_MS = 145
/** 进度超过该比例后展示名单锁定为中奖者 */
const LOCK_IN_PROGRESS = 0.85
/** 进度超过该比例后切换慢速音效并标记 slowing */
const SLOW_DOWN_PROGRESS = 0.6
const SOUND_GAP_BASE_MS = { elegant: 120, balanced: 145, fast: 180 } as const

/** 从候选池中不重复地随机抽取 count 人 */
export function pickUniqueStudents(pool: Student[], count: number): Student[] {
  if (count <= 0 || pool.length === 0) return []
  if (count >= pool.length) return [...pool]
  const copy = [...pool]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

export interface SpinAnimationParams {
  activeStudents: Student[]
  preSelectedWinners: Student[]
  countToPick: number
  animationStyle: AnimationStyle
  animationSpeed: AnimationSpeed
  animationDurationScale: number
  soundEnabled: boolean
  speedFactor: number
}

export function usePickAnimation(callbacks: {
  /** 每次刷新展示名单（Home 负责同步 candidateKey） */
  onTick: (students: Student[]) => void
  onSlowDown: () => void
  onComplete: (winners: Student[]) => void
}): {
  runSpinAnimation: (params: SpinAnimationParams) => void
  runCharByCharReveal: (
    params: { winners: Student[]; speedFactor: number; durationScale: number },
    hooks: { onRevealStart: () => void; onComplete: () => void }
  ) => void
  prefersReducedMotion: boolean
} {
  const animationRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickCountRef = useRef(0)
  const lastSoundAtRef = useRef(0)

  const prefersReducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const { onTick, onSlowDown, onComplete } = callbacks
  const callbacksRef = useRef({ onTick, onSlowDown, onComplete })
  callbacksRef.current = { onTick, onSlowDown, onComplete }

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const runCharByCharReveal = useCallback(
    (
      params: { winners: Student[]; speedFactor: number; durationScale: number },
      hooks: { onRevealStart: () => void; onComplete: () => void }
    ): void => {
      hooks.onRevealStart()
      // 逐字动画时长收敛，避免长姓名拖沓
      const maxChars = Math.max(...params.winners.map((w) => w.name.length), 1)
      const revealDuration = Math.min(
        2200 * params.speedFactor * params.durationScale,
        (maxChars * 120 + 420) * params.speedFactor * params.durationScale
      )
      timeoutRef.current = setTimeout(hooks.onComplete, revealDuration)
    },
    []
  )

  const runSpinAnimation = useCallback(
    (params: SpinAnimationParams): void => {
      const {
        activeStudents,
        preSelectedWinners,
        countToPick,
        animationStyle,
        animationSpeed,
        animationDurationScale,
        soundEnabled,
        speedFactor
      } = params

      const duration = prefersReducedMotion
        ? ANIMATION_DURATION_REDUCED_MS
        : ANIMATION_DURATION_MAP[animationSpeed] * speedFactor * animationDurationScale
      const startTime = performance.now()
      let lastTickAt = startTime
      tickCountRef.current = 0
      lastSoundAtRef.current = 0

      const animate = (time: number): void => {
        const elapsed = time - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 4)
        const interval = TICK_INTERVAL_MIN_MS + eased * TICK_INTERVAL_RANGE_MS

        if (time - lastTickAt >= interval || progress >= 1) {
          const currentRandoms =
            progress > LOCK_IN_PROGRESS
              ? preSelectedWinners
              : pickUniqueStudents(activeStudents, countToPick)
          callbacksRef.current.onTick(currentRandoms)
          lastTickAt = time
        }

        if (soundEnabled && !prefersReducedMotion && progress < 1) {
          const now = performance.now()
          const baseGap = SOUND_GAP_BASE_MS[animationSpeed]
          const effectiveGap = Math.max(
            95,
            Math.min(280, baseGap / Math.max(0.6, animationDurationScale))
          )
          if (now - lastSoundAtRef.current >= effectiveGap) {
            tickCountRef.current++
            if (animationStyle === 'typewriter') {
              playTypewriterKey()
            } else if (animationStyle === 'bounce') {
              playBounceTick()
            } else if (progress >= SLOW_DOWN_PROGRESS) {
              playSlowTick()
            } else {
              playTick()
            }
            lastSoundAtRef.current = now
          }
        }

        if (progress > SLOW_DOWN_PROGRESS) {
          callbacksRef.current.onSlowDown()
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          callbacksRef.current.onComplete(preSelectedWinners)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [prefersReducedMotion]
  )

  return { runSpinAnimation, runCharByCharReveal, prefersReducedMotion }
}
