export interface Student {
  id: string
  name: string
  studentId?: string
  gender?: 'male' | 'female'
  tags?: string[]
  photo?: string
  pickCount: number
  score: number
  scoreHistory?: ScoreLogEntry[]
  weight: number // 1 is default
  status: 'active' | 'absent' | 'excluded'
  lastPickedAt?: string
}

export interface ScoreLogEntry {
  id: string
  timestamp: string
  delta: number
  taskName: string
  source: 'manual' | 'task-assignment' | 'batch'
}

export interface ClassTaskTemplate {
  id: string
  name: string
  scoreDelta: number
}

export interface ClassGroup {
  id: string
  name: string
  students: Student[]
  taskTemplates?: ClassTaskTemplate[]
}

