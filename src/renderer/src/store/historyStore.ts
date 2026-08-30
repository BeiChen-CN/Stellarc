import { create } from 'zustand'
import { useSettingsStore } from './settingsStore'
import { useToastStore } from './toastStore'
import { logger } from '../lib/logger'
import i18next from 'i18next'
import type { HistorySelectionMeta } from '../engine/selection/types'

export interface HistoryRecord {
  id: string
  timestamp: string
  classId: string
  className: string
  eventType?: 'pick' | 'group' | 'task'
  pickedStudents: {
    id: string
    name: string
    studentId?: string
  }[]
  groupSummary?: {
    groupCount: number
    groups: Array<{
      groupIndex: number
      studentIds: string[]
      studentNames: string[]
      taskTemplateId?: string
      taskName?: string
      taskScoreDelta?: number
    }>
  }
  taskSummary?: {
    taskName: string
    scoreDelta: number
    studentIds: string[]
    studentNames: string[]
    source: 'manual' | 'task-assignment' | 'batch'
  }
  selectionMeta?: HistorySelectionMeta
}

interface HistoryState {
  history: HistoryRecord[]
  loadHistory: () => Promise<void>
  addHistoryRecord: (record: Omit<HistoryRecord, 'id' | 'timestamp'>) => Promise<void>
  removeHistoryRecord: (id: string) => Promise<void>
  clearHistory: () => Promise<void>
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: [],

  loadHistory: async () => {
    try {
      const data = (await window.electronAPI.readJson('history.json')) as
        | Record<string, unknown>
        | unknown[]
        | null
      if (
        data &&
        !Array.isArray(data) &&
        Array.isArray((data as Record<string, unknown>).records)
      ) {
        set({ history: (data as { records: HistoryRecord[] }).records })
      } else if (Array.isArray(data)) {
        set({ history: data as HistoryRecord[] })
      } else {
        set({ history: [] })
      }
    } catch (e) {
      logger.error('HistoryStore', 'Failed to load history', e)
      set({ history: [] })
    }
  },

  addHistoryRecord: async (record) => {
    const newRecord: HistoryRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...record
    }

    // Unshift to add to beginning
    const maxRecords = useSettingsStore.getState().maxHistoryRecords
    const newHistory = [newRecord, ...get().history].slice(0, maxRecords)
    set({ history: newHistory })

    // Save
    try {
      // Save in legacy format { records: [] }
      await window.electronAPI.writeJson('history.json', { records: newHistory })
    } catch (e) {
      logger.error('HistoryStore', 'Failed to save history', e)
      useToastStore
        .getState()
        .addToast(i18next.t('历史记录保存失败，请重试；若持续出现请检查磁盘空间与权限'), 'error')
    }
  },

  clearHistory: async () => {
    set({ history: [] })
    try {
      await window.electronAPI.writeJson('history.json', { records: [] })
    } catch (e) {
      logger.error('HistoryStore', 'Failed to clear history', e)
      useToastStore.getState().addToast(i18next.t('历史记录清除失败'), 'error')
    }
  },

  removeHistoryRecord: async (id) => {
    const newHistory = get().history.filter((r) => r.id !== id)
    set({ history: newHistory })
    try {
      await window.electronAPI.writeJson('history.json', { records: newHistory })
    } catch (e) {
      logger.error('HistoryStore', 'Failed to remove history record', e)
      useToastStore.getState().addToast(i18next.t('删除记录失败'), 'error')
    }
  }
}))

// 设置中「最大记录数」变化时立即截断内存与持久化记录。
// 由 historyStore 订阅 settingsStore（单向依赖），避免 settingsStore
// 反向动态 import 本模块来绕开循环依赖。
useSettingsStore.subscribe((state, prevState) => {
  if (state.maxHistoryRecords === prevState.maxHistoryRecords) return
  const max = state.maxHistoryRecords
  const current = useHistoryStore.getState().history
  if (current.length <= max) return
  const trimmed = current.slice(0, max)
  useHistoryStore.setState({ history: trimmed })
  window.electronAPI
    .writeJson('history.json', { records: trimmed })
    .catch((e: unknown) => logger.error('HistoryStore', 'Failed to truncate history', e))
})
