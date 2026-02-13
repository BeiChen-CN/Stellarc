import { create } from 'zustand'

import {
  listStrategyDescriptors,
  loadStrategyPlugins,
  resetDynamicStrategies,
  type StrategyPluginConfig
} from '../engine/selection/strategies'

interface StrategyState {
  loaded: boolean
  loadedCount: number
  lastErrors: string[]
  sourceFile: string
  loadPlugins: () => Promise<void>
}

function normalizePlugins(input: unknown): StrategyPluginConfig[] {
  if (Array.isArray(input)) {
    return input as StrategyPluginConfig[]
  }

  if (input && typeof input === 'object') {
    const raw = input as Record<string, unknown>
    if (Array.isArray(raw.plugins)) {
      return raw.plugins as StrategyPluginConfig[]
    }
  }

  return []
}

export const useStrategyStore = create<StrategyState>((set) => ({
  loaded: false,
  loadedCount: 0,
  lastErrors: [],
  sourceFile: 'strategy-plugins.json',

  loadPlugins: async () => {
    resetDynamicStrategies()

    try {
      const data = await window.electronAPI.readJson('strategy-plugins.json')
      const plugins = normalizePlugins(data)
      const result = loadStrategyPlugins(plugins)

      set({
        loaded: true,
        loadedCount: result.loaded,
        lastErrors: result.errors
      })
    } catch (error) {
      set({
        loaded: true,
        loadedCount: 0,
        lastErrors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }
}))

export function getStrategyDisplayList() {
  return listStrategyDescriptors()
}
