import { getStrategyDescriptor } from './strategies'
import type {
  CandidateSnapshot,
  GroupRequest,
  GroupResult,
  SelectionEngine,
  SelectionReasonCode,
  SelectionRequest,
  SelectionResult,
  SelectionTrace
} from './types'

export const ENGINE_VERSION = '1.1.0'

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

function toTraceMap(traces: SelectionTrace[]): Map<string, SelectionTrace> {
  return new Map(traces.map((trace) => [trace.studentId, trace]))
}

function markExcluded(
  studentIds: string[],
  traceMap: Map<string, SelectionTrace>,
  reason: SelectionReasonCode
): void {
  studentIds.forEach((studentId) => {
    const trace = traceMap.get(studentId)
    if (!trace) return
    trace.eligible = false
    trace.finalWeight = 0
    appendReason(trace, reason)
  })
}

function eligibleByStatus(
  candidates: CandidateSnapshot[],
  traceMap: Map<string, SelectionTrace>
): CandidateSnapshot[] {
  const active = candidates.filter((student) => student.status === 'active')
  const activeIds = new Set(active.map((student) => student.id))

  const excluded = candidates
    .filter((student) => !activeIds.has(student.id))
    .map((student) => student.id)
  markExcluded(excluded, traceMap, 'excluded_by_status')

  return active
}

function eligibleByManualExclusion(
  active: CandidateSnapshot[],
  traceMap: Map<string, SelectionTrace>,
  manualExcludedIds: string[]
): CandidateSnapshot[] {
  if (manualExcludedIds.length === 0) {
    return active
  }

  const excludedSet = new Set(manualExcludedIds)
  const excluded = active
    .filter((student) => excludedSet.has(student.id))
    .map((student) => student.id)
  markExcluded(excluded, traceMap, 'excluded_by_manual')
  return active.filter((student) => !excludedSet.has(student.id))
}

function eligibleByCooldown(
  req: SelectionRequest,
  active: CandidateSnapshot[],
  traceMap: Map<string, SelectionTrace>
): { eligible: CandidateSnapshot[]; cooldownExcludedIds: string[] } {
  if (!req.policy.preventRepeat || req.policy.cooldownRounds <= 0) {
    return { eligible: active, cooldownExcludedIds: [] }
  }

  const classHistory = req.history
    .filter((record) => record.classId === req.classId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, req.policy.cooldownRounds)

  const recentlyPicked = new Set(
    classHistory.flatMap((record) => record.pickedStudents.map((student) => student.id))
  )
  const available = active.filter((student) => !recentlyPicked.has(student.id))
  const cooldownExcludedIds = active
    .filter((student) => recentlyPicked.has(student.id))
    .map((student) => student.id)

  if (available.length > 0) {
    markExcluded(cooldownExcludedIds, traceMap, 'excluded_by_cooldown')
    return { eligible: available, cooldownExcludedIds }
  }

  return { eligible: active, cooldownExcludedIds: [] }
}

function recentPickCounts(req: SelectionRequest): Map<string, number> {
  const rounds = Math.max(0, req.policy.stageFairnessRounds)
  if (rounds === 0) return new Map()

  const recent = req.history
    .filter((record) => record.classId === req.classId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, rounds)

  const countMap = new Map<string, number>()
  recent.forEach((record) => {
    record.pickedStudents.forEach((student) => {
      countMap.set(student.id, (countMap.get(student.id) || 0) + 1)
    })
  })
  return countMap
}

function scoreByGroup(group: CandidateSnapshot[]): number {
  return group.reduce((sum, student) => sum + (student.score || 0), 0)
}

function weightedPickOne(
  candidates: CandidateSnapshot[],
  weightById: Map<string, number>,
  rng: () => number
): CandidateSnapshot {
  const totalWeight = candidates.reduce(
    (sum, student) => sum + (weightById.get(student.id) || 1),
    0
  )
  let random = rng() * totalWeight
  let winner = candidates[candidates.length - 1]

  for (const student of candidates) {
    random -= weightById.get(student.id) || 1
    if (random < 0) {
      winner = student
      break
    }
  }
  return winner
}

