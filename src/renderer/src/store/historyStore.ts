import { create } from 'zustand'
import { useSettingsStore } from './settingsStore'
import { useToastStore } from './toastStore'
import type { HistorySelectionMeta } from '../engine/selection/types'

export interface HistoryRecord {
  id: string
  timestamp: string
  classId: string
  className: string
  pickedStudents: {
    id: string
    name: string
    studentId?: string
  }[]
  selectionMeta?: HistorySelectionMeta
}

interface HistoryState {
  history: HistoryRecord[]
  loadHistory: () => Promise<void>
  addHistoryRecord: (record: Omit<HistoryRecord, 'id' | 'timestamp'>) => Promise<void>
  clearHistory: () => Promise<void>
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: [],

  loadHistory: async () => {
    try {
      const data = await window.electronAPI.readJson('history.json') as Record<string, unknown> | unknown[] | null
      if (data && !Array.isArray(data) && Array.isArray((data as Record<string, unknown>).records)) {
        set({ history: (data as { records: HistoryRecord[] }).records })
      } else if (Array.isArray(data)) {
        set({ history: data as HistoryRecord[] })
      } else {
        set({ history: [] })
      }
    } catch (e) {
      console.error('Failed to load history', e)
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
      console.error('Failed to save history', e)
      useToastStore.getState().addToast('历史记录保存失败，请检查磁盘空间', 'error')
    }
  },

  clearHistory: async () => {
    set({ history: [] })
    try {
      await window.electronAPI.writeJson('history.json', { records: [] })
    } catch (e) {
      console.error('Failed to clear history', e)
      useToastStore.getState().addToast('历史记录清除失败', 'error')
    }
  }
}))
