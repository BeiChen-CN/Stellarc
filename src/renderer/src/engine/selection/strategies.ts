import type { BuiltinStrategyPreset, CandidateSnapshot, SelectionStrategyPreset } from './types'

export interface StrategyDescriptor {
  id: SelectionStrategyPreset
  name: string
  description: string
  adjustWeight: (student: CandidateSnapshot, baseWeight: number) => number
}

export interface StrategyPluginConfig {
  id: string
  name: string
  description?: string
  baseMultiplier?: number
  scoreFactor?: number
  pickDecayFactor?: number
  minWeight?: number
  maxWeight?: number
}

const classicStrategy: StrategyDescriptor = {
  id: 'classic',
  name: '经典',
  description: '严格按权重抽取',
  adjustWeight: (_student, baseWeight) => baseWeight
}

const balancedStrategy: StrategyDescriptor = {
  id: 'balanced',
  name: '均衡',
  description: '抽中次数越多，后续权重越低',
  adjustWeight: (student, baseWeight) => baseWeight / (1 + (student.pickCount || 0))
}

const momentumStrategy: StrategyDescriptor = {
  id: 'momentum',
  name: '激励',
  description: '高分学生获得额外权重加成',
  adjustWeight: (student, baseWeight) => {
    const scoreBoost = Math.max(0, student.score || 0) * 0.05
    return baseWeight * (1 + scoreBoost)
  }
}

const registry = new Map<SelectionStrategyPreset, StrategyDescriptor>([
  [classicStrategy.id, classicStrategy],
  [balancedStrategy.id, balancedStrategy],
  [momentumStrategy.id, momentumStrategy]
])

const builtinIds = new Set<BuiltinStrategyPreset>(['classic', 'balanced', 'momentum'])

function clamp(value: number, min?: number, max?: number): number {
  let next = value
  if (typeof min === 'number') {
    next = Math.max(min, next)
  }
  if (typeof max === 'number') {
    next = Math.min(max, next)
  }
  return next
}

function isSafeStrategyId(id: string): boolean {
  return /^[a-z0-9-]{2,40}$/.test(id)
}

export function registerStrategyDescriptor(descriptor: StrategyDescriptor): boolean {
  if (!descriptor.id || !descriptor.name) {
    return false
  }
  if (!isSafeStrategyId(descriptor.id)) {
    return false
  }
  if (builtinIds.has(descriptor.id as BuiltinStrategyPreset)) {
    return false
  }

  registry.set(descriptor.id, descriptor)
  return true
}

export function resetDynamicStrategies(): void {
  Array.from(registry.keys()).forEach((key) => {
    if (!builtinIds.has(key as BuiltinStrategyPreset)) {
      registry.delete(key)
    }
  })
}

function pluginToDescriptor(plugin: StrategyPluginConfig): StrategyDescriptor {
  return {
    id: plugin.id,
    name: plugin.name,
    description: plugin.description || '由策略插件提供',
    adjustWeight: (student, baseWeight) => {
      const baseMultiplier = plugin.baseMultiplier ?? 1
      const scoreFactor = plugin.scoreFactor ?? 0
      const pickDecayFactor = plugin.pickDecayFactor ?? 0
      const minWeight = plugin.minWeight ?? 0.1
      const maxWeight = plugin.maxWeight

      const scoreBoost = 1 + Math.max(0, student.score || 0) * scoreFactor
      const pickDecay = 1 + Math.max(0, student.pickCount || 0) * pickDecayFactor
      const raw = (baseWeight * baseMultiplier * scoreBoost) / pickDecay
      return clamp(raw, minWeight, maxWeight)
    }
  }
}

export function loadStrategyPlugins(configs: StrategyPluginConfig[]): {
  loaded: number
  errors: string[]
} {
  const errors: string[] = []
  let loaded = 0

  configs.forEach((config, index) => {
    if (!config || typeof config !== 'object') {
      errors.push(`plugins[${index}] is not an object`)
      return
    }

    if (!config.id || !config.name) {
      errors.push(`plugins[${index}] missing id or name`)
      return
    }

    const descriptor = pluginToDescriptor(config)
    const ok = registerStrategyDescriptor(descriptor)
    if (!ok) {
      errors.push(`plugins[${index}] failed to register id '${config.id}'`)
      return
    }

    loaded++
  })

  return { loaded, errors }
}

export function getStrategyDescriptor(id: SelectionStrategyPreset): StrategyDescriptor {
  return registry.get(id) || classicStrategy
}

export function listStrategyDescriptors(): StrategyDescriptor[] {
  return Array.from(registry.values())
}
