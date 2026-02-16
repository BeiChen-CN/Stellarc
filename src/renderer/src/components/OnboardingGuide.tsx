import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Users,
  Settings,
  History,
  PlayCircle,
  X,
  CheckCircle2,
  Palette
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useClassesStore } from '../store/classesStore'
import {
  useSettingsStore,
  type ColorTheme,
  type DesignStyle,
  type AnimationStyle
} from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'

type AppView = 'home' | 'students' | 'history' | 'statistics' | 'settings' | 'about'

interface OnboardingGuideProps {
  open: boolean
  onClose: (complete: boolean) => void
}

const STEPS: Array<{
  title: string
  description: string
  checklist: string[]
  tip?: string
  helper?: 'class-student' | 'appearance'
  view?: AppView
  icon: typeof BookOpen
}> = [
  {
    title: '欢迎使用 Stellarc',
    description: '30 秒带你熟悉核心流程：导入学生、调整规则、开始点名、查看记录。',
    checklist: ['了解 5 步主流程', '知道常用入口在左侧导航', '可在设置里重新打开引导'],
    tip: '建议先完成学生管理，再开始抽选。',
    icon: BookOpen
  },
  {
    title: '先准备班级和学生',
    description: '在“学生管理”创建班级并导入名单，支持 CSV、复制班级与批量编辑。',
    checklist: ['创建至少 1 个班级', '添加或导入学生', '确认学生状态为正常'],
    tip: '首次建议至少准备 10 人，便于测试抽选和分组。',
    helper: 'class-student',
    view: 'students',
    icon: Users
  },
  {
    title: '先单独设置外观',
    description: '在“系统设置”里先确认主题、配色、设计风格和抽取动画。',
    checklist: ['设置主题（浅色/深色）', '选择配色', '选择设计风格与抽取动画'],
    tip: '先统一视觉，再调整规则，课堂观感更稳定。',
    helper: 'appearance',
    view: 'settings',
    icon: Palette
  },
  {
    title: '再按课堂习惯配置规则',
    description: '继续在“系统设置”里调整抽选规则、范围筛选、模块显示和积分规则。',
    checklist: ['选择抽选策略', '设置冷却/防重复', '按需开启模块显示'],
    tip: '不确定时可先用默认规则，上课中再微调。',
    view: 'settings',
    icon: Settings
  },
  {
    title: '开始随机点名',
    description: '回到“随机点名”，点击开始。可切换单人抽选或分组模式。',
    checklist: ['确认当前班级', '选择点名或分组', '开始并查看结果'],
    tip: '大屏授课建议开启投屏模式。',
    view: 'home',
    icon: PlayCircle
  },
  {
    title: '课后查看与复盘',
    description: '在“历史记录”和“数据统计”复盘课堂过程，导出报告。',
    checklist: ['检查历史记录', '查看统计分布', '导出课堂报告'],
    tip: '建议每周导出一次报告，便于教学复盘。',
    view: 'history',
    icon: History
  }
]

