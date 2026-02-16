import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type CSSProperties,
  type ReactElement
} from 'react'
import {
  Database,
  Save,
  History,
  Trash2,
  Power,
  Stethoscope,
  ChevronDown,
  CalendarDays,
  X,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  RefreshCw,
  ArrowUpFromLine,
  ArrowDownToLine,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSettingsStore } from '../../store/settingsStore'
import { useToastStore } from '../../store/toastStore'
import { useConfirmStore } from '../../store/confirmStore'
import { useDiagnosticsStore } from '../../store/diagnosticsStore'
import { MD3Switch } from './MD3Switch'
import { UpdateChecker } from './UpdateChecker'
import { ShortcutRecorder, formatAccelerator } from './ShortcutRecorder'

type RestorePointInfo = { name: string; path: string; createdAt: number }
type FlowAuditItem = { id: string; time: string; action: string; detail: string }
type DiagnosticEventFilter = 'all' | 'error' | 'warn' | 'flow-audit'

function ListDropdown({
  value,
  options,
  onChange,
  className,
  fixedPanel = true
}: {
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
  className?: string
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
      const panelMaxHeight = 160
      const desiredTop = rect.bottom + 6
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

  const selected = options.find((option) => option.value === value)

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container text-xs text-on-surface cursor-pointer"
      >
        <span className="truncate">{selected?.label || '请选择'}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          style={fixedPanel ? panelStyle : undefined}
          className="absolute z-40 mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container elevation-2 max-h-40 overflow-y-auto custom-scrollbar"
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

function formatRestoreImpactSummary(
  point: RestorePointInfo,
  currentLoadedAt: string | null
): string {
  const pointTime = new Date(point.createdAt)
  const currentTime = currentLoadedAt ? new Date(currentLoadedAt) : null
  const ageText = currentTime
    ? pointTime > currentTime
      ? '该快照时间晚于当前已加载数据（可能包含更新）'
      : '该快照时间早于当前已加载数据（可能回滚近期变更）'
    : '未获取当前数据时间戳，将执行全量覆盖恢复'

  return [
    `将恢复到：${point.name}`,
    `快照时间：${pointTime.toLocaleString()}`,
    ageText,
    '覆盖范围：班级与学生、历史记录、设置与规则模板、课堂流程模板',
    '建议：恢复前先创建一个新的恢复点，便于回滚'
  ].join('\n')
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function DatePicker({
  value,
  onChange,
  disabled,
  placeholder
}: {
  value: string
  onChange: (date: string) => void
  disabled?: boolean
  placeholder?: string
}): ReactElement {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [popupStyle, setPopupStyle] = useState<CSSProperties>({})

  // Parse value or default to current month
  const parsed = value ? new Date(value + 'T00:00:00') : null
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() || new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? new Date().getMonth())

  const handleClickOutside = useCallback((e: MouseEvent): void => {
    if (
      ref.current &&
      !ref.current.contains(e.target as Node) &&
      btnRef.current &&
      !btnRef.current.contains(e.target as Node)
    ) {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      // Calculate position relative to viewport
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const panelHeight = 340
        if (spaceBelow < panelHeight) {
          // Open upward
          setPopupStyle({
            position: 'fixed',
            left: rect.left,
            bottom: window.innerHeight - rect.top + 4,
            zIndex: 9999
          })
        } else {
          // Open downward
          setPopupStyle({ position: 'fixed', left: rect.left, top: rect.bottom + 4, zIndex: 9999 })
        }
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, handleClickOutside])

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const prevMonth = (): void => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else setViewMonth(viewMonth - 1)
  }
  const nextMonth = (): void => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else setViewMonth(viewMonth + 1)
  }

  const selectDay = (day: number): void => {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${viewYear}-${m}-${d}`)
    setOpen(false)
  }

  const formatDisplay = (v: string): string => {
    if (!v) return ''
    const [y, m, d] = v.split('-')
    return `${y} 年 ${parseInt(m)} 月 ${parseInt(d)} 日`
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-xl text-sm bg-surface-container-low transition-colors text-left',
          disabled
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:bg-surface-container-high/60 cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary'
        )}
      >
        <CalendarDays className="w-4 h-4 text-on-surface-variant shrink-0" />
        {value ? (
          <span className="text-on-surface">{formatDisplay(value)}</span>
        ) : (
          <span className="text-on-surface-variant">{placeholder || '选择日期'}</span>
        )}
      </button>

      {open && (
        <div
          ref={ref}
          style={popupStyle}
          className="bg-surface-container rounded-2xl elevation-3 border border-outline-variant/30 p-3 w-[280px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={prevMonth}
              className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-on-surface">
              {viewYear} 年 {viewMonth + 1} 月
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="text-center text-[10px] text-on-surface-variant font-medium py-1"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const m = String(viewMonth + 1).padStart(2, '0')
              const d = String(day).padStart(2, '0')
              const dateStr = `${viewYear}-${m}-${d}`
              const isSelected = dateStr === value
              const isToday = dateStr === new Date().toISOString().slice(0, 10)
              return (
                <button
                  key={day}
                  onClick={() => selectDay(day)}
                  className={cn(
                    'w-8 h-8 mx-auto rounded-full text-xs font-medium flex items-center justify-center transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : isToday
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : 'text-on-surface hover:bg-surface-container-high'
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Clear */}
          {value && (
            <button
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="mt-2 w-full text-center text-xs text-destructive hover:text-destructive/80 cursor-pointer py-1"
            >
              清除日期
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function DataSection(): ReactElement {
  const {
    maxHistoryRecords,
    setMaxHistoryRecords,
    syncEnabled,
    toggleSyncEnabled,
    syncFolder,
    setSyncFolder,
    semester,
    setSemester,
    shortcutKey,
    setShortcutKey,
    resetOnboarding
  } = useSettingsStore()
  const addToast = useToastStore((state) => state.addToast)
  const showConfirm = useConfirmStore((state) => state.show)
  const showPrompt = useConfirmStore((state) => state.showPrompt)
  const {
    loading: diagnosticsLoading,
    migrationState,
    healthReport,
    events,
    lastLoadedAt,
    loadDiagnostics
  } = useDiagnosticsStore()
  const [autoLaunch, setAutoLaunchState] = useState(false)
  const [syncExpanded, setSyncExpanded] = useState(false)
  const [diagExpanded, setDiagExpanded] = useState(false)
  const [syncing, setSyncing] = useState<'push' | 'pull' | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [lastSyncStatus, setLastSyncStatus] = useState<'success' | 'error' | null>(null)
  const [lastSyncMessage, setLastSyncMessage] = useState<string>('')
  const [syncLocalFingerprint, setSyncLocalFingerprint] = useState<string>('')
  const [syncRemoteFingerprint, setSyncRemoteFingerprint] = useState<string>('')
  const [restoringPoint, setRestoringPoint] = useState(false)
  const [autoBackupBeforeRestore, setAutoBackupBeforeRestore] = useState(true)
  const [dangerExpanded, setDangerExpanded] = useState(false)
  const [restorePoints, setRestorePoints] = useState<RestorePointInfo[]>([])
  const [loadingRestorePoints, setLoadingRestorePoints] = useState(false)
  const [restorePointSearch, setRestorePointSearch] = useState('')
  const [restorePointSort, setRestorePointSort] = useState<'newest' | 'oldest' | 'name'>('newest')
  const [restoreKeepCount, setRestoreKeepCount] = useState(() => {
    const raw = localStorage.getItem('restore-point-keep-count')
    return raw && /^\d+$/.test(raw) ? raw : '20'
  })
  const [restoreKeepDays, setRestoreKeepDays] = useState(() => {
    const raw = localStorage.getItem('restore-point-keep-days')
    return raw && /^\d+$/.test(raw) ? raw : '30'
  })
  const [autoPruneOnStartup, setAutoPruneOnStartup] = useState(() => {
    return localStorage.getItem('restore-point-auto-prune-on-startup') === '1'
  })
  const [autoPruneMode, setAutoPruneMode] = useState<'count' | 'days'>(() => {
    const raw = localStorage.getItem('restore-point-auto-prune-mode')
    return raw === 'days' ? 'days' : 'count'
  })
  const [diagnosticEventFilter, setDiagnosticEventFilter] = useState<DiagnosticEventFilter>('all')
  const hasAutoPrunedRef = useRef(false)
  const lastAccordionToggleAtRef = useRef(0)

  const safeToggleAccordion = useCallback(
    (setter: (updater: (prev: boolean) => boolean) => void) => {
      const now = Date.now()
      if (now - lastAccordionToggleAtRef.current < 180) {
        return
      }
      lastAccordionToggleAtRef.current = now
      setter((prev) => !prev)
    },
    []
  )

  useEffect((): void => {
    window.electronAPI.getAutoLaunch().then(setAutoLaunchState)
    loadDiagnostics()
  }, [loadDiagnostics])

  const loadRestorePoints = useCallback(async (): Promise<void> => {
    setLoadingRestorePoints(true)
    try {
      const points = await window.electronAPI.listRestorePoints()
      setRestorePoints(points)
    } finally {
      setLoadingRestorePoints(false)
    }
  }, [])

  useEffect(() => {
    if (!dangerExpanded) return
    loadRestorePoints()
  }, [dangerExpanded, loadRestorePoints])

  useEffect(() => {
    localStorage.setItem('restore-point-keep-count', restoreKeepCount)
  }, [restoreKeepCount])

  useEffect(() => {
    localStorage.setItem('restore-point-keep-days', restoreKeepDays)
  }, [restoreKeepDays])

  useEffect(() => {
    localStorage.setItem('restore-point-auto-prune-on-startup', autoPruneOnStartup ? '1' : '0')
  }, [autoPruneOnStartup])

  useEffect(() => {
    localStorage.setItem('restore-point-auto-prune-mode', autoPruneMode)
  }, [autoPruneMode])

  useEffect(() => {
    if (hasAutoPrunedRef.current || !autoPruneOnStartup) return
    hasAutoPrunedRef.current = true
    if (autoPruneMode === 'days') {
      const days = Number(restoreKeepDays)
      if (!Number.isInteger(days) || days < 1 || days > 3650) return
      window.electronAPI
        .deleteRestorePointsOlderThanDays(days)
        .then((result) => {
          if (result.ok && result.deleted > 0) {
            addToast(`启动自动清理（按天）：已删除 ${result.deleted} 条旧恢复点`, 'info')
          }
        })
        .catch(() => {
          addToast('启动自动清理恢复点失败', 'error')
        })
      return
    }

    const keep = Number(restoreKeepCount)
    if (!Number.isInteger(keep) || keep < 1 || keep > 500) return
    window.electronAPI
      .deleteOldRestorePointsKeep(keep)
      .then((result) => {
        if (result.ok && result.deleted > 0) {
          addToast(`启动自动清理（按数量）：已删除 ${result.deleted} 条旧恢复点`, 'info')
        }
      })
      .catch(() => {
        addToast('启动自动清理恢复点失败', 'error')
      })
  }, [autoPruneOnStartup, autoPruneMode, restoreKeepCount, restoreKeepDays, addToast])

  const visibleRestorePoints = useMemo(() => {
    const query = restorePointSearch.trim().toLowerCase()
    const filtered = restorePoints.filter((point) => {
      if (!query) return true
      return point.name.toLowerCase().includes(query)
    })
    if (restorePointSort === 'name') {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    }
    if (restorePointSort === 'oldest') {
      return [...filtered].sort((a, b) => a.createdAt - b.createdAt)
    }
    return [...filtered].sort((a, b) => b.createdAt - a.createdAt)
  }, [restorePoints, restorePointSearch, restorePointSort])

  const flowAuditItems = useMemo((): FlowAuditItem[] => {
    if (!diagExpanded) return []
    try {
      const raw = localStorage.getItem('flow-template-audit')
      if (!raw) return []
      const parsed = JSON.parse(raw) as FlowAuditItem[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [diagExpanded])

  const visibleDiagnosticEvents = useMemo(() => {
    const base = events.slice().reverse()
    return base
      .filter((event) => {
        if (diagnosticEventFilter === 'all') return true
        if (diagnosticEventFilter === 'flow-audit') return event.code === 'FLOW_TEMPLATE_AUDIT'
        return event.level === diagnosticEventFilter
      })
      .slice(0, 10)
  }, [events, diagnosticEventFilter])

  const handleBackup = async (): Promise<void> => {
    const filePath = await window.electronAPI.saveFile({
      title: '备份数据文件',
      defaultPath: 'spotlight-backup.zip',
      filters: [{ name: 'Zip 压缩文件', extensions: ['zip'] }]
    })
    if (filePath) {
      const success = await window.electronAPI.backupData(filePath)
      addToast(success ? '备份创建成功！' : '备份失败。', success ? 'success' : 'error')
    }
  }

  const handleRestore = async (): Promise<void> => {
    showConfirm('恢复数据', '恢复数据将覆盖当前所有数据。确定要继续吗？', async () => {
      const filePath = await window.electronAPI.selectFile({
        title: '选择备份文件',
        filters: [{ name: 'Zip 压缩文件', extensions: ['zip'] }]
      })
      if (filePath) {
        const success = await window.electronAPI.restoreData(filePath)
        if (success) {
          addToast('恢复成功！应用将重新加载。', 'success')
          setTimeout(() => window.location.reload(), 1500)
        } else {
          addToast('恢复失败。', 'error')
        }
      }
    })
  }

  const handleDeleteAllData = (): void => {
    showConfirm(
      '清除所有数据',
      '此操作将删除所有班级、历史记录和设置，且不可撤销。确定要继续吗？',
      async () => {
        await window.electronAPI.writeJson('classes.json', { classes: [], currentClassId: null })
        await window.electronAPI.writeJson('history.json', [])
        await window.electronAPI.writeJson('settings.json', {})
        addToast('所有数据已清除，即将重新加载...', 'success')
        setTimeout(() => window.location.reload(), 1500)
      }
    )
  }

  const handleCreateRestorePoint = async (): Promise<void> => {
    showPrompt(
      '创建恢复点',
      '请输入恢复点名称（建议包含日期或用途）',
      '例如：周测前快照',
      async (name) => {
        const result = await window.electronAPI.createRestorePoint(name)
        addToast(
          result.ok ? `恢复点已创建：${result.name}` : result.message || '创建恢复点失败',
          result.ok ? 'success' : 'error'
        )
        if (result.ok) {
          await loadRestorePoints()
        }
      }
    )
  }

  const handleRestoreLatestPoint = async (): Promise<void> => {
    const points = await window.electronAPI.listRestorePoints()
    if (points.length === 0) {
      addToast('暂无可用恢复点', 'error')
      return
    }

    showConfirm(
      '恢复到最近恢复点',
      `将恢复到 ${points[0].name}，此操作会覆盖当前数据。`,
      async () => {
        setRestoringPoint(true)
        if (autoBackupBeforeRestore) {
          const backup = await window.electronAPI.createRestorePoint(
            `自动快照-恢复前-${new Date().toISOString().slice(0, 19)}`
          )
          if (!backup.ok) {
            setRestoringPoint(false)
            addToast(backup.message || '恢复前自动快照失败，已取消恢复', 'error')
            return
          }
        }
        const ok = await window.electronAPI.restoreFromPoint(points[0].path)
        setRestoringPoint(false)
        if (ok) {
          addToast('恢复成功，应用将重新加载', 'success')
          setTimeout(() => window.location.reload(), 1200)
        } else {
          addToast('恢复失败', 'error')
        }
      }
    )
  }

  const handleRestorePoint = (point: RestorePointInfo): void => {
    showConfirm('恢复到指定恢复点', formatRestoreImpactSummary(point, lastLoadedAt), async () => {
      setRestoringPoint(true)
      if (autoBackupBeforeRestore) {
        const backup = await window.electronAPI.createRestorePoint(
          `自动快照-恢复前-${new Date().toISOString().slice(0, 19)}`
        )
        if (!backup.ok) {
          setRestoringPoint(false)
          addToast(backup.message || '恢复前自动快照失败，已取消恢复', 'error')
          return
        }
      }
      const ok = await window.electronAPI.restoreFromPoint(point.path)
      setRestoringPoint(false)
      if (ok) {
        addToast('恢复成功，应用将重新加载', 'success')
        setTimeout(() => window.location.reload(), 1200)
      } else {
        addToast('恢复失败', 'error')
      }
    })
  }

  const handleDeleteRestorePoint = (point: RestorePointInfo): void => {
    showConfirm('删除恢复点', `确认删除恢复点「${point.name}」吗？`, async () => {
      const ok = await window.electronAPI.deleteRestorePoint(point.path)
      if (ok) {
        addToast('恢复点已删除', 'success')
        await loadRestorePoints()
      } else {
        addToast('删除恢复点失败', 'error')
      }
    })
  }

  const handlePruneRestorePoints = (): void => {
    const keep = Number(restoreKeepCount)
    if (!Number.isInteger(keep) || keep < 1 || keep > 500) {
      addToast('请输入 1-500 的保留数量', 'error')
      return
    }
    showConfirm('清理旧恢复点', `仅保留最近 ${keep} 条恢复点，确定继续吗？`, async () => {
      const result = await window.electronAPI.deleteOldRestorePointsKeep(keep)
      if (result.ok) {
        addToast(`已清理 ${result.deleted} 条旧恢复点`, 'success')
        await loadRestorePoints()
      } else {
        addToast('清理恢复点失败', 'error')
      }
    })
  }

  const handlePruneRestorePointsByDays = (): void => {
    const days = Number(restoreKeepDays)
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      addToast('请输入 1-3650 的保留天数', 'error')
      return
    }
    showConfirm('按天数清理恢复点', `仅保留最近 ${days} 天的恢复点，确定继续吗？`, async () => {
      const result = await window.electronAPI.deleteRestorePointsOlderThanDays(days)
      if (result.ok) {
        addToast(`已清理 ${result.deleted} 条过期恢复点`, 'success')
        await loadRestorePoints()
      } else {
        addToast('按天数清理恢复点失败', 'error')
      }
    })
  }

  const handleChooseSyncFolder = async (): Promise<void> => {
    const folder = await window.electronAPI.selectFolder()
    if (!folder) return
    setSyncFolder(folder)
    addToast('已设置同步目录', 'success')
  }

  const handleSyncToFolder = async (): Promise<void> => {
    if (!syncFolder) {
      addToast('请先选择同步目录', 'error')
      return
    }
    setSyncing('push')
    const result = await window.electronAPI.syncDataToFolderV2(syncFolder)
    setSyncing(null)
    setLastSyncStatus(result.ok ? 'success' : 'error')
    setLastSyncMessage(result.message)
    setSyncLocalFingerprint(result.localFingerprint || '')
    setSyncRemoteFingerprint(result.remoteFingerprint || '')
    if (result.ok) setLastSyncTime(new Date().toLocaleString())
    addToast(result.message, result.ok ? 'success' : 'error')
  }

  const handleSyncFromFolder = async (force = false): Promise<void> => {
    if (!syncFolder) {
      addToast('请先选择同步目录', 'error')
      return
    }
    showConfirm(
      '拉取数据',
      force ? '将强制覆盖本地数据，确定继续吗？' : '从共享目录拉取将覆盖本地数据，确定继续吗？',
      async () => {
        setSyncing('pull')
        const result = await window.electronAPI.syncDataFromFolderV2(syncFolder, force)
        setSyncing(null)
        setLastSyncStatus(result.ok ? 'success' : 'error')
        setLastSyncMessage(result.message)
        setSyncLocalFingerprint(result.localFingerprint || '')
        setSyncRemoteFingerprint(result.remoteFingerprint || '')
        if (result.ok) {
          setLastSyncTime(new Date().toLocaleString())
          addToast('已从共享目录拉取，应用将重新加载', 'success')
          setTimeout(() => window.location.reload(), 1200)
        } else {
          if (result.code === 'SYNC_CONFLICT' && !force) {
            showConfirm(
              '检测到同步冲突',
              '本地与远端都发生了变化。是否强制拉取远端覆盖本地？',
              async () => {
                await handleSyncFromFolder(true)
              }
            )
          } else {
            addToast(result.message, 'error')
          }
        }
      }
    )
  }

  const handleCheckSyncStatus = async (): Promise<void> => {
    if (!syncFolder) {
      addToast('请先选择同步目录', 'error')
      return
    }
    const result = await window.electronAPI.getSyncStatus(syncFolder)
    setLastSyncStatus(result.ok ? 'success' : 'error')
    setLastSyncMessage(result.message)
    setSyncLocalFingerprint(result.localFingerprint || '')
    setSyncRemoteFingerprint(result.remoteFingerprint || '')
    addToast(result.message, result.ok ? 'success' : 'error')
  }

  const handleToggleAutoLaunch = async (): Promise<void> => {
    const next = !autoLaunch
    const ok = await window.electronAPI.setAutoLaunch(next)
    if (ok) {
      setAutoLaunchState(next)
      addToast(next ? '已启用开机自启动' : '已关闭开机自启动', 'success')
    } else {
      addToast('设置失败', 'error')
    }
  }

  const handleSetShortcutKey = async (key: string): Promise<boolean> => {
    const success = await setShortcutKey(key)
    if (!success) {
      addToast('快捷键注册失败，可能已被系统或其他应用占用。', 'error')
      return false
    }
    if (key) {
      addToast(`快捷键已设置为 ${formatAccelerator(key)}`, 'success')
    } else {
      addToast('已清除全局快捷键', 'success')
    }
    return true
  }

  return (
    <>
      {/* Data Management */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
          <Database className="w-5 h-5 text-primary" />
          数据管理
        </h3>
        <div className="bg-surface-container rounded-[28px] overflow-hidden">
          <div className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 text-primary rounded-full">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-on-surface">历史记录上限</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">最多保留的历史记录条数</p>
              </div>
            </div>
            <input
              type="number"
              min="100"
              max="10000"
              step="100"
              value={maxHistoryRecords}
              onChange={(e) =>
                setMaxHistoryRecords(Math.max(100, parseInt(e.target.value) || 1000))
              }
              className="ui-number w-24 rounded-full text-sm text-center px-3"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mt-4">
          <button
            onClick={handleBackup}
            className="flex flex-col items-center justify-center p-6 border border-outline-variant rounded-[28px] hover:bg-surface-container-high transition-all duration-200 group cursor-pointer"
          >
            <div className="p-3 bg-primary/5 text-primary rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Save className="w-6 h-6" />
            </div>
            <span className="font-medium mb-1 text-on-surface">备份数据</span>
            <span className="text-xs text-on-surface-variant text-center">
              导出所有设置和记录为 ZIP 文件
            </span>
          </button>
          <button
            onClick={handleCreateRestorePoint}
            className="flex flex-col items-center justify-center p-6 border border-outline-variant rounded-[28px] hover:bg-surface-container-high transition-all duration-200 group cursor-pointer"
          >
            <div className="p-3 bg-primary/5 text-primary rounded-full mb-3 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="font-medium mb-1 text-on-surface">创建恢复点</span>
            <span className="text-xs text-on-surface-variant text-center">
              为设置和历史生成可回滚快照
            </span>
          </button>
        </div>

        <div className="mt-4 rounded-[20px] border border-destructive/30 bg-destructive/5 overflow-visible">
          <button
            onClick={() => safeToggleAccordion(setDangerExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-destructive/10 transition-colors"
          >
            <div>
              <div className="text-sm font-semibold text-destructive">危险操作</div>
              <div className="text-xs text-on-surface-variant mt-0.5">
                恢复整库、回滚恢复点、清空数据
              </div>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-destructive transition-transform',
                dangerExpanded && 'rotate-180'
              )}
            />
          </button>

          {dangerExpanded && (
            <div className="overflow-visible border-t border-destructive/20">
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={handleRestore}
                  className="flex flex-col items-center justify-center p-4 border border-destructive/30 rounded-2xl hover:bg-destructive/10 transition-all duration-200 group cursor-pointer"
                >
                  <div className="p-2.5 bg-destructive/10 text-destructive rounded-full mb-2 group-hover:scale-110 transition-transform">
                    <Database className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-destructive text-sm">恢复数据</span>
                  <span className="text-[11px] text-on-surface-variant text-center mt-1">
                    从备份覆盖当前数据
                  </span>
                </button>

                <button
                  disabled={restoringPoint}
                  onClick={handleRestoreLatestPoint}
                  className="flex flex-col items-center justify-center p-4 border border-destructive/30 rounded-2xl hover:bg-destructive/10 transition-all duration-200 group cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="p-2.5 bg-destructive/10 text-destructive rounded-full mb-2 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-destructive text-sm">恢复最近恢复点</span>
                  <span className="text-[11px] text-on-surface-variant text-center mt-1">
                    {restoringPoint ? '恢复中...' : '回滚到最近快照'}
                  </span>
                </button>

                <button
                  onClick={handleDeleteAllData}
                  className="flex flex-col items-center justify-center p-4 border border-destructive/30 rounded-2xl hover:bg-destructive/10 transition-all duration-200 group cursor-pointer"
                >
                  <div className="p-2.5 bg-destructive/10 text-destructive rounded-full mb-2 group-hover:scale-110 transition-transform">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-destructive text-sm">清除数据</span>
                  <span className="text-[11px] text-on-surface-variant text-center mt-1">
                    删除所有班级/历史/设置
                  </span>
                </button>
              </div>

              <div className="px-4 pb-4">
                <div className="rounded-2xl border border-destructive/20 bg-surface-container-low/60 p-3">
                  <label className="mb-2.5 flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoBackupBeforeRestore}
                      onChange={(event) => setAutoBackupBeforeRestore(event.target.checked)}
                      className="ui-check"
                    />
                    恢复前自动创建当前快照（建议开启）
                  </label>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-on-surface-variant">恢复点列表（最近 10 条）</div>
                    <button
                      onClick={loadRestorePoints}
                      className="px-2.5 py-1 rounded-full text-[11px] bg-surface-container-high text-on-surface cursor-pointer"
                    >
                      {loadingRestorePoints ? '刷新中...' : '刷新'}
                    </button>
                  </div>
                  <div className="mb-2 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                    <input
                      value={restorePointSearch}
                      onChange={(event) => setRestorePointSearch(event.target.value)}
                      placeholder="搜索恢复点名称"
                      className="px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container text-xs text-on-surface"
                    />
                    <ListDropdown
                      value={restorePointSort}
                      onChange={(next) =>
                        setRestorePointSort(
                          next === 'oldest' ? 'oldest' : next === 'name' ? 'name' : 'newest'
                        )
                      }
                      options={[
                        { value: 'newest', label: '按时间（新到旧）' },
                        { value: 'oldest', label: '按时间（旧到新）' },
                        { value: 'name', label: '按名称' }
                      ]}
                    />
                  </div>
                  <div className="mb-2 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                    <input
                      value={restoreKeepCount}
                      onChange={(event) =>
                        setRestoreKeepCount(event.target.value.replace(/[^0-9]/g, ''))
                      }
                      placeholder="保留数量（1-500）"
                      className="px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container text-xs text-on-surface"
                    />
                    <button
                      onClick={handlePruneRestorePoints}
                      disabled={restoringPoint || loadingRestorePoints}
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-surface-container-high text-on-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      清理旧恢复点
                    </button>
                  </div>
                  <div className="mb-2 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                    <input
                      value={restoreKeepDays}
                      onChange={(event) =>
                        setRestoreKeepDays(event.target.value.replace(/[^0-9]/g, ''))
                      }
                      placeholder="按天保留（1-3650）"
                      className="px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container text-xs text-on-surface"
                    />
                    <button
                      onClick={handlePruneRestorePointsByDays}
                      disabled={restoringPoint || loadingRestorePoints}
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-surface-container-high text-on-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      按天清理
                    </button>
                  </div>
                  <label className="mb-2 flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoPruneOnStartup}
                      onChange={(event) => setAutoPruneOnStartup(event.target.checked)}
                      className="ui-check"
                    />
                    启动时自动清理旧恢复点
                  </label>
                  {autoPruneOnStartup && (
                    <div className="mb-2 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-2 items-center">
                      <span className="text-xs text-on-surface-variant">自动清理策略</span>
                      <ListDropdown
                        value={autoPruneMode}
                        onChange={(next) => setAutoPruneMode(next === 'days' ? 'days' : 'count')}
                        options={[
                          { value: 'count', label: '按保留数量' },
                          { value: 'days', label: '按保留天数' }
                        ]}
                      />
                    </div>
                  )}
                  {visibleRestorePoints.length === 0 ? (
                    <div className="text-xs text-on-surface-variant py-2">暂无恢复点</div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                      {visibleRestorePoints.slice(0, 10).map((point) => (
                        <div
                          key={point.path}
                          className="flex items-center justify-between gap-2 rounded-xl bg-surface-container px-2.5 py-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs text-on-surface truncate">{point.name}</div>
                            <div className="text-[10px] text-on-surface-variant">
                              {new Date(point.createdAt).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-on-surface-variant/80 mt-0.5">
                              {lastLoadedAt && new Date(point.createdAt) > new Date(lastLoadedAt)
                                ? '快照晚于当前数据（可用于同步另一设备变更）'
                                : '快照早于当前数据（将回滚近期变更）'}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRestorePoint(point)}
                            disabled={restoringPoint}
                            className="px-2.5 py-1 rounded-lg text-[11px] text-destructive bg-destructive/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            恢复
                          </button>
                          <button
                            onClick={() => handleDeleteRestorePoint(point)}
                            disabled={restoringPoint}
                            className="px-2 py-1 rounded-lg text-[11px] text-on-surface-variant bg-surface-container-high cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            删除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Semester Setting */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
          <CalendarDays className="w-5 h-5 text-primary" />
          学期设置
        </h3>
        <div className="bg-surface-container rounded-[28px] overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 text-primary rounded-full">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-on-surface">当前学期</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {semester
                    ? `${semester.name}（${semester.startDate} 至 ${semester.endDate || '至今'}）`
                    : '未设置，统计页将自动按月份推断学期范围'}
                </p>
              </div>
              {semester && (
                <button
                  onClick={() => setSemester(null)}
                  className="p-1.5 rounded-full hover:bg-destructive/10 text-on-surface-variant hover:text-destructive transition-colors cursor-pointer"
                  title="清除学期设置"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="pl-14 space-y-3">
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">学期名称</label>
                <input
                  type="text"
                  placeholder="例如：2025 年春季学期"
                  value={semester?.name || ''}
                  onChange={(e) => {
                    const name = e.target.value
                    setSemester(
                      name
                        ? {
                            name,
                            startDate: semester?.startDate || '',
                            endDate: semester?.endDate || ''
                          }
                        : null
                    )
                  }}
                  className="w-full px-3 py-1.5 border border-outline-variant rounded-full text-sm bg-surface-container-low focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-on-surface"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-on-surface-variant block mb-1">开始日期</label>
                  <DatePicker
                    value={semester?.startDate || ''}
                    onChange={(date) => {
                      if (!semester?.name) return
                      setSemester({ ...semester, startDate: date })
                    }}
                    disabled={!semester?.name}
                    placeholder="选择开始日期"
                  />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant block mb-1">结束日期</label>
                  <DatePicker
                    value={semester?.endDate || ''}
                    onChange={(date) => {
                      if (!semester?.name) return
                      setSemester({ ...semester, endDate: date })
                    }}
                    disabled={!semester?.name}
                    placeholder="选择结束日期"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-device Sync */}
      <section className="space-y-4">
        <button
          type="button"
          className="w-full flex items-center justify-between cursor-pointer"
          onClick={() => safeToggleAccordion(setSyncExpanded)}
        >
          <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
            <RefreshCw className="w-5 h-5 text-primary" />
            多终端同步
          </h3>
          <span className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-all cursor-pointer">
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                syncExpanded && 'rotate-180'
              )}
            />
          </span>
        </button>
        {syncExpanded && (
          <div className="overflow-hidden">
            <div className="bg-surface-container rounded-[28px] overflow-hidden">
              {/* Enable toggle */}
              <div
                className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors cursor-pointer select-none"
                onClick={toggleSyncEnabled}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/10 text-primary rounded-full">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-on-surface">启用目录同步</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      通过共享文件夹（如网盘、NAS）在多台设备间同步数据
                    </p>
                  </div>
                </div>
                <div
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <MD3Switch checked={syncEnabled} onClick={toggleSyncEnabled} label="目录同步" />
                </div>
              </div>

              {/* Sync folder */}
              <div className="px-5 pb-4 border-t border-outline-variant/20 pt-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleChooseSyncFolder}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-outline-variant rounded-full text-sm font-medium text-on-surface cursor-pointer hover:bg-surface-container-high transition-colors shrink-0"
                  >
                    <FolderOpen className="w-4 h-4" />
                    选择目录
                  </button>
                  <div className="flex-1 min-w-0">
                    {syncFolder ? (
                      <p className="text-xs text-on-surface truncate" title={syncFolder}>
                        {syncFolder}
                      </p>
                    ) : (
                      <p className="text-xs text-on-surface-variant">未选择同步目录</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sync status bar */}
              {lastSyncTime && (
                <div className="px-5 pb-3 flex items-center gap-2 text-xs">
                  {lastSyncStatus === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                  )}
                  <span className="text-on-surface-variant">上次同步：{lastSyncTime}</span>
                </div>
              )}
              {lastSyncMessage && (
                <div className="px-5 pb-3 text-xs text-on-surface-variant">
                  状态：{lastSyncMessage}
                </div>
              )}
              {(syncLocalFingerprint || syncRemoteFingerprint) && (
                <div className="px-5 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl bg-surface-container-high/40 p-2">
                    <div className="text-on-surface-variant">本地指纹</div>
                    <div className="font-mono text-on-surface mt-0.5 break-all">
                      {syncLocalFingerprint || '-'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-surface-container-high/40 p-2">
                    <div className="text-on-surface-variant">远端指纹</div>
                    <div className="font-mono text-on-surface mt-0.5 break-all">
                      {syncRemoteFingerprint || '-'}
                    </div>
                  </div>
                  <div className="sm:col-span-2 text-on-surface-variant">
                    对比：
                    {syncLocalFingerprint && syncRemoteFingerprint
                      ? syncLocalFingerprint === syncRemoteFingerprint
                        ? '本地与远端一致'
                        : '检测到差异，拉取前建议先确认并备份'
                      : '等待完整指纹信息'}
                  </div>
                </div>
              )}

              {/* Push / Pull buttons */}
              <div className="grid grid-cols-2 gap-3 px-5 pb-5">
                <button
                  disabled={!syncFolder || syncing !== null}
                  onClick={handleCheckSyncStatus}
                  className="col-span-2 flex items-center justify-center gap-2 p-2 rounded-xl border border-outline-variant/50 hover:bg-surface-container-high transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-on-surface-variant" />
                  <span className="text-xs text-on-surface">检查同步状态</span>
                </button>
                <button
                  disabled={!syncEnabled || !syncFolder || syncing !== null}
                  onClick={handleSyncToFolder}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-outline-variant/50 hover:bg-primary/5 hover:border-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer group"
                >
                  {syncing === 'push' ? (
                    <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <ArrowUpFromLine className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-sm font-medium text-on-surface">推送到目录</span>
                  <span className="text-[10px] text-on-surface-variant text-center leading-tight">
                    将本地数据上传到共享目录
                  </span>
                </button>
                <button
                  disabled={!syncEnabled || !syncFolder || syncing !== null}
                  onClick={() => handleSyncFromFolder(false)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-outline-variant/50 hover:bg-primary/5 hover:border-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer group"
                >
                  {syncing === 'pull' ? (
                    <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <ArrowDownToLine className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-sm font-medium text-on-surface">从目录拉取</span>
                  <span className="text-[10px] text-on-surface-variant text-center leading-tight">
                    从共享目录覆盖本地数据
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Diagnostics */}
      <section className="space-y-4">
        <button
          type="button"
          className="w-full flex items-center justify-between cursor-pointer"
          onClick={() => safeToggleAccordion(setDiagExpanded)}
        >
          <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
            <Stethoscope className="w-5 h-5 text-primary" />
            可观测性与诊断
          </h3>
          <span className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-all cursor-pointer">
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                diagExpanded && 'rotate-180'
              )}
            />
          </span>
        </button>
        {diagExpanded && (
          <div className="overflow-hidden">
            <div className="bg-surface-container rounded-[28px] overflow-hidden p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-on-surface">诊断报告</h4>
                  <p className="text-xs text-on-surface-variant">
                    最近刷新：{lastLoadedAt ? new Date(lastLoadedAt).toLocaleString() : '未加载'}
                  </p>
                </div>
                <button
                  onClick={loadDiagnostics}
                  className="px-4 py-1.5 border border-outline-variant rounded-full text-sm font-medium text-on-surface cursor-pointer hover:bg-surface-container-high transition-colors"
                >
                  {diagnosticsLoading ? '刷新中...' : '刷新'}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-surface-container-high/40 p-3">
                  <div className="text-xs text-on-surface-variant">迁移状态</div>
                  <div className="text-sm font-semibold text-on-surface mt-1">
                    {migrationState?.status || 'unknown'}
                  </div>
                </div>
                <div className="rounded-2xl bg-surface-container-high/40 p-3">
                  <div className="text-xs text-on-surface-variant">自检修复数</div>
                  <div className="text-sm font-semibold text-on-surface mt-1">
                    {healthReport?.summary?.repaired ?? '-'}
                  </div>
                </div>
                <div className="rounded-2xl bg-surface-container-high/40 p-3">
                  <div className="text-xs text-on-surface-variant">自检错误数</div>
                  <div className="text-sm font-semibold text-on-surface mt-1">
                    {healthReport?.summary?.error ?? '-'}
                  </div>
                </div>
              </div>

              {Array.isArray(healthReport?.checks || healthReport?.items) &&
                (healthReport?.checks || healthReport?.items)!.length > 0 && (
                  <div className="rounded-2xl bg-surface-container-high/30 p-3">
                    <div className="text-xs text-on-surface-variant mb-2">自检详情</div>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                      {(healthReport?.checks || healthReport?.items || [])
                        .slice(0, 8)
                        .map((check) => (
                          <div
                            key={check.name}
                            className="text-xs flex items-center justify-between gap-2"
                          >
                            <span className="text-on-surface truncate">{check.name}</span>
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-[10px]',
                                check.status === 'ok'
                                  ? 'bg-primary/10 text-primary'
                                  : check.status === 'warning'
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                    : 'bg-destructive/10 text-destructive'
                              )}
                            >
                              {check.status}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              <div className="rounded-2xl bg-surface-container-high/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-on-surface-variant">最近事件</div>
                  <div className="ui-stack-row">
                    <button
                      onClick={() => setDiagnosticEventFilter('all')}
                      className={
                        diagnosticEventFilter === 'all'
                          ? 'px-2 py-0.5 rounded-full text-[10px] bg-secondary-container text-secondary-container-foreground cursor-pointer'
                          : 'px-2 py-0.5 rounded-full text-[10px] bg-surface-container-high text-on-surface-variant cursor-pointer'
                      }
                    >
                      全部
                    </button>
                    <button
                      onClick={() => setDiagnosticEventFilter('error')}
                      className={
                        diagnosticEventFilter === 'error'
                          ? 'px-2 py-0.5 rounded-full text-[10px] bg-destructive/15 text-destructive cursor-pointer'
                          : 'px-2 py-0.5 rounded-full text-[10px] bg-surface-container-high text-on-surface-variant cursor-pointer'
                      }
                    >
                      error
                    </button>
                    <button
                      onClick={() => setDiagnosticEventFilter('warn')}
                      className={
                        diagnosticEventFilter === 'warn'
                          ? 'px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 cursor-pointer'
                          : 'px-2 py-0.5 rounded-full text-[10px] bg-surface-container-high text-on-surface-variant cursor-pointer'
                      }
                    >
                      warn
                    </button>
                    <button
                      onClick={() => setDiagnosticEventFilter('flow-audit')}
                      className={
                        diagnosticEventFilter === 'flow-audit'
                          ? 'px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary cursor-pointer'
                          : 'px-2 py-0.5 rounded-full text-[10px] bg-surface-container-high text-on-surface-variant cursor-pointer'
                      }
                    >
                      flow-audit
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                  {visibleDiagnosticEvents.length === 0 ? (
                    <div className="text-xs text-on-surface-variant">暂无诊断事件</div>
                  ) : (
                    visibleDiagnosticEvents.map((event) => (
                      <div
                        key={event.id}
                        className="text-xs flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-on-surface truncate">{event.message}</div>
                          <div className="text-on-surface-variant/80 truncate">
                            {event.category} · {event.code}
                          </div>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 px-1.5 py-0.5 rounded text-[10px]',
                            event.level === 'error'
                              ? 'bg-destructive/15 text-destructive'
                              : event.level === 'warn'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-primary/10 text-primary'
                          )}
                        >
                          {event.level}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-surface-container-high/30 p-3">
                <div className="text-xs text-on-surface-variant mb-2">
                  流程模板操作日志（诊断镜像）
                </div>
                <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                  {flowAuditItems.length === 0 ? (
                    <div className="text-xs text-on-surface-variant">暂无流程模板日志</div>
                  ) : (
                    flowAuditItems.slice(0, 10).map((item) => (
                      <div key={item.id} className="text-xs flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-on-surface truncate">{item.detail}</div>
                          <div className="text-on-surface-variant/80 truncate">flow-template</div>
                        </div>
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary">
                          {item.action}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* System */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
          <Power className="w-5 h-5 text-primary" />
          系统
        </h3>
        <div className="bg-surface-container rounded-[28px] overflow-hidden">
          <ShortcutRecorder shortcutKey={shortcutKey} setShortcutKey={handleSetShortcutKey} />

          <div className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors border-t border-outline-variant/20">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 text-primary rounded-full">
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-on-surface">新手引导</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">重新打开首次使用引导</p>
              </div>
            </div>
            <button
              onClick={() => {
                resetOnboarding()
                addToast('已重置新手引导，下次将自动显示', 'success')
              }}
              className="px-3 py-1.5 rounded-full text-xs bg-secondary-container text-secondary-container-foreground cursor-pointer"
            >
              重新显示
            </button>
          </div>

          <div className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 text-primary rounded-full">
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-on-surface">开机自启动</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  系统启动时自动运行 Stellarc
                </p>
              </div>
            </div>
            <MD3Switch checked={autoLaunch} onClick={handleToggleAutoLaunch} label="开机自启动" />
          </div>
        </div>
        <UpdateChecker />
      </section>
    </>
  )
}
