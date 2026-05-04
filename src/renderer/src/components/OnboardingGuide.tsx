import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  CheckCircle2,
  FileUp,
  Palette,
  Plus,
  Shuffle,
  Users,
  X
} from 'lucide-react'

import { parseStudentImportRows } from '../lib/studentImport'
import { cn } from '../lib/utils'
import { useClassesStore } from '../store/classesStore'
import {
  type AnimationSpeed,
  type AnimationStyle,
  type ColorTheme,
  useSettingsStore
} from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'
import type { Student } from '../types'
import { DesignStylePreview } from '../views/settings/DesignStylePreview'
import { designStyles } from '../views/settings/designStyles'

interface OnboardingGuideProps {
  open: boolean
  onClose: (complete: boolean) => void
}

type Notice = { type: 'error' | 'success' | 'info'; message: string }

export const ONBOARDING_STEPS = [
  {
    title: '创建班级和导入学生名单',
    description: '先创建本次课堂要使用的班级, 再手动添加学生或从文件导入名单。',
    icon: Users
  },
  {
    title: '选择设计风格和配色',
    description: '直接选择界面风格和主题色, 这里的选择会写入正式设置。',
    icon: Palette
  },
  {
    title: '选择抽取动画',
    description: '选择抽取动画样式、速度和时长, 让课堂节奏更贴合你的习惯。',
    icon: Shuffle
  }
] as const

const COLOR_THEME_OPTIONS: Array<{ id: ColorTheme; label: string; color: string }> = [
  { id: 'blue', label: '经典蓝', color: 'hsl(221.2, 83.2%, 53.3%)' },
  { id: 'rose', label: '玫瑰红', color: 'hsl(346.8, 77.2%, 49.8%)' },
  { id: 'green', label: '翡翠绿', color: 'hsl(142.1, 76.2%, 36.3%)' },
  { id: 'amber', label: '琥珀金', color: 'hsl(43, 96%, 56%)' },
  { id: 'teal', label: '青碧色', color: 'hsl(172, 66%, 40%)' },
  { id: 'violet', label: '梦幻紫', color: 'hsl(262.1, 83.3%, 57.8%)' },
  { id: 'klein-blue', label: '克莱因蓝', color: 'hsl(223, 100%, 33%)' },
  { id: 'china-red', label: '中国红', color: 'hsl(0, 100%, 45%)' },
  { id: 'tiffany', label: '蒂芙尼蓝', color: 'hsl(174, 46%, 68%)' },
  { id: 'forest', label: '森林绿', color: 'hsl(100, 52%, 34%)' },
  { id: 'ocean', label: '海洋蓝', color: 'hsl(180, 100%, 21%)' },
  { id: 'mocha', label: '摩卡棕', color: 'hsl(25, 42%, 40%)' }
]

const ANIMATION_STYLE_OPTIONS: Array<{ id: AnimationStyle; label: string; desc: string }> = [
  { id: 'slot', label: '老虎机', desc: '滚轮式揭晓' },
  { id: 'scroll', label: '滚动', desc: '名单纵向滚动' },
  { id: 'flip', label: '翻转', desc: '卡片翻面揭晓' },
  { id: 'wheel', label: '转盘', desc: '旋转抽取感' },
  { id: 'bounce', label: '弹跳', desc: '轻快弹性反馈' },
  { id: 'typewriter', label: '打字机', desc: '逐字显示姓名' },
  { id: 'ripple', label: '涟漪', desc: '扩散式结果反馈' },
  { id: 'charByChar', label: '逐字', desc: '字符级揭晓' }
]

const ANIMATION_SPEED_OPTIONS: Array<{ id: AnimationSpeed; label: string; desc: string }> = [
  { id: 'elegant', label: '舒缓', desc: '适合慢节奏课堂' },
  { id: 'balanced', label: '均衡', desc: '默认节奏' },
  { id: 'fast', label: '快速', desc: '更利落的抽取' }
]

const formatDuration = (value: number): string =>
  Number.isFinite(value) ? value.toFixed(1).replace(/\.0$/, '') : '1'

