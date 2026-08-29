import { create } from 'zustand'
import { useToastStore } from './toastStore'
import { logger } from '../lib/logger'
import type { SoundIntensity } from '../types'

export type { SoundIntensity }

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
  | 'neo-brutalism'
  | 'editorial'
  | 'cyber-grid'

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

export type ImmersiveIslandStyle = 'classic' | 'beam' | 'slot' | 'pulse'

type StrategyPreset = string

interface SettingsData {
  theme: 'light' | 'dark' | 'system'
  colorTheme: ColorTheme
  customColor?: string
  designStyle: DesignStyle
  showStudentId: boolean
  photoMode: boolean
  soundEnabled: boolean
  soundIntensity: SoundIntensity
  confettiEnabled: boolean
  m3Mode: boolean
  backgroundImage?: string
  projectorMode: boolean
  showTemporaryExclusion: boolean
  showAutoDraw: boolean
  showSelectionExplanation: boolean
  showPickGenderFilter: boolean
  showPickEligibleCount: boolean
  showPickPreviewPanel: boolean
  showPickMissReasonPanel: boolean
  showTaskScorePanel: boolean
  showBatchEditPanel: boolean
  showScoreLogPanel: boolean
  showGroupTaskTemplatePanel: boolean
  colorThemesExpanded: boolean
  onboardingCompleted: boolean
  revealSettleMs: number
  animationStyle: AnimationStyle
  animationSpeed: AnimationSpeed
  animationDurationScale: number
  immersiveIslandStyle: ImmersiveIslandStyle
  dynamicColor: boolean
  fairness: {
    weightedRandom: boolean
    preventRepeat: boolean
    cooldownRounds: number
    strategyPreset: StrategyPreset
    balanceByTerm: boolean
    stageFairnessRounds: number
    prioritizeUnpickedCount: number
    groupStrategy: 'random' | 'balanced-score'
    pairAvoidRounds: number
    autoRelaxOnConflict: boolean
  }
  pickCount: number
  maxHistoryRecords: number
  shortcutKey: string
  semester: { name: string; startDate: string; endDate: string } | null
  scoreRules: {
    maxScorePerStudent: number
    minScorePerStudent: number
    maxDeltaPerOperation: number
    preventDuplicateTaskPerDay: boolean
    taskDailyLimitPerStudent: number
    allowRepeatTasks: string[]
    blockedTasks: string[]
  }
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
  setSoundIntensity: (intensity: SoundIntensity) => void
  toggleConfettiEnabled: () => void
  toggleM3Mode: () => void
  setBackgroundImage: (path: string | undefined) => void
  toggleProjectorMode: () => void
  toggleShowTemporaryExclusion: () => void
  toggleShowAutoDraw: () => void
  toggleShowSelectionExplanation: () => void
  toggleShowPickGenderFilter: () => void
  toggleShowPickEligibleCount: () => void
  toggleShowPickPreviewPanel: () => void
  toggleShowPickMissReasonPanel: () => void
  toggleShowTaskScorePanel: () => void
  toggleShowBatchEditPanel: () => void
  toggleShowScoreLogPanel: () => void
  toggleShowGroupTaskTemplatePanel: () => void
  setColorThemesExpanded: (expanded: boolean) => void
  completeOnboarding: () => void
  resetOnboarding: () => void
  setRevealSettleMs: (ms: number) => void
  setAnimationStyle: (style: AnimationStyle) => void
  setAnimationSpeed: (speed: AnimationSpeed) => void
  setAnimationDurationScale: (scale: number) => void
  setImmersiveIslandStyle: (style: ImmersiveIslandStyle) => void
  setCustomColor: (color: string | undefined) => void
  setFairness: (fairness: {
    weightedRandom: boolean
    preventRepeat: boolean
    cooldownRounds: number
    strategyPreset: StrategyPreset
    balanceByTerm: boolean
    stageFairnessRounds: number
    prioritizeUnpickedCount: number
    groupStrategy: 'random' | 'balanced-score'
    pairAvoidRounds: number
    autoRelaxOnConflict: boolean
  }) => void
  setPickCount: (count: number) => void
  setMaxHistoryRecords: (max: number) => Promise<void>
  setShortcutKey: (key: string) => Promise<boolean>
  toggleDynamicColor: () => void
  setDynamicColorPalette: (palette: DynamicColorPalette | null) => void
  extractAndApplyDynamicColor: () => Promise<void>
  setSemester: (semester: { name: string; startDate: string; endDate: string } | null) => void
  setScoreRules: (rules: {
    maxScorePerStudent: number
    minScorePerStudent: number
    maxDeltaPerOperation: number
    preventDuplicateTaskPerDay: boolean
    taskDailyLimitPerStudent: number
    allowRepeatTasks: string[]
    blockedTasks: string[]
  }) => void
  loadSettings: () => Promise<void>
}

