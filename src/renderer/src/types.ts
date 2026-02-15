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

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  showClassroomFlow?: boolean
  showClassroomTemplate?: boolean
  showTemporaryExclusion?: boolean
  showAutoDraw?: boolean
  showSelectionExplanation?: boolean
  showPickGenderFilter?: boolean
  showPickEligibleCount?: boolean
  showPickPreviewPanel?: boolean
  showPickMissReasonPanel?: boolean
  showTaskScorePanel?: boolean
  showBatchEditPanel?: boolean
  showScoreLogPanel?: boolean
  showGroupTaskTemplatePanel?: boolean
  onboardingCompleted?: boolean
  revealSettleMs?: number
  showStudentId: boolean
  photoMode: boolean
  soundEnabled: boolean
  soundIntensity?: 'low' | 'medium' | 'high'
  backgroundImage?: string
  fairness: {
    weightedRandom: boolean
    preventRepeat: boolean
    cooldownRounds: number
    strategyPreset?: string
    balanceByTerm?: boolean
    stageFairnessRounds?: number
    prioritizeUnpickedCount?: number
    groupStrategy?: 'random' | 'balanced-score'
    pairAvoidRounds?: number
    autoRelaxOnConflict?: boolean
  }
  animationStyle: 'scroll' | 'slot' | 'flip' | 'wheel'
  shortcuts: {
    pick: string
  }
  ruleTemplates?: Array<{
    id: string
    name: string
    description?: string
    pickCount: number
    animationStyle: 'scroll' | 'slot' | 'flip' | 'wheel'
    fairness: {
      weightedRandom: boolean
      preventRepeat: boolean
      cooldownRounds: number
      strategyPreset?: string
      balanceByTerm?: boolean
      stageFairnessRounds?: number
      prioritizeUnpickedCount?: number
      groupStrategy?: 'random' | 'balanced-score'
      pairAvoidRounds?: number
      autoRelaxOnConflict?: boolean
    }
    groupTaskTemplates?: ClassTaskTemplate[]
    createdAt: string
    updatedAt: string
  }>
  scoreRules?: {
    maxScorePerStudent: number
    minScorePerStudent: number
    maxDeltaPerOperation: number
    preventDuplicateTaskPerDay: boolean
    taskDailyLimitPerStudent?: number
    allowRepeatTasks?: string[]
    blockedTasks?: string[]
  }
}

export interface HistoryRecord {
  id: string
  timestamp: string
  eventType?: 'pick' | 'group' | 'task'
  className: string
  pickedStudents: {
    id: string
    name: string
    studentId?: string
  }[]
  groupSummary?: {
    groupCount: number
    groups: Array<{
      groupIndex: number
      studentIds: string[]
      studentNames: string[]
      taskTemplateId?: string
      taskName?: string
      taskScoreDelta?: number
    }>
  }
  taskSummary?: {
    taskName: string
    scoreDelta: number
    studentIds: string[]
    studentNames: string[]
    source: 'manual' | 'task-assignment' | 'batch'
  }
  selectionMeta?: {
    engineVersion: string
    policySnapshot: {
      weightedRandom: boolean
      preventRepeat: boolean
      cooldownRounds: number
      strategyPreset?: string
      balanceByTerm?: boolean
      stageFairnessRounds?: number
      prioritizeUnpickedCount?: number
      groupStrategy?: 'random' | 'balanced-score'
      pairAvoidRounds?: number
      autoRelaxOnConflict?: boolean
    }
    requestedCount: number
    actualCount: number
    generatedAt: string
    cooldownExcludedIds: string[]
    fallbackNotes?: string[]
    explanationSummary?: string
    winnerExplanations?: Array<{
      id: string
      name: string
      baseWeight: number
      finalWeight: number
      estimatedProbability: number
      reasons: string[]
    }>
  }
}
