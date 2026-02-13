import { useRef, useState, useMemo, useEffect } from 'react'
import { useHistoryStore } from '../store/historyStore'
import { useConfirmStore } from '../store/confirmStore'
import { useToastStore } from '../store/toastStore'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Trash2, History as HistoryIcon, Download, Search, X, ChevronDown, Check } from 'lucide-react'
import { cn } from '../lib/utils'

export function History() {
  const { history, clearHistory, removeHistoryRecord } = useHistoryStore()
  const showConfirm = useConfirmStore((state) => state.show)
  const addToast = useToastStore((state) => state.addToast)
  const parentRef = useRef<HTMLDivElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [classFilter, setClassFilter] = useState<string>('all')

  const classNames = useMemo(() => {
    const names = new Set(history.map((r) => r.className))
    return Array.from(names).sort()
  }, [history])

  const filteredHistory = useMemo(() => {
    let result = history
    if (classFilter !== 'all') {
      result = result.filter((r) => r.className === classFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (r) =>
          r.pickedStudents.some((s) => s.name.toLowerCase().includes(q)) ||
          r.className.toLowerCase().includes(q)
      )
    }
    return result
  }, [history, classFilter, searchQuery])

  const virtualizer = useVirtualizer({
    count: filteredHistory.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10
  })

  const handleExportCSV = async () => {
    if (history.length === 0) {
      addToast('没有可导出的历史记录。', 'error')
      return
    }
    const filePath = await window.electronAPI.saveFile({
      title: '导出历史记录',
      defaultPath: 'spotlight-history.csv',
      filters: [{ name: 'CSV 文件', extensions: ['csv'] }]
    })
    if (filePath) {
      const escapeCsv = (s: string) => `"${s.replace(/"/g, '""')}"`
      const header = '时间,班级,抽中学生'
      const rows = history.map((r) => {
        const time = new Date(r.timestamp).toLocaleString()
        const names = r.pickedStudents.map((s) => s.name).join('、')
        return `${escapeCsv(time)},${escapeCsv(r.className)},${escapeCsv(names)}`
      })
      const csv = '\uFEFF' + [header, ...rows].join('\n')
      const success = await window.electronAPI.writeExportFile(filePath, csv)
      addToast(success ? '历史记录已导出！' : '导出失败。', success ? 'success' : 'error')
    }
  }

  const handleDeleteRecord = (id: string) => {
    showConfirm('删除记录', '确定要删除这条历史记录吗？', () => {
      removeHistoryRecord(id)
    })
  }

  return (
    <div className="h-full flex flex-col p-5">
      <header className="flex justify-between items-center pb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">历史记录</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            共 {history.length} 条记录
            {filteredHistory.length !== history.length && `，已筛选 ${filteredHistory.length} 条`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center px-5 py-2 text-primary bg-primary/10 hover:bg-primary/15 rounded-full transition-all font-medium text-sm h-10 cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2" />
            导出 CSV
          </button>
          <button
            onClick={() =>
              showConfirm('清空历史', '确定要清空所有历史记录吗？此操作不可撤销。', clearHistory)
            }
            className="flex items-center px-5 py-2 text-destructive bg-destructive/10 hover:bg-destructive/15 rounded-full transition-all font-medium text-sm h-10 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            清空历史
          </button>
        </div>
      </header>

      {history.length > 0 && (
        <div className="flex items-center gap-3 pb-4 shrink-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索学生或班级..."
              className="w-full pl-9 pr-8 py-2 border border-outline-variant rounded-full text-sm bg-surface-container-low focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors text-on-surface"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <ClassFilterDropdown
            value={classFilter}
            options={classNames}
            onChange={setClassFilter}
          />
        </div>
      )}

      <div
        ref={parentRef}
        className="flex-1 overflow-auto custom-scrollbar bg-surface-container rounded-xl"
      >
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant py-20 opacity-70">
            <HistoryIcon className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">{history.length === 0 ? '暂无历史记录' : '没有匹配的记录'}</p>
            <p className="text-sm mt-1">
              {history.length === 0 ? '开始抽选后，记录将显示在这里' : '尝试调整搜索条件'}
            </p>
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const record = filteredHistory[virtualRow.index]
              return (
                <div
                  key={record.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                >
                  <div className="group flex justify-between items-center px-5 py-4 hover:bg-surface-container-high transition-all duration-200 border-b border-outline-variant/10">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {record.pickedStudents.length}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                          {record.pickedStudents.map((s) => s.name).join('、')}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-container text-secondary-container-foreground font-medium">
                            {record.className}
                          </span>
                          {record.selectionMeta?.policySnapshot.weightedRandom && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              权重
                            </span>
                          )}
                          {record.selectionMeta?.policySnapshot.preventRepeat && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary font-medium">
                              冷却 {record.selectionMeta.policySnapshot.cooldownRounds}
                            </span>
                          )}
                          {record.selectionMeta?.policySnapshot.strategyPreset && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-container text-secondary-container-foreground font-medium">
                              策略 {record.selectionMeta.policySnapshot.strategyPreset}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <div className="text-xs text-on-surface-variant whitespace-nowrap font-mono">
                        {new Date(record.timestamp).toLocaleString()}
                      </div>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="p-1.5 rounded-full text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                        title="删除此记录"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ClassFilterDropdown({
  value,
  options,
  onChange
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const allOptions = [{ value: 'all', label: '全部班级' }, ...options.map((o) => ({ value: o, label: o }))]
  const current = allOptions.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-full text-sm bg-surface-container-low hover:bg-surface-container-high transition-colors text-on-surface cursor-pointer"
      >
        <span>{current?.label || '全部班级'}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-on-surface-variant transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-[160px] bg-surface-container rounded-2xl elevation-2 border border-outline-variant/30 py-1 z-50 max-h-[240px] overflow-y-auto">
          {allOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer text-left',
                value === opt.value
                  ? 'bg-secondary-container text-secondary-container-foreground'
                  : 'text-on-surface hover:bg-surface-container-high'
              )}
            >
              {value === opt.value && <Check className="w-3.5 h-3.5 shrink-0" />}
              <span className={value !== opt.value ? 'pl-[22px]' : ''}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
