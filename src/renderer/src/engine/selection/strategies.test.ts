import { describe, expect, it } from 'vitest'

import { getStrategyDescriptor, listStrategyDescriptors } from './strategies'

describe('builtin strategies', () => {
  it('resolves registered builtin by id and falls back to classic', () => {
    expect(getStrategyDescriptor('balanced').id).toBe('balanced')
    expect(getStrategyDescriptor('momentum').id).toBe('momentum')
  })

  it('exposes exactly the three builtin strategies', () => {
    const ids = listStrategyDescriptors().map((item) => item.id)
    expect(ids).toEqual(['classic', 'balanced', 'momentum'])
  })

  it('adjusts weight per strategy semantics', () => {
    const pickedStudent = { score: 0, pickCount: 3 } as Parameters<
      ReturnType<typeof getStrategyDescriptor>['adjustWeight']
    >[0]

    expect(getStrategyDescriptor('classic').adjustWeight(pickedStudent, 2)).toBe(2)
    // 均衡策略：被抽中 3 次 → 权重除以 (1 + 3)
    expect(getStrategyDescriptor('balanced').adjustWeight(pickedStudent, 2)).toBeCloseTo(0.5)
  })
})
