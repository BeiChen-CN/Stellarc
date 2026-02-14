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
  enabled?: boolean
  minAppVersion?: string
  signature?: string
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

function parseVersion(input: string): number[] {
  return input
    .split('.')
    .map((part) => parseInt(part, 10))
    .map((n) => (Number.isFinite(n) ? n : 0))
}

function isVersionGte(current: string, required: string): boolean {
  const c = parseVersion(current)
  const r = parseVersion(required)
  const len = Math.max(c.length, r.length)
  for (let i = 0; i < len; i++) {
    const cv = c[i] ?? 0
    const rv = r[i] ?? 0
    if (cv > rv) return true
    if (cv < rv) return false
  }
  return true
}

function checksumForPlugin(plugin: StrategyPluginConfig): string {
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
  skipped: number
  errors: string[]
  details: Array<{ id: string; status: 'loaded' | 'skipped' | 'error'; reason?: string }>
} {
  const errors: string[] = []
  let loaded = 0
  let skipped = 0
  const details: Array<{ id: string; status: 'loaded' | 'skipped' | 'error'; reason?: string }> = []
  const currentVersion = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0'

  configs.forEach((config, index) => {
    if (!config || typeof config !== 'object') {
      errors.push(`plugins[${index}] is not an object`)
      details.push({ id: `plugins[${index}]`, status: 'error', reason: 'not object' })
      return
    }

    if (!config.id || !config.name) {
      errors.push(`plugins[${index}] missing id or name`)
      details.push({
        id: config.id || `plugins[${index}]`,
        status: 'error',
        reason: 'missing id/name'
      })
      return
    }

    if (config.enabled === false) {
      skipped++
      details.push({ id: config.id, status: 'skipped', reason: 'disabled' })
      return
    }

    if (config.minAppVersion && !isVersionGte(currentVersion, config.minAppVersion)) {
      skipped++
      details.push({
        id: config.id,
        status: 'skipped',
        reason: `requires app >= ${config.minAppVersion}`
      })
      return
    }

    if (config.signature) {
      const checksum = checksumForPlugin(config)
      if (checksum !== config.signature) {
        errors.push(`plugins[${index}] signature mismatch for '${config.id}'`)
        details.push({ id: config.id, status: 'error', reason: 'signature mismatch' })
        return
      }
    } else {
      skipped++
      details.push({ id: config.id, status: 'skipped', reason: 'missing signature' })
      return
    }

    const descriptor = pluginToDescriptor(config)
    const ok = registerStrategyDescriptor(descriptor)
    if (!ok) {
      errors.push(`plugins[${index}] failed to register id '${config.id}'`)
      details.push({ id: config.id, status: 'error', reason: 'failed to register' })
      return
    }

    loaded++
    details.push({ id: config.id, status: 'loaded' })
  })

  return { loaded, skipped, errors, details }
}

export function getStrategyDescriptor(id: SelectionStrategyPreset): StrategyDescriptor {
  return registry.get(id) || classicStrategy
}

export function listStrategyDescriptors(): StrategyDescriptor[] {
  return Array.from(registry.values())
}
