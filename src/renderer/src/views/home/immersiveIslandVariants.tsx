import { type ReactElement } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, CircleDot, Shuffle, Sparkles, Trophy } from 'lucide-react'

import { cn } from '../../lib/utils'
import type { ImmersiveIslandStyle } from '../../store/settingsStore'

export type ImmersiveIslandRenderPhase = 'spinning' | 'reveal'

export interface ImmersiveIslandRenderProps {
  phase: ImmersiveIslandRenderPhase
  currentClassName?: string
  displayNames: string[]
  winnerNames: string[]
  candidateKey: number
  isSpinning: boolean
}

export interface ImmersiveIslandVariant {
  id: ImmersiveIslandStyle
  title: string
  subtitle: string
  render: (props: ImmersiveIslandRenderProps) => ReactElement
}

function classCaption(currentClassName?: string): string {
  return currentClassName ? `Dynamic Island · ${currentClassName}` : 'Dynamic Island'
}

function firstName(names: string[], fallback: string): string {
  return names.find((name) => name.trim().length > 0) ?? fallback
}

function rollingNames(names: string[]): string[] {
  const visible = names.filter((name) => name.trim().length > 0).slice(0, 3)
  return visible.length > 0 ? [...visible, visible[0]] : ['正在抽取']
}

export function ImmersiveIslandStyleThumbnail({
  style,
  testId,
  className
}: {
  style: ImmersiveIslandStyle
  testId?: string
  className?: string
}): ReactElement {
  return (
    <span
      data-testid={testId}
      aria-hidden="true"
      className={cn(
        'relative flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-white/10 bg-[#07080d] shadow-[0_10px_28px_rgba(0,0,0,0.22)]',
        className
      )}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.12),transparent_34%)]" />
      <span className="relative flex h-8 w-[76px] items-center gap-2 overflow-hidden rounded-full border border-white/14 bg-black/90 px-2">
        {style === 'classic' && (
          <>
            <span className="h-3.5 w-3.5 rounded-full bg-white/22" />
            <span className="flex flex-1 flex-col gap-1">
              <span className="h-1.5 w-9 rounded-full bg-white/75" />
              <span className="h-1 w-6 rounded-full bg-white/28" />
            </span>
          </>
        )}
        {style === 'beam' && (
          <>
            <span className="h-3.5 w-3.5 rounded-full border border-white/28 bg-white/10" />
            <span className="relative h-4 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
              <span className="absolute inset-y-0 left-3 w-5 rounded-full bg-white/35 blur-[3px]" />
              <span className="absolute inset-x-2 top-1/2 h-px bg-white/32" />
            </span>
          </>
        )}
        {style === 'slot' && (
          <>
            <span className="h-3.5 w-3.5 rounded-full border border-white/30 bg-white/8" />
            <span className="relative flex h-5 flex-1 items-center justify-center overflow-hidden rounded-full border border-white/12 bg-white/[0.04]">
              <span className="absolute inset-x-1 top-1/2 h-px bg-white/26" />
              <span className="h-1.5 w-8 rounded-full bg-white/76" />
            </span>
          </>
        )}
        {style === 'pulse' && (
          <>
            <span className="relative h-4 w-4 rounded-full border border-white/34 bg-white/10">
              <span className="absolute -inset-1 rounded-full border border-white/20" />
            </span>
            <span className="flex flex-1 flex-col gap-1">
              <span className="h-1.5 w-10 rounded-full bg-white/72" />
              <span className="h-1 w-7 rounded-full bg-white/24" />
            </span>
          </>
        )}
      </span>
    </span>
  )
}

