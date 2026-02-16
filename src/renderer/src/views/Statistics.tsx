import { useMemo, useState, lazy, Suspense } from 'react'
import type { ReactElement } from 'react'
import { useHistoryStore } from '../store/historyStore'
import { useClassesStore } from '../store/classesStore'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'
import { getStrategyDescriptor } from '../engine/selection/strategies'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  Download,
  User,
  Hash,
  Users,
  Scale
} from 'lucide-react'

const StatisticsChartsPanel = lazy(() =>
  import('./statistics/StatisticsChartsPanel').then((module) => ({
    default: module.StatisticsChartsPanel
  }))
)

type TimeRange = '7d' | '14d' | '30d' | 'semester' | 'all'

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '近 7 天' },
  { value: '14d', label: '近 14 天' },
  { value: '30d', label: '近 30 天' },
  { value: 'semester', label: '本学期' },
  { value: 'all', label: '全部' }
]

function getTimeRangeStart(
  range: TimeRange,
  semesterSetting: { name: string; startDate: string; endDate: string } | null
): { start: Date | null; end: Date | null } {
  const now = new Date()
  switch (range) {
    case '7d':
      return { start: new Date(now.getTime() - 7 * 86400000), end: null }
    case '14d':
      return { start: new Date(now.getTime() - 14 * 86400000), end: null }
    case '30d':
      return { start: new Date(now.getTime() - 30 * 86400000), end: null }
    case 'semester': {
      if (semesterSetting && semesterSetting.startDate) {
        const start = new Date(semesterSetting.startDate)
        const end = semesterSetting.endDate ? new Date(semesterSetting.endDate + 'T23:59:59') : null
        return { start, end }
      }
      // Fallback: auto-detect current semester
      const month = now.getMonth()
      const year = now.getFullYear()
      return month >= 1 && month <= 6
        ? { start: new Date(year, 1, 1), end: null }
        : { start: new Date(month >= 7 ? year : year - 1, 7, 1), end: null }
    }
    case 'all':
      return { start: null, end: null }
  }
}

