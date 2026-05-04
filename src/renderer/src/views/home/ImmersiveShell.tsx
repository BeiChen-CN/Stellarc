import { useRef, type PointerEvent, type ReactElement } from 'react'
import { motion } from 'framer-motion'
import { House, Shuffle, type LucideIcon } from 'lucide-react'

import type { Student } from '../../types'
import { cn } from '../../lib/utils'
import type { ImmersiveIslandStyle } from '../../store/settingsStore'
import type { ImmersivePhase } from './hooks/useImmersiveUI'
import { getImmersiveIslandVariant } from './immersiveIslandVariants'

type DrawPhase = 'idle' | 'spinning' | 'slowing' | 'reveal'

interface ImmersiveShellProps {
  phase: ImmersivePhase
  currentClassName?: string
  displayCandidates: Student[]
  winners: Student[]
  candidateKey: number
  drawPhase: DrawPhase
  islandStyle: ImmersiveIslandStyle
  isSpinning: boolean
  canDraw: boolean
  onOpenMenu: () => void
  onDraw: () => void
  onCollapse: () => void
  onExit: () => void
}

type ImmersiveAction = {
  id: 'draw' | 'return'
  label: string
  icon: LucideIcon
  disabled: boolean
  onClick: () => void
  className: string
  testId: string
}

export function ImmersiveShell({
  phase,
  currentClassName,
  displayCandidates,
  winners,
  candidateKey,
  drawPhase,
  islandStyle,
  isSpinning,
  canDraw,
  onOpenMenu,
  onDraw,
  onCollapse,
  onExit
}: ImmersiveShellProps): ReactElement | null {
  const dragState = useRef<{
    pointerId: number
    originClientX: number
    originClientY: number
    moved: boolean
  } | null>(null)

  if (phase === 'normal') return null

  const handleBallPointerDown = (event: PointerEvent<HTMLButtonElement>): void => {
    dragState.current = {
      pointerId: event.pointerId,
      originClientX: event.clientX,
      originClientY: event.clientY,
      moved: false
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleBallPointerMove = (event: PointerEvent<HTMLButtonElement>): void => {
    const state = dragState.current
    if (!state) return
    const deltaX = event.clientX - state.originClientX
    const deltaY = event.clientY - state.originClientY
    if (!state.moved && Math.hypot(deltaX, deltaY) < 5) return

    state.moved = true
    void window.electronAPI.setImmersiveWindowPhase('ball', {
      anchor: {
        x: Math.round(event.screenX - state.originClientX),
        y: Math.round(event.screenY - state.originClientY)
      }
    })
  }

  const releaseBallPointer = (event: PointerEvent<HTMLButtonElement>): void => {
    const state = dragState.current
    if (!state) return
    if (event.currentTarget.hasPointerCapture(state.pointerId)) {
      event.currentTarget.releasePointerCapture(state.pointerId)
    }
    dragState.current = null
    if (!state.moved) onOpenMenu()
  }

  if (phase === 'ball') {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-transparent p-1">
        <button
          type="button"
          data-testid="immersive-ball"
          aria-label="沉浸浮球"
          onPointerDown={handleBallPointerDown}
          onPointerMove={handleBallPointerMove}
          onPointerUp={releaseBallPointer}
          onPointerCancel={releaseBallPointer}
          className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-primary text-primary-foreground shadow-[0_16px_36px_hsl(var(--primary)/0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <Shuffle className="h-7 w-7" />
        </button>
      </div>
    )
  }

  if (phase === 'menu') {
    const actions: ImmersiveAction[] = [
      {
        id: 'draw',
        label: '抽取',
        icon: Shuffle,
        disabled: !canDraw,
        onClick: onDraw,
        className: 'left-2 top-2',
        testId: 'immersive-menu-draw'
      },
      {
        id: 'return',
        label: '返回',
        icon: House,
        disabled: false,
        onClick: onExit,
        className: 'bottom-2 left-12',
        testId: 'immersive-menu-return'
      }
    ]

    return (
      <div data-testid="immersive-menu" className="absolute inset-0 z-30 bg-transparent">
        <motion.button
          type="button"
          aria-label="收起沉浸菜单"
          onClick={onCollapse}
          initial={{ opacity: 0, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute right-2 top-1/2 flex h-16 w-16 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-primary text-primary-foreground shadow-[0_14px_32px_hsl(var(--primary)/0.32)]"
        >
          <Shuffle className="h-7 w-7" />
        </motion.button>

        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.id}
              type="button"
              data-testid={action.testId}
              aria-label={action.label}
              title={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
              initial={{ opacity: 0, scale: 0.62, x: 36, y: index === 0 ? 26 : -26 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 520, damping: 28, delay: index * 0.04 }}
              className={cn(
                'absolute flex h-14 w-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full border border-white/60 bg-surface-container-high text-on-surface shadow-lg backdrop-blur-md transition-colors',
                'hover:bg-secondary-container hover:text-secondary-container-foreground disabled:cursor-not-allowed disabled:opacity-45',
                action.className
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              <span className="text-[10px] font-semibold leading-none">{action.label}</span>
            </motion.button>
          )
        })}
      </div>
    )
  }

  if (phase === 'island') {
    const isReveal = drawPhase === 'reveal' && winners.length > 0
    const variant = getImmersiveIslandVariant(islandStyle)
    const renderPhase = isReveal ? 'reveal' : 'spinning'
    const displayNames = (isReveal ? winners : displayCandidates)
      .slice(0, isReveal ? 1 : 3)
      .map((student) => student.name)
    const winnerNames = winners.slice(0, 1).map((student) => student.name)

    return (
      <div className="absolute inset-0 z-30 flex items-start justify-center bg-transparent p-2">
        <motion.div
          data-testid="immersive-island"
          data-island-style={variant.id}
          initial={{ opacity: 0, scale: 0.92, y: -8 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0
          }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="max-w-[calc(100vw-16px)] bg-transparent"
        >
          {variant.render({
            phase: renderPhase,
            currentClassName,
            displayNames,
            winnerNames,
            candidateKey,
            isSpinning
          })}
        </motion.div>
      </div>
    )
  }

  return null
}
