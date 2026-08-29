import { escapeCsvCell } from './csv'
import type { HistoryRecord } from '../store/historyStore'
import type { ClassGroup } from '../types'

/**
 * 数据导出的纯函数实现：视图层只负责取数、存盘与提示，
 * 内容拼装集中在这里以便单元测试覆盖。
 */

/** 历史记录简易 CSV（时间/班级/学生） */
export function buildHistoryCsv(history: HistoryRecord[]): string {
  const header = '时间,班级,抽中学生'
  const rows = history.map((r) => {
    const time = new Date(r.timestamp).toLocaleString()
    const names = r.pickedStudents.map((s) => s.name).join('、')
    return `${escapeCsvCell(time)},${escapeCsvCell(r.className)},${escapeCsvCell(names)}`
  })
  return '\uFEFF' + [header, ...rows].join('\n')
}

/** 结构化课堂报告 CSV（事件明细 + 学生积分总表） */
export function buildStructuredReportCsv(history: HistoryRecord[], classes: ClassGroup[]): string {
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
        .map((cell) => escapeCsvCell(cell))
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
          .map((cell) => escapeCsvCell(cell))
          .join(',')
      )
    })
  })

  return '\uFEFF' + lines.join('\n')
}

/** Markdown 课堂报告 */
export function buildClassReportMarkdown(history: HistoryRecord[], classes: ClassGroup[]): string {
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

  return [
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
}

/** 统计页导出所需的预聚合数据 */
export interface StatisticsExportInput {
  rangeLabel: string
  totalPicks: number
  weeklyPicks: number
  classCount: number
  uniquePicked: number
  balanceIndex: number | string
  chartData: Array<{ name: string; count: number }>
  classData: Array<{ name: string; value: number }>
  leaderboard: Array<{ name: string; className: string; score: number }>
}

/** 统计数据 CSV */
export function buildStatisticsCsv(stats: StatisticsExportInput): string {
  const lines: string[] = []
  lines.push('统计摘要')
  lines.push(`总抽选次数,${stats.totalPicks}`)
  lines.push(`本周抽选,${stats.weeklyPicks}`)
  lines.push(`涉及班级,${stats.classCount}`)
  lines.push(`参与学生数,${stats.uniquePicked}`)
  lines.push(`均衡指数,${stats.balanceIndex}`)
  lines.push('')
  lines.push('被抽中次数 Top 10')
  lines.push('姓名,次数')
  stats.chartData.forEach((d) => lines.push(`${d.name},${d.count}`))
  lines.push('')
  lines.push('班级抽选占比')
  lines.push('班级,次数')
  stats.classData.forEach((d) => lines.push(`${d.name},${d.value}`))
  if (stats.leaderboard.length > 0) {
    lines.push('')
    lines.push('积分排行榜')
    lines.push('姓名,班级,积分')
    stats.leaderboard.forEach((s) => lines.push(`${s.name},${s.className},${s.score}`))
  }
  return '\uFEFF' + lines.join('\n')
}

/** 可打印的 HTML 统计报告 */
export function buildStatisticsReportHtml(stats: StatisticsExportInput): string {
  const top10Rows = stats.chartData
    .map((d, i) => `<tr><td>${i + 1}</td><td>${d.name}</td><td>${d.count}</td></tr>`)
    .join('')
  const classRows = stats.classData
    .map((d) => `<tr><td>${d.name}</td><td>${d.value}</td></tr>`)
    .join('')
  const scoreRows = stats.leaderboard
    .map(
      (s, i) =>
        `<tr><td>${i + 1}</td><td>${s.name}</td><td>${s.className}</td><td>${s.score}</td></tr>`
    )
    .join('')

  return `<!DOCTYPE html>
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
<p>统计范围：${stats.rangeLabel} · 生成时间：${new Date().toLocaleString()}</p>
<div class="summary">
<div class="card"><div class="num">${stats.totalPicks}</div><div class="label">总抽选次数</div></div>
<div class="card"><div class="num">${stats.weeklyPicks}</div><div class="label">本周抽选</div></div>
<div class="card"><div class="num">${stats.classCount}</div><div class="label">涉及班级</div></div>
<div class="card"><div class="num">${stats.uniquePicked}</div><div class="label">参与学生</div></div>
<div class="card"><div class="num">${stats.balanceIndex}</div><div class="label">均衡指数</div></div>
</div>
${stats.chartData.length > 0 ? `<h2>被抽中次数 Top 10</h2><table><tr><th>#</th><th>姓名</th><th>次数</th></tr>${top10Rows}</table>` : ''}
${stats.classData.length > 0 ? `<h2>班级抽选分布</h2><table><tr><th>班级</th><th>次数</th></tr>${classRows}</table>` : ''}
${stats.leaderboard.length > 0 ? `<h2>积分排行榜</h2><table><tr><th>#</th><th>姓名</th><th>班级</th><th>积分</th></tr>${scoreRows}</table>` : ''}
<div class="footer">由 Stellarc 自动生成 · 可直接打印此页面</div>
</body></html>`
}
