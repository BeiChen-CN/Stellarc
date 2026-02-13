import { useMemo } from 'react'
import { useHistoryStore } from '../store/historyStore'
import { useClassesStore } from '../store/classesStore'
import { getStrategyDescriptor } from '../engine/selection/strategies'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { TrendingUp, PieChart as PieChartIcon, Activity, Award } from 'lucide-react'

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--tertiary))',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--secondary) / 0.6)',
  'hsl(var(--tertiary) / 0.6)',
  'hsl(var(--primary) / 0.35)',
  'hsl(var(--secondary) / 0.35)'
]

function ChartTooltip({ active, payload, label, valueLabel }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover text-popover-foreground rounded-xl p-3 text-sm elevation-2">
        <p className="font-semibold">{label || payload[0].payload.name || payload[0].name}</p>
        <p>
          {valueLabel || '次数'}: <span className="font-bold text-primary">{payload[0].value}</span>
        </p>
      </div>
    )
  }
  return null
}

export function Statistics() {
  const { history } = useHistoryStore()
  const { classes } = useClassesStore()

  // Single-pass aggregation over history
  const { chartData, dailyData, classData, weeklyComparison } = useMemo(() => {
    const now = new Date()
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - now.getDay())
    thisWeekStart.setHours(0, 0, 0, 0)
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)

    // Build daily buckets
    const dayMap = new Map<string, number>()
    const dayLabels: { date: string; key: string }[] = []
    for (let i = 13; i >= 0; i--) {
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

    for (const r of history) {
      // Student pick counts
      for (const s of r.pickedStudents) {
        studentCounts[s.name] = (studentCounts[s.name] || 0) + 1
      }
      // Class distribution
      classCounts[r.className] = (classCounts[r.className] || 0) + 1
      // Daily frequency
      const dateKey = r.timestamp.slice(0, 10)
      if (dayMap.has(dateKey)) dayMap.set(dateKey, dayMap.get(dateKey)! + 1)
      // Weekly comparison
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
  }, [history])

  // Score leaderboard
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
    history.forEach((record) => {
      record.pickedStudents.forEach((student) => {
        pickedCounts[student.id] = (pickedCounts[student.id] || 0) + 1
      })
    })

    // Include all active students (even those never picked) for accurate fairness
    const allActiveIds = new Set<string>()
    classes.forEach((c) => {
      c.students.forEach((s) => {
        if (s.status === 'active') allActiveIds.add(s.id)
      })
    })
    // Also include any student that was picked (may no longer be active)
    Object.keys(pickedCounts).forEach((id) => allActiveIds.add(id))

    const uniquePicked = Object.keys(pickedCounts).length
    const values = Array.from(allActiveIds).map((id) => pickedCounts[id] || 0)

    if (values.length === 0) {
      return {
        uniquePicked: 0,
        balanceIndex: 100,
        cooldownHitCount: 0,
        strategyUsage: [] as Array<{ name: string; value: number }>
      }
    }

    const avg = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
    const stddev = Math.sqrt(variance)
    const cv = avg === 0 ? 0 : stddev / avg
    const balanceIndex = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)))

    const cooldownHitCount = history.reduce((sum, record) => {
      const size = record.selectionMeta?.cooldownExcludedIds?.length || 0
      return sum + (size > 0 ? 1 : 0)
    }, 0)

    const strategyMap: Record<string, number> = {}
    history.forEach((record) => {
      const strategy = record.selectionMeta?.policySnapshot?.strategyPreset || 'classic'
      strategyMap[strategy] = (strategyMap[strategy] || 0) + 1
    })

    const strategyUsage = Object.entries(strategyMap)
      .map(([name, value]) => ({
        name: getStrategyDescriptor(name).name,
        value
      }))
      .sort((a, b) => b.value - a.value)

    return {
      uniquePicked,
      balanceIndex,
      cooldownHitCount,
      strategyUsage
    }
  }, [history, classes])

  return (
    <div className="min-h-full flex flex-col p-6 space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-on-surface">数据统计</h2>
        <p className="text-sm text-on-surface-variant mt-1">共 {history.length} 条抽选记录</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-surface-container rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-primary">{history.length}</div>
          <div className="text-xs text-on-surface-variant mt-1">总抽选次数</div>
        </div>
        <div className="bg-surface-container rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-primary">{weeklyComparison.thisWeek}</div>
          <div className="text-xs text-on-surface-variant mt-1">本周抽选</div>
        </div>
        <div className="bg-surface-container rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-primary">{classData.length}</div>
          <div className="text-xs text-on-surface-variant mt-1">涉及班级</div>
        </div>
        <div className="bg-surface-container rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-primary">{fairnessMetrics.uniquePicked}</div>
          <div className="text-xs text-on-surface-variant mt-1">参与学生数</div>
        </div>
        <div className="bg-surface-container rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-primary">{fairnessMetrics.balanceIndex}</div>
          <div className="text-xs text-on-surface-variant mt-1">均衡指数</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Bar Chart — Top 10 */}
        <div className="bg-surface-container rounded-xl p-6 flex flex-col elevation-0">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-on-surface">
            <TrendingUp className="w-5 h-5 text-primary" />
            被抽中次数 Top 10
          </h3>
          <div className="flex-1 min-h-[240px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal
                    vertical={false}
                    strokeOpacity={0.3}
                  />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={80}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip valueLabel="被抽中" />}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[0, 8, 8, 0]}
                    barSize={20}
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-on-surface-variant space-y-4">
                <TrendingUp className="w-8 h-8 opacity-30" />
                <p>暂无统计数据</p>
              </div>
            )}
          </div>
        </div>

        {/* Line Chart — Daily Frequency */}
        <div className="bg-surface-container rounded-xl p-6 flex flex-col elevation-0">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-on-surface">
            <Activity className="w-5 h-5 text-primary" />近 14 天抽选频率
          </h3>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<ChartTooltip valueLabel="抽选" />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart — Class Distribution */}
        {classData.length > 0 && (
          <div className="bg-surface-container rounded-xl p-6 flex flex-col elevation-0">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-on-surface">
              <PieChartIcon className="w-5 h-5 text-primary" />
              班级抽选占比
            </h3>
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={1000}
                  >
                    {classData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip valueLabel="抽选" />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 -mt-2">
                {classData.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-1.5 text-xs text-on-surface-variant"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Score Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="bg-surface-container rounded-xl p-6 flex flex-col elevation-0">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-on-surface">
              <Award className="w-5 h-5 text-primary" />
              积分排行榜
            </h3>
            <div className="flex-1 space-y-2 overflow-auto">
              {leaderboard.map((s, i) => (
                <div
                  key={s.name + s.className}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-primary/15 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-on-surface text-sm truncate">{s.name}</div>
                    <div className="text-xs text-on-surface-variant">{s.className}</div>
                  </div>
                  <span className="text-sm font-bold text-primary tabular-nums">{s.score} 分</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategy Usage */}
        {fairnessMetrics.strategyUsage.length > 0 && (
          <div className="bg-surface-container rounded-xl p-6 flex flex-col elevation-0">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-on-surface">
              <Award className="w-5 h-5 text-primary" />
              策略使用分布
            </h3>
            <div className="space-y-2">
              {fairnessMetrics.strategyUsage.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">{item.name}</span>
                  <span className="font-semibold text-primary">{item.value} 次</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-outline-variant/30 flex items-center justify-between text-sm">
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
