import { create } from 'zustand'
import { useToastStore } from './toastStore'
import { logger } from '../lib/logger'

export type ColorTheme =
  | 'blue'
  | 'violet'
  | 'rose'
  | 'green'
  | 'orange'
  | 'amber'
  | 'teal'
  | 'slate'
  | 'cloud'
  | 'corundum'
  | 'kiwi'
  | 'spicy'
  | 'bright-teal'
  | 'sakura'
  | 'forest'
  | 'ocean'
  | 'mocha'
  | 'klein-blue'
  | 'tiffany'
  | 'prussian'
  | 'titian'
  | 'china-red'
  | 'burgundy'
  | 'schonbrunn'
  | 'vandyke'
  | 'marrs'
  | 'turquoise'
  | 'morandi'
  | 'hermes'

export type DesignStyle =
  | 'material-design-3'
  | 'flat'
  | 'minimalism'
  | 'glassmorphism'
  | 'claymorphism'
  | 'neumorphism'
  | 'skeuomorphism'
  | 'microinteractions'
  | 'apple-hig'

export type AnimationStyle =
  | 'scroll'
  | 'slot'
  | 'flip'
  | 'wheel'
  | 'bounce'
  | 'typewriter'
  | 'ripple'
  | 'charByChar'

export type AnimationSpeed = 'elegant' | 'balanced' | 'fast'

export type ActivityPreset = 'quick-pick' | 'deep-focus' | 'group-battle'

export type BuiltinStrategyPreset = 'classic' | 'balanced' | 'momentum'

export type StrategyPreset = string

const activityPresetDefaults: Record<
  ActivityPreset,
  {
    pickCount: number
    animationStyle: AnimationStyle
    fairness: {
      weightedRandom: boolean
      preventRepeat: boolean
      cooldownRounds: number
      strategyPreset: StrategyPreset
    }
  }
> = {
  'quick-pick': {
    pickCount: 1,
    animationStyle: 'slot',
    fairness: {
      weightedRandom: false,
      preventRepeat: false,
      cooldownRounds: 0,
      strategyPreset: 'classic'
    }
  },
  'deep-focus': {
    pickCount: 1,
    animationStyle: 'flip',
    fairness: {
      weightedRandom: true,
      preventRepeat: true,
      cooldownRounds: 2,
      strategyPreset: 'balanced'
    }
  },
  'group-battle': {
    pickCount: 2,
    animationStyle: 'wheel',
    fairness: {
      weightedRandom: true,
      preventRepeat: false,
      cooldownRounds: 0,
      strategyPreset: 'momentum'
    }
  }
}

interface SettingsData {
  theme: 'light' | 'dark' | 'system'
  colorTheme: ColorTheme
  customColor?: string
  designStyle: DesignStyle
  showStudentId: boolean
  photoMode: boolean
  soundEnabled: boolean
  confettiEnabled: boolean
  m3Mode: boolean
  backgroundImage?: string
  projectorMode: boolean
  activityPreset: ActivityPreset
  syncEnabled: boolean
  syncFolder?: string
  animationStyle: AnimationStyle
  animationSpeed: AnimationSpeed
  dynamicColor: boolean
  fairness: {
    weightedRandom: boolean
    preventRepeat: boolean
    cooldownRounds: number
    strategyPreset: StrategyPreset
  }
  pickCount: number
  maxHistoryRecords: number
  shortcutKey: string
  semester: { name: string; startDate: string; endDate: string } | null
}

export interface DynamicColorPalette {
  hue: number
  saturation: number
  lightness: number
  tertiaryHue: number
}

