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
  skippedCount: number
  lastErrors: string[]
  lastDetails: Array<{ id: string; status: 'loaded' | 'skipped' | 'error'; reason?: string }>
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
  skippedCount: 0,
  lastErrors: [],
  lastDetails: [],
  sourceFile: 'strategy-plugins.json',

  loadPlugins: async () => {
    resetDynamicStrategies()

    try {
      const data = await window.electronAPI.readJson('strategy-plugins.json')
      const plugins = normalizePlugins(data)
      const result = loadStrategyPlugins(plugins)

      const existing = await window.electronAPI.readJson('diagnostics-events.json')
      const events = Array.isArray(existing) ? existing : []
      const pluginEvents = result.details.map((detail) => ({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        category: 'plugin',
        level: detail.status === 'error' ? 'error' : detail.status === 'skipped' ? 'warn' : 'info',
        code:
          detail.status === 'error'
            ? 'PLUGIN_LOAD_ERROR'
            : detail.status === 'skipped'
              ? 'PLUGIN_LOAD_SKIPPED'
              : 'PLUGIN_LOAD_OK',
        message: `策略插件 ${detail.id} ${detail.status}`,
        context: detail.reason ? { reason: detail.reason } : undefined
      }))
      await window.electronAPI.writeJson('diagnostics-events.json', [
        ...events.slice(-180),
        ...pluginEvents
      ])

      set({
        loaded: true,
        loadedCount: result.loaded,
        skippedCount: result.skipped,
        lastErrors: result.errors,
        lastDetails: result.details
      })
    } catch (error) {
      set({
        loaded: true,
        loadedCount: 0,
        skippedCount: 0,
        lastErrors: [error instanceof Error ? error.message : String(error)],
        lastDetails: []
      })
    }
  }
}))

export function getStrategyDisplayList() {
  return listStrategyDescriptors()
}
