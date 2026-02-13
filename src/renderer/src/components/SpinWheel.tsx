import { useRef, useEffect, useState, useMemo } from 'react'
import { Student } from '../types'
import { playWheelTick, playReveal } from '../lib/sounds'

interface SpinWheelProps {
  students: Student[]
  winners: Student[]
  isSpinning: boolean
  soundEnabled: boolean
  onSpinComplete: () => void
}

const SEGMENT_COLORS = [
  { bg: 'hsl(var(--primary))', fg: 'hsl(var(--primary-foreground))' },
  { bg: 'hsl(var(--primary) / 0.15)', fg: 'hsl(var(--on-surface))' }
]

export function SpinWheel({
  students, winners, isSpinning, soundEnabled, onSpinComplete
}: SpinWheelProps) {
  const [rotation, setRotation] = useState(0)
  const [done, setDone] = useState(false)
  const rafRef = useRef(0)
  const lastSegRef = useRef(-1)
  const completedRef = useRef(false)

  const count = students.length
  const segAngle = 360 / count

  const winnerIndex = winners.length > 0 ? students.findIndex((s) => s.id === winners[0].id) : 0
  const winnerCenter = winnerIndex * segAngle + segAngle / 2
  const baseTarget = 270 - winnerCenter
  const targetRotation = baseTarget + 360 * 7

  // All winner indices for multi-pick highlight
  const winnerIds = useMemo(() => new Set(winners.map((w) => w.id)), [winners])

  useEffect(() => {
    if (!isSpinning || count === 0) return
    completedRef.current = false
    setDone(false)
    lastSegRef.current = -1
    const duration = 4500
    const startTime = performance.now()
    const animate = (time: number) => {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      const currentRot = targetRotation * eased
      setRotation(currentRot)
      if (soundEnabled) {
        const pointerDeg = (((270 - currentRot) % 360) + 360) % 360
        const currentSeg = Math.floor(pointerDeg / segAngle) % count
        if (currentSeg !== lastSegRef.current) {
          playWheelTick()
          lastSegRef.current = currentSeg
        }
      }
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setRotation(targetRotation)
        setDone(true)
        if (soundEnabled) playReveal()
        if (!completedRef.current) {
          completedRef.current = true
          onSpinComplete()
        }
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isSpinning, count, targetRotation, soundEnabled, onSpinComplete, segAngle])

  const segments = useMemo(() => {
    return students.map((student, i) => {
      const startDeg = i * segAngle
      const endDeg = startDeg + segAngle
      const startRad = (startDeg * Math.PI) / 180
      const endRad = (endDeg * Math.PI) / 180
      const x1 = 100 + 98 * Math.cos(startRad)
      const y1 = 100 + 98 * Math.sin(startRad)
      const x2 = 100 + 98 * Math.cos(endRad)
      const y2 = 100 + 98 * Math.sin(endRad)
      const largeArc = segAngle > 180 ? 1 : 0
      const midRad = ((startDeg + endDeg) / 2) * (Math.PI / 180)
      const textR = count <= 6 ? 58 : count <= 12 ? 62 : 66
      const tx = 100 + textR * Math.cos(midRad)
      const ty = 100 + textR * Math.sin(midRad)
      const textRotation = (startDeg + endDeg) / 2
      const name = student.name
      const maxLen = count <= 8 ? 4 : 3
      const displayName = name.length > maxLen ? name.slice(0, maxLen - 1) + '\u2026' : name
      const divRad = (startDeg * Math.PI) / 180
      const divIx = 100 + 22 * Math.cos(divRad)
      const divIy = 100 + 22 * Math.sin(divRad)
      const divOx = 100 + 97 * Math.cos(divRad)
      const divOy = 100 + 97 * Math.sin(divRad)
      const palette = SEGMENT_COLORS[i % 2]
      return {
        student,
        path: `M100,100 L${x1},${y1} A98,98 0 ${largeArc},1 ${x2},${y2} Z`,
        tx, ty, textRotation, displayName, palette, divIx, divIy, divOx, divOy
      }
    })
  }, [students, count, segAngle])

  const fontSize = count <= 6 ? 12 : count <= 12 ? 10 : count <= 20 ? 8 : 7
  const wheelSize = 370

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: wheelSize, height: wheelSize + 16 }}
    >
      {/* Pointer */}
      <div className="absolute z-30" style={{ top: 2, left: '50%', transform: 'translateX(-50%)' }}>
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
          <path
            d="M14 32 L3 6 Q2 3 5 1.5 L14 1.5 L23 1.5 Q26 3 25 6 Z"
            fill="black"
            opacity="0.12"
            transform="translate(0, 1)"
          />
          <path
            d="M14 30 L4 6 Q3 2 7 1 L14 1 L21 1 Q25 2 24 6 Z"
            fill="hsl(var(--primary))"
          />
          <path
            d="M14 24 L7 6 Q6.5 4 8 3 L14 3 L14 24 Z"
            fill="white"
            opacity="0.2"
          />
          <circle cx="14" cy="30" r="2" fill="hsl(var(--primary-foreground))" opacity="0.9" />
        </svg>
      </div>

      {/* Outer bezel ring */}
      <div
        className="absolute rounded-full spin-wheel-bezel"
        style={{
          width: wheelSize,
          height: wheelSize
        }}
      />

      {/* Wheel body */}
      <div
        className="rounded-full overflow-hidden spin-wheel-body"
        style={{
          width: wheelSize - 12,
          height: wheelSize - 12
        }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            transform: `rotate(${rotation}deg)`,
            willChange: 'transform'
          }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full" style={{ display: 'block' }}>
            <defs>
              <radialGradient id="wheelSheen" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="white" stopOpacity="0.08" />
                <stop offset="100%" stopColor="black" stopOpacity="0.04" />
              </radialGradient>
            </defs>

            {segments.map(({ student, path, tx, ty, textRotation, displayName, palette, divIx, divIy, divOx, divOy }) => {
              const isWinner = done && winnerIds.has(student.id)
              return (
                <g key={student.id}>
                  <path
                    d={path}
                    fill={isWinner ? 'hsl(var(--primary))' : palette.bg}
                    stroke="hsl(var(--surface-container) / 0.6)"
                    strokeWidth="0.4"
                  />
                  <line
                    x1={divIx} y1={divIy} x2={divOx} y2={divOy}
                    stroke="hsl(var(--surface-container-high) / 0.4)"
                    strokeWidth="0.3"
                  />
                  <text
                    x={tx} y={ty}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isWinner ? 'hsl(var(--primary-foreground))' : palette.fg}
                    fontSize={fontSize}
                    fontWeight="700"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    letterSpacing="0.02em"
                    transform={`rotate(${textRotation}, ${tx}, ${ty})`}
                  >
                    {displayName}
                  </text>
                </g>
              )
            })}

            <circle cx="100" cy="100" r="98" fill="url(#wheelSheen)" />

            {Array.from({ length: count }, (_, i) => {
              const midDeg = i * segAngle + segAngle / 2
              const rad = (midDeg * Math.PI) / 180
              const ix = 100 + 93 * Math.cos(rad)
              const iy = 100 + 93 * Math.sin(rad)
              const ox = 100 + 97 * Math.cos(rad)
              const oy = 100 + 97 * Math.sin(rad)
              return (
                <line
                  key={`tick-${i}`}
                  x1={ix} y1={iy} x2={ox} y2={oy}
                  stroke="hsl(var(--on-surface) / 0.15)"
                  strokeWidth="0.5"
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
        </div>
      </div>

      {/* Center hub */}
      <div
        className="absolute rounded-full z-10 flex items-center justify-center spin-wheel-hub"
        style={{
          width: 52,
          height: 52
        }}
      >
        {done && winners.length > 0 ? (
          <span
            className="text-sm font-bold text-center leading-tight"
            style={{ color: 'hsl(var(--primary))' }}
          >
            {winners.length === 1
              ? winners[0].name.slice(0, 1)
              : `${winners.length}人`}
          </span>
        ) : (
          <div
            className="rounded-full spin-wheel-dot"
            style={{
              width: 14,
              height: 14
            }}
          />
        )}
      </div>
    </div>
  )
}
