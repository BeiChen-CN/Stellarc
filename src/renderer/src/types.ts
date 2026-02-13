export interface Student {
  id: string
  name: string
  studentId?: string
  photo?: string
  pickCount: number
  score: number
  weight: number // 1 is default
  status: 'active' | 'absent' | 'excluded'
  lastPickedAt?: string
}

export interface ClassGroup {
  id: string
  name: string
  students: Student[]
}

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  showStudentId: boolean
  photoMode: boolean
  soundEnabled: boolean
  backgroundImage?: string
  fairness: {
    weightedRandom: boolean
    preventRepeat: boolean
    cooldownRounds: number
    strategyPreset?: string
  }
  animationStyle: 'scroll' | 'slot' | 'flip' | 'wheel'
  shortcuts: {
    pick: string
  }
}

export interface HistoryRecord {
  id: string
  timestamp: string
  className: string
  pickedStudents: {
    id: string
    name: string
    studentId?: string
  }[]
  selectionMeta?: {
    engineVersion: string
    policySnapshot: {
      weightedRandom: boolean
      preventRepeat: boolean
      cooldownRounds: number
      strategyPreset?: string
    }
    requestedCount: number
    actualCount: number
    generatedAt: string
    cooldownExcludedIds: string[]
  }
}
