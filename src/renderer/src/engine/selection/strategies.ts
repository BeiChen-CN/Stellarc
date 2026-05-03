import type { CandidateSnapshot, SelectionStrategyPreset } from './types'

export interface StrategyDescriptor {
  id: SelectionStrategyPreset
  name: string
  description: string
  adjustWeight: (student: CandidateSnapshot, baseWeight: number) => number
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

const strategies: StrategyDescriptor[] = [classicStrategy, balancedStrategy, momentumStrategy]
const registry = new Map<SelectionStrategyPreset, StrategyDescriptor>(
  strategies.map((strategy) => [strategy.id, strategy])
)

export function getStrategyDescriptor(id: SelectionStrategyPreset): StrategyDescriptor {
  return registry.get(id) || classicStrategy
}

export function listStrategyDescriptors(): StrategyDescriptor[] {
  return strategies
}

export function getStrategyDisplayList(): StrategyDescriptor[] {
  return listStrategyDescriptors()
}
