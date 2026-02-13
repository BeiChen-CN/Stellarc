import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useClassesStore } from '../store/classesStore'
import { useHistoryStore } from '../store/historyStore'
import { useSettingsStore } from '../store/settingsStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Shuffle, LayoutGrid, ChevronDown, ChevronUp, Users } from 'lucide-react'
import { Student } from '../types'
import { cn, toFileUrl } from '../lib/utils'
import { useToastStore } from '../store/toastStore'
import { useConfirmStore } from '../store/confirmStore'
import { useSpeedFactor } from '../lib/useSpeedFactor'
import {
  playTick,
  playSlowTick,
  playReveal,
  playTypewriterKey,
  playBounceTick
} from '../lib/sounds'
import { Confetti } from '../components/Confetti'
import { logger } from '../lib/logger'
import { SpinWheel } from '../components/SpinWheel'
import { PickAnimationRenderer } from '../components/PickAnimations'
import { selectionEngine } from '../engine/selection'
import { buildGroupRequest, buildPickRequest } from '../engine/selection/adapter'
import type { HistorySelectionMeta } from '../engine/selection/types'
import { ClassSelector } from './home/ClassSelector'
import { TopControls } from './home/TopControls'
import { GroupResults } from './home/GroupResults'
import { WinnerDisplay } from './home/WinnerDisplay'
import { PickIdleState } from './home/PickIdleState'
import { ClassTimer } from '../components/ClassTimer'

const ANIMATION_DURATION_MAP = { elegant: 4800, balanced: 3200, fast: 1600 } as const
const ANIMATION_DURATION_REDUCED_MS = 300
const TICK_INTERVAL_MIN_MS = 25
const TICK_INTERVAL_RANGE_MS = 425
const LOCK_IN_PROGRESS = 0.85
const SLOW_DOWN_PROGRESS = 0.6

const ACTIVITY_TEMPLATES = [
  { id: 'quick-pick' as const, label: '快速点名', hint: '单人高频' },
  { id: 'deep-focus' as const, label: '深度互动', hint: '均衡优先' },
  { id: 'group-battle' as const, label: '小组对抗', hint: '分组模式' }
]