export function OnboardingGuide({ open, onClose }: OnboardingGuideProps) {
  const [step, setStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [quickClassName, setQuickClassName] = useState('')
  const [quickStudentsText, setQuickStudentsText] = useState('')

  const current = STEPS[step]
  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step])
  const completeProgress = useMemo(
    () => Math.round((completedSteps.length / STEPS.length) * 100),
    [completedSteps.length]
  )

  const classes = useClassesStore((state) => state.classes)
  const currentClassId = useClassesStore((state) => state.currentClassId)
  const addClass = useClassesStore((state) => state.addClass)
  const addStudents = useClassesStore((state) => state.addStudents)
  const setCurrentClass = useClassesStore((state) => state.setCurrentClass)

  const theme = useSettingsStore((state) => state.theme)
  const colorTheme = useSettingsStore((state) => state.colorTheme)
  const designStyle = useSettingsStore((state) => state.designStyle)
  const animationStyle = useSettingsStore((state) => state.animationStyle)
  const setTheme = useSettingsStore((state) => state.setTheme)
  const setColorTheme = useSettingsStore((state) => state.setColorTheme)
  const setDesignStyle = useSettingsStore((state) => state.setDesignStyle)
  const setAnimationStyle = useSettingsStore((state) => state.setAnimationStyle)

  const addToast = useToastStore((state) => state.addToast)

  const totalStudents = useMemo(
    () => classes.reduce((sum, classItem) => sum + classItem.students.length, 0),
    [classes]
  )

  const quickColorThemes: Array<{ id: ColorTheme; label: string }> = [
    { id: 'blue', label: '经典蓝' },
    { id: 'forest', label: '森林' },
    { id: 'tiffany', label: '蒂芙尼' },
    { id: 'china-red', label: '中国红' },
    { id: 'hermes', label: '爱马仕橙' }
  ]

  const quickDesignStyles: Array<{ id: DesignStyle; label: string }> = [
    { id: 'material-design-3', label: 'Material 3' },
    { id: 'minimalism', label: '极简' },
    { id: 'glassmorphism', label: '玻璃拟态' },
    { id: 'apple-hig', label: 'Apple 风格' },
    { id: 'neo-brutalism', label: '粗野几何' },
    { id: 'editorial', label: '杂志排版' }
  ]

  const quickAnimationStyles: Array<{ id: AnimationStyle; label: string }> = [
    { id: 'slot', label: '老虎机' },
    { id: 'flip', label: '翻转' },
    { id: 'wheel', label: '转盘' },
    { id: 'charByChar', label: '逐字' }
  ]

  const quickAppearancePresets: Array<{
    id: string
    label: string
    theme: 'light' | 'dark' | 'system'
    color: ColorTheme
    style: DesignStyle
    animation: AnimationStyle
  }> = [
    {
      id: 'classic-classroom',
      label: '课堂经典',
      theme: 'system',
      color: 'blue',
      style: 'material-design-3',
      animation: 'slot'
    },
    {
      id: 'focus-minimal',
      label: '专注极简',
      theme: 'light',
      color: 'forest',
      style: 'minimalism',
      animation: 'flip'
    },
    {
      id: 'stage-vivid',
      label: '投屏活力',
      theme: 'dark',
      color: 'hermes',
      style: 'glassmorphism',
      animation: 'wheel'
    }
  ]

  const parsedQuickNames = useMemo(
    () => parseStudentNamesFromText(quickStudentsText),
    [quickStudentsText]
  )

  const isCurrentStepReady = useMemo(() => {
    if (current.helper === 'class-student') {
      return classes.length > 0 && totalStudents > 0
    }
    if (current.helper === 'appearance') {
      return (
        theme !== 'system' ||
        colorTheme !== 'blue' ||
        designStyle !== 'material-design-3' ||
        animationStyle !== 'slot'
      )
    }
    return false
  }, [
    current.helper,
    classes.length,
    totalStudents,
    theme,
    colorTheme,
    designStyle,
    animationStyle
  ])

  useEffect(() => {
    if (open) {
      setStep(0)
      setCompletedSteps([])
      setQuickClassName('')
      setQuickStudentsText('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(false)
      if (e.key === 'ArrowRight') setStep((s) => Math.min(STEPS.length - 1, s + 1))
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleQuickAddClassAndStudents = () => {
    const className = quickClassName.trim() || '新班级'
    const names = quickStudentsText
      .split(/\r?\n|,|，/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 60)

    let targetClassId = currentClassId
    if (!targetClassId) {
      addClass(className)
      const latest = useClassesStore.getState().classes
      targetClassId = latest[latest.length - 1]?.id || null
      if (targetClassId) setCurrentClass(targetClassId)
    }

    if (!targetClassId) {
      addToast('创建班级失败，请重试', 'error')
      return
    }

    if (names.length > 0) {
      addStudents(
        targetClassId,
        names.map((name) => ({
          id: crypto.randomUUID(),
          name,
          pickCount: 0,
          score: 0,
          weight: 1,
          status: 'active' as const
        }))
      )
    }

    const finalClassName = classes.find((item) => item.id === targetClassId)?.name || className
    addToast(`已准备班级「${finalClassName}」，新增 ${names.length} 名学生`, 'success')
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]))
  }

  function parseStudentNamesFromText(content: string): string[] {
    const rows = content
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter((row) => row.length > 0)
    if (rows.length === 0) return []

    const first = rows[0].replace(/^\uFEFF/, '')
    const hasHeader = /(^|,|，)(name|姓名)(,|，|$)/i.test(first)
    const dataRows = hasHeader ? rows.slice(1) : rows

    return dataRows
      .flatMap((row) => row.split(/,|，/).map((cell) => cell.trim()))
      .filter((name) => name.length > 0)
      .slice(0, 60)
  }

  const handleImportStudentsFromFile = async () => {
    const filePath = await window.electronAPI.selectFile({
      title: '选择学生名单文件',
      filters: [
        { name: '文本文件', extensions: ['txt', 'csv'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })
    if (!filePath) return

    try {
      const text = await window.electronAPI.readTextFile(filePath)
      const names = parseStudentNamesFromText(text)
      if (names.length === 0) {
        addToast('未识别到可导入的学生姓名', 'error')
        return
      }
      setQuickStudentsText(names.join('\n'))
      addToast(`已从文件载入 ${names.length} 名学生`, 'success')
    } catch {
      addToast('读取名单文件失败', 'error')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-xl rounded-3xl bg-surface-container border border-outline-variant/40 shadow-2xl"
        >
          <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-on-surface">新手引导</div>
              <div className="text-xs text-on-surface-variant mt-0.5">
                第 {step + 1} / {STEPS.length} 步
              </div>
            </div>
            <button
              onClick={() => onClose(false)}
              className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
              title="稍后再看"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 pt-4">
            <div className="h-1.5 bg-surface-container-low rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-on-surface-variant flex items-center justify-between">
              <span>浏览进度 {progress}%</span>
              <span>完成进度 {completeProgress}%</span>
            </div>
          </div>

          <div className="p-5">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {STEPS.map((item, idx) => (
                <button
                  key={item.title}
                  onClick={() => setStep(idx)}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[11px] border cursor-pointer transition-colors',
                    idx === step
                      ? 'bg-secondary-container text-secondary-container-foreground border-transparent'
                      : completedSteps.includes(idx)
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40'
                  )}
                >
                  {idx + 1}. {item.title}
                </button>
              ))}
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <current.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-on-surface">{current.title}</h3>
                <p className="text-sm text-on-surface-variant mt-1">{current.description}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 p-3">
              <div className="text-xs font-semibold text-on-surface mb-2">本步你可以这样做</div>
              <div className="space-y-1.5">
                {current.checklist.map((item) => (
                  <div
                    key={item}
                    className="text-xs text-on-surface-variant flex items-start gap-1.5"
                  >
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              {current.tip && (
                <div className="mt-2 text-[11px] text-primary">提示：{current.tip}</div>
              )}
            </div>

            {current.helper === 'class-student' && (
              <div className="mt-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 p-3">
                <div className="text-xs font-semibold text-on-surface mb-2">
                  快速初始化（可直接操作）
                </div>
                <div className="space-y-2">
                  <input
                    value={quickClassName}
                    onChange={(e) => setQuickClassName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container text-xs text-on-surface outline-none"
                    placeholder="班级名称（为空则用“新班级”）"
                  />
                  <textarea
                    value={quickStudentsText}
                    onChange={(e) => setQuickStudentsText(e.target.value)}
                    className="w-full min-h-[84px] px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container text-xs text-on-surface outline-none resize-y"
                    placeholder="学生姓名（每行一个，或用逗号分隔）"
                  />
                  <div className="text-[11px] text-on-surface-variant">
                    已识别 {parsedQuickNames.length} 名学生
                    {parsedQuickNames.length > 0 && (
                      <span>（示例：{parsedQuickNames.slice(0, 3).join('、')}）</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleImportStudentsFromFile}
                      className="px-3 py-1.5 rounded-full text-xs border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
                    >
                      从文件导入名单
                    </button>
                    <button
                      onClick={handleQuickAddClassAndStudents}
                      className="px-3.5 py-1.5 rounded-full text-xs bg-primary text-primary-foreground cursor-pointer"
                    >
                      创建
                    </button>
                    <button
                      onClick={() => {
                        setQuickClassName('')
                        setQuickStudentsText('')
                      }}
                      className="px-3 py-1.5 rounded-full text-xs border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
                    >
                      清空输入
                    </button>
                  </div>
                </div>
              </div>
            )}

            {current.helper === 'appearance' && (
              <div className="mt-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 p-3">
                <div className="text-xs font-semibold text-on-surface mb-2">
                  快速设置外观（可直接操作）
                </div>
                <div className="text-[11px] text-on-surface-variant mb-1.5">主题</div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    { id: 'light', label: '浅色' },
                    { id: 'system', label: '跟随系统' },
                    { id: 'dark', label: '深色' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setTheme(item.id as 'light' | 'dark' | 'system')}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[11px] border cursor-pointer',
                        theme === item.id
                          ? 'bg-secondary-container text-secondary-container-foreground border-transparent'
                          : 'bg-surface-container text-on-surface-variant border-outline-variant/40'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-on-surface-variant mb-1.5">配色</div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {quickColorThemes.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setColorTheme(item.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[11px] border cursor-pointer',
                        colorTheme === item.id
                          ? 'bg-secondary-container text-secondary-container-foreground border-transparent'
                          : 'bg-surface-container text-on-surface-variant border-outline-variant/40'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-on-surface-variant mb-1.5">设计风格</div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {quickDesignStyles.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setDesignStyle(item.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[11px] border cursor-pointer',
                        designStyle === item.id
                          ? 'bg-secondary-container text-secondary-container-foreground border-transparent'
                          : 'bg-surface-container text-on-surface-variant border-outline-variant/40'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-on-surface-variant mb-1.5">抽取动画</div>
                <div className="flex flex-wrap gap-1.5">
                  {quickAnimationStyles.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setAnimationStyle(item.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[11px] border cursor-pointer',
                        animationStyle === item.id
                          ? 'bg-secondary-container text-secondary-container-foreground border-transparent'
                          : 'bg-surface-container text-on-surface-variant border-outline-variant/40'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-on-surface-variant mt-3 mb-1.5">一键推荐方案</div>
                <div className="flex flex-wrap gap-1.5">
                  {quickAppearancePresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setTheme(preset.theme)
                        setColorTheme(preset.color)
                        setDesignStyle(preset.style)
                        setAnimationStyle(preset.animation)
                        addToast(`已应用外观方案：${preset.label}`, 'success')
                      }}
                      className="px-2.5 py-1 rounded-full text-[11px] border cursor-pointer bg-surface-container text-on-surface-variant border-outline-variant/40 hover:bg-surface-container-high"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() =>
                  setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]))
                }
                className="px-3 py-2 rounded-full text-sm border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high cursor-pointer inline-flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isCurrentStepReady ? '本步已完成（可标记）' : '标记本步已完成'}
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                onClick={() => onClose(true)}
                className="px-3 py-1.5 rounded-full text-xs border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
              >
                跳过并不再提示
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-sm cursor-pointer',
                    step === 0
                      ? 'bg-surface-container-low text-on-surface-variant/50 cursor-not-allowed'
                      : 'bg-surface-container-high text-on-surface'
                  )}
                >
                  上一步
                </button>
                {step < STEPS.length - 1 ? (
                  <button
                    onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                    className="px-4 py-1.5 rounded-full text-sm bg-primary text-primary-foreground cursor-pointer"
                  >
                    下一步
                  </button>
                ) : (
                  <button
                    onClick={() => onClose(true)}
                    className="px-4 py-1.5 rounded-full text-sm bg-primary text-primary-foreground cursor-pointer"
                  >
                    完成引导
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
