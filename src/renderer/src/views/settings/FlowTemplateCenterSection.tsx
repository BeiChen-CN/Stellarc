import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Copy,
  Download,
  Play,
  Plus,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement } from 'react'
import { useFlowStore, type ClassroomFlow } from '../../store/flowStore'
import { useToastStore } from '../../store/toastStore'
import { useConfirmStore } from '../../store/confirmStore'

const ACTIVITY_PRESET_IDS = ['quick-pick', 'deep-focus', 'group-battle'] as const
type ImportConflictStrategy = 'rename' | 'overwrite-name'
type FlowAuditItem = { id: string; time: string; action: string; detail: string }
type AuditRange = 'all' | '1d' | '7d' | '30d'

const AUDIT_ACTION_OPTIONS = [
  { value: 'all', label: '全部动作' },
  { value: 'import', label: '导入' },
  { value: 'export', label: '导出模板' },
  { value: 'export-log', label: '导出日志' },
  { value: 'rename', label: '重命名' },
  { value: 'duplicate', label: '复制' },
  { value: 'move', label: '移动' },
  { value: 'activate', label: '启用' },
  { value: 'delete', label: '删除' },
  { value: 'edit-steps', label: '步骤编辑' },
  { value: 'reset-default', label: '恢复默认' },
  { value: 'cross-copy', label: '跨流程复制' }
] as const

const AUDIT_RANGE_OPTIONS: Array<{ value: AuditRange; label: string }> = [
  { value: 'all', label: '全部时间' },
  { value: '1d', label: '最近 1 天' },
  { value: '7d', label: '最近 7 天' },
  { value: '30d', label: '最近 30 天' }
]

const STEP_PRESET_OPTIONS = [
  { value: 'quick-pick', label: 'quick-pick' },
  { value: 'deep-focus', label: 'deep-focus' },
  { value: 'group-battle', label: 'group-battle' }
] as const

