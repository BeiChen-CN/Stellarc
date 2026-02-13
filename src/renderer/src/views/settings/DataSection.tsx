import { useState, useEffect, useRef, useCallback } from 'react'
import { Database, Save, History, Trash2, Power, Stethoscope, ChevronDown, CalendarDays, X, ChevronLeft, ChevronRight, FolderOpen, RefreshCw, ArrowUpFromLine, ArrowDownToLine, CheckCircle2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useSettingsStore } from '../../store/settingsStore'
import { useToastStore } from '../../store/toastStore'
import { useConfirmStore } from '../../store/confirmStore'
import { useDiagnosticsStore } from '../../store/diagnosticsStore'
import { MD3Switch } from './MD3Switch'
import { UpdateChecker } from './UpdateChecker'

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
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})

  // Parse value or default to current month
  const parsed = value ? new Date(value + 'T00:00:00') : null
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() || new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? new Date().getMonth())

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)) {
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
          setPopupStyle({ position: 'fixed', left: rect.left, bottom: window.innerHeight - rect.top + 4, zIndex: 9999 })
        } else {
          // Open downward
          setPopupStyle({ position: 'fixed', left: rect.left, top: rect.bottom + 4, zIndex: 9999 })
        }
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, handleClickOutside])

  // When value changes externally, sync the view
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.getFullYear())
      setViewMonth(parsed.getMonth())
    }
  }, [value])

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else setViewMonth(viewMonth - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else setViewMonth(viewMonth + 1)
  }

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${viewYear}-${m}-${d}`)
    setOpen(false)
  }

  const formatDisplay = (v: string) => {
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
          disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-container-high/60 cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary'
        )}
      >
        <CalendarDays className="w-4 h-4 text-on-surface-variant shrink-0" />
        {value
          ? <span className="text-on-surface">{formatDisplay(value)}</span>
          : <span className="text-on-surface-variant">{placeholder || '选择日期'}</span>}
      </button>

      {open && (
        <div ref={ref} style={popupStyle} className="bg-surface-container rounded-2xl elevation-3 border border-outline-variant/30 p-3 w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button onClick={prevMonth} className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-on-surface">{viewYear} 年 {viewMonth + 1} 月</span>
            <button onClick={nextMonth} className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[10px] text-on-surface-variant font-medium py-1">{w}</div>
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
              onClick={() => { onChange(''); setOpen(false) }}
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

export function DataSection() {
  const { maxHistoryRecords, setMaxHistoryRecords, syncEnabled, toggleSyncEnabled, syncFolder, setSyncFolder, semester, setSemester } =
    useSettingsStore()
  const addToast = useToastStore((state) => state.addToast)
  const showConfirm = useConfirmStore((state) => state.show)
  const { loading: diagnosticsLoading, migrationState, healthReport, lastLoadedAt, loadDiagnostics } =
    useDiagnosticsStore()
  const [autoLaunch, setAutoLaunchState] = useState(false)
  const [syncExpanded, setSyncExpanded] = useState(false)
  const [diagExpanded, setDiagExpanded] = useState(false)
  const [syncing, setSyncing] = useState<'push' | 'pull' | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [lastSyncStatus, setLastSyncStatus] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    window.electronAPI.getAutoLaunch().then(setAutoLaunchState)
    loadDiagnostics()
  }, [])

  const handleBackup = async () => {
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

  const handleRestore = async () => {
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

  const handleDeleteAllData = () => {
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

  const handleChooseSyncFolder = async () => {
    const folder = await window.electronAPI.selectFolder()
    if (!folder) return
    setSyncFolder(folder)
    addToast('已设置同步目录', 'success')
  }

  const handleSyncToFolder = async () => {
    if (!syncFolder) {
      addToast('请先选择同步目录', 'error')
      return
    }
    setSyncing('push')
    const ok = await window.electronAPI.syncDataToFolder(syncFolder)
    setSyncing(null)
    setLastSyncStatus(ok ? 'success' : 'error')
    if (ok) setLastSyncTime(new Date().toLocaleString())
    addToast(ok ? '已同步到共享目录' : '同步失败', ok ? 'success' : 'error')
  }

  const handleSyncFromFolder = async () => {
    if (!syncFolder) {
      addToast('请先选择同步目录', 'error')
      return
    }
    showConfirm('拉取数据', '从共享目录拉取将覆盖本地数据，确定继续吗？', async () => {
      setSyncing('pull')
      const ok = await window.electronAPI.syncDataFromFolder(syncFolder)
      setSyncing(null)
      setLastSyncStatus(ok ? 'success' : 'error')
      if (ok) {
        setLastSyncTime(new Date().toLocaleString())
        addToast('已从共享目录拉取，应用将重新加载', 'success')
        setTimeout(() => window.location.reload(), 1200)
      } else {
        addToast('拉取失败，请检查同步目录是否包含有效数据', 'error')
      }
    })
  }

  const handleToggleAutoLaunch = async () => {
    const next = !autoLaunch
    const ok = await window.electronAPI.setAutoLaunch(next)
    if (ok) {
      setAutoLaunchState(next)
      addToast(next ? '已启用开机自启动' : '已关闭开机自启动', 'success')
    } else {
      addToast('设置失败', 'error')
    }
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
              onChange={(e) => setMaxHistoryRecords(Math.max(100, parseInt(e.target.value) || 1000))}
              className="w-24 px-3 py-1.5 border border-outline-variant rounded-full text-sm text-center bg-surface-container-low focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-on-surface"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <button
            onClick={handleBackup}
            className="flex flex-col items-center justify-center p-6 border border-outline-variant rounded-[28px] hover:bg-surface-container-high transition-all duration-200 group cursor-pointer"
          >
            <div className="p-3 bg-primary/5 text-primary rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Save className="w-6 h-6" />
            </div>
            <span className="font-medium mb-1 text-on-surface">备份数据</span>
            <span className="text-xs text-on-surface-variant text-center">导出所有设置和记录为 ZIP 文件</span>
          </button>
          <button
            onClick={handleRestore}
            className="flex flex-col items-center justify-center p-6 border border-outline-variant rounded-[28px] hover:bg-destructive/5 hover:border-destructive/30 transition-all duration-200 group cursor-pointer"
          >
            <div className="p-3 bg-destructive/5 text-destructive rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <span className="font-medium mb-1 text-destructive">恢复数据</span>
            <span className="text-xs text-on-surface-variant text-center">从备份文件恢复所有数据</span>
          </button>
          <button
            onClick={handleDeleteAllData}
            className="flex flex-col items-center justify-center p-6 border border-outline-variant rounded-[28px] hover:bg-destructive/5 hover:border-destructive/30 transition-all duration-200 group cursor-pointer"
          >
            <div className="p-3 bg-destructive/5 text-destructive rounded-full mb-3 group-hover:10 transition-transform">
              <Trash2 className="w-6 h-6" />
            </div>
            <span className="font-medium mb-1 text-destructive">清除数据</span>
            <span className="text-xs text-on-surface-variant text-center">删除所有班级、历史和设置</span>
          </button>
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
                    setSemester(name ? { name, startDate: semester?.startDate || '', endDate: semester?.endDate || '' } : null)
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
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setSyncExpanded(!syncExpanded)}
        >
          <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
            <RefreshCw className="w-5 h-5 text-primary" />
            多终端同步
          </h3>
          <button className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-all cursor-pointer">
            <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', syncExpanded && 'rotate-180')} />
          </button>
        </div>
        <AnimatePresence initial={false}>
          {syncExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
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
                      <p className="text-xs text-on-surface-variant mt-0.5">通过共享文件夹（如网盘、NAS）在多台设备间同步数据</p>
                    </div>
                  </div>
                  <MD3Switch checked={syncEnabled} onClick={toggleSyncEnabled} label="目录同步" />
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
                        <p className="text-xs text-on-surface truncate" title={syncFolder}>{syncFolder}</p>
                      ) : (
                        <p className="text-xs text-on-surface-variant">未选择同步目录</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sync status bar */}
                {lastSyncTime && (
                  <div className="px-5 pb-3 flex items-center gap-2 text-xs">
                    {lastSyncStatus === 'success'
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" />
                      : <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                    <span className="text-on-surface-variant">上次同步：{lastSyncTime}</span>
                  </div>
                )}

                {/* Push / Pull buttons */}
                <div className="grid grid-cols-2 gap-3 px-5 pb-5">
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
                    <span className="text-[10px] text-on-surface-variant text-center leading-tight">将本地数据上传到共享目录</span>
                  </button>
                  <button
                    disabled={!syncEnabled || !syncFolder || syncing !== null}
                    onClick={handleSyncFromFolder}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border bordariant/50 hover:bg-primary/5 hover:border-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer group"
                  >
                    {syncing === 'pull' ? (
                      <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <ArrowDownToLine className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-sm font-medium text-on-surface">从目录拉取</span>
                    <span className="text-[10px] text-on-surface-variant text-center leading-tight">从共享目录覆盖本地数据</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Diagnostics */}
      <section className="space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setDiagExpanded(!diagExpanded)}
        >
          <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
            <Stethoscope className="w-5 h-5 text-primary" />
            可观测性与诊断
          </h3>
          <button className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-all cursor-pointer">
            <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', diagExpanded && 'rotate-180')} />
          </button>
        </div>
        <AnimatePresence initial={false}>
          {diagExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
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
                    <div className="text-sm font-semibold text-on-surface mt-1">{migrationState?.status || 'unknown'}</div>
                  </div>
                  <div className="rounded-2xl bg-surface-container-high/40 p-3">
                    <div className="text-xs text-on-surface-variant">自检修复数</div>
                    <div className="text-sm font-semibold text-on-surface mt-1">{healthReport?.summary?.repaired ?? '-'}</div>
                  </div>
                  <div className="rounded-2xl bg-surface-container-high/40 p-3">
                    <div className="text-xs text-on-surface-variant">自检错误数</div>
                    <div className="text-sm font-semibold text-on-surface mt-1">{healthReport?.summary?.error ?? '-'}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* System */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
          <Power className="w-5 h-5 text-primary" />
          系统
        </h3>
        <div className="bg-surface-container rounded-[28px] overflow-hidden">
          <div className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 text-primary rounded-full">
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-on-surface">开机自启动</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">系统启动时自动运行 Stellarc</p>
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