function ClassicIsland({
  phase,
  currentClassName,
  displayNames,
  winnerNames,
  candidateKey,
  isSpinning
}: ImmersiveIslandRenderProps): ReactElement {
  const isReveal = phase === 'reveal' && winnerNames.length > 0
  const names = rollingNames(displayNames)
  const winner = firstName(winnerNames, '等待结果')

  return (
    <motion.div
      data-testid="immersive-island-classic"
      animate={{ width: isReveal ? 352 : 304 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className="h-[68px] overflow-hidden rounded-full border border-white/10 bg-black px-4 text-white shadow-[0_18px_42px_rgba(0,0,0,0.52)]"
    >
      <div className="flex h-full min-w-0 items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
          <motion.div
            animate={isReveal ? { scale: [1, 1.08, 1] } : { rotate: 360 }}
            transition={{ duration: isReveal ? 1.2 : 0.9, repeat: Infinity, ease: 'linear' }}
          >
            {isReveal ? <Trophy className="h-5 w-5 text-amber-200" /> : <Shuffle className="h-5 w-5" />}
          </motion.div>
          {isSpinning && !isReveal && (
            <motion.span
              className="absolute inset-0 rounded-full border border-white/30"
              animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-white/50">
            {isReveal ? 'Picked' : classCaption(currentClassName)}
          </div>
          <div className="relative mt-0.5 h-7 overflow-hidden text-lg font-semibold leading-7">
            <AnimatePresence mode="wait">
              {isReveal ? (
                <motion.div
                  key={`classic-result-${candidateKey}-${winner}`}
                  data-testid="immersive-result-list"
                  initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8 }}
                  className="truncate"
                >
                  <span data-testid="immersive-result-name">{winner}</span>
                </motion.div>
              ) : (
                <motion.div
                  key={`classic-rolling-${candidateKey}`}
                  data-testid="immersive-draw-animation"
                  animate={{ y: names.length > 1 ? [0, -28 * (names.length - 1), 0] : 0 }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {names.map((name, index) => (
                    <div
                      key={`${name}-${index}`}
                      data-testid="immersive-draw-candidate"
                      className="h-7 truncate text-white/90"
                    >
                      {name}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function FocusBeamIsland({
  phase,
  currentClassName,
  displayNames,
  winnerNames,
  candidateKey
}: ImmersiveIslandRenderProps): ReactElement {
  const isReveal = phase === 'reveal' && winnerNames.length > 0
  const names = displayNames.length > 0 ? displayNames.slice(0, 3) : ['扫描中']
  const winner = firstName(winnerNames, '等待结果')

  return (
    <div
      data-testid="immersive-island-beam"
      data-visual-tone="transparent"
      className="relative h-[68px] w-[364px] max-w-[calc(100vw-16px)] overflow-hidden rounded-full border border-white/12 bg-black/[0.82] px-4 text-white shadow-[0_18px_44px_rgba(0,0,0,0.42)] backdrop-blur-xl"
    >
      <motion.div
        className="absolute inset-y-1 w-24 rounded-full bg-white/16 blur-lg"
        animate={{ x: isReveal ? 190 : [-80, 328] }}
        transition={{ duration: isReveal ? 0.55 : 1.1, repeat: isReveal ? 0 : Infinity, ease: 'easeInOut' }}
      />
      <div className="relative z-10 flex h-full min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-white/85">
          <motion.div
            animate={{ opacity: [0.55, 1, 0.55], scaleX: [0.8, 1.15, 0.8] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-white/50">
            {isReveal ? 'Focus Locked' : currentClassName || 'Focus Beam'}
          </div>
          <AnimatePresence mode="wait">
            {isReveal ? (
              <motion.div
                key={`beam-result-${candidateKey}-${winner}`}
                data-testid="immersive-result-list"
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                transition={{ duration: 0.24 }}
                className="mt-0.5 truncate text-lg font-semibold"
              >
                <span data-testid="immersive-result-name">{winner}</span>
              </motion.div>
            ) : (
              <motion.div
                key={`beam-rolling-${candidateKey}`}
                data-testid="immersive-draw-animation"
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="mt-0.5 flex min-w-0 items-center gap-2 overflow-hidden text-base font-semibold"
              >
                {names.map((name, index) => (
                  <span
                    key={`${name}-${index}`}
                    data-testid="immersive-draw-candidate"
                    className={cn('shrink-0 truncate', index > 0 && 'text-white/45')}
                  >
                    {name}
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function CapsuleSlotIsland({
  phase,
  displayNames,
  winnerNames,
  candidateKey
}: ImmersiveIslandRenderProps): ReactElement {
  const isReveal = phase === 'reveal' && winnerNames.length > 0
  const names = rollingNames(displayNames)
  const winner = firstName(winnerNames, '等待结果')

  return (
    <div
      data-testid="immersive-island-slot"
      data-visual-tone="transparent"
      className="flex h-[72px] w-[380px] max-w-[calc(100vw-16px)] items-center gap-3 rounded-full border border-white/12 bg-black/[0.84] px-3 text-white shadow-[0_18px_46px_rgba(0,0,0,0.44)] backdrop-blur-xl"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white/85">
        <motion.div
          animate={isReveal ? { scale: [1, 1.1, 1] } : { rotate: 360 }}
          transition={{ duration: isReveal ? 1 : 0.95, repeat: Infinity, ease: 'linear' }}
        >
          <CircleDot className="h-5 w-5" />
        </motion.div>
      </div>
      <div className="relative h-10 flex-1 overflow-hidden rounded-full border border-white/10 bg-white/[0.06] px-4">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/24" />
        <AnimatePresence mode="wait">
          {isReveal ? (
            <motion.div
              key={`slot-result-${candidateKey}-${winner}`}
              data-testid="immersive-result-list"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              className="flex h-full items-center justify-center text-xl font-bold text-white"
            >
              <span data-testid="immersive-result-name">{winner}</span>
            </motion.div>
          ) : (
            <motion.div
              key={`slot-rolling-${candidateKey}`}
              data-testid="immersive-draw-animation"
              animate={{ y: names.length > 1 ? [0, -40 * (names.length - 1), 0] : 0 }}
              transition={{ duration: 0.92, repeat: Infinity, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {names.map((name, index) => (
                <div
                  key={`${name}-${index}`}
                  data-testid="immersive-draw-candidate"
                  className="flex h-10 items-center justify-center truncate text-lg font-bold"
                >
                  {name}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function PulseBadgeIsland({
  phase,
  currentClassName,
  displayNames,
  winnerNames,
  candidateKey
}: ImmersiveIslandRenderProps): ReactElement {
  const isReveal = phase === 'reveal' && winnerNames.length > 0
  const activeName = firstName(displayNames, '正在抽取 1 人')
  const winner = firstName(winnerNames, '等待结果')

  return (
    <div
      data-testid="immersive-island-pulse"
      data-visual-tone="transparent"
      className="flex h-[70px] w-[348px] max-w-[calc(100vw-16px)] items-center gap-3 rounded-full border border-white/12 bg-black/[0.82] px-4 text-white shadow-[0_18px_42px_rgba(0,0,0,0.42)] backdrop-blur-xl"
    >
      <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white/85">
        <motion.span
          className="absolute inset-0 rounded-full border border-white/30"
          animate={{ scale: [1, 1.32], opacity: [0.7, 0] }}
          transition={{ duration: 0.86, repeat: Infinity, ease: 'easeOut' }}
        />
        {isReveal ? <Check className="h-5 w-5" /> : <Shuffle className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-white/50">
          {isReveal ? 'Result Locked' : currentClassName || 'Single Draw'}
        </div>
        <AnimatePresence mode="wait">
          {isReveal ? (
            <motion.div
              key={`pulse-result-${candidateKey}-${winner}`}
              data-testid="immersive-result-list"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="mt-0.5 truncate text-lg font-semibold"
            >
              <span data-testid="immersive-result-name">{winner}</span>
            </motion.div>
          ) : (
            <motion.div
              key={`pulse-rolling-${candidateKey}-${activeName}`}
              data-testid="immersive-draw-animation"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="mt-0.5 truncate text-lg font-semibold"
            >
              <span data-testid="immersive-draw-candidate">{activeName}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export const IMMERSIVE_ISLAND_VARIANTS: ImmersiveIslandVariant[] = [
  {
    id: 'classic',
    title: 'Classic Island',
    subtitle: '纯黑胶囊, 姓名纵向滚动, 揭晓时宽度呼吸。',
    render: (props) => <ClassicIsland {...props} />
  },
  {
    id: 'beam',
    title: 'Focus Beam',
    subtitle: '扫描光束快速扫过候选, 揭晓时停在姓名上。',
    render: (props) => <FocusBeamIsland {...props} />
  },
  {
    id: 'slot',
    title: 'Capsule Slot',
    subtitle: '胶囊老虎机滚轮, 抽奖感最强, 最终只留一个姓名。',
    render: (props) => <CapsuleSlotIsland {...props} />
  },
  {
    id: 'pulse',
    title: 'Pulse Badge',
    subtitle: '左侧脉冲徽章, 右侧结果条, 轻量且信息清楚。',
    render: (props) => <PulseBadgeIsland {...props} />
  }
]

export function getImmersiveIslandVariant(style: ImmersiveIslandStyle): ImmersiveIslandVariant {
  return (
    IMMERSIVE_ISLAND_VARIANTS.find((variant) => variant.id === style) ??
    IMMERSIVE_ISLAND_VARIANTS[0]
  )
}