function applyAdvancedWeights(
  req: SelectionRequest,
  candidates: CandidateSnapshot[],
  traceMap: Map<string, SelectionTrace>
): Map<string, number> {
  const strategy = getStrategyDescriptor(req.policy.strategyPreset)
  const recentCounts = recentPickCounts(req)
  const weightById = new Map<string, number>()

  candidates.forEach((student) => {
    const trace = traceMap.get(student.id)
    if (!trace) return

    const baseWeight = student.weight || 1
    let finalWeight = strategy.adjustWeight(student, baseWeight)

    if (req.policy.balanceByTerm) {
      finalWeight *= 1 / (1 + Math.max(0, student.pickCount || 0) * 0.25)
      appendReason(trace, 'balance_target_boost')
    }

    const recentCount = recentCounts.get(student.id) || 0
    if (req.policy.stageFairnessRounds > 0 && recentCount > 0) {
      finalWeight *= 1 / (1 + recentCount * 0.4)
      appendReason(trace, 'stage_fairness_boost')
    }

    finalWeight = Math.max(0.1, finalWeight)

    trace.baseWeight = baseWeight
    trace.finalWeight = finalWeight
    if (req.policy.weightedRandom) {
      appendReason(trace, 'weighted')
      if (req.policy.strategyPreset !== 'classic') {
        appendReason(trace, 'strategy_adjusted')
      }
    } else {
      appendReason(trace, 'fallback_random')
    }

    weightById.set(student.id, finalWeight)
  })

  return weightById
}

function pickPrioritizedUnpicked(
  req: SelectionRequest,
  candidates: CandidateSnapshot[],
  weightById: Map<string, number>,
  traceMap: Map<string, SelectionTrace>,
  rng: () => number
): CandidateSnapshot[] {
  const winners: CandidateSnapshot[] = []
  let remaining = [...candidates]

  const prioritizedCount = Math.max(0, Math.min(req.policy.prioritizeUnpickedCount, req.count))
  for (let i = 0; i < prioritizedCount; i++) {
    const unpicked = remaining.filter((student) => (student.pickCount || 0) === 0)
    if (unpicked.length === 0) {
      break
    }
    const winner = weightedPickOne(unpicked, weightById, rng)
    winners.push(winner)
    const trace = traceMap.get(winner.id)
    if (trace) {
      appendReason(trace, 'priority_unpicked')
    }
    remaining = remaining.filter((student) => student.id !== winner.id)
  }

  const needMore = Math.max(0, req.count - winners.length)
  for (let i = 0; i < needMore; i++) {
    if (remaining.length === 0) break
    const winner = req.policy.weightedRandom
      ? weightedPickOne(remaining, weightById, rng)
      : remaining[Math.floor(rng() * remaining.length)]
    winners.push(winner)
    remaining = remaining.filter((student) => student.id !== winner.id)
  }

  return winners
}

function countHistoricalPairs(req: GroupRequest): Map<string, number> {
  const rounds = Math.max(0, req.policy.pairAvoidRounds)
  if (rounds === 0) return new Map()

  const map = new Map<string, number>()
  req.history
    .filter((record) => record.classId === req.classId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, rounds)
    .forEach((record) => {
      const ids = record.pickedStudents.map((student) => student.id)
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const key = [ids[i], ids[j]].sort().join('::')
          map.set(key, (map.get(key) || 0) + 1)
        }
      }
    })
  return map
}

function pairPenalty(
  candidate: CandidateSnapshot,
  group: CandidateSnapshot[],
  pairCounts: Map<string, number>
): number {
  return group.reduce((sum, member) => {
    const key = [candidate.id, member.id].sort().join('::')
    return sum + (pairCounts.get(key) || 0)
  }, 0)
}