interface SettingsState extends SettingsData {
  dynamicColorPalette: DynamicColorPalette | null
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setColorTheme: (colorTheme: ColorTheme) => void
  setDesignStyle: (designStyle: DesignStyle) => void
  toggleShowStudentId: () => void
  togglePhotoMode: () => void
  toggleSoundEnabled: () => void
  toggleConfettiEnabled: () => void
  toggleM3Mode: () => void
  setBackgroundImage: (path: string | undefined) => void
  toggleSyncEnabled: () => void
  setSyncFolder: (path: string | undefined) => void
  toggleProjectorMode: () => void
  setActivityPreset: (preset: ActivityPreset) => void
  setAnimationStyle: (style: AnimationStyle) => void
  setAnimationSpeed: (speed: AnimationSpeed) => void
  setCustomColor: (color: string | undefined) => void
  setFairness: (fairness: {
    weightedRandom: boolean
    preventRepeat: boolean
    cooldownRounds: number
    strategyPreset: StrategyPreset
  }) => void
  setPickCount: (count: number) => void
  setMaxHistoryRecords: (max: number) => Promise<void>
  setShortcutKey: (key: string) => Promise<boolean>
  toggleDynamicColor: () => void
  setDynamicColorPalette: (palette: DynamicColorPalette | null) => void
  extractAndApplyDynamicColor: () => Promise<void>
  setSemester: (semester: { name: string; startDate: string; endDate: string } | null) => void
  loadSettings: () => Promise<void>
}

const defaults: SettingsData = {
  theme: 'system',
  colorTheme: 'blue',
  designStyle: 'material-design-3',
  showStudentId: true,
  photoMode: true,
  soundEnabled: true,
  confettiEnabled: true,
  m3Mode: false,
  projectorMode: false,
  activityPreset: 'quick-pick',
  syncEnabled: false,
  animationStyle: 'slot',
  animationSpeed: 'balanced',
  dynamicColor: false,
  pickCount: 1,
  maxHistoryRecords: 1000,
  shortcutKey: '',
  semester: null,
  fairness: {
    weightedRandom: false,
    preventRepeat: false,
    cooldownRounds: 0,
    strategyPreset: 'classic'
  }
}

const saveSettings = async (state: SettingsData): Promise<void> => {
  try {
    const {
      theme,
      colorTheme,
      customColor,
      designStyle,
      showStudentId,
      photoMode,
      soundEnabled,
      confettiEnabled,
      m3Mode,
      backgroundImage,
      projectorMode,
      activityPreset,
      syncEnabled,
      syncFolder,
      animationStyle,
      animationSpeed,
      dynamicColor,
      fairness,
      pickCount,
      maxHistoryRecords,
      shortcutKey,
      semester
    } = state
    await window.electronAPI.writeJson('settings.json', {
      theme,
      colorTheme,
      customColor,
      designStyle,
      showStudentId,
      photoMode,
      soundEnabled,
      confettiEnabled,
      m3Mode,
      backgroundImage,
      projectorMode,
      activityPreset,
      syncEnabled,
      syncFolder,
      animationStyle,
      animationSpeed,
      dynamicColor,
      fairness,
      pickCount,
      maxHistoryRecords,
      shortcutKey,
      semester
    })
  } catch (e) {
    logger.error('SettingsStore', 'Failed to save settings', e)
    useToastStore.getState().addToast('设置保存失败，请检查磁盘空间', 'error')
  }
}

