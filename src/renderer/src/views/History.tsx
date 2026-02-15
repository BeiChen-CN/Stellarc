import { useRef, useState, useMemo, useEffect } from 'react'
import { useHistoryStore } from '../store/historyStore'
import { useClassesStore } from '../store/classesStore'
import { useConfirmStore } from '../store/confirmStore'
import { useToastStore } from '../store/toastStore'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  Trash2,
  History as HistoryIcon,
  Download,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Play,
  Pause,
  SkipForward,
  FileText
} from 'lucide-react'
import { cn } from '../lib/utils'

function summarizeNames(names: string[], max = 6): string {
  if (names.length <= max) return names.join('、')
  return `${names.slice(0, max).join('、')} 等 ${names.length} 人`
}

export function History() {
  const { history, clearHistory, removeHistoryRecord } = useHistoryStore()
  const classes = useClassesStore((state) => state.classes)
  const showConfirm = useConfirmStore((state) => state.show)
  const addToast = useToastStore((state) => state.addToast)
  const parentRef = useRef<HTMLDivElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [eventFilter, setEventFilter] = useState<'all' | 'pick' | 'group' | 'task'>('all')
  const [playbackMode, setPlaybackMode] = useState(false)
  const [playbackRunning, setPlaybackRunning] = useState(false)
  const [playbackIndex, setPlaybackIndex] = useState(0)
  const [playbackIntervalMs, setPlaybackIntervalMs] = useState(1400)
  const [expandedRecordIds, setExpandedRecordIds] = useState<string[]>([])
  const [groupBySession, setGroupBySession] = useState(true)

  const classNames = useMemo(() => {
    const names = new Set(history.map((r) => r.className))
    return Array.from(names).sort()
  }, [history])

  const filteredHistory = useMemo(() => {
    let result = history
    if (classFilter !== 'all') {
      result = result.filter((r) => r.className === classFilter)
    }
    if (eventFilter !== 'all') {
      result = result.filter((r) => (r.eventType || 'pick') === eventFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (r) =>
          r.pickedStudents.some((s) => s.name.toLowerCase().includes(q)) ||
          r.className.toLowerCase().includes(q) ||
          (r.taskSummary?.taskName || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [history, classFilter, eventFilter, searchQuery])

  const playbackRecord = filteredHistory[playbackIndex]

  const sessionGroups = useMemo(() => {
    const groups: Array<{
      id: string
      className: string
      startTime: string
      endTime: string
      records: (typeof filteredHistory)[number][]
    }> = []
    const gapMs = 50 * 60 * 1000
    filteredHistory.forEach((record) => {
      const ts = new Date(record.timestamp).getTime()
      const dateKey = new Date(record.timestamp).toLocaleDateString()
      const last = groups[groups.length - 1]
      if (!last) {
        groups.push({
          id: `${record.className}-${record.timestamp}`,
          className: record.className,
          startTime: record.timestamp,
          endTime: record.timestamp,
          records: [record]
        })
        return
      }
      const lastTs = new Date(last.endTime).getTime()
      const lastDateKey = new Date(last.endTime).toLocaleDateString()
      if (
        last.className === record.className &&
        lastDateKey === dateKey &&
        Math.abs(lastTs - ts) <= gapMs
      ) {
        last.records.push(record)
        last.endTime = record.timestamp
        return
      }
      groups.push({
        id: `${record.className}-${record.timestamp}`,
        className: record.className,
        startTime: record.timestamp,
        endTime: record.timestamp,
        records: [record]
      })
    })
    return groups
  }, [filteredHistory])

  useEffect(() => {
    if (!playbackMode || !playbackRunning || filteredHistory.length === 0) return
    const timer = setTimeout(
      () => {
        setPlaybackIndex((prev) => (prev + 1 >= filteredHistory.length ? 0 : prev + 1))
      },
      Math.max(600, playbackIntervalMs)
    )
    return () => clearTimeout(timer)
  }, [playbackMode, playbackRunning, filteredHistory.length, playbackIntervalMs, playbackIndex])

  useEffect(() => {
    if (playbackIndex >= filteredHistory.length) {
      setPlaybackIndex(0)
    }
  }, [filteredHistory.length, playbackIndex])

  const virtualizer = useVirtualizer({
    count: filteredHistory.length,
    getItemKey: (index) => filteredHistory[index]?.id || index,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 108,
    measureElement: (element) => element?.getBoundingClientRect().height,
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

  const handleExportStructuredCSV = async () => {
    if (history.length === 0) {
      addToast('没有可导出的历史记录。', 'error')
      return
    }
    const filePath = await window.electronAPI.saveFile({
      title: '导出结构化课堂报告 CSV',
      defaultPath: 'classroom-report-structured.csv',
      filters: [{ name: 'CSV 文件', extensions: ['csv'] }]
    })
    if (!filePath) return

    const escapeCsv = (s: string) => `"${s.replace(/"/g, '""')}"`
    const lines: string[] = []

    lines.push('事件时间,事件类型,班级,学生名单,人数,任务名称,任务分值,策略预设,冷却轮次,说明')
    history.forEach((record) => {
      const eventType =
        record.eventType === 'group' ? '分组' : record.eventType === 'task' ? '任务记分' : '点名'
      const names = record.pickedStudents.map((student) => student.name).join('、')
      const taskName =
        record.taskSummary?.taskName || record.groupSummary?.groups?.[0]?.taskName || ''
      const taskScore =
        typeof record.taskSummary?.scoreDelta === 'number'
          ? String(record.taskSummary.scoreDelta)
          : typeof record.groupSummary?.groups?.[0]?.taskScoreDelta === 'number'
            ? String(record.groupSummary.groups[0].taskScoreDelta)
            : ''
      const strategyPreset = record.selectionMeta?.policySnapshot.strategyPreset || ''
      const cooldownRounds =
        typeof record.selectionMeta?.policySnapshot.cooldownRounds === 'number'
          ? String(record.selectionMeta.policySnapshot.cooldownRounds)
          : ''
      const note =
        record.selectionMeta?.explanationSummary ||
        (record.selectionMeta?.fallbackNotes || []).join('；') ||
        ''
      lines.push(
        [
          new Date(record.timestamp).toLocaleString(),
          eventType,
          record.className,
          names,
          String(record.pickedStudents.length),
          taskName,
          taskScore,
          strategyPreset,
          cooldownRounds,
          note
        ]
          .map((cell) => escapeCsv(cell))
          .join(',')
      )
    })

    lines.push('')
    lines.push('班级,学生,积分,被抽中次数,标签')
    classes.forEach((classItem) => {
      classItem.students.forEach((student) => {
        lines.push(
          [
            classItem.name,
            student.name,
            String(student.score),
            String(student.pickCount),
            (student.tags || []).join(' / ')
          ]
            .map((cell) => escapeCsv(cell))
            .join(',')
        )
      })
    })

    const csv = '\uFEFF' + lines.join('\n')
    const success = await window.electronAPI.writeExportFile(filePath, csv)
    addToast(success ? '结构化 CSV 导出成功' : '结构化 CSV 导出失败', success ? 'success' : 'error')
  }

  const handleExportClassReport = async () => {
    const filePath = await window.electronAPI.saveFile({
      title: '导出课堂报告',
      defaultPath: 'classroom-report.md',
      filters: [{ name: 'Markdown 文件', extensions: ['md'] }]
    })
    if (!filePath) return

    const pickEvents = history.filter((record) => (record.eventType || 'pick') === 'pick').length
    const groupEvents = history.filter((record) => record.eventType === 'group').length
    const taskEvents = history.filter((record) => record.eventType === 'task').length

    const scoreRows = classes.flatMap((classItem) =>
      classItem.students.map((student) => ({
        className: classItem.name,
        studentName: student.name,
        score: student.score,
        pickCount: student.pickCount,
        tags: (student.tags || []).join(' / ')
      }))
    )

    const topScores = [...scoreRows].sort((a, b) => b.score - a.score).slice(0, 10)
    const latest = history.slice(0, 20)
    const classStats = classes.map((classItem) => {
      const classEvents = history.filter((record) => record.className === classItem.name)
      const classTaskEvents = classEvents.filter((record) => record.eventType === 'task')
      const taskVolume = classTaskEvents.reduce(
        (sum, record) => sum + (record.pickedStudents?.length || 0),
        0
      )
      return {
        className: classItem.name,
        studentCount: classItem.students.length,
        eventCount: classEvents.length,
        avgScore:
          classItem.students.length > 0
            ? (
                classItem.students.reduce((sum, student) => sum + (student.score || 0), 0) /
                classItem.students.length
              ).toFixed(2)
            : '0.00',
        taskVolume
      }
    })

    const taskBreakdownMap = new Map<string, { count: number; impacted: number }>()
    history
      .filter((record) => record.eventType === 'task')
      .forEach((record) => {
        const key = record.taskSummary?.taskName || '未命名任务'
        const prev = taskBreakdownMap.get(key) || { count: 0, impacted: 0 }
        prev.count += 1
        prev.impacted += record.taskSummary?.studentIds?.length || record.pickedStudents.length || 0
        taskBreakdownMap.set(key, prev)
      })
    const taskBreakdown = Array.from(taskBreakdownMap.entries())
      .map(([taskName, value]) => ({ taskName, ...value }))
      .sort((a, b) => b.count - a.count)

    const tagBreakdownMap = new Map<string, number>()
    classes.forEach((classItem) => {
      classItem.students.forEach((student) => {
        ;(student.tags || []).forEach((tag) => {
          const key = tag.trim()
          if (!key) return
          tagBreakdownMap.set(key, (tagBreakdownMap.get(key) || 0) + 1)
        })
      })
    })
    const tagBreakdown = Array.from(tagBreakdownMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)

    const content = [
      '# 课堂报告',
      '',
      `生成时间：${new Date().toLocaleString()}`,
      `历史总记录：${history.length}`,
      `点名记录：${pickEvents}`,
      `分组记录：${groupEvents}`,
      `任务记分记录：${taskEvents}`,
      '',
      '## 积分榜（Top 10）',
      ...topScores.map(
        (row, index) =>
          `${index + 1}. ${row.studentName}（${row.className}）- 积分 ${row.score}，被抽中 ${row.pickCount} 次${row.tags ? `，标签：${row.tags}` : ''}`
      ),
      '',
      '## 班级概览',
      ...classStats.map(
        (item, index) =>
          `${index + 1}. ${item.className} - 学生 ${item.studentCount} 人，事件 ${item.eventCount} 条，平均积分 ${item.avgScore}，任务影响 ${item.taskVolume} 人次`
      ),
      '',
      '## 任务分布',
      ...(taskBreakdown.length > 0
        ? taskBreakdown.map(
            (item, index) =>
              `${index + 1}. ${item.taskName} - 执行 ${item.count} 次，影响 ${item.impacted} 人次`
          )
        : ['暂无任务数据']),
      '',
      '## 标签分布',
      ...(tagBreakdown.length > 0
        ? tagBreakdown.map((item, index) => `${index + 1}. ${item.tag} - ${item.count} 人`)
        : ['暂无标签数据']),
      '',
      '## 最近 20 条课堂事件',
      ...latest.map((record) => {
        const eventType =
          record.eventType === 'group' ? '分组' : record.eventType === 'task' ? '任务记分' : '点名'
        const names = record.pickedStudents.map((student) => student.name).join('、')
        return `- ${new Date(record.timestamp).toLocaleString()} [${eventType}] ${record.className}: ${names}`
      }),
      ''
    ].join('\n')

    const success = await window.electronAPI.writeExportFile(filePath, content)
    addToast(success ? '课堂报告导出成功' : '课堂报告导出失败', success ? 'success' : 'error')
  }

  const handleDeleteRecord = (id: string) => {
    showConfirm('删除记录', '确定要删除这条历史记录吗？', () => {
      removeHistoryRecord(id)
    })
  }

  const toggleExpandedRecord = (id: string) => {
    setExpandedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
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
            onClick={handleExportStructuredCSV}
            className="flex items-center px-5 py-2 text-on-surface bg-surface-container-high hover:bg-surface-container-low rounded-full transition-all font-medium text-sm h-10 cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2" />
            导出结构化 CSV
          </button>
          <button
            onClick={handleExportClassReport}
            className="flex items-center px-5 py-2 text-secondary-container-foreground bg-secondary-container hover:bg-secondary-container/80 rounded-full transition-all font-medium text-sm h-10 cursor-pointer"
          >
            <FileText className="w-4 h-4 mr-2" />
            导出课堂报告
          </button>
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
          <ClassFilterDropdown value={classFilter} options={classNames} onChange={setClassFilter} />
          <div className="flex items-center rounded-full border border-outline-variant overflow-hidden">
            {[
              { value: 'all', label: '全部' },
              { value: 'pick', label: '点名' },
              { value: 'group', label: '分组' },
              { value: 'task', label: '任务' }
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setEventFilter(item.value as 'all' | 'pick' | 'group' | 'task')}
                className={cn(
                  'px-3 py-1.5 text-xs cursor-pointer',
                  eventFilter === item.value
                    ? 'bg-secondary-container text-secondary-container-foreground'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setPlaybackMode((prev) => !prev)
              setPlaybackRunning(false)
              setPlaybackIndex(0)
            }}
            className={cn(
              'px-3.5 py-2 rounded-full text-sm border transition-colors cursor-pointer',
              playbackMode
                ? 'bg-secondary-container text-secondary-container-foreground border-outline-variant/50'
                : 'bg-surface-container-low text-on-surface border-outline-variant/50'
            )}
          >
            回放模式
          </button>
          <button
            onClick={() => setGroupBySession((prev) => !prev)}
            className={cn(
              'px-3.5 py-2 rounded-full text-sm border transition-colors cursor-pointer',
              groupBySession
                ? 'bg-secondary-container text-secondary-container-foreground border-outline-variant/50'
                : 'bg-surface-container-low text-on-surface border-outline-variant/50'
            )}
          >
            课次分组
          </button>
        </div>
      )}

      {playbackMode && playbackRecord && (
        <div className="mb-3 rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-on-surface-variant">课堂回放</div>
              <div className="text-sm text-on-surface mt-0.5">
                {new Date(playbackRecord.timestamp).toLocaleString()} · {playbackRecord.className}
              </div>
              <div className="text-xs text-on-surface-variant mt-1">
                {playbackRecord.eventType === 'group'
                  ? '分组事件'
                  : playbackRecord.eventType === 'task'
                    ? '任务记分事件'
                    : '点名事件'}
                ：{playbackRecord.pickedStudents.map((student) => student.name).join('、')}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={600}
                max={5000}
                step={100}
                value={playbackIntervalMs}
                onChange={(e) => setPlaybackIntervalMs(Number(e.target.value) || 1400)}
                className="w-20 px-2 py-1 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-center outline-none"
                title="回放间隔（毫秒）"
              />
              <button
                onClick={() => setPlaybackRunning((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground cursor-pointer inline-flex items-center gap-1"
              >
                {playbackRunning ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                {playbackRunning ? '暂停' : '播放'}
              </button>
              <button
                onClick={() =>
                  setPlaybackIndex((prev) =>
                    filteredHistory.length === 0 ? 0 : (prev + 1) % filteredHistory.length
                  )
                }
                className="px-3 py-1.5 rounded-lg text-xs bg-surface-container-high text-on-surface cursor-pointer inline-flex items-center gap-1"
              >
                <SkipForward className="w-3.5 h-3.5" />
                下一条
              </button>
            </div>
          </div>
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
        ) : groupBySession ? (
          <div className="p-3 space-y-3">
            {sessionGroups.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border border-outline-variant/20 bg-surface-container-high/40"
              >
                <div className="px-4 py-2.5 border-b border-outline-variant/20 flex items-center justify-between">
                  <div className="text-sm font-medium text-on-surface">
                    {session.className} · {new Date(session.startTime).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    {new Date(session.endTime).toLocaleTimeString()} -{' '}
                    {new Date(session.startTime).toLocaleTimeString()} · {session.records.length} 条
                  </div>
                </div>

                <div className="divide-y divide-outline-variant/10">
                  {session.records.map((record) => {
                    const expanded = expandedRecordIds.includes(record.id)
                    return (
                      <div
                        key={record.id}
                        className="group px-4 py-3 hover:bg-surface-container-high/60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-on-surface truncate">
                              {summarizeNames(
                                record.pickedStudents.map((s) => s.name),
                                record.eventType === 'group' ? 10 : 6
                              )}
                            </div>
                            <div className="mt-1 text-[11px] text-on-surface-variant">
                              {record.eventType === 'group'
                                ? '分组'
                                : record.eventType === 'task'
                                  ? '任务'
                                  : '点名'}
                              {' · '}
                              {new Date(record.timestamp).toLocaleTimeString()}
                            </div>
                            {expanded && (
                              <div className="mt-2 text-[11px] text-on-surface-variant space-y-1">
                                <div>
                                  全部学生：{record.pickedStudents.map((s) => s.name).join('、')}
                                </div>
                                {record.taskSummary && (
                                  <div>
                                    任务：{record.taskSummary.taskName}（
                                    {record.taskSummary.scoreDelta > 0 ? '+' : ''}
                                    {record.taskSummary.scoreDelta}）
                                  </div>
                                )}
                                {record.groupSummary && (
                                  <div>
                                    分组：
                                    {record.groupSummary.groups
                                      .map(
                                        (item) =>
                                          `第${item.groupIndex}组 ${item.studentNames.join('、')}`
                                      )
                                      .join('；')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => toggleExpandedRecord(record.id)}
                              className="p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all cursor-pointer"
                              title={expanded ? '收起详情' : '展开详情'}
                            >
                              {expanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="p-1.5 rounded-full text-on-surface-variant hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
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
              </div>
            ))}
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const record = filteredHistory[virtualRow.index]
              const expanded = expandedRecordIds.includes(record.id)
              return (
                <div
                  key={record.id}
                  ref={virtualizer.measureElement}
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
                          {summarizeNames(
                            record.pickedStudents.map((s) => s.name),
                            record.eventType === 'group' ? 10 : 6
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-container text-secondary-container-foreground font-medium">
                            {record.className}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant font-medium">
                            {record.eventType === 'group'
                              ? '分组'
                              : record.eventType === 'task'
                                ? '任务'
                                : '点名'}
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
                          {(record.selectionMeta?.fallbackNotes || []).length > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">
                              自动降级
                            </span>
                          )}
                        </div>
                        {record.selectionMeta?.explanationSummary && (
                          <div
                            className={cn(
                              'text-[11px] text-on-surface-variant mt-1.5',
                              expanded ? '' : 'line-clamp-1'
                            )}
                          >
                            {record.selectionMeta.explanationSummary}
                          </div>
                        )}
                        {record.taskSummary && (
                          <div
                            className={cn(
                              'text-[11px] text-primary mt-1.5',
                              expanded ? '' : 'line-clamp-1'
                            )}
                          >
                            任务：{record.taskSummary.taskName}（
                            {record.taskSummary.scoreDelta > 0 ? '+' : ''}
                            {record.taskSummary.scoreDelta}）
                          </div>
                        )}
                        {record.groupSummary && (
                          <div
                            className={cn(
                              'text-[11px] text-on-surface-variant mt-1.5',
                              expanded ? '' : 'line-clamp-1'
                            )}
                          >
                            分组：{record.groupSummary.groupCount} 组
                            {record.groupSummary.groups
                              .slice(0, 2)
                              .map(
                                (item) =>
                                  ` · 第${item.groupIndex}组 ${summarizeNames(item.studentNames, 3)}${item.taskName ? ` [${item.taskName}]` : ''}`
                              )
                              .join('')}
                          </div>
                        )}

                        {expanded && (
                          <div className="mt-2 rounded-lg bg-surface-container-low border border-outline-variant/20 p-2.5 space-y-1.5">
                            <div className="text-[11px] text-on-surface">
                              全部学生：{record.pickedStudents.map((s) => s.name).join('、')}
                            </div>
                            {record.taskSummary && (
                              <div className="text-[11px] text-on-surface-variant">
                                任务详情：{record.taskSummary.taskName}，分值
                                {record.taskSummary.scoreDelta > 0 ? '+' : ''}
                                {record.taskSummary.scoreDelta}，来源 {record.taskSummary.source}
                              </div>
                            )}
                            {record.groupSummary && (
                              <div className="text-[11px] text-on-surface-variant">
                                分组详情：
                                {record.groupSummary.groups
                                  .map(
                                    (item) =>
                                      `第${item.groupIndex}组(${item.studentNames.join('、')})${item.taskName ? `:${item.taskName}` : ''}`
                                  )
                                  .join('；')}
                              </div>
                            )}
                            {(record.selectionMeta?.fallbackNotes || []).length > 0 && (
                              <div className="text-[11px] text-amber-700 dark:text-amber-400">
                                降级说明：{(record.selectionMeta?.fallbackNotes || []).join('；')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <div className="text-xs text-on-surface-variant whitespace-nowrap font-mono">
                        {new Date(record.timestamp).toLocaleString()}
                      </div>
                      <button
                        onClick={() => toggleExpandedRecord(record.id)}
                        className="p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all cursor-pointer"
                        title={expanded ? '收起详情' : '展开详情'}
                      >
                        {expanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
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

  const allOptions = [
    { value: 'all', label: '全部班级' },
    ...options.map((o) => ({ value: o, label: o }))
  ]
  const current = allOptions.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-full text-sm bg-surface-container-low hover:bg-surface-container-high transition-colors text-on-surface cursor-pointer"
      >
        <span>{current?.label || '全部班级'}</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-on-surface-variant transition-transform',
            open && 'rotate-180'
          )}
        />
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