export function Statistics(): ReactElement {
  const { history } = useHistoryStore()
  const { classes } = useClassesStore()
  const { semester } = useSettingsStore()
  const addToast = useToastStore((s) => s.addToast)

  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [selectedStudent, setSelectedStudent] = useState<string>('')

  const filteredHistory = useMemo(() => {
    const { start, end } = getTimeRangeStart(timeRange, semester)
    if (!start) return history
    return history.filter((r) => {
      const t = new Date(r.timestamp)
      if (t < start) return false
      if (end && t > end) return false
      return true
    })
  }, [history, timeRange, semester])

  const dailyDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14

  const { chartData, dailyData, classData, weeklyComparison } = useMemo(() => {
    const now = new Date()
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - now.getDay())
    thisWeekStart.setHours(0, 0, 0, 0)
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)

    const dayMap = new Map<string, number>()
    const dayLabels: { date: string; key: string }[] = []
    for (let i = dailyDays - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      dayMap.set(key, 0)
      dayLabels.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, key })
    }

    const studentCounts: Record<string, number> = {}
    const classCounts: Record<string, number> = {}
    let thisWeek = 0
    let lastWeek = 0

    for (const r of filteredHistory) {
      for (const s of r.pickedStudents) {
        studentCounts[s.name] = (studentCounts[s.name] || 0) + 1
      }
      classCounts[r.className] = (classCounts[r.className] || 0) + 1
      const dateKey = r.timestamp.slice(0, 10)
      if (dayMap.has(dateKey)) dayMap.set(dateKey, dayMap.get(dateKey)! + 1)
      const t = new Date(r.timestamp)
      if (t >= thisWeekStart) thisWeek++
      else if (t >= lastWeekStart) lastWeek++
    }

    return {
      chartData: Object.entries(studentCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      dailyData: dayLabels.map(({ date, key }) => ({ date, count: dayMap.get(key)! })),
      classData: Object.entries(classCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      weeklyComparison: { thisWeek, lastWeek }
    }
  }, [filteredHistory, dailyDays])

  const leaderboard = useMemo(() => {
    const allStudents: { name: string; score: number; className: string }[] = []
    classes.forEach((c) => {
      c.students.forEach((s) => {
        if (s.score && s.score !== 0) {
          allStudents.push({ name: s.name, score: s.score, className: c.name })
        }
      })
    })
    return allStudents.sort((a, b) => b.score - a.score).slice(0, 10)
  }, [classes])

  const fairnessMetrics = useMemo(() => {
    const pickedCounts: Record<string, number> = {}
    filteredHistory.forEach((record) => {
      record.pickedStudents.forEach((student) => {
        pickedCounts[student.id] = (pickedCounts[student.id] || 0) + 1
      })
    })

    const allActiveIds = new Set<string>()
    classes.forEach((c) => {
      c.students.forEach((s) => {
        if (s.status === 'active') allActiveIds.add(s.id)
      })
    })
    Object.keys(pickedCounts).forEach((id) => allActiveIds.add(id))

    const uniquePicked = Object.keys(pickedCounts).length
    const values = Array.from(allActiveIds).map((id) => pickedCounts[id] || 0)

    if (values.length === 0) {
      return {
        uniquePicked: 0,
        balanceIndex: 0,
        cooldownHitCount: 0,
        strategyUsage: [] as Array<{ name: string; value: number }>
      }
    }

    const avg = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
    const stddev = Math.sqrt(variance)
    const cv = avg === 0 ? 0 : stddev / avg
    const balanceIndex = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)))

    const cooldownHitCount = filteredHistory.reduce((sum, record) => {
      const size = record.selectionMeta?.cooldownExcludedIds?.length || 0
      return sum + (size > 0 ? 1 : 0)
    }, 0)

    const strategyMap: Record<string, number> = {}
    filteredHistory.forEach((record) => {
      const strategy = record.selectionMeta?.policySnapshot?.strategyPreset || 'classic'
      strategyMap[strategy] = (strategyMap[strategy] || 0) + 1
    })

    const strategyUsage = Object.entries(strategyMap)
      .map(([name, value]) => ({
        name: getStrategyDescriptor(name).name,
        value
      }))
      .sort((a, b) => b.value - a.value)

    return { uniquePicked, balanceIndex, cooldownHitCount, strategyUsage }
  }, [filteredHistory, classes])

  // All students for the trend selector (with class name and pick count)
  const allStudentOptions = useMemo(() => {
    const map = new Map<string, { name: string; className: string; pickCount: number }>()
    classes.forEach((c) =>
      c.students.forEach((s) => {
        if (!map.has(s.name)) {
          map.set(s.name, { name: s.name, className: c.name, pickCount: 0 })
        }
      })
    )
    filteredHistory.forEach((r) =>
      r.pickedStudents.forEach((s) => {
        const existing = map.get(s.name)
        if (existing) {
          existing.pickCount++
        } else {
          map.set(s.name, { name: s.name, className: '', pickCount: 1 })
        }
      })
    )
    return Array.from(map.values()).sort((a, b) => b.pickCount - a.pickCount)
  }, [classes, filteredHistory])

  // Student trend data
  const studentTrendData = useMemo(() => {
    if (!selectedStudent) return []
    const now = new Date()
    const dayMap = new Map<string, number>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      dayMap.set(d.toISOString().slice(0, 10), 0)
    }
    filteredHistory.forEach((r) => {
      if (r.pickedStudents.some((s) => s.name === selectedStudent)) {
        const key = r.timestamp.slice(0, 10)
        if (dayMap.has(key)) dayMap.set(key, dayMap.get(key)! + 1)
      }
    })
    return Array.from(dayMap.entries()).map(([key, cnt]) => {
      const d = new Date(key)
      return { date: `${d.getMonth() + 1}/${d.getDate()}`, count: cnt }
    })
  }, [selectedStudent, filteredHistory])

  const handleExportStats = async (): Promise<void> => {
    const filePath = await window.electronAPI.saveFile({
      title: '导出统计数据',
      defaultPath: 'stellarc-statistics.csv',
      filters: [{ name: 'CSV 文件', extensions: ['csv'] }]
    })
    if (!filePath) return

    const lines: string[] = []
    lines.push('统计摘要')
    lines.push(`总抽选次数,${filteredHistory.length}`)
    lines.push(`本周抽选,${weeklyComparison.thisWeek}`)
    lines.push(`涉及班级,${classData.length}`)
    lines.push(`参与学生数,${fairnessMetrics.uniquePicked}`)
    lines.push(`均衡指数,${fairnessMetrics.balanceIndex}`)
    lines.push('')
    lines.push('被抽中次数 Top 10')
    lines.push('姓名,次数')
    chartData.forEach((d) => lines.push(`${d.name},${d.count}`))
    lines.push('')
    lines.push('班级抽选占比')
    lines.push('班级,次数')
    classData.forEach((d) => lines.push(`${d.name},${d.value}`))
    if (leaderboard.length > 0) {
      lines.push('')
      lines.push('积分排行榜')
      lines.push('姓名,班级,积分')
      leaderboard.forEach((s) => lines.push(`${s.name},${s.className},${s.score}`))
    }

    const csv = '\uFEFF' + lines.join('\n')
    const ok = await window.electronAPI.writeExportFile(filePath, csv)
    addToast(ok ? '统计数据已导出' : '导出失败', ok ? 'success' : 'error')
  }

  const handleGenerateReport = async (): Promise<void> => {
    const filePath = await window.electronAPI.saveFile({
      title: '生成课堂报告',
      defaultPath: 'stellarc-report.html',
      filters: [{ name: 'HTML 文件', extensions: ['html'] }]
    })
    if (!filePath) return

    const rangeLabel = TIME_RANGE_OPTIONS.find((o) => o.value === timeRange)?.label || '全部'
    const top10Rows = chartData
      .map((d, i) => `<tr><td>${i + 1}</td><td>${d.name}</td><td>${d.count}</td></tr>`)
      .join('')
    const classRows = classData
      .map((d) => `<tr><td>${d.name}</td><td>${d.value}</td></tr>`)
      .join('')
    const scoreRows = leaderboard
      .map(
        (s, i) =>
          `<tr><td>${i + 1}</td><td>${s.name}</td><td>${s.className}</td><td>${s.score}</td></tr>`
      )
      .join('')

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>Stellarc 课堂报告</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.6}
h1{border-bottom:3px solid #4f46e5;padding-bottom:8px}
h2{color:#4f46e5;margin-top:32px}
table{width:100%;border-collapse:collapse;margin:12px 0}
th,td{border:1px solid #e5e7eb;padding:8px 12px;text-align:left}
th{background:#f3f4f6;font-weight:600}
.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:16px 0}
.card{background:#f8fafc;border-radius:12px;padding:16px;text-align:center}
.card .num{font-size:28px;font-weight:800;color:#4f46e5}
.card .label{font-size:12px;color:#6b7280;margin-top:4px}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center}
@media print{body{margin:0}h1{font-size:20px}.summary{grid-template-columns:repeat(5,1fr)}}
</style></head>
<body>
<h1>Stellarc 课堂报告</h1>
<p>统计范围：${rangeLabel} · 生成时间：${new Date().toLocaleString()}</p>
<div class="summary">
<div class="card"><div class="num">${filteredHistory.length}</div><div class="label">总抽选次数</div></div>
<div class="card"><div class="num">${weeklyComparison.thisWeek}</div><div class="label">本周抽选</div></div>
<div class="card"><div class="num">${classData.length}</div><div class="label">涉及班级</div></div>
<div class="card"><div class="num">${fairnessMetrics.uniquePicked}</div><div class="label">参与学生</div></div>
<div class="card"><div class="num">${fairnessMetrics.balanceIndex}</div><div class="label">均衡指数</div></div>
</div>
${chartData.length > 0 ? `<h2>被抽中次数 Top 10</h2><table><tr><th>#</th><th>姓名</th><th>次数</th></tr>${top10Rows}</table>` : ''}
${classData.length > 0 ? `<h2>班级抽选分布</h2><table><tr><th>班级</th><th>次数</th></tr>${classRows}</table>` : ''}
${leaderboard.length > 0 ? `<h2>积分排行榜</h2><table><tr><th>#</th><th>姓名</th><th>班级</th><th>积分</th></tr>${scoreRows}</table>` : ''}
<div class="footer">由 Stellarc 自动生成 · 可直接打印此页面</div>
</body></html>`

    const ok = await window.electronAPI.writeExportFile(filePath, html)
    addToast(ok ? '课堂报告已生成' : '生成失败', ok ? 'success' : 'error')
  }

  return (
    <div className="h-full overflow-y-auto flex flex-col p-3 sm:p-5 space-y-4 sm:space-y-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">数据统计</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            共 {filteredHistory.length} 条抽选记录
            {timeRange !== 'all' &&
              `（${TIME_RANGE_OPTIONS.find((o) => o.value === timeRange)?.label}）`}
          </p>
        </div>
        <div className="ui-stack-row">
          <div className="flex flex-wrap items-center gap-1 rounded-2xl bg-surface-container-high/80 px-1 py-1">
            {TIME_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeRange(opt.value)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                  timeRange === opt.value
                    ? 'bg-secondary-container text-secondary-container-foreground'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportStats}
            className="ui-btn ui-btn-sm text-primary bg-primary/10 hover:bg-primary/15"
          >
            <Download className="w-4 h-4 mr-1.5" />
            导出
          </button>
          <button
            onClick={handleGenerateReport}
            className="ui-btn ui-btn-sm text-primary bg-primary/10 hover:bg-primary/15"
          >
            <Award className="w-4 h-4 mr-1.5" />
            报告
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-surface-container rounded-2xl p-4 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-3 right-3 p-1.5 rounded-full bg-primary/10">
            <Hash className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-3xl font-black text-primary">{filteredHistory.length}</div>
          <div className="text-xs text-on-surface-variant mt-1">总抽选次数</div>
        </div>
        <div className="bg-surface-container rounded-2xl p-4 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-3 right-3 p-1.5 rounded-full bg-primary/10">
            <Activity className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-3xl font-black text-primary">{weeklyComparison.thisWeek}</div>
          <div className="text-xs text-on-surface-variant mt-1">本周抽选</div>
          {weeklyComparison.lastWeek > 0 && (
            <div
              className={`flex items-center gap-0.5 text-[10px] mt-1 ${weeklyComparison.thisWeek >= weeklyComparison.lastWeek ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}
            >
              {weeklyComparison.thisWeek >= weeklyComparison.lastWeek ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              较上周{' '}
              {weeklyComparison.lastWeek > 0
                ? Math.round(
                    ((weeklyComparison.thisWeek - weeklyComparison.lastWeek) /
                      weeklyComparison.lastWeek) *
                      100
                  )
                : 0}
              %
            </div>
          )}
        </div>
        <div className="bg-surface-container rounded-2xl p-4 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-3 right-3 p-1.5 rounded-full bg-primary/10">
            <Users className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-3xl font-black text-primary">{classData.length}</div>
          <div className="text-xs text-on-surface-variant mt-1">涉及班级</div>
        </div>
        <div className="bg-surface-container rounded-2xl p-4 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-3 right-3 p-1.5 rounded-full bg-primary/10">
            <User className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-3xl font-black text-primary">{fairnessMetrics.uniquePicked}</div>
          <div className="text-xs text-on-surface-variant mt-1">参与学生数</div>
        </div>
        <div className="bg-surface-container rounded-2xl p-4 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-3 right-3 p-1.5 rounded-full bg-primary/10">
            <Scale className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-3xl font-black text-primary">{fairnessMetrics.balanceIndex}</div>
          <div className="text-xs text-on-surface-variant mt-1">均衡指数</div>
          <div className="w-full mt-2 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${fairnessMetrics.balanceIndex}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1">
        <Suspense
          fallback={
            <div className="xl:col-span-2 rounded-xl bg-surface-container p-6 text-sm text-on-surface-variant">
              图表加载中...
            </div>
          }
        >
          <StatisticsChartsPanel
            chartData={chartData}
            dailyData={dailyData}
            classData={classData}
            dailyDays={dailyDays}
            allStudentOptions={allStudentOptions}
            selectedStudent={selectedStudent}
            onSelectStudent={setSelectedStudent}
            studentTrendData={studentTrendData}
          />
        </Suspense>

        {/* Score Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="bg-surface-container rounded-xl p-6 flex flex-col elevation-0">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-on-surface">
              <Award className="w-5 h-5 text-primary" />
              积分排行榜
            </h3>
            <div className="flex-1 space-y-2 overflow-auto">
              {leaderboard.map((s, i) => {
                const medalColors = [
                  'bg-amber-400/20 text-amber-600 dark:text-amber-400',
                  'bg-slate-300/20 text-slate-500 dark:text-slate-300',
                  'bg-orange-400/20 text-orange-600 dark:text-orange-400'
                ]
                return (
                  <div
                    key={s.name + s.className}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors"
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? medalColors[i] : 'bg-surface-container-high text-on-surface-variant'}`}
                    >
                      {i < 3 ? <Award className="w-3.5 h-3.5" /> : i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-on-surface text-sm truncate">{s.name}</div>
                      <div className="text-xs text-on-surface-variant">{s.className}</div>
                    </div>
                    <span className="text-sm font-bold text-primary tabular-nums">
                      {s.score} 分
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Strategy Usage */}
        {fairnessMetrics.strategyUsage.length > 0 && (
          <div className="bg-surface-container rounded-xl p-6 flex flex-col elevation-0">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-on-surface">
              <Scale className="w-5 h-5 text-primary" />
              策略使用分布
            </h3>
            <div className="space-y-3">
              {(() => {
                const maxVal = Math.max(...fairnessMetrics.strategyUsage.map((i) => i.value), 1)
                return fairnessMetrics.strategyUsage.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-on-surface-variant">{item.name}</span>
                      <span className="font-semibold text-primary tabular-nums">
                        {item.value} 次
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all duration-500"
                        style={{ width: `${(item.value / maxVal) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              })()}
              <div className="pt-2 mt-1 border-t border-outline-variant/30 flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">冷却命中轮次</span>
                <span className="font-semibold text-primary">
                  {fairnessMetrics.cooldownHitCount}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
