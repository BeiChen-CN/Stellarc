import { useClassesStore } from '../store/classesStore'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'
import { useConfirmStore } from '../store/confirmStore'
import {
  Plus,
  Trash2,
  UserX,
  Upload,
  Download,
  Users,
  RotateCcw,
  Copy,
  RotateCw,
  TrendingUp,
  BadgeCheck,
  Undo2,
  Clock3,
  ChevronDown,
  Check,
  PencilLine
} from 'lucide-react'
import { useState, useCallback, useRef, useMemo, useEffect, type ReactElement } from 'react'
import { cn } from '../lib/utils'
import { Student } from '../types'
import { logger } from '../lib/logger'
import { StudentMobileCard, StudentRow } from './students/StudentRow'
import { StatePanel } from '../components/StatePanel'

interface DropdownOption {
  value: string
  label: string
}

function InlineSelect({
  value,
  options,
  onChange,
  placeholder
}: {
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  placeholder: string
}): ReactElement {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = options.find((item) => item.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="px-2.5 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface outline-none cursor-pointer inline-flex items-center gap-1.5"
      >
        <span>{current?.label || placeholder}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-on-surface-variant', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 min-w-[150px] max-h-56 overflow-y-auto custom-scrollbar rounded-xl border border-outline-variant/30 bg-surface-container p-1 elevation-2">
          {options.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                onChange(item.value)
                setOpen(false)
              }}
              className={cn(
                'w-full text-left px-2 py-1.5 text-xs rounded-lg inline-flex items-center gap-1.5 cursor-pointer',
                value === item.value
                  ? 'bg-secondary-container text-secondary-container-foreground'
                  : 'text-on-surface hover:bg-surface-container-high'
              )}
            >
              <span className="w-3.5 h-3.5 inline-flex items-center justify-center shrink-0">
                {value === item.value ? <Check className="w-3.5 h-3.5" /> : null}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function parseStudentImportRows(
  content: string
): Array<Pick<Student, 'name' | 'studentId' | 'gender' | 'weight' | 'score' | 'status'>> {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) return []

  const detectDelimiter = (line: string): string => {
    if (line.includes('\t')) return '\t'
    if (line.includes('，')) return '，'
    if (line.includes(',')) return ','
    return ''
  }

  const delimiter = detectDelimiter(lines[0])
  if (!delimiter) {
    return lines.map((name) => ({ name, weight: 1, score: 0, status: 'active' as const }))
  }

  const split = (line: string): string[] => line.split(delimiter).map((cell) => cell.trim())
  const first = split(lines[0]).map((h) => h.toLowerCase())
  const hasHeader = first.some((h) =>
    [
      'name',
      '姓名',
      'studentid',
      '学号',
      'gender',
      '性别',
      'weight',
      '权重',
      'score',
      '积分',
      'status',
      '状态'
    ].includes(h)
  )

  const rows = hasHeader ? lines.slice(1) : lines
  const header = hasHeader ? first : ['name', 'studentId', 'gender', 'weight', 'score', 'status']
  const indexOf = (keys: string[]): number => header.findIndex((h) => keys.includes(h))

  const nameIdx = indexOf(['name', '姓名'])
  const studentIdIdx = indexOf(['studentid', '学号'])
  const genderIdx = indexOf(['gender', '性别'])
  const weightIdx = indexOf(['weight', '权重'])
  const scoreIdx = indexOf(['score', '积分'])
  const statusIdx = indexOf(['status', '状态'])

  return rows
    .map((line) => split(line))
    .map((cells) => {
      const rawName = ((nameIdx >= 0 ? cells[nameIdx] : cells[0]) || '').slice(0, 50)
      const name = rawName.replace(/[<>"'&]/g, '')
      const rawStudentId = studentIdIdx >= 0 ? cells[studentIdIdx] : undefined
      const studentId = rawStudentId?.slice(0, 30)
      const genderRaw = ((genderIdx >= 0 ? cells[genderIdx] : '') || '').toLowerCase()
      const gender: 'male' | 'female' | undefined =
        genderRaw === 'male' || genderRaw === '男' || genderRaw === 'm'
          ? 'male'
          : genderRaw === 'female' || genderRaw === '女' || genderRaw === 'f'
            ? 'female'
            : undefined
      const weightRaw = weightIdx >= 0 ? Number(cells[weightIdx]) : 1
      const scoreRaw = scoreIdx >= 0 ? Number(cells[scoreIdx]) : 0
      const statusRaw = (statusIdx >= 0 ? cells[statusIdx] : 'active') || 'active'

      const normalizedStatus =
        statusRaw === 'absent' || statusRaw === '缺席'
          ? 'absent'
          : statusRaw === 'excluded' || statusRaw === '排除'
            ? 'excluded'
            : 'active'

      return {
        name,
        studentId: studentId || undefined,
        gender,
        weight: Number.isFinite(weightRaw) && weightRaw > 0 ? Math.floor(weightRaw) : 1,
        score: Number.isFinite(scoreRaw) ? Math.floor(scoreRaw) : 0,
        status: normalizedStatus as 'active' | 'absent' | 'excluded'
      }
    })
    .filter((row) => row.name.length > 0)
}

export function Students(): ReactElement {
  const {
    classes,
    currentClassId,
    addClass,
    removeClass,
    renameClass,
    duplicateClass,
    addStudent,
    addStudents,
    removeStudent,
    updateStudentStatus,
    updateStudentWeight,
    updateStudentScore,
    updateStudentPhoto,
    updateStudentName,
    updateStudentId,
    updateStudentGender,
    updateStudentTags,
    batchUpdateStudents,
    applyTaskScore,
    rollbackScoreLog,
    setClassTaskTemplates,
    resetClassScores,
    dedupeClassStudents,
    normalizeClassStudents,
    undoLastChange,
    canUndo
  } = useClassesStore()
  const {
    fairness,
    showStudentId,
    showTaskScorePanel,
    showBatchEditPanel,
    showScoreLogPanel,
    showGroupTaskTemplatePanel
  } = useSettingsStore()
  const addToast = useToastStore((state) => state.addToast)
  const showConfirm = useConfirmStore((state) => state.show)
  const [newStudentName, setNewStudentName] = useState('')
  const [newClassName, setNewClassName] = useState('')
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [editingClassName, setEditingClassName] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [taskName, setTaskName] = useState('课堂任务')
  const [taskDelta, setTaskDelta] = useState(1)
  const [taskTagQuery, setTaskTagQuery] = useState('')
  const [taskTemplateDraft, setTaskTemplateDraft] = useState('观察记录:+1,快问快答:+2,上台展示:+3')
  const [logStudentFilter, setLogStudentFilter] = useState('all')
  const [logTaskFilter, setLogTaskFilter] = useState('')
  const [logSourceFilter, setLogSourceFilter] = useState<
    'all' | 'manual' | 'task-assignment' | 'batch'
  >('all')
  const [batchGender, setBatchGender] = useState<'keep' | 'male' | 'female'>('keep')
  const [batchStatus, setBatchStatus] = useState<'keep' | 'active' | 'absent' | 'excluded'>('keep')
  const [batchWeight, setBatchWeight] = useState('')
  const [batchTags, setBatchTags] = useState('')
  const [batchTagsMode, setBatchTagsMode] = useState<'replace' | 'append'>('append')
  const classNameInputRef = useRef<HTMLInputElement>(null)

  const currentClass = classes.find((c) => c.id === currentClassId)
  const validStudentIdSet = useMemo(
    () => new Set((currentClass?.students || []).map((student) => student.id)),
    [currentClass]
  )
  const effectiveSelectedStudentIds = useMemo(
    () => selectedStudentIds.filter((id) => validStudentIdSet.has(id)),
    [selectedStudentIds, validStudentIdSet]
  )
  const selectedSet = useMemo(
    () => new Set(effectiveSelectedStudentIds),
    [effectiveSelectedStudentIds]
  )
  const effectiveLogStudentFilter = useMemo(
    () =>
      logStudentFilter === 'all' || validStudentIdSet.has(logStudentFilter)
        ? logStudentFilter
        : 'all',
    [logStudentFilter, validStudentIdSet]
  )
  const classTagOptions = useMemo(() => {
    if (!currentClass) return []
    const counter = new Map<string, number>()
    currentClass.students.forEach((student) => {
      ;(student.tags || []).forEach((tag) => {
        const key = tag.trim()
        if (!key) return
        counter.set(key, (counter.get(key) || 0) + 1)
      })
    })
    return Array.from(counter.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
  }, [currentClass])

  const matchedTagStudentIds = useMemo(() => {
    if (!currentClass) return []
    const query = taskTagQuery.trim().toLowerCase()
    if (!query) return []
    return currentClass.students
      .filter((student) => (student.tags || []).some((tag) => tag.toLowerCase().includes(query)))
      .map((student) => student.id)
  }, [currentClass, taskTagQuery])

  const classScoreStats = useMemo(() => {
    if (!currentClass || currentClass.students.length === 0) {
      return { avg: 0, max: 0, min: 0 }
    }
    const scores = currentClass.students.map((student) => student.score || 0)
    const total = scores.reduce((sum, item) => sum + item, 0)
    return {
      avg: total / scores.length,
      max: Math.max(...scores),
      min: Math.min(...scores)
    }
  }, [currentClass])

  const scoreLogs = useMemo(() => {
    if (!currentClass) return []
    return currentClass.students
      .flatMap((student) =>
        (student.scoreHistory || []).map((entry) => ({
          ...entry,
          studentId: student.id,
          studentName: student.name
        }))
      )
      .sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1))
  }, [currentClass])

  const filteredScoreLogs = useMemo(() => {
    const taskQuery = logTaskFilter.trim().toLowerCase()
    return scoreLogs.filter((item) => {
      if (effectiveLogStudentFilter !== 'all' && item.studentId !== effectiveLogStudentFilter) {
        return false
      }
      if (logSourceFilter !== 'all' && item.source !== logSourceFilter) return false
      if (taskQuery && !item.taskName.toLowerCase().includes(taskQuery)) return false
      return true
    })
  }, [scoreLogs, effectiveLogStudentFilter, logSourceFilter, logTaskFilter])

  const logStudentOptions = useMemo(
    () => [
      { value: 'all', label: '全部学生' },
      ...((currentClass?.students || []).map((student) => ({
        value: student.id,
        label: student.name
      })) as DropdownOption[])
    ],
    [currentClass]
  )

  const logSourceOptions: DropdownOption[] = useMemo(
    () => [
      { value: 'all', label: '全部来源' },
      { value: 'manual', label: '手动' },
      { value: 'batch', label: '批量任务' },
      { value: 'task-assignment', label: '分组任务' }
    ],
    []
  )

  const batchGenderOptions: DropdownOption[] = useMemo(
    () => [
      { value: 'keep', label: '性别不变' },
      { value: 'male', label: '设为男' },
      { value: 'female', label: '设为女' }
    ],
    []
  )

  const batchStatusOptions: DropdownOption[] = useMemo(
    () => [
      { value: 'keep', label: '状态不变' },
      { value: 'active', label: '设为正常' },
      { value: 'absent', label: '设为缺席' },
      { value: 'excluded', label: '设为排除' }
    ],
    []
  )

  const handleAddClass = useCallback(() => {
    if (newClassName.trim()) {
      addClass(newClassName.trim())
      setNewClassName('')
    }
  }, [newClassName, addClass])

  const handleAddStudent = useCallback(() => {
    if (newStudentName.trim() && currentClassId) {
      addStudent(currentClassId, {
        id: crypto.randomUUID(),
        name: newStudentName.trim(),
        pickCount: 0,
        score: 0,
        weight: 1,
        status: 'active'
      })
      setNewStudentName('')
    }
  }, [newStudentName, currentClassId, addStudent])

  const toggleStudentSelected = useCallback((studentId: string, checked: boolean) => {
    setSelectedStudentIds((prev) => {
      if (checked) {
        return prev.includes(studentId) ? prev : [...prev, studentId]
      }
      return prev.filter((id) => id !== studentId)
    })
  }, [])

  const handleApplyTaskScore = useCallback(
    (target: 'selected' | 'all' | 'tag') => {
      if (!currentClassId || !currentClass) return
      const ids =
        target === 'all'
          ? currentClass.students.map((student) => student.id)
          : target === 'tag'
            ? matchedTagStudentIds
            : effectiveSelectedStudentIds
      if (ids.length === 0) {
        addToast(target === 'tag' ? '没有匹配标签的学生' : '请先选择至少 1 名学生', 'error')
        return
      }
      const safeDelta = Math.max(-100, Math.min(100, Math.trunc(taskDelta)))
      const result = applyTaskScore(currentClassId, ids, taskName, safeDelta, 'batch')
      addToast(
        `已为 ${result.affected} 名学生应用任务「${taskName || '课堂任务'}」(${safeDelta >= 0 ? '+' : ''}${safeDelta})`,
        'success'
      )
    },
    [
      currentClassId,
      currentClass,
      effectiveSelectedStudentIds,
      applyTaskScore,
      taskName,
      taskDelta,
      matchedTagStudentIds,
      addToast
    ]
  )

  const toggleSelectAll = useCallback(() => {
    if (!currentClass) return
    if (effectiveSelectedStudentIds.length === currentClass.students.length) {
      setSelectedStudentIds([])
      return
    }
    setSelectedStudentIds(currentClass.students.map((student) => student.id))
  }, [currentClass, effectiveSelectedStudentIds.length])

  const handleSaveTaskTemplates = useCallback(() => {
    if (!currentClassId) return
    const templates = taskTemplateDraft
      .split(',')
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0)
      .map((chunk) => {
        const [namePart, scorePart] = chunk.split(':')
        const scoreDelta = Number(scorePart?.replace('+', ''))
        return {
          id: crypto.randomUUID(),
          name: (namePart || '').trim(),
          scoreDelta: Number.isFinite(scoreDelta) ? Math.trunc(scoreDelta) : 1
        }
      })
      .filter((item) => item.name.length > 0)
    if (templates.length === 0) {
      addToast('模板格式无效，请使用：任务:+分值', 'error')
      return
    }
    setClassTaskTemplates(currentClassId, templates)
    addToast(`已保存 ${templates.length} 条分组任务模板`, 'success')
  }, [currentClassId, taskTemplateDraft, setClassTaskTemplates, addToast])

  const handleRollbackScoreLog = useCallback(
    (studentId: string, logId: string) => {
      if (!currentClassId) return
      const result = rollbackScoreLog(currentClassId, studentId, logId)
      addToast(result.message, result.ok ? 'success' : 'error')
    },
    [currentClassId, rollbackScoreLog, addToast]
  )

  const handleBatchEditSelected = useCallback(() => {
    if (!currentClassId) return
    if (effectiveSelectedStudentIds.length === 0) {
      addToast('请先选择要批量编辑的学生', 'error')
      return
    }
    const tags = batchTags
      .split('/')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
    const result = batchUpdateStudents(currentClassId, effectiveSelectedStudentIds, {
      gender: batchGender === 'keep' ? undefined : batchGender,
      status: batchStatus === 'keep' ? undefined : batchStatus,
      weight: batchWeight.trim() ? Math.max(1, Math.trunc(Number(batchWeight) || 1)) : undefined,
      tags: tags.length > 0 ? tags : undefined,
      tagsMode: batchTagsMode
    })
    addToast(
      `批量编辑完成，已更新 ${result.affected} 名学生`,
      result.affected > 0 ? 'success' : 'info'
    )
  }, [
    currentClassId,
    effectiveSelectedStudentIds,
    batchTags,
    batchGender,
    batchStatus,
    batchWeight,
    batchTagsMode,
    batchUpdateStudents,
    addToast
  ])

  const handleUploadPhoto = useCallback(
    async (classId: string, studentId: string) => {
      const filePath = await window.electronAPI.selectFile({
        title: '选择学生照片',
        filters: [{ name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }]
      })
      if (filePath) {
        try {
          const fileData = await window.electronAPI.readFile(filePath)
          const sizeMB = fileData.byteLength / (1024 * 1024)
          if (sizeMB > 5) {
            addToast(`照片过大（${sizeMB.toFixed(1)}MB），请选择 5MB 以内的图片`, 'error')
            return
          }
          const targetName = `${studentId}.jpg`
          const photoPath = await window.electronAPI.copyPhoto(filePath, targetName)
          updateStudentPhoto(classId, studentId, photoPath)
          addToast('照片上传成功！', 'success')
        } catch {
          addToast('照片上传失败。', 'error')
        }
      }
    },
    [addToast, updateStudentPhoto]
  )

  const handleRemoveStudent = useCallback(
    (classId: string, studentId: string): void => {
      showConfirm('删除学生', '确定要删除这位学生吗？此操作不可撤销。', () =>
        removeStudent(classId, studentId)
      )
    },
    [showConfirm, removeStudent]
  )

  const existingStudentKeys = useMemo(
    () =>
      new Set(
        (currentClass?.students || []).map((student) =>
          `${student.name}::${student.studentId || ''}`.toLowerCase()
        )
      ),
    [currentClass]
  )

  const handleImportStudents = useCallback(async (): Promise<void> => {
    if (!currentClassId) return

    const filePath = await window.electronAPI.selectFile({
      title: '导入学生名单',
      filters: [{ name: '文本文件', extensions: ['txt', 'csv'] }]
    })

    if (filePath) {
      try {
        const content = await window.electronAPI.readTextFile(filePath)
        const parsedRows = parseStudentImportRows(content)

        if (parsedRows.length === 0) {
          addToast('文件内容为空或格式无效。', 'error')
          return
        }

        const existingSet = new Set(existingStudentKeys)

        const newStudents = parsedRows
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
          addToast('没有可导入的新学生（已自动去重）。', 'error')
          return
        }

        addStudents(currentClassId, newStudents)
        addToast(`成功导入 ${newStudents.length} 名学生（已去重）。`, 'success')
      } catch (error) {
        logger.error('Students', 'Import failed:', error)
        addToast('导入失败，请检查文件格式。', 'error')
      }
    }
  }, [currentClassId, existingStudentKeys, addStudents, addToast])

  const handleExportStudents = useCallback(async () => {
    if (!currentClass || currentClass.students.length === 0) return
    const filePath = await window.electronAPI.saveFile({
      title: '导出学生名单',
      defaultPath: `${currentClass.name}-学生名单.csv`,
      filters: [{ name: 'CSV 文件', extensions: ['csv'] }]
    })
    if (filePath) {
      const header = '姓名,学号,性别,权重,积分,状态'
      const statusMap = { active: '正常', absent: '缺席', excluded: '排除' }
      const genderMap = { male: '男', female: '女' }
      const rows = currentClass.students.map(
        (s) =>
          `${s.name},${s.studentId || ''},${s.gender ? genderMap[s.gender] : ''},${s.weight},${s.score},${statusMap[s.status] || s.status}`
      )
      const ok = await window.electronAPI.writeExportFile(filePath, [header, ...rows].join('\n'))
      addToast(ok ? '导出成功' : '导出失败', ok ? 'success' : 'error')
    }
  }, [currentClass, addToast])

  const handleResetScores = useCallback(() => {
    if (!currentClassId) return
    showConfirm('重置积分', '确定要将当前班级所有学生的积分归零吗？', () => {
      resetClassScores(currentClassId)
      addToast('积分已重置', 'success')
    })
  }, [currentClassId, showConfirm, resetClassScores, addToast])

  const handleDataGovernance = useCallback(() => {
    if (!currentClassId) return
    const normalize = normalizeClassStudents(currentClassId)
    const dedupe = dedupeClassStudents(currentClassId)
    addToast(
      `治理完成：规范化 ${normalize.updated} 项，移除空名 ${normalize.removed} 项，去重 ${dedupe.removed} 项`,
      'success'
    )
  }, [currentClassId, normalizeClassStudents, dedupeClassStudents, addToast])

  const handleDuplicateClass = useCallback(
    (classId: string) => {
      duplicateClass(classId)
      addToast('班级已复制', 'success')
    },
    [duplicateClass, addToast]
  )

  const startRenameClass = useCallback((classId: string, currentName: string) => {
    setEditingClassId(classId)
    setEditingClassName(currentName)
    setTimeout(() => classNameInputRef.current?.select(), 0)
  }, [])

  const commitRenameClass = useCallback(() => {
    if (editingClassId && editingClassName.trim()) {
      renameClass(editingClassId, editingClassName.trim())
    }
    setEditingClassId(null)
  }, [editingClassId, editingClassName, renameClass])

  return (
    <div className="h-full overflow-y-auto flex flex-col space-y-3 p-3 sm:p-5">
      <header className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-on-surface">学生管理</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={undoLastChange}
            disabled={!canUndo}
            className="p-2.5 bg-surface-container-high text-on-surface rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors cursor-pointer"
            title="撤销上一步"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <input
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder="新班级名称"
            className="w-full sm:w-52 px-4 py-2 border border-outline-variant rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface-container-low outline-none transition-colors"
          />
          <button
            onClick={handleAddClass}
            className="p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors elevation-1 cursor-pointer"
            title="添加班级"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant p-10 space-y-4">
            <div className="p-4 bg-surface-container-high rounded-full">
              <Plus className="w-8 h-8 opacity-50" />
            </div>
            <p>暂无班级。请在上方输入名称并点击添加。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-full">
            <div className="col-span-1 pr-2 space-y-2 overflow-y-auto">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-on-surface">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                班级列表
              </h3>
              <div className="space-y-1.5">
                {classes.map((c) => {
                  const isActive = currentClassId === c.id
                  const studentCount = c.students.length
                  const activeCount = c.students.filter((s) => s.status === 'active').length
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        'group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200',
                        isActive
                          ? 'bg-secondary-container text-secondary-container-foreground elevation-1'
                          : 'hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                      )}
                      onClick={() => useClassesStore.getState().setCurrentClass(c.id)}
                    >
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {c.name.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingClassId === c.id ? (
                          <input
                            ref={classNameInputRef}
                            value={editingClassName}
                            onChange={(e) => setEditingClassName(e.target.value)}
                            onBlur={commitRenameClass}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitRenameClass()
                              if (e.key === 'Escape') setEditingClassId(null)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-1.5 py-0.5 border border-primary rounded text-sm bg-surface-container-low outline-none text-on-surface"
                            autoFocus
                          />
                        ) : (
                          <div
                            className="font-medium text-sm break-all line-clamp-2"
                            onDoubleClick={(e) => {
                              e.stopPropagation()
                              startRenameClass(c.id, c.name)
                            }}
                            title={c.name}
                          >
                            {c.name}
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3 text-on-surface-variant/60" />
                          <span className="text-[11px] text-on-surface-variant/70">
                            {activeCount}/{studentCount} 人
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicateClass(c.id)
                        }}
                        className="text-on-surface-variant opacity-70 sm:opacity-0 sm:group-hover:opacity-100 hover:text-primary transition-all duration-200 p-1.5 hover:bg-primary/10 rounded-full shrink-0"
                        title="复制班级"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          showConfirm('删除班级', '确定要删除这个班级吗？此操作不可撤销。', () =>
                            removeClass(c.id)
                          )
                        }}
                        className="text-on-surface-variant opacity-70 sm:opacity-0 sm:group-hover:opacity-100 hover:text-destructive transition-all duration-200 p-1.5 hover:bg-destructive/10 rounded-full shrink-0"
                        title="删除班级"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="col-span-4 flex flex-col h-full overflow-hidden">
              {currentClass ? (
                <>
                  <div className="mb-4 ui-stack-row shrink-0">
                    <input
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      className="flex-1 min-w-0 sm:min-w-[220px] border border-outline-variant px-4 py-2 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface-container-low outline-none transition-colors"
                      placeholder="输入学生姓名..."
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
                    />
                    <button
                      onClick={handleAddStudent}
                      className="ui-btn ui-btn-sm bg-primary text-primary-foreground hover:bg-primary/90 elevation-1 whitespace-nowrap"
                    >
                      添加学生
                    </button>
                    <button
                      onClick={handleImportStudents}
                      className="ui-btn ui-btn-sm bg-secondary-container text-secondary-container-foreground hover:bg-secondary-container/80 whitespace-nowrap"
                      title="从文本文件导入（每行一个名字）"
                    >
                      <Upload className="w-4 h-4" />
                      导入
                    </button>
                    <button
                      onClick={handleExportStudents}
                      disabled={!currentClass || currentClass.students.length === 0}
                      className="ui-btn ui-btn-sm bg-secondary-container text-secondary-container-foreground hover:bg-secondary-container/80 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                      title="导出学生名单为 CSV"
                    >
                      <Download className="w-4 h-4" />
                      导出
                    </button>
                    <button
                      onClick={handleResetScores}
                      disabled={!currentClass || currentClass.students.length === 0}
                      className="p-2.5 bg-surface-container-high text-on-surface rounded-full hover:bg-surface-container-low transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="重置当前班级所有积分"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDataGovernance}
                      disabled={!currentClass || currentClass.students.length === 0}
                      className="px-3 py-2 bg-surface-container-high text-on-surface rounded-full hover:bg-surface-container-low transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                      title="执行数据治理（规范化与去重）"
                    >
                      治理
                    </button>
                  </div>

                  <div className="mb-3 flex items-center gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-high/70 px-3 py-2">
                    <div className="inline-flex items-center gap-1 text-xs text-on-surface-variant pr-2 border-r border-outline-variant/30">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      均分 {classScoreStats.avg.toFixed(1)}
                    </div>
                    <div className="text-xs text-on-surface-variant">
                      最高 {classScoreStats.max}
                    </div>
                    <div className="text-xs text-on-surface-variant">
                      最低 {classScoreStats.min}
                    </div>
                  </div>

                  {showBatchEditPanel && (
                    <div className="mb-3 rounded-2xl border border-outline-variant/30 bg-surface-container-high/70 px-3 py-2">
                      <div className="flex items-center gap-2 mb-2">
                        <PencilLine className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs text-on-surface-variant">
                          批量编辑（仅已选 {effectiveSelectedStudentIds.length} 人）
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <InlineSelect
                          value={batchGender}
                          onChange={(value) => setBatchGender(value as 'keep' | 'male' | 'female')}
                          options={batchGenderOptions}
                          placeholder="性别不变"
                        />
                        <InlineSelect
                          value={batchStatus}
                          onChange={(value) =>
                            setBatchStatus(value as 'keep' | 'active' | 'absent' | 'excluded')
                          }
                          options={batchStatusOptions}
                          placeholder="状态不变"
                        />
                        <input
                          value={batchWeight}
                          onChange={(e) => setBatchWeight(e.target.value)}
                          className="w-24 px-2 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface outline-none"
                          placeholder="权重"
                        />
                        <input
                          value={batchTags}
                          onChange={(e) => setBatchTags(e.target.value)}
                          className="w-44 px-2 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface outline-none"
                          placeholder="标签（/分隔）"
                        />
                        <button
                          onClick={() =>
                            setBatchTagsMode((m) => (m === 'append' ? 'replace' : 'append'))
                          }
                          className="px-2.5 py-1.5 rounded-xl text-xs bg-surface-container-low text-on-surface-variant border border-outline-variant/40 cursor-pointer"
                        >
                          标签模式：{batchTagsMode === 'append' ? '追加' : '替换'}
                        </button>
                        <button
                          onClick={handleBatchEditSelected}
                          className="px-3 py-1.5 rounded-xl text-xs bg-primary text-primary-foreground cursor-pointer"
                        >
                          应用批量编辑
                        </button>
                      </div>
                    </div>
                  )}

                  {showTaskScorePanel && (
                    <div className="mb-3 flex items-center gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-high/70 px-3 py-2">
                      <span className="text-xs text-on-surface-variant">任务积分</span>
                      <input
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        className="w-40 px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface outline-none"
                        placeholder="任务名称"
                      />
                      <input
                        type="number"
                        value={taskDelta}
                        onChange={(e) => setTaskDelta(Number(e.target.value) || 0)}
                        className="w-20 px-2 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface outline-none text-center"
                        title="分值"
                      />
                      <div className="flex items-center gap-1">
                        {[1, 2, 5, -1, -2].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => setTaskDelta(preset)}
                            className="px-2 py-1 rounded-lg text-[11px] bg-surface-container-low text-on-surface-variant hover:bg-surface-container cursor-pointer"
                          >
                            {preset > 0 ? '+' : ''}
                            {preset}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => handleApplyTaskScore('selected')}
                        className="px-3 py-1.5 rounded-xl text-xs bg-primary text-primary-foreground cursor-pointer"
                      >
                        应用到已选（{effectiveSelectedStudentIds.length}）
                      </button>
                      <button
                        onClick={() => handleApplyTaskScore('all')}
                        className="px-3 py-1.5 rounded-xl text-xs bg-secondary-container text-secondary-container-foreground cursor-pointer"
                      >
                        应用到全体
                      </button>
                      <div className="flex items-center gap-1 pl-2 border-l border-outline-variant/30">
                        <BadgeCheck className="w-3.5 h-3.5 text-primary" />
                        <input
                          value={taskTagQuery}
                          onChange={(e) => setTaskTagQuery(e.target.value)}
                          className="w-24 px-2 py-1 rounded-lg border border-outline-variant/40 bg-surface-container-low text-[11px] text-on-surface outline-none"
                          placeholder="按标签"
                        />
                        <button
                          onClick={() => handleApplyTaskScore('tag')}
                          className="px-2.5 py-1.5 rounded-xl text-xs bg-primary/10 text-primary border border-primary/20 cursor-pointer"
                        >
                          标签应用（{matchedTagStudentIds.length}）
                        </button>
                      </div>
                    </div>
                  )}

                  {showTaskScorePanel && classTagOptions.length > 0 && (
                    <div className="mb-3 flex flex-wrap items-center gap-1.5">
                      {classTagOptions.slice(0, 10).map((item) => (
                        <button
                          key={item.tag}
                          onClick={() => setTaskTagQuery(item.tag)}
                          className="px-2 py-1 rounded-full text-[11px] bg-surface-container-high text-on-surface-variant hover:text-on-surface cursor-pointer"
                        >
                          {item.tag} ({item.count})
                        </button>
                      ))}
                    </div>
                  )}

                  {showGroupTaskTemplatePanel && (
                    <div className="mb-3 flex items-center gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-high/70 px-3 py-2">
                      <span className="text-xs text-on-surface-variant">分组任务模板</span>
                      <input
                        value={taskTemplateDraft}
                        onChange={(e) => setTaskTemplateDraft(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface outline-none"
                        placeholder="格式：任务A:+1,任务B:+2"
                      />
                      <button
                        onClick={handleSaveTaskTemplates}
                        className="px-3 py-1.5 rounded-xl text-xs bg-primary/10 text-primary border border-primary/20 cursor-pointer"
                      >
                        保存模板
                      </button>
                    </div>
                  )}

                  {showScoreLogPanel && (
                    <div className="mb-3 rounded-2xl border border-outline-variant/30 bg-surface-container-high/50 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock3 className="w-4 h-4 text-primary" />
                        <span className="text-xs text-on-surface-variant">积分日志面板</span>
                        <span className="text-[11px] text-on-surface-variant">
                          共 {filteredScoreLogs.length} 条
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <InlineSelect
                          value={effectiveLogStudentFilter}
                          onChange={setLogStudentFilter}
                          options={logStudentOptions}
                          placeholder="全部学生"
                        />

                        <InlineSelect
                          value={logSourceFilter}
                          onChange={(value) =>
                            setLogSourceFilter(
                              value as 'all' | 'manual' | 'task-assignment' | 'batch'
                            )
                          }
                          options={logSourceOptions}
                          placeholder="全部来源"
                        />

                        <input
                          value={logTaskFilter}
                          onChange={(e) => setLogTaskFilter(e.target.value)}
                          placeholder="筛选任务名"
                          className="px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface outline-none"
                        />
                      </div>

                      <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-1.5">
                        {filteredScoreLogs.slice(0, 120).map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between gap-2 rounded-xl bg-surface-container px-2.5 py-1.5 border border-outline-variant/20"
                          >
                            <div className="min-w-0">
                              <div className="text-xs text-on-surface truncate">
                                {log.studentName} · {log.taskName}
                              </div>
                              <div className="text-[10px] text-on-surface-variant">
                                {new Date(log.timestamp).toLocaleString()} · {log.source}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={cn(
                                  'text-xs font-semibold',
                                  log.delta > 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : log.delta < 0
                                      ? 'text-destructive'
                                      : 'text-on-surface-variant'
                                )}
                              >
                                {log.delta > 0 ? '+' : ''}
                                {log.delta}
                              </span>
                              <button
                                onClick={() => handleRollbackScoreLog(log.studentId, log.id)}
                                className="px-2 py-1 rounded-lg text-[11px] bg-destructive/10 text-destructive cursor-pointer inline-flex items-center gap-1"
                              >
                                <Undo2 className="w-3 h-3" />
                                回滚
                              </button>
                            </div>
                          </div>
                        ))}
                        {filteredScoreLogs.length === 0 && (
                          <div className="text-xs text-on-surface-variant text-center py-4">
                            暂无匹配日志
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="sm:hidden space-y-2 pb-2">
                    {currentClass.students.map((student) => (
                      <StudentMobileCard
                        key={student.id}
                        student={student}
                        classId={currentClass.id}
                        selected={selectedSet.has(student.id)}
                        onToggleSelected={toggleStudentSelected}
                        showWeight={fairness.weightedRandom}
                        showStudentId={showStudentId}
                        onUploadPhoto={handleUploadPhoto}
                        onUpdateWeight={updateStudentWeight}
                        onUpdateScore={updateStudentScore}
                        onUpdateStatus={updateStudentStatus}
                        onUpdateName={updateStudentName}
                        onUpdateStudentId={updateStudentId}
                        onUpdateGender={updateStudentGender}
                        onUpdateTags={updateStudentTags}
                        onRemove={handleRemoveStudent}
                      />
                    ))}
                    {currentClass.students.length === 0 && (
                      <div className="bg-surface-container rounded-xl">
                        <StatePanel
                          icon={UserX}
                          title="该班级暂无学生"
                          description="请添加学生或导入名单"
                          compact
                        />
                      </div>
                    )}
                  </div>

                  <div className="hidden sm:flex rounded-xl bg-surface-container elevation-0 flex-1 overflow-hidden flex-col">
                    <div className="overflow-auto flex-1">
                      <table className="w-full text-sm">
                        <thead className="bg-surface-container-high sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-3 text-center">
                              <button
                                onClick={toggleSelectAll}
                                className="text-xs text-primary hover:underline cursor-pointer"
                              >
                                {currentClass.students.length > 0 &&
                                effectiveSelectedStudentIds.length === currentClass.students.length
                                  ? '全不选'
                                  : '全选'}
                              </button>
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-on-surface-variant">
                              姓名
                            </th>
                            {fairness.weightedRandom && (
                              <th className="px-4 py-3 text-center font-semibold text-on-surface-variant">
                                权重
                              </th>
                            )}
                            <th className="px-4 py-3 text-center font-semibold text-on-surface-variant">
                              积分
                            </th>
                            <th className="px-4 py-3 text-center font-semibold text-on-surface-variant">
                              被抽中
                            </th>
                            <th className="px-4 py-3 text-center font-semibold text-on-surface-variant">
                              状态
                            </th>
                            <th className="px-4 py-3 text-center font-semibold text-on-surface-variant">
                              操作
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentClass.students.map((student) => (
                            <StudentRow
                              key={student.id}
                              student={student}
                              classId={currentClass.id}
                              selected={selectedSet.has(student.id)}
                              onToggleSelected={toggleStudentSelected}
                              showWeight={fairness.weightedRandom}
                              showStudentId={showStudentId}
                              onUploadPhoto={handleUploadPhoto}
                              onUpdateWeight={updateStudentWeight}
                              onUpdateScore={updateStudentScore}
                              onUpdateStatus={updateStudentStatus}
                              onUpdateName={updateStudentName}
                              onUpdateStudentId={updateStudentId}
                              onUpdateGender={updateStudentGender}
                              onUpdateTags={updateStudentTags}
                              onRemove={handleRemoveStudent}
                            />
                          ))}
                          {currentClass.students.length === 0 && (
                            <tr>
                              <td
                                colSpan={6 + (fairness.weightedRandom ? 1 : 0)}
                                className="p-10 text-center text-on-surface-variant"
                              >
                                <p>该班级暂无学生。</p>
                                <p className="text-xs opacity-70 mt-1">请添加学生或导入名单</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <StatePanel
                  icon={UserX}
                  title="请选择一个班级"
                  description="选择班级后即可管理学生数据"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