function ListDropdown({
  value,
  options,
  onChange,
  buttonClassName,
  panelClassName,
  fixedPanel = true
}: {
  value: string
  options: ReadonlyArray<{ value: string; label: string }>
  onChange: (value: string) => void
  buttonClassName?: string
  panelClassName?: string
  fixedPanel?: boolean
}): ReactElement {
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})
  const ref = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onMouseDown = (event: MouseEvent): void => {
      if (!ref.current) return
      if (!ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onAnyScroll = (): void => {
      setOpen(false)
    }

    if (fixedPanel && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const desiredTop = rect.bottom + 6
      const panelMaxHeight = 176
      const top =
        desiredTop + panelMaxHeight > window.innerHeight
          ? Math.max(8, rect.top - panelMaxHeight - 6)
          : desiredTop
      setPanelStyle({
        position: 'fixed',
        left: rect.left,
        top,
        width: rect.width,
        zIndex: 9999
      })
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('scroll', onAnyScroll, true)
    window.addEventListener('resize', onAnyScroll)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('scroll', onAnyScroll, true)
      window.removeEventListener('resize', onAnyScroll)
    }
  }, [open, fixedPanel])

  const selected = options.find((item) => item.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className={
          buttonClassName ||
          'w-full inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-low/60 text-[11px] text-on-surface cursor-pointer'
        }
      >
        <span className="truncate">{selected?.label || '请选择'}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          style={fixedPanel ? panelStyle : undefined}
          className={
            panelClassName ||
            'absolute z-30 mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container elevation-2 max-h-44 overflow-y-auto custom-scrollbar'
          }
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={
                option.value === value
                  ? 'w-full text-left px-2.5 py-1.5 text-[11px] bg-secondary-container text-secondary-container-foreground cursor-pointer border-b last:border-b-0 border-outline-variant/20'
                  : 'w-full text-left px-2.5 py-1.5 text-[11px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high cursor-pointer border-b last:border-b-0 border-outline-variant/20'
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function isActivityPreset(value: unknown): value is (typeof ACTIVITY_PRESET_IDS)[number] {
  return typeof value === 'string' && (ACTIVITY_PRESET_IDS as readonly string[]).includes(value)
}

function normalizeImportedFlows(payload: unknown): ClassroomFlow[] | null {
  const root =
    payload && typeof payload === 'object' && 'flows' in payload
      ? (payload as { flows?: unknown }).flows
      : payload
  if (!Array.isArray(root)) return null

  const flows: ClassroomFlow[] = []
  root.forEach((flow, flowIndex) => {
    if (!flow || typeof flow !== 'object') return
    const candidate = flow as {
      id?: unknown
      name?: unknown
      steps?: unknown
    }
    if (typeof candidate.name !== 'string' || !Array.isArray(candidate.steps)) return

    const steps = candidate.steps
      .map((step, stepIndex) => {
        if (!step || typeof step !== 'object') return null
        const item = step as {
          id?: unknown
          title?: unknown
          activityPreset?: unknown
          notes?: unknown
        }
        if (typeof item.title !== 'string' || !isActivityPreset(item.activityPreset)) return null
        return {
          id:
            typeof item.id === 'string' && item.id.trim()
              ? item.id
              : `step-${flowIndex + 1}-${stepIndex + 1}`,
          title: item.title.trim(),
          activityPreset: item.activityPreset,
          notes: typeof item.notes === 'string' ? item.notes : undefined
        }
      })
      .filter((step): step is NonNullable<typeof step> => !!step)

    if (steps.length === 0) return

    flows.push({
      id:
        typeof candidate.id === 'string' && candidate.id.trim()
          ? candidate.id
          : `flow-${flowIndex + 1}`,
      name: candidate.name.trim(),
      steps
    })
  })

  return flows.length > 0 ? flows : null
}

export function FlowTemplateCenterSection(): ReactElement {
  const {
    flows,
    activeFlowId,
    setActiveFlow,
    setFlows,
    resetDefaultFlows,
    updateFlow,
    removeFlow,
    duplicateFlow,
    moveFlow
  } = useFlowStore()
  const addToast = useToastStore((state) => state.addToast)
  const showPrompt = useConfirmStore((state) => state.showPrompt)
  const showConfirm = useConfirmStore((state) => state.show)
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null)
  const [draftSteps, setDraftSteps] = useState<ClassroomFlow['steps']>([])
  const [draggingStepId, setDraggingStepId] = useState<string | null>(null)
  const [importStrategy, setImportStrategy] = useState<ImportConflictStrategy>('rename')
  const [copiedStep, setCopiedStep] = useState<ClassroomFlow['steps'][number] | null>(null)
  const [auditActionFilter, setAuditActionFilter] = useState('all')
  const [auditRange, setAuditRange] = useState<AuditRange>('all')
  const [auditItems, setAuditItems] = useState<FlowAuditItem[]>(() => {
    try {
      const raw = localStorage.getItem('flow-template-audit')
      if (!raw) return []
      const parsed = JSON.parse(raw) as FlowAuditItem[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  const canReset = useMemo(() => flows.length > 0, [flows.length])

  useEffect(() => {
    try {
      localStorage.setItem('flow-template-audit', JSON.stringify(auditItems.slice(0, 100)))
    } catch {
      // ignore localStorage errors
    }
  }, [auditItems])

  const appendAudit = (action: string, detail: string): void => {
    setAuditItems((prev) => [
      {
        id: `audit-${crypto.randomUUID()}`,
        time: new Date().toISOString(),
        action,
        detail
      },
      ...prev
    ])

    void window.electronAPI.appendDiagnosticEvent({
      category: 'sync',
      level: 'info',
      code: 'FLOW_TEMPLATE_AUDIT',
      message: detail,
      context: { action }
    })
  }

  const visibleAuditItems = useMemo(() => {
    const now = Date.now()
    const rangeMs =
      auditRange === '1d'
        ? 24 * 60 * 60 * 1000
        : auditRange === '7d'
          ? 7 * 24 * 60 * 60 * 1000
          : auditRange === '30d'
            ? 30 * 24 * 60 * 60 * 1000
            : Infinity

    return auditItems.filter((item) => {
      if (auditActionFilter !== 'all' && item.action !== auditActionFilter) return false
      if (rangeMs !== Infinity) {
        const t = new Date(item.time).getTime()
        if (!Number.isFinite(t) || now - t > rangeMs) return false
      }
      return true
    })
  }, [auditItems, auditActionFilter, auditRange])

  const exportAuditLogs = async (): Promise<void> => {
    const filePath = await window.electronAPI.saveFile({
      title: '导出流程模板操作日志',
      defaultPath: 'flow-template-audit.json',
      filters: [{ name: 'JSON 文件', extensions: ['json'] }]
    })
    if (!filePath) return
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      logs: auditItems
    }
    const ok = await window.electronAPI.writeExportFile(filePath, JSON.stringify(payload, null, 2))
    addToast(ok ? '操作日志导出成功' : '操作日志导出失败', ok ? 'success' : 'error')
    if (ok) appendAudit('export-log', `导出 ${auditItems.length} 条流程模板日志`)
  }

  const handleExportFlows = async (): Promise<void> => {
    const filePath = await window.electronAPI.saveFile({
      title: '导出课堂流程模板',
      defaultPath: 'classroom-flows.json',
      filters: [{ name: 'JSON 文件', extensions: ['json'] }]
    })
    if (!filePath) return
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      flows
    }
    const ok = await window.electronAPI.writeExportFile(filePath, JSON.stringify(payload, null, 2))
    addToast(ok ? '课堂流程模板导出成功' : '课堂流程模板导出失败', ok ? 'success' : 'error')
    if (ok) appendAudit('export', `导出 ${flows.length} 条流程模板`)
  }

  const handleImportFlows = async (): Promise<void> => {
    const filePath = await window.electronAPI.selectFile({
      title: '导入课堂流程模板',
      filters: [{ name: 'JSON 文件', extensions: ['json'] }]
    })
    if (!filePath) return
    try {
      const raw = await window.electronAPI.readTextFile(filePath)
      const parsed = JSON.parse(raw) as unknown
      const imported = normalizeImportedFlows(parsed)
      if (!imported) {
        addToast('模板格式无效，请检查 JSON 内容', 'error')
        return
      }

      if (importStrategy === 'overwrite-name') {
        const next = [...flows]
        const existingIds = new Set(next.map((flow) => flow.id))
        let overwrittenCount = 0
        let focusFlowId: string | null = null

        imported.forEach((flow) => {
          const sameNameIndex = next.findIndex((item) => item.name === flow.name)
          if (sameNameIndex >= 0) {
            const keepId = next[sameNameIndex].id
            next[sameNameIndex] = { ...flow, id: keepId, name: next[sameNameIndex].name }
            overwrittenCount++
            if (!focusFlowId) focusFlowId = keepId
            return
          }

          let nextId = flow.id
          while (existingIds.has(nextId)) {
            nextId = `flow-${crypto.randomUUID()}`
          }
          existingIds.add(nextId)
          next.push({ ...flow, id: nextId })
          if (!focusFlowId) focusFlowId = nextId
        })

        setFlows(next)
        setActiveFlow(focusFlowId)
        addToast(
          `已导入 ${imported.length} 条流程${overwrittenCount > 0 ? `（覆盖同名 ${overwrittenCount} 条）` : ''}`,
          'success'
        )
        appendAudit(
          'import',
          `导入 ${imported.length} 条（覆盖同名 ${overwrittenCount} 条，策略：覆盖同名）`
        )
      } else {
        const existingNames = new Set(flows.map((flow) => flow.name))
        const existingIds = new Set(flows.map((flow) => flow.id))
        let renamedCount = 0
        const merged = imported.map((flow) => {
          let nextId = flow.id
          let nextName = flow.name

          while (existingIds.has(nextId)) {
            nextId = `flow-${crypto.randomUUID()}`
            renamedCount++
          }
          existingIds.add(nextId)

          if (existingNames.has(nextName)) {
            let suffix = 1
            while (existingNames.has(`${flow.name}（导入${suffix}）`)) {
              suffix++
            }
            nextName = `${flow.name}（导入${suffix}）`
            renamedCount++
          }
          existingNames.add(nextName)

          return {
            ...flow,
            id: nextId,
            name: nextName
          }
        })

        const nextFlows = [...flows, ...merged]
        setFlows(nextFlows)
        setActiveFlow(merged[0]?.id || null)
        addToast(
          `已导入 ${merged.length} 条流程${renamedCount > 0 ? `（自动处理冲突 ${renamedCount} 处）` : ''}`,
          'success'
        )
        appendAudit(
          'import',
          `导入 ${merged.length} 条（冲突处理 ${renamedCount} 处，策略：重命名合并）`
        )
      }
    } catch {
      addToast('导入失败，请检查模板文件', 'error')
    }
  }

  const startStepEditing = (flow: ClassroomFlow): void => {
    setEditingFlowId(flow.id)
    setDraftSteps(
      flow.steps.map((step) => ({
        ...step,
        id: step.id || `step-${crypto.randomUUID()}`
      }))
    )
  }

  const saveStepEditing = (flowId: string): void => {
    const cleaned = draftSteps
      .map((step) => ({
        ...step,
        title: step.title.trim(),
        notes: step.notes?.trim() || undefined
      }))
      .filter((step) => step.title.length > 0)
    if (cleaned.length === 0) {
      addToast('至少保留一个有效步骤', 'error')
      return
    }
    updateFlow(flowId, { steps: cleaned })
    setEditingFlowId(null)
    setDraftSteps([])
    addToast('流程步骤已更新', 'success')
    appendAudit('edit-steps', `流程 ${flowId} 更新步骤 ${cleaned.length} 条`)
  }

  const updateDraftStep = (
    stepId: string,
    patch: Partial<ClassroomFlow['steps'][number]>
  ): void => {
    setDraftSteps((prev) =>
      prev.map((step) => {
        if (step.id !== stepId) return step
        return { ...step, ...patch }
      })
    )
  }

  const addDraftStep = (): void => {
    setDraftSteps((prev) => [
      ...prev,
      {
        id: `step-${crypto.randomUUID()}`,
        title: `步骤 ${prev.length + 1}`,
        activityPreset: 'quick-pick',
        notes: ''
      }
    ])
  }

  const pasteCopiedStep = (): void => {
    if (!copiedStep) return
    setDraftSteps((prev) => [
      ...prev,
      {
        ...copiedStep,
        id: `step-${crypto.randomUUID()}`
      }
    ])
    addToast('已粘贴步骤到当前流程', 'success')
  }

  const removeDraftStep = (stepId: string): void => {
    setDraftSteps((prev) => prev.filter((step) => step.id !== stepId))
  }

  const moveDraftStep = (stepId: string, direction: 'up' | 'down'): void => {
    setDraftSteps((prev) => {
      const index = prev.findIndex((step) => step.id === stepId)
      if (index < 0) return prev
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const moveDraftStepTo = (sourceId: string, targetId: string): void => {
    if (sourceId === targetId) return
    setDraftSteps((prev) => {
      const sourceIndex = prev.findIndex((step) => step.id === sourceId)
      const targetIndex = prev.findIndex((step) => step.id === targetId)
      if (sourceIndex < 0 || targetIndex < 0) return prev
      const next = [...prev]
      const [item] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, item)
      return next
    })
  }

  return (
    <section className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
        课堂流程模板中心
      </h3>

      <div className="bg-surface-container rounded-[28px] overflow-visible p-5 space-y-4">
        <div className="ui-stack-row">
          <button
            onClick={handleImportFlows}
            className="ui-btn ui-btn-sm bg-surface-container-high text-on-surface inline-flex items-center"
          >
            <Upload className="w-4 h-4" />
            导入模板
          </button>
          <button
            onClick={handleExportFlows}
            className="ui-btn ui-btn-sm bg-surface-container-high text-on-surface inline-flex items-center"
          >
            <Download className="w-4 h-4" />
            导出模板
          </button>
          <button
            onClick={() => {
              if (!canReset) return
              resetDefaultFlows()
              setActiveFlow(null)
              addToast('课堂流程模板已恢复默认', 'info')
              appendAudit('reset-default', '恢复默认流程模板')
            }}
            className="ui-btn ui-btn-sm bg-surface-container-high text-on-surface"
            disabled={!canReset}
          >
            恢复默认
          </button>
          <div className="ml-auto min-w-[180px]">
            <div className="text-[11px] text-on-surface-variant mb-1">同名导入策略</div>
            <ListDropdown
              value={importStrategy}
              options={[
                { value: 'rename', label: '重命名合并' },
                { value: 'overwrite-name', label: '覆盖同名' }
              ]}
              onChange={(next) =>
                setImportStrategy(next === 'overwrite-name' ? 'overwrite-name' : 'rename')
              }
            />
          </div>
        </div>

        {flows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/40 p-6 text-sm text-on-surface-variant text-center">
            暂无课堂流程模板，请先导入或恢复默认模板
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {flows.map((flow, index) => (
              <div
                key={flow.id}
                onDragOver={(event) => {
                  if (!draggingStepId) return
                  event.preventDefault()
                }}
                onDrop={() => {
                  if (!draggingStepId || !editingFlowId || editingFlowId === flow.id) return
                  const sourceStep = draftSteps.find((step) => step.id === draggingStepId)
                  if (!sourceStep) return
                  updateFlow(flow.id, {
                    steps: [
                      ...flow.steps,
                      {
                        ...sourceStep,
                        id: `step-${crypto.randomUUID()}`
                      }
                    ]
                  })
                  setDraggingStepId(null)
                  addToast(`已复制步骤到流程「${flow.name}」`, 'success')
                  appendAudit('cross-copy', `跨流程复制步骤到 ${flow.name}`)
                }}
                className="rounded-2xl border border-outline-variant/30 bg-surface-container-high/40 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-on-surface">{flow.name}</div>
                    <div className="text-xs text-on-surface-variant mt-1">
                      步骤 {flow.steps.length} 条 · 预设：
                      {flow.steps.map((step) => step.activityPreset).join(' / ')}
                    </div>
                  </div>
                  <div className="ui-stack-row">
                    <button
                      onClick={() => {
                        setActiveFlow(flow.id)
                        appendAudit('activate', `启用流程 ${flow.name}`)
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground cursor-pointer inline-flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      启用
                    </button>
                    <button
                      onClick={() =>
                        showPrompt('重命名流程', '请输入新的流程名称', flow.name, (name) => {
                          updateFlow(flow.id, { name: name.trim() })
                          addToast('流程已重命名', 'success')
                          appendAudit('rename', `流程重命名为 ${name.trim()}`)
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-surface-container text-on-surface cursor-pointer"
                    >
                      重命名
                    </button>
                    <button
                      onClick={() => startStepEditing(flow)}
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-surface-container text-on-surface cursor-pointer"
                    >
                      编辑步骤
                    </button>
                    <button
                      onClick={() => {
                        duplicateFlow(flow.id)
                        addToast('流程已复制', 'success')
                        appendAudit('duplicate', `复制流程 ${flow.name}`)
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-surface-container text-on-surface cursor-pointer inline-flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      复制
                    </button>
                    <button
                      onClick={() => {
                        moveFlow(flow.id, 'up')
                        appendAudit('move', `流程上移 ${flow.name}`)
                      }}
                      disabled={index === 0}
                      className="px-2 py-1.5 rounded-lg text-xs bg-surface-container text-on-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="上移"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        moveFlow(flow.id, 'down')
                        appendAudit('move', `流程下移 ${flow.name}`)
                      }}
                      disabled={index === flows.length - 1}
                      className="px-2 py-1.5 rounded-lg text-xs bg-surface-container text-on-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="下移"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        showConfirm('删除流程', `确认删除流程「${flow.name}」吗？`, () => {
                          removeFlow(flow.id)
                          addToast('流程已删除', 'success')
                          appendAudit('delete', `删除流程 ${flow.name}`)
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg text-xs text-destructive bg-destructive/10 cursor-pointer inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      删除
                    </button>
                  </div>
                </div>
                {activeFlowId === flow.id && (
                  <div className="mt-2 text-[11px] text-primary">当前启用</div>
                )}

                {editingFlowId === flow.id && (
                  <div className="mt-3 rounded-xl border border-outline-variant/30 bg-surface-container p-3 space-y-2.5">
                    <div className="ui-stack-row justify-between">
                      <div className="text-xs text-on-surface-variant">可视化编辑步骤</div>
                      <div className="ui-stack-row">
                        <button
                          onClick={addDraftStep}
                          className="px-2.5 py-1 rounded-lg text-xs bg-surface-container-high text-on-surface cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          添加步骤
                        </button>
                        <button
                          onClick={pasteCopiedStep}
                          disabled={!copiedStep}
                          className="px-2.5 py-1 rounded-lg text-xs bg-surface-container-high text-on-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          粘贴步骤
                        </button>
                        <button
                          onClick={() => {
                            setEditingFlowId(null)
                            setDraftSteps([])
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs bg-surface-container-high text-on-surface cursor-pointer inline-flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          取消
                        </button>
                        <button
                          onClick={() => saveStepEditing(flow.id)}
                          className="px-2.5 py-1 rounded-lg text-xs bg-primary text-primary-foreground cursor-pointer"
                        >
                          保存步骤
                        </button>
                      </div>
                    </div>

                    {draftSteps.map((step, stepIndex) => (
                      <div
                        key={step.id}
                        draggable
                        onDragStart={() => setDraggingStepId(step.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.stopPropagation()
                          if (!draggingStepId) return
                          moveDraftStepTo(draggingStepId, step.id)
                          setDraggingStepId(null)
                        }}
                        onDragEnd={() => setDraggingStepId(null)}
                        className={
                          draggingStepId === step.id
                            ? 'rounded-lg border border-primary/50 p-2.5 space-y-2 bg-primary/5'
                            : 'rounded-lg border border-outline-variant/25 p-2.5 space-y-2'
                        }
                      >
                        <div className="ui-stack-row">
                          <span className="text-[11px] text-on-surface-variant">
                            步骤 {stepIndex + 1}
                          </span>
                          <button
                            onClick={() => moveDraftStep(step.id, 'up')}
                            disabled={stepIndex === 0}
                            className="ml-auto px-2 py-1 rounded-md text-[11px] bg-surface-container-high cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            上移
                          </button>
                          <button
                            onClick={() => moveDraftStep(step.id, 'down')}
                            disabled={stepIndex === draftSteps.length - 1}
                            className="px-2 py-1 rounded-md text-[11px] bg-surface-container-high cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            下移
                          </button>
                          <button
                            onClick={() => removeDraftStep(step.id)}
                            className="px-2 py-1 rounded-md text-[11px] bg-destructive/10 text-destructive cursor-pointer"
                          >
                            删除
                          </button>
                          <button
                            onClick={() => {
                              setCopiedStep({
                                ...step,
                                id: `step-${crypto.randomUUID()}`
                              })
                              addToast('步骤已复制，可切换流程后粘贴', 'info')
                            }}
                            className="px-2 py-1 rounded-md text-[11px] bg-surface-container-high text-on-surface cursor-pointer"
                          >
                            复制步骤
                          </button>
                        </div>
                        <input
                          value={step.title}
                          onChange={(e) => updateDraftStep(step.id, { title: e.target.value })}
                          placeholder="步骤标题"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs text-on-surface"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <ListDropdown
                            value={step.activityPreset}
                            options={STEP_PRESET_OPTIONS}
                            onChange={(next) =>
                              updateDraftStep(step.id, {
                                activityPreset: isActivityPreset(next) ? next : 'quick-pick'
                              })
                            }
                          />
                          <input
                            value={step.notes || ''}
                            onChange={(e) => updateDraftStep(step.id, { notes: e.target.value })}
                            placeholder="备注（可选）"
                            className="px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs text-on-surface"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-on-surface-variant">流程模板操作日志（最近 20 条）</div>
            <div className="ui-stack-row">
              <button
                onClick={exportAuditLogs}
                className="px-2 py-1 rounded-md text-[11px] bg-surface-container-high text-on-surface cursor-pointer inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                导出日志
              </button>
              <button
                onClick={() => setAuditItems([])}
                className="px-2 py-1 rounded-md text-[11px] bg-surface-container-high text-on-surface cursor-pointer"
              >
                清空日志
              </button>
            </div>
          </div>
          <div className="mb-2 space-y-2">
            <div className="text-[11px] text-on-surface-variant">动作筛选</div>
            <ListDropdown
              value={auditActionFilter}
              options={AUDIT_ACTION_OPTIONS}
              onChange={setAuditActionFilter}
              panelClassName="absolute z-30 mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container elevation-2 max-h-44 overflow-y-auto custom-scrollbar"
            />
            <div className="text-[11px] text-on-surface-variant">时间范围</div>
            <ListDropdown
              value={auditRange}
              options={AUDIT_RANGE_OPTIONS}
              onChange={(next) => setAuditRange(next as AuditRange)}
              panelClassName="absolute z-30 mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container elevation-2 max-h-44 overflow-y-auto custom-scrollbar"
            />
          </div>
          {visibleAuditItems.length === 0 ? (
            <div className="text-xs text-on-surface-variant">暂无操作日志</div>
          ) : (
            <div className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar">
              {visibleAuditItems.slice(0, 20).map((item) => (
                <div key={item.id} className="text-[11px] text-on-surface-variant">
                  <span className="text-on-surface mr-1">[{item.action}]</span>
                  {item.detail}
                  <span className="ml-1 opacity-70">{new Date(item.time).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
