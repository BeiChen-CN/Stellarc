import { describe, expect, it } from 'vitest'

import {
  getStrategyDescriptor,
  listStrategyDescriptors,
  loadStrategyPlugins,
  resetDynamicStrategies
} from './strategies'

function checksumForPlugin(plugin: {
  id: string
  name: string
  description?: string
  baseMultiplier?: number
  scoreFactor?: number
  pickDecayFactor?: number
  minWeight?: number
  maxWeight?: number
  minAppVersion?: string
}): string {
  const payload = [
    plugin.id,
    plugin.name,
    plugin.description || '',
    plugin.baseMultiplier ?? '',
    plugin.scoreFactor ?? '',
    plugin.pickDecayFactor ?? '',
    plugin.minWeight ?? '',
    plugin.maxWeight ?? '',
    plugin.minAppVersion || ''
  ].join('|')
  let hash = 0
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(16)
}

describe('strategy plugins', () => {
  it('loads plugin descriptors and resolves by id', () => {
    resetDynamicStrategies()
    const plugin = {
      id: 'test-plugin',
      name: 'Test Plugin',
      scoreFactor: 0.1,
      pickDecayFactor: 0.2
    }
    const result = loadStrategyPlugins([
      {
        ...plugin,
        signature: checksumForPlugin(plugin)
      }
    ])

    expect(result.loaded).toBe(1)
    expect(result.errors.length).toBe(0)
    expect(getStrategyDescriptor('test-plugin').name).toBe('Test Plugin')
  })

  it('skips plugins without signature', () => {
    resetDynamicStrategies()
    const result = loadStrategyPlugins([
      {
        id: 'unsigned-plugin',
        name: 'Unsigned Plugin'
      }
    ])

    expect(result.loaded).toBe(0)
    expect(result.skipped).toBe(1)
  })

  it('keeps builtin strategies after reset', () => {
    resetDynamicStrategies()
    const ids = listStrategyDescriptors().map((item) => item.id)
    expect(ids).toContain('classic')
    expect(ids).toContain('balanced')
    expect(ids).toContain('momentum')
  })
})
