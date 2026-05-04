import type { Student } from '../types'

export type ImportedStudentRow = Pick<
  Student,
  'name' | 'studentId' | 'gender' | 'weight' | 'score' | 'status'
>

const HEADER_NAMES = new Set([
  'name',
  '姓名',
  'studentid',
  '学号',
  'gender',
  '性别',
  'weight',
  '权重',
  'score',
  '积分',
  'status',
  '状态'
])

const cleanName = (value: string): string => value.replace(/[<>"'&]/g, '').trim()

const normalizeGender = (value: string): 'male' | 'female' | undefined => {
  const gender = value.trim().toLowerCase()
  if (gender === 'male' || gender === '男' || gender === 'm') return 'male'
  if (gender === 'female' || gender === '女' || gender === 'f') return 'female'
  return undefined
}

const normalizeStatus = (value: string): 'active' | 'absent' | 'excluded' => {
  const status = value.trim().toLowerCase()
  if (status === 'absent' || status === '缺席') return 'absent'
  if (status === 'excluded' || status === '排除') return 'excluded'
  return 'active'
}

const normalizeNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

const detectDelimiter = (line: string): string => {
  if (line.includes('\t')) return '\t'
  if (line.includes('，')) return '，'
  if (line.includes(',')) return ','
  return ''
}

export function parseStudentImportRows(content: string): ImportedStudentRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) return []

  const delimiter = detectDelimiter(lines[0])
  if (!delimiter) {
    return lines
      .map((name) => cleanName(name))
      .filter((name) => name.length > 0)
      .map((name) => ({ name, weight: 1, score: 0, status: 'active' as const }))
  }

  const split = (line: string): string[] => line.split(delimiter).map((cell) => cell.trim())
  const headerCells = split(lines[0])
  const normalizedHeader = headerCells.map((item) => item.toLowerCase())
  const hasHeader = normalizedHeader.some((item) => HEADER_NAMES.has(item))
  const rows = hasHeader ? lines.slice(1) : lines
  const header = hasHeader ? normalizedHeader : ['name', 'studentId', 'gender', 'weight', 'score', 'status']

  const indexOf = (keys: string[]): number => header.findIndex((item) => keys.includes(item))
  const nameIdx = indexOf(['name', '姓名'])
  const studentIdIdx = indexOf(['studentid', '学号'])
  const genderIdx = indexOf(['gender', '性别'])
  const weightIdx = indexOf(['weight', '权重'])
  const scoreIdx = indexOf(['score', '积分'])
  const statusIdx = indexOf(['status', '状态'])

  return rows
    .map((line) => split(line))
    .map((cells) => {
      const rawName = (nameIdx >= 0 ? cells[nameIdx] : cells[0]) || ''
      const name = cleanName(rawName).slice(0, 50)
      const rawStudentId = studentIdIdx >= 0 ? cells[studentIdIdx] : undefined
      const studentId = rawStudentId?.trim().slice(0, 30)
      const gender = genderIdx >= 0 ? normalizeGender(cells[genderIdx] || '') : undefined
      const weight = normalizeNumber(weightIdx >= 0 ? cells[weightIdx] : undefined, 1)
      const score = Number.isFinite(Number(scoreIdx >= 0 ? cells[scoreIdx] : undefined))
        ? Math.trunc(Number(scoreIdx >= 0 ? cells[scoreIdx] : undefined))
        : 0
      const status = normalizeStatus(statusIdx >= 0 ? cells[statusIdx] || 'active' : 'active')

      return {
        name,
        studentId: studentId || undefined,
        gender,
        weight,
        score,
        status
      }
    })
    .filter((row) => row.name.length > 0)
}
