import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useClassesStore } from '../store/classesStore'
import { useHistoryStore } from '../store/historyStore'
import { useSettingsStore } from '../store/settingsStore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shuffle,
  Sparkles,
  User,
  Users,
  ChevronDown,
  ChevronUp,
  Crown,
  Check,
  GraduationCap,
  LayoutGrid,
  Plus,
  ArrowRight,
  Minus,
  Keyboard
} from 'lucide-react'
import { Student } from '../types'
import { cn, toFileUrl } from '../lib/utils'
import { useToastStore } from '../store/toastStore'
import {
  playTick,
  playSlowTick,
  playReveal,
  playTypewriterKey,
  playBounceTick
} from '../lib/sounds'
import { Confetti } from '../components/Confetti'
import { SpinWheel } from '../components/SpinWheel'
import { ClassTimer } from '../components/ClassTimer'
import { PickAnimationRenderer } from '../components/PickAnimations'
import { selectionEngine } from '../engine/selection'
import { buildGroupRequest, buildPickRequest } from '../engine/selection/adapter'
import type { HistorySelectionMeta } from '../engine/selection/types'

/** Animation timing constants */
const ANIMATION_DURATION_MS = 3200
const ANIMATION_DURATION_REDUCED_MS = 300
const TICK_INTERVAL_MIN_MS = 25
const TICK_INTERVAL_RANGE_MS = 425
const LOCK_IN_PROGRESS = 0.85
const SLOW_DOWN_PROGRESS = 0.6

