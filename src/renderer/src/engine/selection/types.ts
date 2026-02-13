import type { Student } from '@renderer/types'

export type SelectionMode = 'pick' | 'group'

export type SelectionReasonCode =
  | 'eligible'
  | 'excluded_by_status'
  | 'excluded_by_cooldown'
  | 'weighted'
  | 'strategy_adjusted'
  | 'fallback_random'

export type BuiltinStrategyPreset = 'classic' | 'balanced' | 'momentum'

export type SelectionStrategyPreset = string

export interface SelectionPolicy {
  weightedRandom: boolean
  preventRepeat: boolean
  cooldownRounds: number
  strategyPreset: SelectionStrategyPreset
}

export interface CandidateSnapshot extends Student {
  classId: string
  className: string
}

export interface PickedStudentRef {
  id: string
  name: string
  studentId?: string
}

export interface HistoricalPickRecord {
  id: string
  timestamp: string
  classId: string
  pickedStudents: PickedStudentRef[]
}

export interface SelectionTrace {
  studentId: string
  baseWeight: number
  finalWeight: number
  eligible: boolean
  reasons: SelectionReasonCode[]
}

export interface SelectionRequest {
  mode: 'pick'
  classId: string
  className: string
  candidates: CandidateSnapshot[]
  history: HistoricalPickRecord[]
  count: number
  policy: SelectionPolicy
  now?: string
  rng?: () => number
}

export interface SelectionResult {
  winners: CandidateSnapshot[]
  traces: SelectionTrace[]
  cooldownExcludedIds: string[]
  meta: {
    engineVersion: string
    policySnapshot: SelectionPolicy
    requestedCount: number
    actualCount: number
    generatedAt: string
  }
}

export interface GroupRequest {
  mode: 'group'
  classId: string
  className: string
  candidates: CandidateSnapshot[]
  history: HistoricalPickRecord[]
  groupCount: number
  policy: SelectionPolicy
  rng?: () => number
}

export interface GroupResult {
  groups: CandidateSnapshot[][]
  traces: SelectionTrace[]
  meta: {
    engineVersion: string
    groupCount: number
    generatedAt: string
  }
}

export interface SelectionEngine {
  pick(req: SelectionRequest): SelectionResult
  group(req: GroupRequest): GroupResult
}

export interface HistorySelectionMeta {
  engineVersion: string
  policySnapshot: SelectionPolicy
  requestedCount: number
  actualCount: number
  generatedAt: string
  cooldownExcludedIds: string[]
}