export function OnboardingGuide({ open, onClose }: OnboardingGuideProps): ReactElement {
  const [step, setStep] = useState(0)
  const [className, setClassName] = useState('')
  const [studentName, setStudentName] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [importing, setImporting] = useState(false)

  const {
    classes,
    currentClassId,
    addClass,
    addStudent,
    addStudents
  } = useClassesStore()
  const addToast = useToastStore((state) => state.addToast)
  const {
    colorTheme,
    customColor,
    setColorTheme,
    setCustomColor,
    designStyle,
    setDesignStyle,
    animationStyle,
    setAnimationStyle,
    animationSpeed,
    setAnimationSpeed,
    animationDurationScale,
    setAnimationDurationScale
  } = useSettingsStore()
  const [durationDraft, setDurationDraft] = useState(formatDuration(animationDurationScale))

  const currentClass = useMemo(
    () => classes.find((item) => item.id === currentClassId) || classes[0] || null,
    [classes, currentClassId]
  )
  const stepOneComplete = Boolean(currentClass && currentClass.students.length > 0)
  const current = ONBOARDING_STEPS[step]
  const progress = Math.round(((step + 1) / ONBOARDING_STEPS.length) * 100)

  useEffect(() => {
    if (!open) return
    setStep(0)
    setClassName('')
    setStudentName('')
    setNotice(null)
  }, [open])

  useEffect(() => {
    setDurationDraft(formatDuration(animationDurationScale))
  }, [animationDurationScale])

  const requireRosterBeforeAdvance = useCallback((): boolean => {
    if (stepOneComplete) return true
    setNotice({ type: 'error', message: '请先创建班级并至少添加 1 名学生。' })
    return false
  }, [stepOneComplete])

  const goToStep = useCallback(
    (target: number): void => {
      if (target > 0 && !requireRosterBeforeAdvance()) return
      setStep(Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, target)))
    },
    [requireRosterBeforeAdvance]
  )

  const goNext = useCallback((): void => {
    if (step >= ONBOARDING_STEPS.length - 1) return
    if (step === 0 && !requireRosterBeforeAdvance()) return
    setStep((value) => Math.min(ONBOARDING_STEPS.length - 1, value + 1))
  }, [requireRosterBeforeAdvance, step])

  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose(false)
      if (event.key === 'ArrowRight') goNext()
      if (event.key === 'ArrowLeft') setStep((value) => Math.max(0, value - 1))
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, onClose, open])

  const handleCreateClass = useCallback((): void => {
    const name = className.trim()
    if (!name) {
      setNotice({ type: 'error', message: '请输入班级名称。' })
      return
    }
    addClass(name)
    setClassName('')
    setNotice({ type: 'success', message: `已创建班级「${name}」。` })
  }, [addClass, className])

  const handleAddStudent = useCallback((): void => {
    const name = studentName.trim()
    if (!currentClass) {
      setNotice({ type: 'error', message: '请先创建一个班级。' })
      return
    }
    if (!name) {
      setNotice({ type: 'error', message: '请输入学生姓名。' })
      return
    }

    addStudent(currentClass.id, {
      id: crypto.randomUUID(),
      name,
      pickCount: 0,
      score: 0,
      weight: 1,
      status: 'active'
    })
    setStudentName('')
    setNotice({ type: 'success', message: `已添加学生「${name}」。` })
  }, [addStudent, currentClass, studentName])

  const handleImportStudents = useCallback(async (): Promise<void> => {
    if (!currentClass) {
      setNotice({ type: 'error', message: '请先创建一个班级, 再导入学生名单。' })
      return
    }

    setImporting(true)
    try {
      const filePath = await window.electronAPI.selectFile({
        title: '导入学生名单',
        filters: [{ name: '文本文件', extensions: ['txt', 'csv'] }]
      })
      if (!filePath) {
        setNotice({ type: 'info', message: '未选择文件。' })
        return
      }

      const content = await window.electronAPI.readTextFile(filePath)
      const parsedRows = parseStudentImportRows(content)
      if (parsedRows.length === 0) {
        setNotice({ type: 'error', message: '文件内容为空或格式无效。' })
        addToast('文件内容为空或格式无效。', 'error')
        return
      }

      const existingSet = new Set(
        currentClass.students.map((student) =>
          `${student.name}::${student.studentId || ''}`.toLowerCase()
        )
      )
      const newStudents: Student[] = parsedRows
        .filter((row) => {
          const key = `${row.name}::${row.studentId || ''}`.toLowerCase()
          if (existingSet.has(key)) return false
          existingSet.add(key)
          return true
        })
        .map((row) => ({
          id: crypto.randomUUID(),
          name: row.name,
          studentId: row.studentId,
          gender: row.gender,
          pickCount: 0,
          score: row.score,
          weight: row.weight,
          status: row.status
        }))

      if (newStudents.length === 0) {
        setNotice({ type: 'error', message: '没有可导入的新学生, 已自动去重。' })
        addToast('没有可导入的新学生, 已自动去重。', 'error')
        return
      }

      addStudents(currentClass.id, newStudents)
      setNotice({ type: 'success', message: `成功导入 ${newStudents.length} 名学生。` })
      addToast(`成功导入 ${newStudents.length} 名学生。`, 'success')
    } catch {
      setNotice({ type: 'error', message: '导入失败, 请检查文件格式。' })
      addToast('导入失败, 请检查文件格式。', 'error')
    } finally {
      setImporting(false)
    }
  }, [addStudents, addToast, currentClass])

  const updateDuration = useCallback(
    (value: string): void => {
      setDurationDraft(value)
      const next = Number(value)
      if (Number.isFinite(next)) {
        setAnimationDurationScale(next)
      }
    },
    [setAnimationDurationScale]
  )

  const renderStepOne = (): ReactElement => (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-3">
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-on-surface">创建班级</h4>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                输入一个课堂班级名称, 后续学生都会加入当前班级。
              </p>
            </div>
            {currentClass && (
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                当前: {currentClass.name}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              data-testid="onboarding-class-name"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleCreateClass()
              }}
              className="min-w-0 flex-1 rounded-xl border border-outline-variant/40 bg-surface-container px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
              placeholder="例如: 三年级二班"
            />
            <button
              type="button"
              data-testid="onboarding-create-class"
              onClick={handleCreateClass}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              创建
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-on-surface">添加或导入学生</h4>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              可以逐个输入学生姓名, 也可以导入 txt/csv 名单。
            </p>
          </div>
          <div className="flex gap-2">
            <input
              data-testid="onboarding-student-name"
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleAddStudent()
              }}
              className="min-w-0 flex-1 rounded-xl border border-outline-variant/40 bg-surface-container px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
              placeholder="输入学生姓名"
            />
            <button
              type="button"
              data-testid="onboarding-add-student"
              onClick={handleAddStudent}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-secondary-container px-3 py-2 text-sm font-medium text-secondary-container-foreground"
            >
              <Plus className="h-4 w-4" />
              添加
            </button>
          </div>
          <button
            type="button"
            data-testid="onboarding-import-students"
            disabled={importing}
            onClick={handleImportStudents}
            className={cn(
              'mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/40 px-3 py-2 text-sm font-medium transition-colors',
              importing
                ? 'cursor-wait text-on-surface-variant/60'
                : 'cursor-pointer text-on-surface hover:bg-surface-container-high'
            )}
          >
            <FileUp className="h-4 w-4" />
            {importing ? '导入中...' : '从文件导入名单'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-on-surface">当前名单</h4>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              下一步前至少需要 1 名学生。
            </p>
          </div>
          <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-xs text-on-surface-variant">
            {currentClass?.students.length || 0} 人
          </span>
        </div>
        {currentClass ? (
          <div className="space-y-2">
            <div className="rounded-xl bg-surface-container px-3 py-2">
              <div className="text-xs text-on-surface-variant">班级</div>
              <div className="mt-0.5 truncate text-sm font-semibold text-on-surface">
                {currentClass.name}
              </div>
            </div>
            <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
              {currentClass.students.slice(0, 12).map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface"
                >
                  <span className="truncate">{student.name}</span>
                  {student.studentId && (
                    <span className="shrink-0 text-xs text-on-surface-variant">
                      {student.studentId}
                    </span>
                  )}
                </div>
              ))}
              {currentClass.students.length === 0 && (
                <div className="rounded-xl border border-dashed border-outline-variant/50 px-3 py-8 text-center text-sm text-on-surface-variant">
                  还没有学生
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-outline-variant/50 px-3 py-10 text-center text-sm text-on-surface-variant">
            还没有创建班级
          </div>
        )}
      </div>
    </div>
  )

  const renderStepTwo = (): ReactElement => (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-on-surface">设计风格</h4>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            选择整体视觉方向, 预览会同步显示当前选中状态。
          </p>
        </div>
        <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
          {designStyles.map((style) => {
            const selected = designStyle === style.id
            return (
              <button
                key={style.id}
                type="button"
                data-testid={`onboarding-design-style-${style.id}`}
                onClick={() => setDesignStyle(style.id)}
                className={cn(
                  'cursor-pointer rounded-xl border p-2 text-left transition-colors',
                  selected
                    ? 'border-outline bg-secondary-container'
                    : 'border-outline-variant/30 bg-surface-container hover:bg-surface-container-high'
                )}
              >
                <DesignStylePreview type={style.preview} isActive={selected} />
                <div className="mt-2 text-xs font-semibold text-on-surface">{style.label}</div>
                <div className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-on-surface-variant">
                  {style.desc}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-on-surface">主题配色</h4>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            选择主色调, 这里会清除自定义取色并使用标准主题色。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COLOR_THEME_OPTIONS.map((item) => {
            const selected = colorTheme === item.id && !customColor
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`onboarding-color-theme-${item.id}`}
                onClick={() => {
                  setColorTheme(item.id)
                  setCustomColor(undefined)
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors',
                  selected
                    ? 'border-outline bg-secondary-container'
                    : 'border-outline-variant/30 bg-surface-container hover:bg-surface-container-high'
                )}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: item.color }}
                >
                  {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </span>
                <span className="min-w-0 truncate text-xs font-medium text-on-surface">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderStepThree = (): ReactElement => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-on-surface">动画样式</h4>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            选择点名时的结果揭晓方式。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {ANIMATION_STYLE_OPTIONS.map((item) => {
            const selected = animationStyle === item.id
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`onboarding-animation-style-${item.id}`}
                onClick={() => setAnimationStyle(item.id)}
                className={cn(
                  'cursor-pointer rounded-xl border p-3 text-left transition-colors',
                  selected
                    ? 'border-outline bg-secondary-container text-secondary-container-foreground'
                    : 'border-outline-variant/30 bg-surface-container text-on-surface hover:bg-surface-container-high'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{item.label}</span>
                  {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </div>
                <div className="mt-1 text-[11px] leading-4 text-on-surface-variant">
                  {item.desc}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
          <h4 className="mb-3 text-sm font-semibold text-on-surface">动画速度</h4>
          <div className="grid grid-cols-3 gap-2">
            {ANIMATION_SPEED_OPTIONS.map((item) => {
              const selected = animationSpeed === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`onboarding-animation-speed-${item.id}`}
                  onClick={() => setAnimationSpeed(item.id)}
                  className={cn(
                    'cursor-pointer rounded-xl border px-3 py-2 text-center transition-colors',
                    selected
                      ? 'border-outline bg-secondary-container'
                      : 'border-outline-variant/30 bg-surface-container hover:bg-surface-container-high'
                  )}
                >
                  <div className="text-xs font-semibold text-on-surface">{item.label}</div>
                  <div className="mt-0.5 text-[11px] text-on-surface-variant">{item.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
          <h4 className="mb-3 text-sm font-semibold text-on-surface">持续时间</h4>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0.6}
              max={1.8}
              step={0.1}
              value={animationDurationScale}
              onChange={(event) => updateDuration(event.target.value)}
              className="min-w-0 flex-1 accent-primary"
              aria-label="动画持续时间"
            />
            <input
              type="number"
              min={0.6}
              max={1.8}
              step={0.1}
              data-testid="onboarding-animation-duration"
              value={durationDraft}
              onChange={(event) => updateDuration(event.target.value)}
              onBlur={() => setDurationDraft(formatDuration(animationDurationScale))}
              className="w-20 rounded-xl border border-outline-variant/40 bg-surface-container px-2 py-1.5 text-center text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>
          <p className="mt-2 text-xs text-on-surface-variant">
            当前为 {formatDuration(animationDurationScale)} 倍时长。
          </p>
        </div>
      </div>
    </div>
  )

  const renderStepContent = (): ReactElement => {
    if (step === 0) return renderStepOne()
    if (step === 1) return renderStepTwo()
    return renderStepThree()
  }

  const Icon = current.icon

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="新手引导"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-outline-variant/40 bg-surface-container shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-on-surface">新手引导</div>
                <div className="mt-0.5 text-xs text-on-surface-variant">
                  {step + 1} / {ONBOARDING_STEPS.length}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onClose(false)}
                className="cursor-pointer rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high"
                title="稍后再看"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 pt-4">
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-low">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-4 flex flex-wrap gap-1.5">
                {ONBOARDING_STEPS.map((item, index) => {
                  const disabled = index > 0 && !stepOneComplete
                  return (
                    <button
                      key={item.title}
                      type="button"
                      disabled={disabled}
                      onClick={() => goToStep(index)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                        index === step
                          ? 'border-transparent bg-secondary-container text-secondary-container-foreground'
                          : 'border-outline-variant/40 bg-surface-container-low text-on-surface-variant',
                        disabled
                          ? 'cursor-not-allowed opacity-50'
                          : 'cursor-pointer hover:bg-surface-container-high'
                      )}
                    >
                      {index + 1}. {item.title}
                    </button>
                  )
                })}
              </div>

              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-on-surface">{current.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    {current.description}
                  </p>
                </div>
              </div>

              {notice && (
                <div
                  data-testid="onboarding-step-message"
                  className={cn(
                    'mb-4 flex items-start gap-2 rounded-2xl border px-3 py-2 text-xs',
                    notice.type === 'error' &&
                      'border-destructive/25 bg-destructive/10 text-destructive',
                    notice.type === 'success' &&
                      'border-primary/20 bg-primary/10 text-primary',
                    notice.type === 'info' &&
                      'border-outline-variant/30 bg-surface-container-low text-on-surface-variant'
                  )}
                >
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{notice.message}</span>
                </div>
              )}

              {renderStepContent()}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-outline-variant/20 px-5 py-4">
              <button
                type="button"
                onClick={() => onClose(true)}
                className="cursor-pointer rounded-full border border-outline-variant/40 px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-high"
              >
                跳过并不再提示
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="onboarding-previous"
                  onClick={() => setStep((value) => Math.max(0, value - 1))}
                  disabled={step === 0}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-sm',
                    step === 0
                      ? 'cursor-not-allowed bg-surface-container-low text-on-surface-variant/50'
                      : 'cursor-pointer bg-surface-container-high text-on-surface'
                  )}
                >
                  上一步
                </button>
                {step < ONBOARDING_STEPS.length - 1 ? (
                  <button
                    type="button"
                    data-testid="onboarding-next"
                    onClick={goNext}
                    disabled={step === 0 && !stepOneComplete}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-sm font-medium',
                      step === 0 && !stepOneComplete
                        ? 'cursor-not-allowed bg-primary/40 text-primary-foreground/70'
                        : 'cursor-pointer bg-primary text-primary-foreground'
                    )}
                  >
                    下一步
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid="onboarding-finish"
                    onClick={() => onClose(true)}
                    className="cursor-pointer rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
                  >
                    完成引导
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
