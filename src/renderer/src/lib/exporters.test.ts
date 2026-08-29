import { describe, expect, it } from 'vitest'
import {
  buildHistoryCsv,
  buildStructuredReportCsv,
  buildClassReportMarkdown,
  buildStatisticsCsv
} from './exporters'
import type { HistoryRecord } from '../store/historyStore'
import type { ClassGroup } from '../types'

const record: HistoryRecord = {
  id: 'r1',
  timestamp: '2026-08-29T08:00:00.000Z',
  classId: 'c1',
  className: '三年二班',
  eventType: 'pick',
  pickedStudents: [{ id: 's1', name: '张三' }]
}

const classes: ClassGroup[] = [
  {
    id: 'c1',
    name: '三年二班',
    students: [
      {
        id: 's1',
        name: '张三',
        pickCount: 2,
        score: 5,
        weight: 1,
        status: 'active',
        tags: ['组长']
      }
    ]
  }
]

describe('buildHistoryCsv', () => {
  it('写入 BOM 与表头，并转义包含逗号的字段', () => {
    const csv = buildHistoryCsv([{ ...record, className: '一班,二班' }])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('时间,班级,抽中学生')
    expect(csv).toContain('"一班,二班"')
  })
})

describe('buildStructuredReportCsv', () => {
  it('包含事件明细段与学生积分段', () => {
    const csv = buildStructuredReportCsv([record], classes)
    expect(csv).toContain('事件时间,事件类型')
    expect(csv).toContain('班级,学生,积分,被抽中次数,标签')
    expect(csv).toContain('张三')
  })
})

describe('buildClassReportMarkdown', () => {
  it('包含统计概览与积分榜', () => {
    const md = buildClassReportMarkdown([record], classes)
    expect(md.startsWith('# 课堂报告')).toBe(true)
    expect(md).toContain('## 积分榜（Top 10）')
    expect(md).toContain('张三')
  })
})

describe('buildStatisticsCsv', () => {
  it('按预聚合数据拼装摘要与排行', () => {
    const csv = buildStatisticsCsv({
      rangeLabel: '全部',
      totalPicks: 3,
      weeklyPicks: 2,
      classCount: 1,
      uniquePicked: 1,
      balanceIndex: 0.8,
      chartData: [{ name: '张三', count: 3 }],
      classData: [{ name: '三年二班', value: 3 }],
      leaderboard: [{ name: '张三', className: '三年二班', score: 5 }]
    })
    expect(csv).toContain('总抽选次数,3')
    expect(csv).toContain('积分排行榜')
  })
})