const updateAndSave = (
  partial: Partial<SettingsData>,
  set: (p: Partial<SettingsData>) => void,
  get: () => SettingsState
): void => {
  set(partial)
  saveSettings(get())
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaults,
  dynamicColorPalette: null,

  loadSettings: async () => {
    try {
      const data = await window.electronAPI.readJson('settings.json')
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const raw = data as Record<string, unknown>
        // Migrate old m3-* color themes to new names
        const m3Migration: Record<string, ColorTheme> = {
          'm3-indigo': 'blue',
          'm3-sakura': 'sakura',
          'm3-forest': 'forest',
          'm3-ocean': 'ocean',
          'm3-mocha': 'mocha'
        }
        if (typeof raw.colorTheme === 'string' && raw.colorTheme in m3Migration) {
          raw.colorTheme = m3Migration[raw.colorTheme]
          // Auto-enable m3Mode when migrating from old m3 themes
          if (raw.m3Mode === undefined) {
            raw.m3Mode = true
          }
        }
        const next = {
          ...defaults,
          ...raw,
          fairness: {
            ...defaults.fairness,
            ...(typeof raw.fairness === 'object' && raw.fairness ? raw.fairness : {})
          }
        }
        set(next)
        const key = (raw as Partial<SettingsData>).shortcutKey
        if (key) {
          const success = await window.electronAPI.registerShortcut(key, 'pick')
          if (!success) {
            set({ shortcutKey: '' })
            saveSettings({ ...get(), shortcutKey: '' })
            useToastStore.getState().addToast(
              `快捷键 ${key} 注册失败（可能已被其他应用占用），已自动清除`,
              'error'
            )
          }
        }
      }
    } catch (e) {
      logger.error('SettingsStore', 'Failed to load settings', e)
    }
  },

  setTheme: (theme) => updateAndSave({ theme }, set, get),
  setColorTheme: (colorTheme) => updateAndSave({ colorTheme }, set, get),
  setDesignStyle: (designStyle) => updateAndSave({ designStyle }, set, get),
  toggleShowStudentId: () => updateAndSave({ showStudentId: !get().showStudentId }, set, get),
  togglePhotoMode: () => updateAndSave({ photoMode: !get().photoMode }, set, get),
  toggleSoundEnabled: () => updateAndSave({ soundEnabled: !get().soundEnabled }, set, get),
  toggleConfettiEnabled: () => updateAndSave({ confettiEnabled: !get().confettiEnabled }, set, get),
  toggleM3Mode: () => updateAndSave({ m3Mode: !get().m3Mode }, set, get),
  toggleProjectorMode: () => updateAndSave({ projectorMode: !get().projectorMode }, set, get),
  setActivityPreset: (activityPreset) => {
    const preset = activityPresetDefaults[activityPreset]
    updateAndSave(
      {
        activityPreset,
        pickCount: preset.pickCount,
        animationStyle: preset.animationStyle,
        fairness: preset.fairness
      },
      set,
      get
    )
  },
  setBackgroundImage: (path) => {
    updateAndSave({ backgroundImage: path }, set, get)
    if (get().dynamicColor && path) {
      get().extractAndApplyDynamicColor()
    } else if (!path) {
      set({ dynamicColorPalette: null })
    }
  },
  toggleSyncEnabled: () => updateAndSave({ syncEnabled: !get().syncEnabled }, set, get),
  setSyncFolder: (syncFolder) => updateAndSave({ syncFolder }, set, get),
  setAnimationStyle: (style) => updateAndSave({ animationStyle: style }, set, get),
  setAnimationSpeed: (speed) => updateAndSave({ animationSpeed: speed }, set, get),
  setCustomColor: (color) => updateAndSave({ customColor: color }, set, get),
  setFairness: (fairness) => updateAndSave({ fairness }, set, get),
  setPickCount: (count) => updateAndSave({ pickCount: Math.max(1, Math.min(10, count)) }, set, get),
  setMaxHistoryRecords: async (max) => {
    updateAndSave({ maxHistoryRecords: max }, set, get)
    // Trigger immediate truncation in historyStore
    try {
      const { useHistoryStore } = await import('./historyStore')
      const historyState = useHistoryStore.getState()
      if (historyState.history.length > max) {
        const trimmed = historyState.history.slice(0, max)
        useHistoryStore.setState({ history: trimmed })
        await window.electronAPI.writeJson('history.json', { records: trimmed })
      }
    } catch (e) {
      logger.error('SettingsStore', 'Failed to truncate history', e)
    }
  },
  setShortcutKey: async (key) => {
    const prev = get().shortcutKey
    const success = await window.electronAPI.registerShortcut(key, 'pick')
    if (!success) {
      return false
    }
    set({ shortcutKey: key })
    await saveSettings(get())
    if (!key && prev) {
      set({ shortcutKey: '' })
    }
    return true
  },
  toggleDynamicColor: () => {
    const next = !get().dynamicColor
    updateAndSave({ dynamicColor: next }, set, get)
    if (next && get().backgroundImage) {
      get().extractAndApplyDynamicColor()
    } else if (!next) {
      set({ dynamicColorPalette: null })
    }
  },
  setDynamicColorPalette: (palette) => set({ dynamicColorPalette: palette }),
  setSemester: (semester) => updateAndSave({ semester }, set, get),
  extractAndApplyDynamicColor: async () => {
    const { backgroundImage } = get()
    if (!backgroundImage) return
    try {
      const result = await window.electronAPI.extractWallpaperColors(backgroundImage)
      set({ dynamicColorPalette: result })
    } catch (e) {
      logger.error('SettingsStore', 'Failed to extract wallpaper colors', e)
      set({ dynamicColorPalette: null })
    }
  }
}))