export function Home({
  onNavigate
}: {
  onNavigate: (view: 'home' | 'students' | 'history' | 'statistics' | 'settings' | 'about') => void
}) {
  const { classes, currentClassId, setCurrentClass, incrementPickCount, addClass } =
    useClassesStore()
  const { history, addHistoryRecord } = useHistoryStore()
  const addToast = useToastStore((state) => state.addToast)
  const showPrompt = useConfirmStore((state) => state.showPrompt)
  const sf = useSpeedFactor()

  const [displayCandidates, setDisplayCandidates] = useState<Student[]>([])
  const [winners, setWinners] = useState<Student[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'slowing' | 'reveal'>('idle')
  const [showConfetti, setShowConfetti] = useState(false)
  const [wheelActiveStudents, setWheelActiveStudents] = useState<Student[]>([])
  const [mode, setMode] = useState<'pick' | 'group'>('pick')
  const [groupCount, setGroupCount] = useState(2)
  const [groups, setGroups] = useState<Student[][]>([])
  const [showGroups, setShowGroups] = useState(false)
  const animationRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickCountRef = useRef(0)
  const wheelWinnersRef = useRef<Student[]>([])
  const lastSelectionMetaRef = useRef<HistorySelectionMeta | null>(null)
  const [candidateKey, setCandidateKey] = useState(0)

  const prefersReducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const currentClass = classes.find((c) => c.id === currentClassId)

  const {
    fairness,
    pickCount,
    setPickCount,
    projectorMode,
    activityPreset,
    setActivityPreset,
    showStudentId,
    photoMode,
    backgroundImage,
    soundEnabled,
    confettiEnabled,
    animationStyle,
    animationSpeed
  } = useSettingsStore()

  const handleDrawRef = useRef<() => void>(() => {})

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const cleanup = window.electronAPI.onShortcutTriggered((action) => {
      if (action === 'pick') {
        handleDrawRef.current()
      }
    })
    return cleanup
  }, [])

  useEffect(() => {
    if (activityPreset === 'group-battle') {
      setMode('group')
      setGroupCount((prev) => Math.max(prev, 4))
      return
    }

    setMode('pick')
  }, [activityPreset])

  const getPickPlan = useCallback(() => {
    if (!currentClass) return null

    const result = selectionEngine.pick(
      buildPickRequest({
        currentClass,
        history,
        policy: fairness,
        count: pickCount
      })
    )

    const candidateMap = new Map(result.traces.map((trace) => [trace.studentId, trace]))
    const eligibleStudents = currentClass.students.filter((student) => {
      const trace = candidateMap.get(student.id)
      return !!trace?.eligible
    })

    const selectionMeta: HistorySelectionMeta = {
      ...result.meta,
      cooldownExcludedIds: result.cooldownExcludedIds
    }

    return { eligibleStudents, winners: result.winners, selectionMeta }
  }, [currentClass, fairness, history, pickCount])

  const finishDraw = useCallback(
    (preSelectedWinners: Student[]) => {
      if (!currentClass) return
      setDisplayCandidates(preSelectedWinners)
      setWinners(preSelectedWinners)
      setIsSpinning(false)
      setPhase('reveal')
      setShowConfetti(true)

      if (soundEnabled) playReveal()

      try {
        preSelectedWinners.forEach((w) => incrementPickCount(currentClass.id, w.id))
        addHistoryRecord({
          classId: currentClass.id,
          className: currentClass.name,
          pickedStudents: preSelectedWinners.map((w) => ({
            id: w.id,
            name: w.name,
            studentId: w.studentId
          })),
          selectionMeta: lastSelectionMetaRef.current ?? undefined
        })
      } catch (err) {
        logger.error('Home', 'Failed to update stats or history', err)
        addToast('抽选结果记录失败，请重试', 'error')
      }
    },
    [currentClass, soundEnabled, incrementPickCount, addHistoryRecord, addToast]
  )

  const handleWheelComplete = useCallback(() => {
    finishDraw(wheelWinnersRef.current)
  }, [finishDraw])

  const handleDraw = () => {
    if (isSpinning) return
    if (!currentClass || currentClass.students.length === 0) return

    const pickPlan = getPickPlan()
    if (!pickPlan) return

    const activeStudents = pickPlan.eligibleStudents
    if (activeStudents.length === 0) {
      addToast('当前班级没有可被抽选的学生！', 'error')
      return
    }

    lastSelectionMetaRef.current = pickPlan.selectionMeta

    setIsSpinning(true)
    setWinners([])
    setDisplayCandidates([])
    setShowConfetti(false)
    setPhase('spinning')
    tickCountRef.current = 0

    const countToPick = Math.min(pickCount, activeStudents.length)
    const preSelectedWinners = pickPlan.winners.slice(0, countToPick)

    if (animationStyle === 'wheel') {
      wheelWinnersRef.current = preSelectedWinners
      setWheelActiveStudents(activeStudents)
      setWinners(preSelectedWinners)
      return
    }

    if (animationStyle === 'charByChar') {
      setDisplayCandidates(preSelectedWinners)
      setCandidateKey((k) => k + 1)
      setPhase('spinning')
      if (soundEnabled) playTick()
      // Calculate total reveal time: 0.6s per char + 0.4s animation + 0.5s pause
      const maxChars = Math.max(...preSelectedWinners.map((w) => w.name.length))
      const revealDuration = (maxChars * 0.6 + 0.4 + 0.5) * 1000 * sf
      timeoutRef.current = setTimeout(() => {
        finishDraw(preSelectedWinners)
      }, revealDuration)
      return
    }

    const duration = prefersReducedMotion ? ANIMATION_DURATION_REDUCED_MS : ANIMATION_DURATION_MAP[animationSpeed] * sf
    const startTime = performance.now()

    const animate = (time: number) => {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      const interval = TICK_INTERVAL_MIN_MS + eased * TICK_INTERVAL_RANGE_MS

      const currentRandoms: Student[] = []
      for (let i = 0; i < countToPick; i++) {
        if (progress > LOCK_IN_PROGRESS) {
          currentRandoms.push(preSelectedWinners[i])
        } else {
          currentRandoms.push(activeStudents[Math.floor(Math.random() * activeStudents.length)])
        }
      }
      setDisplayCandidates(currentRandoms)
      setCandidateKey((k) => k + 1)

      if (soundEnabled && !prefersReducedMotion) {
        tickCountRef.current++
        if (animationStyle === 'typewriter') {
          if (tickCountRef.current % 3 === 0) playTypewriterKey()
        } else if (animationStyle === 'bounce') {
          if (progress < SLOW_DOWN_PROGRESS && tickCountRef.current % 2 === 0) playBounceTick()
          else if (progress >= SLOW_DOWN_PROGRESS && progress < 1 && tickCountRef.current % 4 === 0)
            playBounceTick()
        } else {
          if (progress < SLOW_DOWN_PROGRESS && tickCountRef.current % 2 === 0) playTick()
          else if (progress >= SLOW_DOWN_PROGRESS && progress < 1 && tickCountRef.current % 4 === 0)
            playSlowTick()
        }
      }

      if (progress > SLOW_DOWN_PROGRESS && phase !== 'slowing') {
        setPhase('slowing')
      }

      if (progress < 1) {
        timeoutRef.current = setTimeout(() => {
          animationRef.current = requestAnimationFrame(animate)
        }, interval)
      } else {
        finishDraw(preSelectedWinners)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  handleDrawRef.current = handleDraw

  const handleGroup = () => {
    if (!currentClass) return

    const activeStudents = currentClass.students.filter((s) => s.status === 'active')
    if (activeStudents.length < 2) {
      addToast('至少需要 2 名可用学生才能分组！', 'error')
      return
    }

    const safeGroupCount = Math.min(groupCount, activeStudents.length)

    const groupResult = selectionEngine.group(
      buildGroupRequest({
        currentClass,
        history,
        policy: fairness,
        groupCount: safeGroupCount
      })
    )

    setGroups(groupResult.groups.filter((group) => group.length > 0))
    setShowGroups(true)
    setShowConfetti(true)
    if (soundEnabled) playReveal()
  }

  const handleModeChange = useCallback(
    (newMode: 'pick' | 'group') => {
      setMode(newMode)
      if (newMode === 'pick') {
        setShowGroups(false)
      } else {
        setPhase('idle')
        setWinners([])
      }
    },
    []
  )

  const handleCreateClass = useCallback(() => {
    showPrompt('创建班级', '请输入新班级的名称', '班级名称', (name) => {
      addClass(name)
      addToast(`班级「${name}」已创建`, 'success')
    })
  }, [addClass, addToast, showPrompt])

  return (
    <div
      className={cn(
        'h-full relative overflow-hidden bg-gradient-to-b from-transparent to-surface-container-low/30',
        projectorMode && 'bg-gradient-to-b from-surface-container-low/10 to-surface-container'
      )}
    >
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {phase === 'reveal' &&
          winners.length > 0 &&
          `抽选结果：${winners.map((w) => w.name).join('、')}`}
        {showGroups &&
          groups.length > 0 &&
          groups.map((g, i) => `第${i + 1}组：${g.map((s) => s.name).join('、')}`).join('。')}
      </div>

      {backgroundImage && (
        <img
          src={toFileUrl(backgroundImage)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none z-0"
        />
      )}

      <AnimatePresence>
        {(phase === 'spinning' || phase === 'slowing') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 * sf } }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
          </motion.div>
        )}
      </AnimatePresence>

      <ClassSelector
        classes={classes}
        currentClassId={currentClassId}
        currentClass={currentClass}
        isSpinning={isSpinning}
        onSelectClass={setCurrentClass}
      />

      <TopControls
        mode={mode}
        groupCount={groupCount}
        projectorMode={projectorMode}
        onModeChange={handleModeChange}
        onGroupCountChange={setGroupCount}
      />

      {/* Timer — top center */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
        <ClassTimer />
      </div>

      {/* Main Card */}
      <div className="absolute inset-0 top-14 flex flex-col items-center justify-center p-4 z-10">
        {/* Activity template bar — above card */}
        <div className="mb-3 shrink-0">
          <div className="flex items-center gap-2 rounded-full bg-surface-container-high/80 px-3 py-1.5 border border-outline-variant/40">
            <span className="text-xs text-on-surface-variant">课堂模板</span>
            {ACTIVITY_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => setActivityPreset(template.id)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[11px] transition-colors cursor-pointer',
                  activityPreset === template.id
                    ? 'bg-secondary-container text-secondary-container-foreground'
                    : 'text-on-surface-variant hover:bg-surface-container'
                )}
                title={template.hint}
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        <div
          className={cn(
            'relative w-full max-w-2xl bg-surface-container rounded-[28px] elevation-1 flex flex-col items-center justify-center p-8 pb-24 h-[480px] overflow-hidden',
            projectorMode && 'max-w-4xl h-[600px] p-10 pb-28'
          )}
        >
          <Confetti active={showConfetti && confettiEnabled && !prefersReducedMotion} />

          {/* Group mode */}
          {mode === 'group' && showGroups && groups.length > 0 && (
            <GroupResults groups={groups} />
          )}

          {mode === 'group' && !showGroups && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.3, 0.2] }}
                transition={{ duration: 3 * sf, repeat: Infinity, ease: 'easeInOut' }}
                className="text-primary/20"
              >
                <LayoutGrid className="w-32 h-32 mx-auto" strokeWidth={1} />
              </motion.div>
              <div className="text-on-surface-variant text-xl font-light">
                {currentClass ? `将学生随机分为 ${groupCount} 组` : '请先选择班级'}
              </div>
            </motion.div>
          )}

          {/* Pick mode */}
          {mode === 'pick' && (
            <>
              {animationStyle === 'wheel' && isSpinning && wheelActiveStudents.length > 0 && (
                <div className="flex items-center justify-center w-full h-full">
                  <SpinWheel
                    students={wheelActiveStudents}
                    winners={winners}
                    isSpinning={isSpinning}
                    soundEnabled={soundEnabled}
                    onSpinComplete={handleWheelComplete}
                  />
                </div>
              )}

              {phase === 'idle' &&
                winners.length === 0 &&
                !(animationStyle === 'wheel' && isSpinning) && (
                  <PickIdleState
                    classes={classes}
                    currentClass={currentClass}
                    onNavigate={onNavigate}
                    onCreateClass={handleCreateClass}
                  />
                )}

              <AnimatePresence mode="popLayout">
                {(phase === 'spinning' || phase === 'slowing') && animationStyle !== 'wheel' && (
                  <motion.div
                    key="spinning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 * sf } }}
                    className="absolute inset-0 flex items-center justify-center p-8 overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-surface-container to-transparent z-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-surface-container to-transparent z-10 pointer-events-none" />
                    <div
                      className={cn(
                        displayCandidates.length > 1 ? 'grid gap-6 grid-cols-2' : 'flex',
                        displayCandidates.length > 4 && 'grid-cols-3',
                        'items-center justify-center justify-items-center'
                      )}
                    >
                      <PickAnimationRenderer
                        students={displayCandidates}
                        candidateKey={candidateKey}
                        animationStyle={animationStyle}
                        phase={phase}
                      />
                    </div>
                  </motion.div>
                )}

                {phase === 'reveal' && winners.length > 0 && currentClass && (
                  <div className="w-full overflow-y-auto overflow-x-hidden max-h-full pb-4 scrollbar-hide">
                    <WinnerDisplay
                      winners={winners}
                      currentClass={currentClass}
                      showStudentId={showStudentId}
                      photoMode={photoMode}
                    />
                  </div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Action Button */}
          <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center z-20">
            {mode === 'pick' ? (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 8px 24px -4px hsl(var(--primary) / 0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDraw}
                disabled={isSpinning || !currentClass || currentClass.students.length === 0}
                aria-label={isSpinning ? '抽选中' : '开始点名'}
                aria-busy={isSpinning}
                className={cn(
                  'px-10 py-3 bg-primary text-primary-foreground rounded-full text-xl font-bold elevation-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 h-12 cursor-pointer',
                  projectorMode && 'h-14 text-2xl px-12'
                )}
              >
                {isSpinning ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1 * sf, repeat: Infinity, ease: 'linear' }}
                    >
                      <Shuffle className="w-6 h-6" />
                    </motion.div>
                    抽选中...
                  </>
                ) : (
                  <>
                    <Shuffle className="w-6 h-6" />
                    开始点名
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 8px 24px -4px hsl(var(--primary) / 0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGroup}
                disabled={!currentClass || currentClass.students.length === 0}
                className={cn(
                  'px-10 py-3 bg-primary text-primary-foreground rounded-full text-xl font-bold elevation-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 h-12 cursor-pointer',
                  projectorMode && 'h-14 text-2xl px-12'
                )}
              >
                <LayoutGrid className="w-6 h-6" />
                {showGroups ? '重新分组' : '随机分组'}
              </motion.button>
            )}
          </div>
        </div>

        {/* Pick Count — below card */}
        {mode === 'pick' && !isSpinning && (
          <div className="mt-3 shrink-0 flex items-center bg-surface-container-high/80 rounded-full px-2.5 py-1 border border-outline-variant/40">
            <span className="text-xs font-medium mr-1.5 text-on-surface-variant flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              人数
            </span>
            <button
              onClick={() => setPickCount(Math.max(1, pickCount - 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-on-surface/10 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <span className="w-5 text-center text-sm font-bold text-primary">{pickCount}</span>
            <button
              onClick={() => setPickCount(Math.min(10, pickCount + 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-on-surface/10 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