const defaults: SettingsData = {
  theme: 'system',
  colorTheme: 'blue',
  designStyle: 'material-design-3',
  showStudentId: true,
  photoMode: true,
  soundEnabled: true,
  soundIntensity: 'medium',
  confettiEnabled: true,
  m3Mode: false,
  projectorMode: false,
  showTemporaryExclusion: false,
  showAutoDraw: false,
  showSelectionExplanation: false,
  showPickGenderFilter: false,
  showPickEligibleCount: false,
  showPickPreviewPanel: false,
  showPickMissReasonPanel: false,
  showTaskScorePanel: false,
  showBatchEditPanel: false,
  showScoreLogPanel: false,
  showGroupTaskTemplatePanel: false,
  colorThemesExpanded: true,
  onboardingCompleted: false,
  revealSettleMs: 900,
  animationStyle: 'slot',
  animationSpeed: 'balanced',
  animationDurationScale: 1,
  immersiveIslandStyle: 'classic',
  dynamicColor: false,
  pickCount: 1,
  maxHistoryRecords: 1000,
  shortcutKey: '',
  semester: null,
  scoreRules: {
    maxScorePerStudent: 100,
    minScorePerStudent: -50,
    maxDeltaPerOperation: 20,
    preventDuplicateTaskPerDay: true,
    taskDailyLimitPerStudent: 1,
    allowRepeatTasks: [],
    blockedTasks: []
  },
  fairness: {
    weightedRandom: false,
    preventRepeat: false,
    cooldownRounds: 0,
    strategyPreset: 'classic',
    balanceByTerm: false,
    stageFairnessRounds: 0,
    prioritizeUnpickedCount: 0,
    groupStrategy: 'random',
    pairAvoidRounds: 0,
    autoRelaxOnConflict: true
  }
}

const legacySettingKeys = new Set([
  'activityPreset',
  'showClassroomFlow',
  'showClassroomTemplate',
  'ruleTemplates',
  'syncEnabled',
  'syncFolder'
])

