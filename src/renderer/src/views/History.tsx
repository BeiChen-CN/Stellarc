import { useRef } from 'react'
import { useHistoryStore } from '../store/historyStore'
import { useConfirmStore } from '../store/confirmStore'
import { useToastStore } from '../store/toastStore'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Trash2, History as HistoryIcon, Download } from 'lucide-react'

export function History() {
  const { history, clearHistory } = useHistoryStore()
  const showConfirm = useConfirmStore((state) => state.show)
  const addToast = useToastStore((state) => state.addToast)
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: history.length,
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
      if (success) {
        addToast('历史记录已导出！', 'success')
      } else {
        addToast('导出失败。', 'error')
      }
    }
  }

  return (
    <div className="h-full flex flex-col p-6">
      <header className="flex justify-between items-center pb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">历史记录</h2>
          <p className="text-sm text-on-surface-variant mt-1">共 {history.length} 条记录</p>
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

      <div
        ref={parentRef}
        className="flex-1 overflow-auto custom-scrollbar bg-surface-container rounded-xl"
      >
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant py-20 opacity-70">
            <HistoryIcon className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">暂无历史记录</p>
            <p className="text-sm mt-1">开始抽选后，记录将显示在这里</p>
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const record = history[virtualRow.index]
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
                    <div className="text-xs text-on-surface-variant whitespace-nowrap font-mono shrink-0 ml-4">
                      {new Date(record.timestamp).toLocaleString()}
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
