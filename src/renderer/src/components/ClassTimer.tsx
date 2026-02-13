import { useState, useRef, useEffect, useCallback } from 'react'
import { Timer, X, Play, Pause, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import { audioCtx } from '../lib/sounds'

const PRESETS = [60, 120, 180, 300, 600] // seconds
const PRESET_LABELS = ['1分', '2分', '3分', '5分', '10分']

function playTimerEnd() {
  const ctx = audioCtx()
  const now = ctx.currentTime
  ;[880, 0, 880, 0, 880].forEach((freq, i) => {
    if (freq === 0) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + i * 0.25)
    gain.gain.setValueAtTime(0.15, now + i * 0.25)
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + i * 0.25)
    osc.stop(now + i * 0.25 + 0.2)
  })
}

export function ClassTimer() {
  const [open, setOpen] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!running || remaining <= 0) {
      clearTimer()
      return
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false)
          playTimerEnd()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return clearTimer
  }, [running, remaining, clearTimer])

  const startPreset = (seconds: number) => {
    clearTimer()
    setTotalSeconds(seconds)
    setRemaining(seconds)
    setRunning(true)
  }

  const togglePause = () => {
    if (remaining > 0) setRunning(!running)
  }

  const reset = () => {
    clearTimer()
    setRunning(false)
    setRemaining(0)
    setTotalSeconds(0)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0

  return (
    <>
      {/* Mini trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 bg-surface-container-high rounded-full px-3 py-1.5 elevation-1 text-sm font-medium transition-colors cursor-pointer',
          remaining > 0 && remaining <= 10 ? 'text-destructive animate-pulse' : 'text-on-surface-variant hover:text-on-surface'
        )}
      >
        <Timer className="w-4 h-4" />
        {remaining > 0 ? formatTime(remaining) : '计时'}
      </button>

      {/* Timer panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-14 left-0 w-64 bg-surface-container-high border border-outline-variant/50 rounded-2xl elevation-2 p-4 z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-on-surface">课堂计时器</span>
              <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-on-surface/10 cursor-pointer">
                <X className="w-3.5 h-3.5 text-on-surface-variant" />
              </button>
            </div>

            {/* Progress ring */}
            {totalSeconds > 0 && (
              <div className="flex flex-col items-center mb-4">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--outline-variant))" strokeWidth="6" opacity="0.3" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={remaining <= 10 && remaining > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress)}`}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn(
                      'text-xl font-bold font-mono',
                      remaining <= 10 && remaining > 0 ? 'text-destructive' : 'text-on-surface'
                    )}>
                      {formatTime(remaining)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={togglePause} className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                    {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={reset} className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high cursor-pointer">
                    <RotateCcw className="w-4 h-4 text-on-surface-variant" />
                  </button>
                </div>
              </div>
            )}

            {/* Presets */}
            <div className="grid grid-cols-5 gap-1.5">
              {PRESETS.map((sec, i) => (
                <button
                  key={sec}
                  onClick={() => startPreset(sec)}
                  className="px-2 py-1.5 text-xs font-medium rounded-lg bg-secondary-container text-secondary-container-foreground hover:bg-secondary-container/80 transition-colors cursor-pointer text-center"
                >
                  {PRESET_LABELS[i]}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