function assignBalancedGroups(
  req: GroupRequest,
  active: CandidateSnapshot[],
  rng: () => number
): CandidateSnapshot[][] {
  const safeGroupCount = Math.max(1, req.groupCount)
  const groups: CandidateSnapshot[][] = Array.from({ length: safeGroupCount }, () => [])
  const pairCounts = countHistoricalPairs(req)

  const ordered = [...active].sort((a, b) => (b.score || 0) - (a.score || 0))
  // small shuffle in equal scores to avoid fixed order
  for (let i = ordered.length - 1; i > 0; i--) {
    if ((ordered[i].score || 0) === (ordered[i - 1].score || 0) && rng() < 0.5) {
      ;[ordered[i], ordered[i - 1]] = [ordered[i - 1], ordered[i]]
    }
  }

  ordered.forEach((candidate) => {
    let targetIndex = 0
    let bestCost = Number.POSITIVE_INFINITY

    groups.forEach((group, index) => {
      const scoreCost = scoreByGroup(group)
      const pairCost = pairPenalty(candidate, group, pairCounts) * 100
      const sizeCost = group.length * 10
      const cost = scoreCost + pairCost + sizeCost
      if (cost < bestCost) {
        bestCost = cost
        targetIndex = index
      }
    })

    groups[targetIndex].push(candidate)
  })

  return groups
}

export class DefaultSelectionEngine implements SelectionEngine {
  pick(req: SelectionRequest): SelectionResult {
    const rng = req.rng ?? Math.random
    const traces = req.candidates.map(createTrace)
    const traceMap = toTraceMap(traces)
    const fallbackNotes: string[] = []

    const active = eligibleByStatus(req.candidates, traceMap)
    const manualExcludedIds = req.policy.manualExcludedIds || []
    let eligible = eligibleByManualExclusion(active, traceMap, manualExcludedIds)
    let cooldownExcludedIds: string[] = []

    const cooldownResult = eligibleByCooldown(req, eligible, traceMap)
    eligible = cooldownResult.eligible
    cooldownExcludedIds = cooldownResult.cooldownExcludedIds

    if (eligible.length === 0 && req.policy.autoRelaxOnConflict) {
      if (manualExcludedIds.length > 0) {
        fallbackNotes.push('已自动放宽临时禁选约束')
        eligible = active
        active.forEach((student) => {
          const trace = traceMap.get(student.id)
          if (trace) appendReason(trace, 'fallback_relaxed_constraints')
        })
      }

      if (eligible.length === 0) {
        fallbackNotes.push('已自动放宽冷却约束')
        eligible = active
      }
    }

    const requestedCount = Math.max(0, req.count)
    const actualCount = Math.min(requestedCount, eligible.length)
    const effectiveReq: SelectionRequest = { ...req, count: actualCount }
    const weightById = applyAdvancedWeights(effectiveReq, eligible, traceMap)
    const winners = pickPrioritizedUnpicked(effectiveReq, eligible, weightById, traceMap, rng)

    return {
      winners,
      traces,
      cooldownExcludedIds,
      meta: {
        engineVersion: ENGINE_VERSION,
        policySnapshot: req.policy,
        requestedCount,
        actualCount: winners.length,
        generatedAt: req.now ?? new Date().toISOString(),
        fallbackNotes
      }
    }
  }

  group(req: GroupRequest): GroupResult {
    const rng = req.rng ?? Math.random
    const traces = req.candidates.map(createTrace)
    const traceMap = toTraceMap(traces)
    const active = eligibleByStatus(req.candidates, traceMap)

    const groups =
      req.policy.groupStrategy === 'balanced-score'
        ? assignBalancedGroups(req, active, rng)
        : (() => {
            const shuffled = [...active]
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(rng() * (i + 1))
              ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
            }
            const safeGroupCount = Math.max(1, req.groupCount)
            const basic: CandidateSnapshot[][] = Array.from({ length: safeGroupCount }, () => [])
            shuffled.forEach((student, index) => {
              basic[index % safeGroupCount].push(student)
            })
            return basic
          })()

    return {
      groups,
      traces,
      meta: {
        engineVersion: ENGINE_VERSION,
        groupCount: Math.max(1, req.groupCount),
        generatedAt: new Date().toISOString()
      }
    }
  }
}

export const selectionEngine = new DefaultSelectionEngine()
