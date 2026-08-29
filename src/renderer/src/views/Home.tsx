import { useState, useRef, useEffect, useCallback, useMemo, type ReactElement } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useClassesStore } from '../store/classesStore'
import { useHistoryStore } from '../store/historyStore'
import { useSettingsStore } from '../store/settingsStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Shuffle, LayoutGrid, ChevronDown, ChevronUp, Users, Maximize2 } from 'lucide-react'
import { Student, ClassTaskTemplate, type AppView } from '../types'
import { cn, toFileUrl } from '../lib/utils'
import { useToastStore } from '../store/toastStore'
import { useConfirmStore } from '../store/confirmStore'
import { useSpeedFactor } from '../lib/useSpeedFactor'
import {
  playTick,
  playSlowTick,
  playReveal,
  playTypewriterKey,
  playBounceTick,
  setSoundIntensity
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
import { ImmersiveShell } from './home/ImmersiveShell'
import { useImmersiveUI } from './home/hooks/useImmersiveUI'
import { useTemporaryExclusion } from './home/hooks/useTemporaryExclusion'
import { TemporaryExclusionMenu, AutoDrawBar } from './home/DrawToolbar'
import {
  PickPreviewPanel,
  StudentExplainPanel,
  SelectionExplainPanel
} from './home/SelectionExplainPanels'

const ANIMATION_DURATION_MAP = { elegant: 3200, balanced: 2200, fast: 1300 } as const
const ANIMATION_DURATION_REDUCED_MS = 300
const TICK_INTERVAL_MIN_MS = 38
const TICK_INTERVAL_RANGE_MS = 145
const LOCK_IN_PROGRESS = 0.85
const SLOW_DOWN_PROGRESS = 0.6
const SOUND_GAP_BASE_MS = { elegant: 120, balanced: 145, fast: 180 } as const
type PickPlan = {
  eligibleStudents: Student[]
  winners: Student[]
  traces: ReturnType<typeof selectionEngine.pick>['traces']
  selectionMeta: HistorySelectionMeta
  totalCandidates: number
}

type DrawOptions = {
  countOverride?: number
}

function pickUniqueStudents(pool: Student[], count: number): Student[] {
  if (count <= 0 || pool.length === 0) return []
  if (count >= pool.length) return [...pool]
  const copy = [...pool]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

const DEFAULT_GROUP_TASK_TEMPLATES: ClassTaskTemplate[] = [
  { id: 'task-observe', name: '观察记录', scoreDelta: 1 },
  { id: 'task-quiz', name: '快问快答', scoreDelta: 2 },
  { id: 'task-present', name: '上台展示', scoreDelta: 3 },
  { id: 'task-review', name: '同伴互评', scoreDelta: 1 }
]

export function Home({
  onNavigate,
  onImmersiveChange
}: {
  onNavigate: (view: AppView) => void
  onImmersiveChange?: (immersive: boolean) => void
}): ReactElement {
  const { classes, currentClassId, setCurrentClass, incrementPickCount, addClass, applyTaskScore } =
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
  const [groupAssignments, setGroupAssignments] = useState<
    Array<{ groupIndex: number; taskTemplateId: string; taskName: string; scoreDelta: number }>
  >([])
  const [showGroups, setShowGroups] = useState(false)
  const [autoDrawEnabled, setAutoDrawEnabled] = useState(false)
  const [autoDrawRounds, setAutoDrawRounds] = useState(3)
  const [autoDrawIntervalMs, setAutoDrawIntervalMs] = useState(3600)
  const [autoDrawRemaining, setAutoDrawRemaining] = useState(0)
  const animationRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickCountRef = useRef(0)
  const lastSoundAtRef = useRef(0)
  const wheelWinnersRef = useRef<Student[]>([])
  const lastSelectionMetaRef = useRef<HistorySelectionMeta | null>(null)
  const [lastSelectionMeta, setLastSelectionMeta] = useState<HistorySelectionMeta | null>(null)
  const [candidateKey, setCandidateKey] = useState(0)
  const autoDrawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoDrawRemainingRef = useRef(0)
  const [lastGroupSnapshot, setLastGroupSnapshot] = useState<Student[][]>([])
  const [pickGenderFilter, setPickGenderFilter] = useState<'all' | 'male' | 'female'>('all')
  const [previewStudentQuery, setPreviewStudentQuery] = useState('')

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
    showTemporaryExclusion,
    showAutoDraw,
    showSelectionExplanation,
    showPickGenderFilter,
    showPickEligibleCount,
    showPickPreviewPanel,
    showPickMissReasonPanel,
    revealSettleMs,
    showStudentId,
    photoMode,
    backgroundImage,
    soundEnabled,
    soundIntensity,
    confettiEnabled,
    animationStyle,
    animationSpeed,
    animationDurationScale,
    immersiveIslandStyle} = useSettingsStore(
    useShallow((state) => ({
      fairness: state.fairness,
      pickCount: state.pickCount,
      setPickCount: state.setPickCount,
      projectorMode: state.projectorMode,
      showTemporaryExclusion: state.showTemporaryExclusion,
      showAutoDraw: state.showAutoDraw,
      showSelectionExplanation: state.showSelectionExplanation,
      showPickGenderFilter: state.showPickGenderFilter,
      showPickEligibleCount: state.showPickEligibleCount,
      showPickPreviewPanel: state.showPickPreviewPanel,
      showPickMissReasonPanel: state.showPickMissReasonPanel,
      revealSettleMs: state.revealSettleMs,
      showStudentId: state.showStudentId,
      photoMode: state.photoMode,
      backgroundImage: state.backgroundImage,
      soundEnabled: state.soundEnabled,
      soundIntensity: state.soundIntensity,
      confettiEnabled: state.confettiEnabled,
      animationStyle: state.animationStyle,
      animationSpeed: state.animationSpeed,
      animationDurationScale: state.animationDurationScale,
      immersiveIslandStyle: state.immersiveIslandStyle
    }))
  )

  const effectivePickGenderFilter = showPickGenderFilter ? pickGenderFilter : 'all'
  const { immersiveMode, immersivePickMode, immersivePhase, setImmersiveMode, setImmersivePhase } =
    useImmersiveUI(mode, onImmersiveChange)
  const temporaryExclusion = useTemporaryExclusion({
    currentClass,
    currentClassId,
    effectivePickGenderFilter
  })
  const {
    setExcludedMenuOpen,
    manualExcludedIds,
    pickRangeEligibleCount,
    updateManualExcludedIds,
    hydrateForClass
  } = temporaryExclusion

  const handleDrawRef = useRef<(options?: DrawOptions) => void>(() => {})

  useEffect(() => {
    setSoundIntensity(soundIntensity)
  }, [soundIntensity])

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (autoDrawTimerRef.current) clearTimeout(autoDrawTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const cleanup = window.electronAPI.onShortcutTriggered((action) => {
      if (action === 'pick') {
        if (immersiveMode) {
          setImmersivePhase('island')
        }
        handleDrawRef.current(immersiveMode ? { countOverride: 1 } : undefined)
      }
    })
    return cleanup
  }, [immersiveMode, immersivePhase, setImmersivePhase])

  const getPickPlan = useCallback(
    (countOverride?: number): PickPlan | null => {
      if (!currentClass) return null

      const genderFilteredStudents =
        effectivePickGenderFilter === 'all'
          ? currentClass.students
          : currentClass.students.filter((student) => student.gender === effectivePickGenderFilter)

      const pickClass =
        effectivePickGenderFilter === 'all'
          ? currentClass
          : { ...currentClass, students: genderFilteredStudents }

      const requestedCount = countOverride ?? pickCount
      const result = selectionEngine.pick(
        buildPickRequest({
          currentClass: pickClass,
          history,
          policy: {
            ...fairness,
            manualExcludedIds
          },
          count: requestedCount
        })
      )

      const candidateMap = new Map(result.traces.map((trace) => [trace.studentId, trace]))
      const eligibleStudents = currentClass.students.filter((student) => {
        const trace = candidateMap.get(student.id)
        return !!trace?.eligible
      })

      const selectionMeta: HistorySelectionMeta = {
        ...result.meta,
        cooldownExcludedIds: result.cooldownExcludedIds,
        fallbackNotes: result.meta.fallbackNotes,
        winnerExplanations: result.winners.map((winner) => {
          const trace = result.traces.find((item) => item.studentId === winner.id)
          const totalWeight = result.traces
            .filter((item) => item.eligible)
            .reduce((sum, item) => sum + (item.finalWeight || 1), 0)
          const finalWeight = trace?.finalWeight || winner.weight || 1
          return {
            id: winner.id,
            name: winner.name,
            baseWeight: trace?.baseWeight || winner.weight || 1,
            finalWeight,
            estimatedProbability: totalWeight > 0 ? finalWeight / totalWeight : 0,
            reasons: trace?.reasons || ['eligible']
          }
        }),
        explanationSummary: (() => {
          const parts: string[] = []
          if (result.meta.policySnapshot.weightedRandom) {
            parts.push('采用权重抽取')
          } else {
            parts.push('采用随机抽取')
          }
          if (result.meta.policySnapshot.balanceByTerm) {
            parts.push('启用学期均衡')
          }
          if (result.meta.policySnapshot.stageFairnessRounds > 0) {
            parts.push(`参考最近 ${result.meta.policySnapshot.stageFairnessRounds} 轮阶段公平`)
          }
          if (result.meta.policySnapshot.prioritizeUnpickedCount > 0) {
            parts.push(`优先未抽中 ${result.meta.policySnapshot.prioritizeUnpickedCount} 人`)
          }
          if (result.meta.fallbackNotes.length > 0) {
            parts.push('发生约束冲突并已自动放宽')
          }
          return parts.join('，')
        })()
      }

      return {
        eligibleStudents,
        winners: result.winners,
        selectionMeta,
        traces: result.traces,
        totalCandidates: pickClass.students.length
      }
    },
    [currentClass, effectivePickGenderFilter, fairness, history, pickCount, manualExcludedIds]
  )

  const pickPreview = useMemo(() => {
    if (mode !== 'pick') return null
    const plan = getPickPlan()
    if (!plan) return null
    const excluded = plan.traces.filter((trace) => !trace.eligible)
    const reasonCount = new Map<string, number>()
    excluded.forEach((trace) => {
      const reason =
        trace.reasons.find((item) => item.startsWith('excluded_')) || trace.reasons[0] || 'unknown'
      reasonCount.set(reason, (reasonCount.get(reason) || 0) + 1)
    })
    const excludedBreakdown = Array.from(reasonCount.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
    return {
      totalCandidates: plan.totalCandidates,
      eligibleCount: plan.eligibleStudents.length,
      excludedCount: excluded.length,
      excludedBreakdown
    }
  }, [mode, getPickPlan])

  const previewStudentExplain = useMemo(() => {
    if (!currentClass || mode !== 'pick') return null
    const q = previewStudentQuery.trim().toLowerCase()
    if (!q) return null
    const target = currentClass.students.find(
      (student) =>
        student.name.toLowerCase().includes(q) ||
        (student.studentId || '').toLowerCase().includes(q)
    )
    if (!target) return { notFound: true as const }
    const plan = getPickPlan()
    if (!plan) return null
    const trace = plan.traces.find((item) => item.studentId === target.id)
    if (!trace) {
      return {
        notFound: false as const,
        student: target,
        eligible: false,
        reasons: ['excluded_by_status'] as string[],
        finalWeight: 0,
        baseWeight: target.weight || 1
      }
    }
    return {
      notFound: false as const,
      student: target,
      eligible: trace.eligible,
      reasons: trace.reasons,
      finalWeight: trace.finalWeight,
      baseWeight: trace.baseWeight
    }
  }, [currentClass, mode, previewStudentQuery, getPickPlan])

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
          eventType: 'pick',
          pickedStudents: preSelectedWinners.map((w) => ({
            id: w.id,
            name: w.name,
            studentId: w.studentId
          })),
          selectionMeta: lastSelectionMetaRef.current ?? undefined
        })

        const fallbackNotes = lastSelectionMetaRef.current?.fallbackNotes || []
        if (fallbackNotes.length > 0) {
          addToast(fallbackNotes.join('；'), 'info')
        }

        const remaining = autoDrawRemainingRef.current
        if (mode === 'pick' && remaining > 1) {
          const nextRemaining = remaining - 1
          autoDrawRemainingRef.current = nextRemaining
          setAutoDrawRemaining(nextRemaining)
          if (autoDrawTimerRef.current) clearTimeout(autoDrawTimerRef.current)
          autoDrawTimerRef.current = setTimeout(
            () => {
              handleDrawRef.current()
            },
            Math.max(2500, autoDrawIntervalMs) + (prefersReducedMotion ? 120 : revealSettleMs)
          )
        } else if (remaining > 0) {
          autoDrawRemainingRef.current = 0
          setAutoDrawRemaining(0)
        }
      } catch (err) {
        logger.error('Home', 'Failed to update stats or history', err)
        addToast('抽选结果记录失败，请重试', 'error')
      }
    },
    [
      currentClass,
      soundEnabled,
      incrementPickCount,
      addHistoryRecord,
      addToast,
      mode,
      autoDrawIntervalMs,
      prefersReducedMotion,
      revealSettleMs
    ]
  )

  const handleWheelComplete = useCallback(() => {
    finishDraw(wheelWinnersRef.current)
  }, [finishDraw])

  const handleDraw = useCallback(
    (options: DrawOptions = {}): void => {
      if (isSpinning) return
      if (!currentClass || currentClass.students.length === 0) return

      const requestedCount = options.countOverride ?? pickCount
      const pickPlan = getPickPlan(requestedCount)
      if (!pickPlan) return

      const activeStudents = pickPlan.eligibleStudents
      if (activeStudents.length === 0) {
        addToast(
          effectivePickGenderFilter === 'all'
            ? '当前班级没有可被抽选的学生！'
            : `当前${effectivePickGenderFilter === 'male' ? '男生' : '女生'}筛选下没有可被抽选的学生！`,
          'error'
        )
        return
      }

      lastSelectionMetaRef.current = pickPlan.selectionMeta
      setLastSelectionMeta(pickPlan.selectionMeta)

      setIsSpinning(true)
      setWinners([])
      setDisplayCandidates([])
      setShowConfetti(false)
      setPhase('spinning')
      tickCountRef.current = 0
      lastSoundAtRef.current = 0

      const countToPick = Math.min(requestedCount, activeStudents.length)
      const uniqueWinners = pickPlan.winners
        .filter((winner, index, arr) => arr.findIndex((item) => item.id === winner.id) === index)
        .slice(0, countToPick)
      const winnerIdSet = new Set(uniqueWinners.map((winner) => winner.id))
      const fallbackWinners = activeStudents.filter((student) => !winnerIdSet.has(student.id))
      const preSelectedWinners =
        uniqueWinners.length >= countToPick
          ? uniqueWinners
          : [
              ...uniqueWinners,
              ...pickUniqueStudents(fallbackWinners, countToPick - uniqueWinners.length)
            ]

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
        // Keep char-by-char concise to avoid dragging
        const maxChars = Math.max(...preSelectedWinners.map((w) => w.name.length), 1)
        const revealDuration = Math.min(
          2200 * sf * animationDurationScale,
          (maxChars * 120 + 420) * sf * animationDurationScale
        )
        timeoutRef.current = setTimeout(() => {
          finishDraw(preSelectedWinners)
        }, revealDuration)
        return
      }

      const duration = prefersReducedMotion
        ? ANIMATION_DURATION_REDUCED_MS
        : ANIMATION_DURATION_MAP[animationSpeed] * sf * animationDurationScale
      const startTime = performance.now()
      let lastTickAt = startTime

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
          setDisplayCandidates(currentRandoms)
          setCandidateKey((k) => k + 1)
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

        if (progress > SLOW_DOWN_PROGRESS && phase !== 'slowing') {
          setPhase('slowing')
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          finishDraw(preSelectedWinners)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [
      isSpinning,
      currentClass,
      getPickPlan,
      addToast,
      effectivePickGenderFilter,
      pickCount,
      animationStyle,
      sf,
      animationDurationScale,
      finishDraw,
      prefersReducedMotion,
      animationSpeed,
      soundEnabled,
      phase
    ]
  )

  useEffect(() => {
    handleDrawRef.current = handleDraw
  }, [handleDraw])

  const handleImmersiveOpenMenu = useCallback(() => {
    setImmersivePhase('menu')
  }, [setImmersivePhase])

  const handleImmersiveDraw = useCallback(() => {
    if (isSpinning || !currentClass || currentClass.students.length === 0) return
    setImmersivePhase('island')
    handleDrawRef.current({ countOverride: 1 })
  }, [currentClass, isSpinning, setImmersivePhase])

  const handleImmersiveCollapse = useCallback(() => {
    setImmersivePhase('ball')
  }, [setImmersivePhase])

  const handleImmersiveExit = useCallback(() => {
    setImmersiveMode(false)
  }, [setImmersiveMode])

  useEffect(() => {
    if (immersivePhase !== 'island') return
    if (isSpinning || phase !== 'reveal' || winners.length === 0) return

    const timer = setTimeout(() => {
      setImmersivePhase('ball')
    }, 3000)
    return () => clearTimeout(timer)
  }, [immersivePhase, isSpinning, phase, winners.length, setImmersivePhase])

  const handleGroup = (): void => {
    if (!currentClass) return

    const activeCount = currentClass.students.filter((s) => s.status === 'active').length
    if (activeCount < 2) {
      addToast('至少需要 2 名可用学生才能分组！', 'error')
      return
    }

    const safeGroupCount = Math.min(groupCount, activeCount)

    const groupResult = selectionEngine.group(
      buildGroupRequest({
        currentClass,
        history,
        policy: {
          ...fairness,
          manualExcludedIds
        },
        groupCount: safeGroupCount
      })
    )

    const finalGroups = groupResult.groups.filter((group) => group.length > 0)
    const taskTemplates =
      currentClass.taskTemplates && currentClass.taskTemplates.length > 0
        ? currentClass.taskTemplates
        : DEFAULT_GROUP_TASK_TEMPLATES
    const assignments = finalGroups.map((_, index) => {
      const template = taskTemplates[index % taskTemplates.length]
      return {
        groupIndex: index + 1,
        taskTemplateId: template.id,
        taskName: template.name,
        scoreDelta: template.scoreDelta
      }
    })

    setGroups(finalGroups)
    setGroupAssignments(assignments)
    setLastGroupSnapshot(finalGroups)
    setShowGroups(true)
    setShowConfetti(true)

    addHistoryRecord({
      classId: currentClass.id,
      className: currentClass.name,
      eventType: 'group',
      pickedStudents: finalGroups.flat().map((student) => ({
        id: student.id,
        name: student.name,
        studentId: student.studentId
      })),
      groupSummary: {
        groupCount: finalGroups.length,
        groups: finalGroups.map((group, index) => ({
          groupIndex: index + 1,
          studentIds: group.map((student) => student.id),
          studentNames: group.map((student) => student.name),
          taskTemplateId: assignments[index]?.taskTemplateId,
          taskName: assignments[index]?.taskName,
          taskScoreDelta: assignments[index]?.scoreDelta
        }))
      }
    })

    if (soundEnabled) playReveal()
  }

  const handleApplyGroupTaskScores = useCallback(() => {
    if (!currentClass || groupAssignments.length === 0 || groups.length === 0) return
    let affectedTotal = 0
    groupAssignments.forEach((assignment) => {
      const group = groups[assignment.groupIndex - 1]
      if (!group || group.length === 0) return
      const result = applyTaskScore(
        currentClass.id,
        group.map((student) => student.id),
        assignment.taskName,
        assignment.scoreDelta,
        'task-assignment'
      )
      affectedTotal += result.affected
      addHistoryRecord({
        classId: currentClass.id,
        className: currentClass.name,
        eventType: 'task',
        pickedStudents: group.map((student) => ({
          id: student.id,
          name: student.name,
          studentId: student.studentId
        })),
        taskSummary: {
          taskName: assignment.taskName,
          scoreDelta: assignment.scoreDelta,
          studentIds: group.map((student) => student.id),
          studentNames: group.map((student) => student.name),
          source: 'task-assignment'
        }
      })
    })
    if (affectedTotal > 0) {
      addToast(`已完成分组任务记分，共 ${affectedTotal} 人`, 'success')
    }
  }, [currentClass, groupAssignments, groups, applyTaskScore, addHistoryRecord, addToast])

  const handleUpdateGroupAssignment = useCallback(
    (groupIndex: number, patch: { taskName?: string; scoreDelta?: number }) => {
      setGroupAssignments((prev) =>
        prev.map((item) => {
          if (item.groupIndex !== groupIndex) return item
          return {
            ...item,
            ...(patch.taskName !== undefined
              ? { taskName: patch.taskName.trim() || `第${groupIndex}组任务` }
              : {}),
            ...(patch.scoreDelta !== undefined ? { scoreDelta: patch.scoreDelta } : {})
          }
        })
      )
    },
    []
  )

  const groupTaskOptions = useMemo(() => {
    if (!currentClass) return DEFAULT_GROUP_TASK_TEMPLATES
    return currentClass.taskTemplates && currentClass.taskTemplates.length > 0
      ? currentClass.taskTemplates
      : DEFAULT_GROUP_TASK_TEMPLATES
  }, [currentClass])

  const handleApplyTemplateToGroup = useCallback(
    (groupIndex: number, templateId: string) => {
      const template = groupTaskOptions.find((item) => item.id === templateId)
      if (!template) return
      setGroupAssignments((prev) =>
        prev.map((item) =>
          item.groupIndex === groupIndex
            ? {
                ...item,
                taskTemplateId: template.id,
                taskName: template.name,
                scoreDelta: template.scoreDelta
              }
            : item
        )
      )
    },
    [groupTaskOptions]
  )

  const handleModeChange = useCallback(
    (newMode: 'pick' | 'group') => {
      setMode(newMode)
      if (newMode === 'pick') {
        setShowGroups(false)
        setGroupAssignments([])
      } else {
        setImmersiveMode(false)
        setPhase('idle')
        setWinners([])
        autoDrawRemainingRef.current = 0
        setAutoDrawRemaining(0)
        if (autoDrawTimerRef.current) {
          clearTimeout(autoDrawTimerRef.current)
          autoDrawTimerRef.current = null
        }
      }
    },
    [setImmersiveMode]
  )

  const handleSelectClass = useCallback(
    (classId: string): void => {
      setCurrentClass(classId)
      const targetClass = classes.find((item) => item.id === classId)
      if (!targetClass) {
        updateManualExcludedIds([])
        return
      }
      hydrateForClass(classId, targetClass.students)
    },
    [setCurrentClass, classes, updateManualExcludedIds, hydrateForClass]
  )

  const handleCreateClass = useCallback(() => {
    showPrompt('创建班级', '请输入新班级的名称', '班级名称', (name) => {
      addClass(name)
      addToast(`班级「${name}」已创建`, 'success')
    })
  }, [addClass, addToast, showPrompt])

  const startAutoDraw = useCallback(() => {
    if (mode !== 'pick') {
      addToast('请先切换到抽选模式', 'error')
      return
    }
    if (isSpinning) return
    const rounds = Math.max(1, autoDrawRounds)
    autoDrawRemainingRef.current = rounds
    setAutoDrawRemaining(rounds)
    setAutoDrawEnabled(true)
    setTimeout(() => {
      handleDrawRef.current()
    }, 0)
  }, [mode, isSpinning, autoDrawRounds, addToast])

  const stopAutoDraw = useCallback(() => {
    autoDrawRemainingRef.current = 0
    setAutoDrawRemaining(0)
    if (autoDrawTimerRef.current) {
      clearTimeout(autoDrawTimerRef.current)
      autoDrawTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        if (immersiveMode) {
          setImmersiveMode(false)
          return
        }
        setExcludedMenuOpen(false)
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && mode === 'pick') {
        event.preventDefault()
        if (autoDrawRemainingRef.current > 0) {
          stopAutoDraw()
        } else {
          startAutoDraw()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode, immersiveMode, startAutoDraw, stopAutoDraw, setExcludedMenuOpen, setImmersiveMode])

  return (
    <div
      className={cn(
        'h-full relative overflow-hidden',
        immersivePickMode
          ? 'bg-transparent'
          : 'bg-gradient-to-b from-transparent to-surface-container-low/30',
        !immersivePickMode &&
          projectorMode &&
          'bg-gradient-to-b from-surface-container-low/10 to-surface-container'
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

      {immersivePickMode && (
        <ImmersiveShell
          phase={immersivePhase}
          currentClassName={currentClass?.name}
          displayCandidates={displayCandidates}
          winners={winners}
          candidateKey={candidateKey}
          drawPhase={phase}
          islandStyle={immersiveIslandStyle}
          isSpinning={isSpinning}
          canDraw={!!currentClass && currentClass.students.length > 0 && !isSpinning}
          onOpenMenu={handleImmersiveOpenMenu}
          onDraw={handleImmersiveDraw}
          onCollapse={handleImmersiveCollapse}
          onExit={handleImmersiveExit}
        />
      )}

      {!immersivePickMode && backgroundImage && (
        <img
          src={toFileUrl(backgroundImage)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none z-0"
        />
      )}

      {!immersivePickMode && (
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
      )}

      {!immersivePickMode && (
        <>
          <ClassSelector
            classes={classes}
            currentClassId={currentClassId}
            currentClass={currentClass}
            isSpinning={isSpinning}
            onSelectClass={handleSelectClass}
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
        </>
      )}

      {/* Main Card */}
      {!immersivePickMode && (
        <div className="absolute inset-0 top-14 flex flex-col items-center justify-center p-4 z-10">
          {mode === 'pick' && (showTemporaryExclusion || showAutoDraw) && (
            <div className="mb-3 shrink-0 w-full max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-surface-container-high/80 px-3 py-2 border border-outline-variant/40">
                {showTemporaryExclusion && (
                  <TemporaryExclusionMenu currentClass={currentClass} exclusion={temporaryExclusion} />
                )}

                {showAutoDraw && (
                  <AutoDrawBar
                    autoDrawEnabled={autoDrawEnabled}
                    onToggleEnabled={() => setAutoDrawEnabled((v) => !v)}
                    autoDrawRounds={autoDrawRounds}
                    onRoundsChange={setAutoDrawRounds}
                    autoDrawIntervalMs={autoDrawIntervalMs}
                    onIntervalChange={setAutoDrawIntervalMs}
                    autoDrawRemaining={autoDrawRemaining}
                    onStart={startAutoDraw}
                    onStop={stopAutoDraw}
                    isSpinning={isSpinning}
                    canDraw={!!currentClass && currentClass.students.length > 0}
                  />
                )}
              </div>
            </div>
          )}

          <div
            className={cn(
              'relative w-full max-w-2xl bg-surface-container rounded-[28px] elevation-1 flex flex-col items-center justify-center p-8 pb-24 h-[480px] overflow-hidden',
              projectorMode && 'max-w-4xl h-[600px] p-10 pb-28'
            )}
          >
            <Confetti active={showConfetti && confettiEnabled && !prefersReducedMotion} />

            {/* Group mode */}
            {mode === 'group' && showGroups && groups.length > 0 && (
              <GroupResults
                groups={groups}
                assignments={groupAssignments}
                taskOptions={groupTaskOptions}
                onUpdateAssignment={handleUpdateGroupAssignment}
                onApplyTemplateToGroup={handleApplyTemplateToGroup}
              />
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
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 8px 24px -4px hsl(var(--primary) / 0.3)'
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDraw()}
                  disabled={isSpinning || !currentClass || currentClass.students.length === 0}
                  aria-label={isSpinning ? '抽选中' : '开始点名'}
                  aria-busy={isSpinning}
                  className={cn(
                    'px-7 sm:px-10 py-3 bg-primary text-primary-foreground rounded-full text-lg sm:text-xl font-bold elevation-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 h-12 cursor-pointer',
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
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      boxShadow: '0 8px 24px -4px hsl(var(--primary) / 0.3)'
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGroup}
                    disabled={!currentClass || currentClass.students.length === 0}
                    className={cn(
                      'px-7 sm:px-10 py-3 bg-primary text-primary-foreground rounded-full text-lg sm:text-xl font-bold elevation-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 h-12 cursor-pointer',
                      projectorMode && 'h-14 text-2xl px-12'
                    )}
                  >
                    <LayoutGrid className="w-6 h-6" />
                    {showGroups ? '重新分组' : '随机分组'}
                  </motion.button>

                  {lastGroupSnapshot.length > 0 && (
                    <button
                      onClick={() => {
                        setGroups(lastGroupSnapshot)
                        setShowGroups(true)
                        setShowConfetti(true)
                      }}
                      className="px-4 py-2.5 rounded-full text-sm font-medium bg-secondary-container text-secondary-container-foreground cursor-pointer"
                    >
                      重放上次
                    </button>
                  )}

                  {showGroups && groupAssignments.length > 0 && (
                    <button
                      onClick={handleApplyGroupTaskScores}
                      className="px-4 py-2.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 cursor-pointer"
                    >
                      按任务批量记分
                    </button>
                  )}
                </div>
              )}
            </div>

            {mode === 'group' && showGroups && groups.length > 0 && (
              <div className="absolute top-4 left-4 rounded-xl bg-surface-container-high/80 border border-outline-variant/30 px-3 py-2 text-[11px] text-on-surface-variant">
                {(() => {
                  const sums = groups.map((group) =>
                    group.reduce((sum, student) => sum + (student.score || 0), 0)
                  )
                  const max = Math.max(...sums)
                  const min = Math.min(...sums)
                  return `分组解释：积分区间 ${min} ~ ${max}，差值 ${max - min}`
                })()}
              </div>
            )}
          </div>

          {/* Pick Count — below card */}
          {mode === 'pick' && !isSpinning && (
            <div className="mt-3 shrink-0 flex flex-wrap items-center justify-center gap-1 bg-surface-container-high/80 rounded-full px-2.5 py-1 border border-outline-variant/40">
              <button
                data-testid="enter-immersive-mode"
                onClick={() => setImmersiveMode(true)}
                className="mr-2 px-2.5 py-1 rounded-full text-[11px] border border-outline-variant/40 bg-surface-container text-on-surface-variant hover:bg-surface-container-high inline-flex items-center gap-1 cursor-pointer"
                title="沉浸模式下仅显示点名按钮和人数选项，按 Esc 退出"
              >
                <Maximize2 className="w-3 h-3" />
                沉浸模式
              </button>
              {showPickGenderFilter && (
                <>
                  <span className="text-xs font-medium mr-1 text-on-surface-variant">范围</span>
                  <div className="flex items-center mr-2 rounded-full bg-surface-container border border-outline-variant/40 p-0.5">
                    {[
                      { value: 'all' as const, label: '全部' },
                      { value: 'male' as const, label: '男生' },
                      { value: 'female' as const, label: '女生' }
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setPickGenderFilter(item.value)}
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[11px] transition-colors cursor-pointer',
                          pickGenderFilter === item.value
                            ? 'bg-secondary-container text-secondary-container-foreground'
                            : 'text-on-surface-variant hover:bg-surface-container-high'
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {showPickEligibleCount && (
                    <span className="text-[11px] text-on-surface-variant mr-2">
                      可抽 {pickRangeEligibleCount}
                    </span>
                  )}
                </>
              )}

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

          {showPickPreviewPanel && mode === 'pick' && !isSpinning && pickPreview && (
            <PickPreviewPanel preview={pickPreview} />
          )}

          {showPickMissReasonPanel && mode === 'pick' && !isSpinning && (
            <StudentExplainPanel
              explain={previewStudentExplain}
              query={previewStudentQuery}
              onQueryChange={setPreviewStudentQuery}
            />
          )}

          {showSelectionExplanation &&
            mode === 'pick' &&
            phase === 'reveal' &&
            winners.length > 0 && (
              <SelectionExplainPanel meta={lastSelectionMeta} requestedCount={pickCount} />
            )}
        </div>
      )}
    </div>
  )
}
