import type {
  CandidateSnapshot,
  GroupRequest,
  GroupResult,
  SelectionEngine,
  SelectionReasonCode,
  SelectionRequest,
  SelectionResult,
  SelectionTrace,
  SelectionStrategyPreset
} from './types'
import { getStrategyDescriptor } from './strategies'

export const ENGINE_VERSION = '1.0.0'

function createTrace(student: CandidateSnapshot): SelectionTrace {
  return {
    studentId: student.id,
    baseWeight: student.weight || 1,
    finalWeight: student.weight || 1,
    eligible: true,
    reasons: ['eligible']
  }
}

function appendReason(trace: SelectionTrace, reason: SelectionReasonCode): void {
  if (!trace.reasons.includes(reason)) {
    trace.reasons.push(reason)
  }
}

function eligibleByStatus(
  candidates: CandidateSnapshot[],
  traces: SelectionTrace[]
): CandidateSnapshot[] {
  const active = candidates.filter((s) => s.status === 'active')
  const activeIds = new Set(active.map((s) => s.id))

  traces.forEach((trace) => {
    if (!activeIds.has(trace.studentId)) {
      trace.eligible = false
      trace.finalWeight = 0
      appendReason(trace, 'excluded_by_status')
    }
  })

  return active
}

function eligibleByCooldown(
  req: SelectionRequest,
  active: CandidateSnapshot[],
  traces: SelectionTrace[]
) {
  if (!req.policy.preventRepeat || req.policy.cooldownRounds <= 0) {
    return { eligible: active, cooldownExcludedIds: [] as string[] }
  }

  const classHistory = req.history
    .filter((record) => record.classId === req.classId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, req.policy.cooldownRounds)

  const recentlyPicked = new Set(
    classHistory.flatMap((record) => record.pickedStudents.map((s) => s.id))
  )

  const available = active.filter((student) => !recentlyPicked.has(student.id))
  const cooldownExcludedIds = active
    .filter((student) => recentlyPicked.has(student.id))
    .map((student) => student.id)

  if (available.length > 0) {
    traces.forEach((trace) => {
      if (cooldownExcludedIds.includes(trace.studentId)) {
        trace.eligible = false
        trace.finalWeight = 0
        appendReason(trace, 'excluded_by_cooldown')
      }
    })
    return { eligible: available, cooldownExcludedIds }
  }

  return { eligible: active, cooldownExcludedIds: [] as string[] }
}

function weightedDraw(
  candidates: CandidateSnapshot[],
  count: number,
  weightedRandom: boolean,
  strategyPreset: SelectionStrategyPreset,
  rng: () => number,
  traces: SelectionTrace[]
): CandidateSnapshot[] {
  const winners: CandidateSnapshot[] = []
  let remaining = [...candidates]

  for (let i = 0; i < count; i++) {
    if (remaining.length === 0) {
      break
    }

    let winner: CandidateSnapshot

    if (weightedRandom) {
      const strategy = getStrategyDescriptor(strategyPreset)
      remaining.forEach((student) => {
        const trace = traces.find((t) => t.studentId === student.id)
        const baseWeight = student.weight || 1
        let finalWeight = strategy.adjustWeight(student, baseWeight)

        finalWeight = Math.max(0.1, finalWeight)

        if (trace) {
          trace.baseWeight = baseWeight
          trace.finalWeight = finalWeight
          appendReason(trace, 'weighted')
          if (strategyPreset !== 'classic') {
            appendReason(trace, 'strategy_adjusted')
          }
        }
      })

      const totalWeight = remaining.reduce((sum, student) => {
        const trace = traces.find((t) => t.studentId === student.id)
        return sum + ((trace?.finalWeight ?? student.weight) || 1)
      }, 0)
      let random = rng() * totalWeight
      winner = remaining[remaining.length - 1]

      for (const student of remaining) {
        const trace = traces.find((t) => t.studentId === student.id)
        random -= (trace?.finalWeight ?? student.weight) || 1
        if (random < 0) {
          winner = student
          break
        }
      }
    } else {
      const index = Math.floor(rng() * remaining.length)
      winner = remaining[index]
      const trace = traces.find((t) => t.studentId === winner.id)
      if (trace) {
        appendReason(trace, 'fallback_random')
      }
    }

    winners.push(winner)
    remaining = remaining.filter((s) => s.id !== winner.id)
  }

  return winners
}

function fisherYates<T>(items: T[], rng: () => number): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export class DefaultSelectionEngine implements SelectionEngine {
  pick(req: SelectionRequest): SelectionResult {
    const rng = req.rng ?? Math.random
    const traces = req.candidates.map(createTrace)

    const active = eligibleByStatus(req.candidates, traces)
    const { eligible, cooldownExcludedIds } = eligibleByCooldown(req, active, traces)

    const requestedCount = Math.max(0, req.count)
    const actualCount = Math.min(requestedCount, eligible.length)
    const winners = weightedDraw(
      eligible,
      actualCount,
      req.policy.weightedRandom,
      req.policy.strategyPreset,
      rng,
      traces
    )

    return {
      winners,
      traces,
      cooldownExcludedIds,
      meta: {
        engineVersion: ENGINE_VERSION,
        policySnapshot: req.policy,
        requestedCount,
        actualCount: winners.length,
        generatedAt: req.now ?? new Date().toISOString()
      }
    }
  }

  group(req: GroupRequest): GroupResult {
    const rng = req.rng ?? Math.random
    const traces = req.candidates.map(createTrace)
    const active = eligibleByStatus(req.candidates, traces)
    const shuffled = fisherYates(active, rng)
    const safeGroupCount = Math.max(1, req.groupCount)
    const groups: CandidateSnapshot[][] = Array.from({ length: safeGroupCount }, () => [])

    shuffled.forEach((student, index) => {
      groups[index % safeGroupCount].push(student)
    })

    return {
      groups,
      traces,
      meta: {
        engineVersion: ENGINE_VERSION,
        groupCount: safeGroupCount,
        generatedAt: new Date().toISOString()
      }
    }
  }
}

export const selectionEngine = new DefaultSelectionEngine()