export function Home({
  onNavigate
}: {
  onNavigate: (view: 'home' | 'students' | 'history' | 'statistics' | 'settings' | 'about') => void
}) {
  const {
    classes,
    currentClassId,
    setCurrentClass,
    incrementPickCount,
    addClass,
    updateStudentScore
  } = useClassesStore()
  const { history, addHistoryRecord } = useHistoryStore()
  const addToast = useToastStore((state) => state.addToast)

  const [displayCandidates, setDisplayCandidates] = useState<Student[]>([])
  const [winners, setWinners] = useState<Student[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'slowing' | 'reveal'>('idle')
  const [classDropdownOpen, setClassDropdownOpen] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [wheelActiveStudents, setWheelActiveStudents] = useState<Student[]>([])
  const [mode, setMode] = useState<'pick' | 'group'>('pick')
  const [groupCount, setGroupCount] = useState(2)
  const [groups, setGroups] = useState<Student[][]>([])
  const [showGroups, setShowGroups] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
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
    animationStyle
  } = useSettingsStore()

  const handleDrawRef = useRef<() => void>(() => {})

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setClassDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Listen for global shortcut trigger
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
    if (activityPreset === 'quick-pick' || activityPreset === 'deep-focus') {
      setPickCount(1)
    }
  }, [activityPreset, setPickCount])

  const getPickPlan = useCallback(() => {
    if (!currentClass) {
      return null
    }

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

    return {
      eligibleStudents,
      winners: result.winners,
      selectionMeta
    }
  }, [currentClass, fairness, history, pickCount])

  const activityTemplates = [
    { id: 'quick-pick' as const, label: '快速点名', hint: '单人高频' },
    { id: 'deep-focus' as const, label: '深度互动', hint: '均衡优先' },
    { id: 'group-battle' as const, label: '小组对抗', hint: '分组模式' }
  ]

  const handleDraw = async () => {
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

    // Wheel mode: delegate animation to SpinWheel component
    if (animationStyle === 'wheel') {
      wheelWinnersRef.current = preSelectedWinners
      setWheelActiveStudents(activeStudents)
      setWinners(preSelectedWinners)
      // SpinWheel will call onSpinComplete when done
      return
    }

    const duration = prefersReducedMotion ? ANIMATION_DURATION_REDUCED_MS : ANIMATION_DURATION_MS
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

      // Sound effects
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
          else if (progress >= SLOW_DOWN_PROGRESS && progress < 1 && tickCountRef.current % 4 === 0) playSlowTick()
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

  // Keep ref in sync for global shortcut
  handleDrawRef.current = handleDraw

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
        console.error('Failed to update stats or history', err)
        addToast('抽选结果记录失败，请重试', 'error')
      }
    },
    [currentClass, soundEnabled, incrementPickCount, addHistoryRecord]
  )

  const handleWheelComplete = useCallback(() => {
    finishDraw(wheelWinnersRef.current)
  }, [finishDraw])

  const handleGroup = () => {
    if (!currentClass) return

    const groupResult = selectionEngine.group(
      buildGroupRequest({
        currentClass,
        history,
        policy: fairness,
        groupCount
      })
    )

    const activeStudents = groupResult.groups.flat()
    if (activeStudents.length < 2) {
      addToast('至少需要 2 名可用学生才能分组！', 'error')
      return
    }

    setGroups(groupResult.groups.filter((group) => group.length > 0))
    setShowGroups(true)
    setShowConfetti(true)
    if (soundEnabled) playReveal()
  }

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 2,
        delay: Math.random() * 0.5
      })),
    []
  )

  return (
    <div
      className={cn(
        'h-screen relative overflow-hidden bg-gradient-to-b from-transparent to-surface-container-low/30',
        projectorMode && 'bg-gradient-to-b from-surface-container-low/10 to-surface-container'
      )}
    >
      {/* Screen reader announcement for pick results */}
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {phase === 'reveal' && winners.length > 0 &&
          `抽选结果：${winners.map((w) => w.name).join('、')}`}
        {showGroups && groups.length > 0 &&
          groups.map((g, i) => `第${i + 1}组：${g.map((s) => s.name).join('、')}`).join('。')}
      </div>

      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none z-0"
          style={{ backgroundImage: `url("${toFileUrl(backgroundImage)}")` }}
        />
      )}

      <AnimatePresence>
        {(phase === 'spinning' || phase === 'slowing') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Controls — Left: class selector, Right: timer + mode + count */}
      <div className="absolute top-4 left-4 z-20" ref={dropdownRef}>
        <button
          onClick={() => !isSpinning && setClassDropdownOpen(!classDropdownOpen)}
          disabled={isSpinning}
          className="flex items-center gap-2.5 bg-surface-container-high border border-outline-variant rounded-full px-3 py-1.5 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-w-[140px] elevation-1 transition-colors hover:bg-surface-container-high/80"
        >
          {currentClass ? (
            <>
              <span className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                {currentClass.name.slice(0, 1)}
              </span>
              <span className="font-medium truncate">{currentClass.name}</span>
            </>
          ) : (
            <>
              <GraduationCap className="w-4 h-4 text-on-surface-variant" />
              <span className="text-on-surface-variant">选择班级</span>
            </>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-on-surface-variant ml-auto shrink-0 transition-transform duration-200',
              classDropdownOpen && 'rotate-180'
            )}
          />
        </button>

        <AnimatePresence>
          {classDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-64 bg-surface-container-high border border-outline-variant/50 rounded-2xl elevation-2 overflow-hidden z-50"
            >
              <div className="p-1.5 max-h-[280px] overflow-y-auto custom-scrollbar">
                {classes.map((c) => {
                  const isSelected = currentClassId === c.id
                  const activeCount = c.students.filter((s) => s.status === 'active').length
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCurrentClass(c.id)
                        setClassDropdownOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left',
                        isSelected
                          ? 'bg-secondary-container text-secondary-container-foreground'
                          : 'hover:bg-surface-container text-on-surface'
                      )}
                    >
                      <span
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {c.name.slice(0, 1)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{c.name}</div>
                        <div className="text-[11px] text-on-surface-variant/70 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {activeCount} 人可抽选
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  )
                })}
                {classes.length === 0 && (
                  <div className="px-3 py-6 text-center text-on-surface-variant text-sm">
                    暂无班级
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        className={cn(
          'absolute top-4 right-4 z-20 flex items-center gap-3',
          projectorMode && 'top-6 right-6 gap-4'
        )}
      >
        {/* Timer */}
        <div className="relative">
          <ClassTimer />
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-full border border-outline-variant overflow-hidden elevation-1">
          <button
            onClick={() => {
              setMode('pick')
              setShowGroups(false)
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer',
              mode === 'pick'
                ? 'bg-secondary-container text-secondary-container-foreground'
                : 'text-on-surface-variant hover:bg-surface-container-high/60'
            )}
          >
            <Shuffle className="w-3.5 h-3.5" />
            抽选
          </button>
          <button
            onClick={() => {
              setMode('group')
              setPhase('idle')
              setWinners([])
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer',
              mode === 'group'
                ? 'bg-secondary-container text-secondary-container-foreground'
                : 'text-on-surface-variant hover:bg-surface-container-high/60'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            分组
          </button>
        </div>

        {/* Pick count (pick mode) or Group count (group mode) */}
        {mode === 'pick' ? (
          <div className="flex items-center bg-surface-container-high rounded-full px-3 py-1.5 elevation-1">
            <span className="text-sm font-medium mr-2 text-on-surface-variant flex items-center gap-1">
              <Users className="w-4 h-4" />
              人数
            </span>
            <button
              onClick={() => setPickCount(Math.max(1, pickCount - 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-on-surface/10 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              disabled={isSpinning}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <span className="w-6 text-center font-bold text-primary">{pickCount}</span>
            <button
              onClick={() => setPickCount(Math.min(10, pickCount + 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-on-surface/10 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              disabled={isSpinning}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center bg-surface-container-high rounded-full px-3 py-1.5 elevation-1">
            <span className="text-sm font-medium mr-2 text-on-surface-variant flex items-center gap-1">
              <LayoutGrid className="w-4 h-4" />
              组数
            </span>
            <button
              onClick={() => setGroupCount(Math.max(2, groupCount - 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-on-surface/10 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <span className="w-6 text-center font-bold text-primary">{groupCount}</span>
            <button
              onClick={() => setGroupCount(Math.min(10, groupCount + 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-on-surface/10 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Card */}
      <div className="absolute inset-0 top-14 flex items-center justify-center p-4 z-10">
        <div
          className={cn(
            'relative w-full max-w-2xl bg-surface-container rounded-[28px] elevation-1 flex flex-col items-center justify-center p-8 pt-14 pb-24 min-h-[400px] overflow-hidden',
            projectorMode && 'max-w-4xl min-h-[520px] p-10 pt-16 pb-28'
          )}
        >
          <Confetti active={showConfetti && confettiEnabled && !prefersReducedMotion} />

          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-2 rounded-full bg-surface-container-high/80 px-3 py-1.5 border border-outline-variant/40">
              <span className="text-xs text-on-surface-variant">课堂模板</span>
              {activityTemplates.map((template) => (
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

          {/* Group mode results */}
          {mode === 'group' && showGroups && groups.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
              <div className="flex items-center justify-center gap-2 mb-4">
                <LayoutGrid className="w-4 h-4 text-primary" />
                <span className="text-base font-semibold text-on-surface">分组结果</span>
              </div>
              <div
                className={cn(
                  'grid gap-3 w-full',
                  groups.length <= 2
                    ? 'grid-cols-2'
                    : groups.length <= 4
                      ? 'grid-cols-2 lg:grid-cols-4'
                      : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
                )}
              >
                {groups.map((group, gi) => (
                  <motion.div
                    key={gi}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gi * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
                    className="bg-surface-container-high rounded-xl p-3 elevation-1"
                  >
                    <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-outline-variant/30">
                      <span className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                        {gi + 1}
                      </span>
                      <span className="text-xs font-semibold text-on-surface">第 {gi + 1} 组</span>
                      <span className="text-[10px] text-on-surface-variant ml-auto">
                        {group.length} 人
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {group.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md hover:bg-surface-container transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[9px] font-bold shrink-0">
                            {student.name.slice(0, 1)}
                          </div>
                          <span className="text-xs text-on-surface truncate">{student.name}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Group mode idle */}
          {mode === 'group' && !showGroups && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.3, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-primary/20"
              >
                <LayoutGrid className="w-32 h-32 mx-auto" strokeWidth={1} />
              </motion.div>
              <div className="text-on-surface-variant text-xl font-light">
                {currentClass ? `将学生随机分为 ${groupCount} 组` : '请先选择班级'}
              </div>
            </motion.div>
          )}

          {/* Pick mode content */}
          {mode === 'pick' && (
            <>
              {/* Wheel mode */}
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

              {/* Non-wheel idle state */}
              {phase === 'idle' &&
                winners.length === 0 &&
                !(animationStyle === 'wheel' && isSpinning) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-4"
                  >
                    {classes.length === 0 ? (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          className="text-primary/20"
                        >
                          <GraduationCap className="w-28 h-28 mx-auto" strokeWidth={1} />
                        </motion.div>
                        <div className="space-y-2">
                          <div className="text-on-surface text-xl font-medium">
                            欢迎使用 Stellarc
                          </div>
                          <div className="text-on-surface-variant text-sm">
                            创建你的第一个班级，开始随机点名
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            onClick={() => {
                              const name = prompt('请输入班级名称：')
                              if (name?.trim()) {
                                addClass(name.trim())
                                addToast(`班级「${name.trim()}」已创建`, 'success')
                              }
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium elevation-1 hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            快速创建班级
                          </button>
                          <button
                            onClick={() => onNavigate('students')}
                            className="flex items-center gap-2 px-5 py-2.5 border border-outline-variant text-on-surface rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
                          >
                            学生管理
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : !currentClass ? (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.3, 0.2] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          className="text-primary/20"
                        >
                          <Users className="w-28 h-28 mx-auto" strokeWidth={1} />
                        </motion.div>
                        <div className="text-on-surface-variant text-xl font-light">
                          请在右上角选择班级
                        </div>
                      </>
                    ) : currentClass.students.length === 0 ? (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.3, 0.2] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          className="text-primary/20"
                        >
                          <Users className="w-28 h-28 mx-auto" strokeWidth={1} />
                        </motion.div>
                        <div className="space-y-2">
                          <div className="text-on-surface-variant text-xl font-light">
                            当前班级还没有学生
                          </div>
                          <button
                            onClick={() => onNavigate('students')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium elevation-1 hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            添加学生
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col items-center gap-1">
                          <motion.div
                            animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.3, 0.15] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className="text-primary/20"
                          >
                            <Sparkles className="w-20 h-20 mx-auto" strokeWidth={1} />
                          </motion.div>
                          <div className="text-on-surface text-lg font-medium">
                            {currentClass.name}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {
                                currentClass.students.filter((s) => s.status === 'active').length
                              }{' '}
                              人可抽选
                            </span>
                            <span className="text-outline-variant">/</span>
                            <span>{currentClass.students.length} 人总计</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant/60 pt-2">
                          <Keyboard className="w-3.5 h-3.5" />
                          <span>按空格键或点击下方按钮开始抽选</span>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

              <AnimatePresence mode="popLayout">
                {(phase === 'spinning' || phase === 'slowing') && animationStyle !== 'wheel' && (
                  <motion.div
                    key="spinning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    className="relative w-full absolute inset-0 flex items-center justify-center p-8 overflow-hidden"
                  >
                    {/* Top/bottom fade masks for slot machine effect */}
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

                {phase === 'reveal' && winners.length > 0 && (
                  <motion.div
                    key="winner"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative text-center w-full py-2"
                  >
                    {!prefersReducedMotion &&
                      particles.map((p) => (
                        <motion.div
                          key={p.id}
                          className="absolute rounded-full bg-primary/20"
                          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{
                            opacity: [0, 0.8, 0],
                            scale: [0, 1.5, 0],
                            y: [0, -40 - Math.random() * 60]
                          }}
                          transition={{ duration: 2, delay: p.delay, ease: 'easeOut' }}
                        />
                      ))}

                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                      className="flex items-center justify-center gap-2 mb-4"
                    >
                      <Crown className="w-5 h-5 text-tertiary" />
                      <span className="text-lg text-on-surface-variant font-medium tracking-wide">
                        {winners.length > 1 ? `已选中 ${winners.length} 人` : '天选之子'}
                      </span>
                      <Crown className="w-5 h-5 text-tertiary" />
                    </motion.div>

                    {winners.length === 1 ? (
                      /* Single winner: compact vertical layout */
                      <motion.div
                        initial={{ opacity: 0, scale: 0.3, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
                        className="flex flex-col items-center gap-3 relative"
                      >
                        <div className="absolute -inset-4 bg-primary/5 rounded-[28px] blur-2xl" />
                        {photoMode && (
                          <div className="relative">
                            {winners[0].photo ? (
                              <motion.img
                                src={toFileUrl(winners[0].photo)}
                                alt={winners[0].name}
                                className="w-24 h-24 rounded-full object-cover border-4 border-primary/60 elevation-2"
                                initial={{ rotate: -10 }}
                                animate={{ rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-4 border-primary/20 elevation-2">
                                <User className="w-12 h-12 text-primary/40" />
                              </div>
                            )}
                          </div>
                        )}
                        <div className="text-center relative">
                          <div className="text-5xl md:text-7xl font-black text-primary drop-shadow-sm">
                            {winners[0].name}
                          </div>
                          {showStudentId && winners[0].studentId && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 }}
                              className="text-base text-on-surface-variant mt-1.5 font-mono bg-surface-container-high px-3 py-0.5 rounded-full inline-block"
                            >
                              {winners[0].studentId}
                            </motion.div>
                          )}
                          {currentClass &&
                            (() => {
                              const liveStudent = currentClass.students.find(
                                (s) => s.id === winners[0].id
                              )
                              const score = liveStudent?.score || 0
                              return (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.7 }}
                                  className="flex items-center gap-3 mt-3 justify-center"
                                >
                                  <button
                                    onClick={() =>
                                      updateStudentScore(currentClass.id, winners[0].id, score - 1)
                                    }
                                    className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors cursor-pointer"
                                  >
                                    <Minus className="w-5 h-5" />
                                  </button>
                                  <span className="text-lg font-bold text-on-surface min-w-[48px] text-center tabular-nums">
                                    {score} 分
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateStudentScore(currentClass.id, winners[0].id, score + 1)
                                    }
                                    className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-5 h-5" />
                                  </button>
                                </motion.div>
                              )
                            })()}
                        </div>
                      </motion.div>
                    ) : (
                      /* Multi-winner: grid card layout */
                      <div
                        className={cn(
                          'grid gap-4 w-full max-w-lg mx-auto',
                          winners.length <= 2
                            ? 'grid-cols-2'
                            : winners.length <= 4
                              ? 'grid-cols-2'
                              : 'grid-cols-3'
                        )}
                      >
                        {winners.map((student, i) => (
                          <motion.div
                            key={student.id + i}
                            initial={{ opacity: 0, scale: 0.3, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{
                              delay: 0.15 + 0.08 * i,
                              type: 'spring',
                              stiffness: 260,
                              damping: 18
                            }}
                            className="flex flex-col items-center gap-2 p-3 bg-surface-container-high/60 rounded-2xl relative"
                          >
                            <div className="absolute -inset-1 bg-primary/5 rounded-2xl blur-xl" />
                            {photoMode && (
                              <div className="relative">
                                {student.photo ? (
                                  <img
                                    src={toFileUrl(student.photo)}
                                    alt={student.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/40"
                                  />
                                ) : (
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/20">
                                    <User className="w-8 h-8 text-primary/40" />
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="text-center relative">
                              <div className="text-2xl font-bold text-primary">{student.name}</div>
                              {showStudentId && student.studentId && (
                                <div className="text-xs text-on-surface-variant font-mono mt-0.5">
                                  {student.studentId}
                                </div>
                              )}
                              {currentClass &&
                                (() => {
                                  const liveStudent = currentClass.students.find(
                                    (s) => s.id === student.id
                                  )
                                  const score = liveStudent?.score || 0
                                  return (
                                    <div className="flex items-center gap-2 mt-2 justify-center">
                                      <button
                                        onClick={() =>
                                          updateStudentScore(currentClass.id, student.id, score - 1)
                                        }
                                        className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors cursor-pointer"
                                      >
                                        <Minus className="w-4 h-4" />
                                      </button>
                                      <span className="text-sm font-bold text-on-surface min-w-[36px] text-center tabular-nums">
                                        {score} 分
                                      </span>
                                      <button
                                        onClick={() =>
                                          updateStudentScore(currentClass.id, student.id, score + 1)
                                        }
                                        className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )
                                })()}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.5, type: 'spring' }}
                      className="absolute -top-2 -right-2 text-tertiary/80"
                    >
                      <Sparkles size={32} fill="currentColor" />
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0, rotate: 30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.6, type: 'spring' }}
                      className="absolute -bottom-2 -left-2 text-tertiary/60"
                    >
                      <Sparkles size={24} fill="currentColor" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Action Button — inside card bottom */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
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
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
      </div>
    </div>
  )
}
