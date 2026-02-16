import { useMemo, useState, useRef, useEffect, useCallback, type ReactElement } from 'react'
import {
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
import {
  TrendingUp,
  Activity,
  PieChart as PieChartIcon,
  User,
  Search,
  X,
  ChevronDown
} from 'lucide-react'

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

function ChartTooltip({
  active,
  payload,
  label,
  valueLabel
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; payload: { name?: string } }>
  label?: string
  valueLabel?: string
}): ReactElement | null {
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

interface StudentOption {
  name: string
  className: string
  pickCount: number
}

function StudentPicker({
  students,
  value,
  onChange
}: {
  students: StudentOption[]
  value: string
  onChange: (name: string) => void
}): ReactElement {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return students
    const q = query.trim().toLowerCase()
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.className.toLowerCase().includes(q)
    )
  }, [students, query])

  const handleClickOutside = useCallback((e: MouseEvent): void => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, handleClickOutside])

  const selected = students.find((s) => s.name === value)

  return (
    <div ref={containerRef} className="relative mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 border border-outline-variant rounded-2xl text-sm bg-surface-container-low hover:bg-surface-container-high/60 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors text-on-surface cursor-pointer"
      >
        {selected ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
              {selected.name.slice(0, 1)}
            </div>
            <span className="truncate font-medium">{selected.name}</span>
            <span className="hidden sm:inline text-xs text-on-surface-variant shrink-0">
              {selected.className}
            </span>
            <span className="ml-auto hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
              {selected.pickCount} 次
            </span>
          </div>
        ) : (
          <span className="flex-1 text-left text-on-surface-variant">选择学生查看趋势...</span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-on-surface-variant shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {value && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onChange('')
            setOpen(false)
          }}
          className="absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-surface-container rounded-2xl elevation-3 border border-outline-variant/30 overflow-hidden">
          <div className="p-2 border-b border-outline-variant/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/50" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索姓名或班级..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-surface-container-high/50 rounded-xl outline-none text-on-surface placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>
          <div className="max-h-[240px] overflow-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-on-surface-variant/60">
                没有匹配的学生
              </div>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.name}
                  onClick={() => {
                    onChange(s.name)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                    value === s.name
                      ? 'bg-secondary-container/60 text-secondary-container-foreground'
                      : 'hover:bg-surface-container-high/60 text-on-surface'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      value === s.name
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {s.name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                    {s.className && (
                      <div className="text-xs text-on-surface-variant/70 truncate">
                        {s.className}
                      </div>
                    )}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium tabular-nums shrink-0">
                    {s.pickCount} 次
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function StatisticsChartsPanel({
  chartData,
  dailyData,
  classData,
  dailyDays,
  allStudentOptions,
  selectedStudent,
  onSelectStudent,
  studentTrendData
}: {
  chartData: Array<{ name: string; count: number }>
  dailyData: Array<{ date: string; count: number }>
  classData: Array<{ name: string; value: number }>
  dailyDays: number
  allStudentOptions: StudentOption[]
  selectedStudent: string
  onSelectStudent: (value: string) => void
  studentTrendData: Array<{ date: string; count: number }>
}): ReactElement {
  return (
    <>
      <div className="bg-surface-container rounded-xl p-6 flex flex-col elevation-0">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-on-surface">
          <TrendingUp className="w-5 h-5 text-primary" />
          被抽中次数 Top 10
        </h3>
        <div className="flex-1 min-h-[240px]">
          {chartData.length > 0 ? (
            <div className="space-y-2">
              {(() => {
                const maxCount = Math.max(...chartData.map((d) => d.count), 1)
                return chartData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2.5 group">
                    <span
                      className={`w-5 text-right text-xs font-bold shrink-0 tabular-nums ${
                        i < 3 ? 'text-primary' : 'text-on-surface-variant/60'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="w-16 text-sm text-on-surface truncate shrink-0" title={d.name}>
                      {d.name}
                    </span>
                    <div className="flex-1 h-6 rounded-full bg-surface-container-high/60 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          i === 0 ? 'bg-primary' : i < 3 ? 'bg-primary/70' : 'bg-primary/40'
                        }`}
                        style={{ width: `${Math.max((d.count / maxCount) * 100, 8)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-primary tabular-nums shrink-0 w-8 text-right">
                      {d.count}
                    </span>
                  </div>
                ))
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant space-y-4">
              <TrendingUp className="w-8 h-8 opacity-30" />
              <p>暂无统计数据</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface-container rounded-xl p-6 flex flex-col elevation-0">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-on-surface">
          <Activity className="w-5 h-5 text-primary" />近 {dailyDays} 天抽选频率
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

      <div className="bg-surface-container rounded-xl p-6 flex flex-col elevation-0">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-on-surface">
          <User className="w-5 h-5 text-primary" />
          学生被抽中趋势
        </h3>
        <StudentPicker
          students={allStudentOptions}
          value={selectedStudent}
          onChange={onSelectStudent}
        />
        <div className="flex-1 min-h-[200px]">
          {selectedStudent && studentTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={studentTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<ChartTooltip valueLabel="被抽中" />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--tertiary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'hsl(var(--tertiary))' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant opacity-60">
              <User className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">
                {selectedStudent ? '该时间段内无数据' : '请选择一位学生查看趋势'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
