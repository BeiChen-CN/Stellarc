import { describe, expect, it } from 'vitest'
import { DefaultSelectionEngine } from './index'
import type { SelectionRequest, GroupRequest, CandidateSnapshot, SelectionPolicy } from './types'

function makeStudent(
  id: string,
  name: string,
  overrides?: Partial<CandidateSnapshot>
): CandidateSnapshot {
  return {
    id,
    name,
    studentId: id,
    status: 'active',
    weight: 1,
    pickCount: 0,
    score: 0,
    classId: 'class-1',
    className: 'Test Class',
    ...overrides
  }
}

const defaultPolicy: SelectionPolicy = {
  weightedRandom: false,
  preventRepeat: false,
  cooldownRounds: 0,
  strategyPreset: 'classic',
  balanceByTerm: false,
  stageFairnessRounds: 0,
  prioritizeUnpickedCount: 0,
  groupStrategy: 'random',
  pairAvoidRounds: 0,
  autoRelaxOnConflict: true
}

function makePickRequest(overrides?: Partial<SelectionRequest>): SelectionRequest {
  return {
    mode: 'pick',
    classId: 'class-1',
    className: 'Test Class',
    candidates: [makeStudent('1', 'Alice'), makeStudent('2', 'Bob'), makeStudent('3', 'Charlie')],
    history: [],
    count: 1,
    policy: defaultPolicy,
    rng: () => 0.5,
    ...overrides
  }
}

describe('DefaultSelectionEngine.pick', () => {
  const engine = new DefaultSelectionEngine()

  it('picks the requested number of students', () => {
    const result = engine.pick(makePickRequest({ count: 2 }))
    expect(result.winners).toHaveLength(2)
    expect(result.meta.actualCount).toBe(2)
  })

  it('does not pick more than available students', () => {
    const result = engine.pick(makePickRequest({ count: 10 }))
    expect(result.winners).toHaveLength(3)
  })

  it('excludes inactive students', () => {
    const result = engine.pick(
      makePickRequest({
        candidates: [
          makeStudent('1', 'Alice'),
          makeStudent('2', 'Bob', { status: 'absent' }),
          makeStudent('3', 'Charlie', { status: 'excluded' })
        ],
        count: 3
      })
    )
    expect(result.winners).toHaveLength(1)
    expect(result.winners[0].name).toBe('Alice')
  })

  it('excludes recently picked students when cooldown is enabled', () => {
    const result = engine.pick(
      makePickRequest({
        candidates: [makeStudent('1', 'Alice'), makeStudent('2', 'Bob')],
        policy: { ...defaultPolicy, preventRepeat: true, cooldownRounds: 1 },
        history: [
          {
            id: 'h1',
            timestamp: new Date().toISOString(),
            classId: 'class-1',
            pickedStudents: [{ id: '1', name: 'Alice' }]
          }
        ],
        count: 1
      })
    )
    expect(result.winners[0].name).toBe('Bob')
    expect(result.cooldownExcludedIds).toContain('1')
  })

  it('falls back to all active when cooldown excludes everyone', () => {
    const result = engine.pick(
      makePickRequest({
        candidates: [makeStudent('1', 'Alice')],
        policy: { ...defaultPolicy, preventRepeat: true, cooldownRounds: 1 },
        history: [
          {
            id: 'h1',
            timestamp: new Date().toISOString(),
            classId: 'class-1',
            pickedStudents: [{ id: '1', name: 'Alice' }]
          }
        ],
        count: 1
      })
    )
    expect(result.winners).toHaveLength(1)
    expect(result.cooldownExcludedIds).toHaveLength(0)
  })

  it('produces deterministic results with fixed rng', () => {
    let callCount = 0
    const rng = () => {
      callCount++
      return 0.1
    }
    const r1 = engine.pick(makePickRequest({ rng }))
    callCount = 0
    const r2 = engine.pick(makePickRequest({ rng: () => 0.1 }))
    expect(r1.winners[0].id).toBe(r2.winners[0].id)
  })

  it('generates traces for all candidates', () => {
    const result = engine.pick(makePickRequest())
    expect(result.traces).toHaveLength(3)
    result.traces.forEach((trace) => {
      expect(trace.reasons).toContain('eligible')
    })
  })

  it('returns empty winners for zero count', () => {
    const result = engine.pick(makePickRequest({ count: 0 }))
    expect(result.winners).toHaveLength(0)
    expect(result.meta.actualCount).toBe(0)
  })
})

describe('DefaultSelectionEngine.group', () => {
  const engine = new DefaultSelectionEngine()

  function makeGroupRequest(overrides?: Partial<GroupRequest>): GroupRequest {
    return {
      mode: 'group',
      classId: 'class-1',
      className: 'Test Class',
      candidates: [
        makeStudent('1', 'Alice'),
        makeStudent('2', 'Bob'),
        makeStudent('3', 'Charlie'),
        makeStudent('4', 'Diana')
      ],
      history: [],
      groupCount: 2,
      policy: defaultPolicy,
      rng: () => 0.5,
      ...overrides
    }
  }

  it('distributes students into requested number of groups', () => {
    const result = engine.group(makeGroupRequest())
    expect(result.groups).toHaveLength(2)
    const total = result.groups.reduce((sum, g) => sum + g.length, 0)
    expect(total).toBe(4)
  })

  it('excludes inactive students from groups', () => {
    const result = engine.group(
      makeGroupRequest({
        candidates: [
          makeStudent('1', 'Alice'),
          makeStudent('2', 'Bob', { status: 'absent' }),
          makeStudent('3', 'Charlie'),
          makeStudent('4', 'Diana')
        ]
      })
    )
    const allStudents = result.groups.flat()
    expect(allStudents).toHaveLength(3)
    expect(allStudents.find((s) => s.name === 'Bob')).toBeUndefined()
  })

  it('handles groupCount of 1', () => {
    const result = engine.group(makeGroupRequest({ groupCount: 1 }))
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0]).toHaveLength(4)
  })

  it('handles groupCount larger than student count', () => {
    const result = engine.group(makeGroupRequest({ groupCount: 10 }))
    expect(result.groups).toHaveLength(10)
    const nonEmpty = result.groups.filter((g) => g.length > 0)
    expect(nonEmpty.length).toBeLessThanOrEqual(4)
  })
})
