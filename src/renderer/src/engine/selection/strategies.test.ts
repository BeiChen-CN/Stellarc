import { describe, expect, it } from 'vitest'

import {
  getStrategyDescriptor,
  listStrategyDescriptors,
  loadStrategyPlugins,
  resetDynamicStrategies
} from './strategies'

describe('strategy plugins', () => {
  it('loads plugin descriptors and resolves by id', () => {
    resetDynamicStrategies()
    const result = loadStrategyPlugins([
      {
        id: 'test-plugin',
        name: 'Test Plugin',
        scoreFactor: 0.1,
        pickDecayFactor: 0.2
      }
    ])

    expect(result.loaded).toBe(1)
    expect(result.errors.length).toBe(0)
    expect(getStrategyDescriptor('test-plugin').name).toBe('Test Plugin')
  })

  it('keeps builtin strategies after reset', () => {
    resetDynamicStrategies()
    const ids = listStrategyDescriptors().map((item) => item.id)
    expect(ids).toContain('classic')
    expect(ids).toContain('balanced')
    expect(ids).toContain('momentum')
  })
})
