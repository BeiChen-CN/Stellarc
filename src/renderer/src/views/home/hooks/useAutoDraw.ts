import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 连抽状态机：轮次/间隔设置、剩余轮次、下一轮调度与清理。
 * Home 只需在每轮揭晓后调用 scheduleNextRound/resetRemaining。
 */

export const AUTO_DRAW_DEFAULT_INTERVAL_MS = 3600
export const AUTO_DRAW_MIN_INTERVAL_MS = 2500

/** ok=false 且无 message 时为静默忽略（如旋转中），有 message 时向用户提示 */
export type AutoDrawGate = { ok: true } | { ok: false; message?: string }

export function useAutoDraw(options: {
  /** 返回 ok=false 阻止开始；message 非空时提示用户 */
  ensureCanStart: () => AutoDrawGate
  /** 触发一轮抽选（Home 内部转调 handleDrawRef） */
  onRoundStart: () => void
  onError: (message: string) => void
}): {
  autoDrawEnabled: boolean
  toggleEnabled: () => void
  autoDrawRounds: number
  setAutoDrawRounds: (value: number) => void
  autoDrawIntervalMs: number
  setAutoDrawIntervalMs: (value: number) => void
  autoDrawRemaining: number
  getRemaining: () => number
  isRunning: () => boolean
  startAutoDraw: () => void
  stopAutoDraw: () => void
  scheduleNextRound: (delayMs: number) => void
  resetRemaining: () => void
} {
  const { ensureCanStart, onRoundStart, onError } = options

  const [autoDrawEnabled, setAutoDrawEnabled] = useState(false)
  const [autoDrawRounds, setAutoDrawRounds] = useState(3)
  const [autoDrawIntervalMs, setAutoDrawIntervalMs] = useState(AUTO_DRAW_DEFAULT_INTERVAL_MS)
  const [autoDrawRemaining, setAutoDrawRemaining] = useState(0)
  const remainingRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const toggleEnabled = useCallback(() => setAutoDrawEnabled((v) => !v), [])

  const resetRemaining = useCallback((): void => {
    remainingRef.current = 0
    setAutoDrawRemaining(0)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startAutoDraw = useCallback((): void => {
    const gate = ensureCanStart()
    if (!gate.ok) {
      if (gate.message) onError(gate.message)
      return
    }
    const rounds = Math.max(1, autoDrawRounds)
    remainingRef.current = rounds
    setAutoDrawRemaining(rounds)
    setAutoDrawEnabled(true)
    setTimeout(onRoundStart, 0)
  }, [ensureCanStart, autoDrawRounds, onError, onRoundStart])

  const stopAutoDraw = useCallback((): void => {
    resetRemaining()
  }, [resetRemaining])

  const scheduleNextRound = useCallback(
    (delayMs: number): void => {
      const next = remainingRef.current - 1
      remainingRef.current = next
      setAutoDrawRemaining(next)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(onRoundStart, delayMs)
    },
    [onRoundStart]
  )

  const getRemaining = useCallback(() => remainingRef.current, [])
  const isRunning = useCallback(() => remainingRef.current > 0, [])

  return {
    autoDrawEnabled,
    toggleEnabled,
    autoDrawRounds,
    setAutoDrawRounds,
    autoDrawIntervalMs,
    setAutoDrawIntervalMs,
    autoDrawRemaining,
    getRemaining,
    isRunning,
    startAutoDraw,
    stopAutoDraw,
    scheduleNextRound,
    resetRemaining
  }
}