const saveSettings = async (state: SettingsData): Promise<void> => {
  try {
    // 持久化字段 = defaults 的全部键：新增设置项只需在 SettingsData 与
    // defaults 中各加一行，此处自动跟随，无需再手工罗列
    const payload: Record<string, unknown> = {}
    for (const key of Object.keys(defaults) as Array<keyof SettingsData>) {
      payload[key] = state[key]
    }
    await window.electronAPI.writeJson('settings.json', payload)
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

export const useSettingsStore = create<SettingsState>((set, get) => {
  type BooleanSettingKey = Exclude<
    { [K in keyof SettingsData]: SettingsData[K] extends boolean ? K : never }[keyof SettingsData],
    undefined
  >

  /** 通用布尔设置翻转：字段名只出现一次，避免 getter/setter 手写不一致 */
  const flip = (key: BooleanSettingKey) => (): void => {
    const partial: Partial<SettingsData> = {}
    partial[key] = !get()[key]
    updateAndSave(partial, set, get)
  }

  return {
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
          const rawSettings = Object.fromEntries(
            Object.entries(raw).filter(([key]) => !legacySettingKeys.has(key))
          )
          const next = {
            ...defaults,
            ...rawSettings,
            immersiveIslandStyle:
              typeof rawSettings.immersiveIslandStyle === 'string' &&
              ['classic', 'beam', 'slot', 'pulse'].includes(rawSettings.immersiveIslandStyle)
                ? (rawSettings.immersiveIslandStyle as ImmersiveIslandStyle)
                : defaults.immersiveIslandStyle,
            showTemporaryExclusion: false,
            showAutoDraw: false,
            showSelectionExplanation: false,
            showPickGenderFilter: false,
            showPickEligibleCount: false,
            showPickPreviewPanel: false,
            showPickMissReasonPanel: false,
            scoreRules:
              typeof raw.scoreRules === 'object' && raw.scoreRules
                ? {
                    ...defaults.scoreRules,
                    ...(raw.scoreRules as SettingsData['scoreRules'])
                  }
                : defaults.scoreRules,
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
              useToastStore
                .getState()
                .addToast(`快捷键 ${key} 注册失败（可能已被其他应用占用），已自动清除`, 'error')
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
    toggleShowStudentId: flip('showStudentId'),
    togglePhotoMode: flip('photoMode'),
    toggleSoundEnabled: flip('soundEnabled'),
    setSoundIntensity: (soundIntensity) => updateAndSave({ soundIntensity }, set, get),
    toggleConfettiEnabled: flip('confettiEnabled'),
    toggleM3Mode: flip('m3Mode'),
    toggleProjectorMode: flip('projectorMode'),
    toggleShowTemporaryExclusion: flip('showTemporaryExclusion'),
    toggleShowAutoDraw: flip('showAutoDraw'),
    toggleShowSelectionExplanation: flip('showSelectionExplanation'),
    toggleShowPickGenderFilter: () =>
      updateAndSave(
        {
          showPickGenderFilter: !get().showPickGenderFilter,
          showPickEligibleCount: !get().showPickGenderFilter ? get().showPickEligibleCount : false
        },
        set,
        get
      ),
    toggleShowPickEligibleCount: flip('showPickEligibleCount'),
    toggleShowPickPreviewPanel: flip('showPickPreviewPanel'),
    toggleShowPickMissReasonPanel: flip('showPickMissReasonPanel'),
    toggleShowTaskScorePanel: flip('showTaskScorePanel'),
    toggleShowBatchEditPanel: flip('showBatchEditPanel'),
    toggleShowScoreLogPanel: flip('showScoreLogPanel'),
    toggleShowGroupTaskTemplatePanel: flip('showGroupTaskTemplatePanel'),
    setColorThemesExpanded: (colorThemesExpanded) =>
      updateAndSave({ colorThemesExpanded }, set, get),
    completeOnboarding: () => updateAndSave({ onboardingCompleted: true }, set, get),
    resetOnboarding: () => updateAndSave({ onboardingCompleted: false }, set, get),
    setRevealSettleMs: (revealSettleMs) =>
      updateAndSave({ revealSettleMs: Math.max(0, Math.min(5000, revealSettleMs)) }, set, get),
    setBackgroundImage: (path) => {
      updateAndSave({ backgroundImage: path }, set, get)
      if (get().dynamicColor && path) {
        get().extractAndApplyDynamicColor()
      } else if (!path) {
        set({ dynamicColorPalette: null })
      }
    },
    setAnimationStyle: (style) => updateAndSave({ animationStyle: style }, set, get),
    setAnimationSpeed: (speed) => updateAndSave({ animationSpeed: speed }, set, get),
    setAnimationDurationScale: (scale) =>
      updateAndSave({ animationDurationScale: Math.max(0.6, Math.min(1.8, scale)) }, set, get),
    setImmersiveIslandStyle: (immersiveIslandStyle) =>
      updateAndSave({ immersiveIslandStyle }, set, get),
    setCustomColor: (color) => updateAndSave({ customColor: color }, set, get),
    setFairness: (fairness) => updateAndSave({ fairness }, set, get),
    setPickCount: (count) =>
      updateAndSave({ pickCount: Math.max(1, Math.min(10, count)) }, set, get),
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
    setScoreRules: (scoreRules) => {
      const safe = {
        maxScorePerStudent: Math.trunc(
          Math.max(-9999, Math.min(9999, scoreRules.maxScorePerStudent))
        ),
        minScorePerStudent: Math.trunc(
          Math.max(-9999, Math.min(9999, scoreRules.minScorePerStudent))
        ),
        maxDeltaPerOperation: Math.trunc(
          Math.max(1, Math.min(999, scoreRules.maxDeltaPerOperation))
        ),
        preventDuplicateTaskPerDay: scoreRules.preventDuplicateTaskPerDay,
        taskDailyLimitPerStudent: Math.trunc(
          Math.max(1, Math.min(50, scoreRules.taskDailyLimitPerStudent))
        ),
        allowRepeatTasks: (scoreRules.allowRepeatTasks || [])
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
          .slice(0, 30),
        blockedTasks: (scoreRules.blockedTasks || [])
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
          .slice(0, 30)
      }
      if (safe.minScorePerStudent > safe.maxScorePerStudent) {
        const tmp = safe.minScorePerStudent
        safe.minScorePerStudent = safe.maxScorePerStudent
        safe.maxScorePerStudent = tmp
      }
      updateAndSave({ scoreRules: safe }, set, get)
    },
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
  }
})
