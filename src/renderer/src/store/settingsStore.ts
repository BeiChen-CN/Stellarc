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

export type SoundIntensity = 'low' | 'medium' | 'high'

export type ActivityPreset = 'quick-pick' | 'deep-focus' | 'group-battle'

export type BuiltinStrategyPreset = 'classic' | 'balanced' | 'momentum'

export type StrategyPreset = string

export interface RuleTemplateItem {
  id: string
  name: string
  description?: string
  pickCount: number
  animationStyle: AnimationStyle
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
  groupTaskTemplates?: Array<{
    id: string
    name: string
    scoreDelta: number
  }>
  createdAt: string
  updatedAt: string
}

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
      balanceByTerm: boolean
      stageFairnessRounds: number
      prioritizeUnpickedCount: number
      groupStrategy: 'random' | 'balanced-score'
      pairAvoidRounds: number
      autoRelaxOnConflict: boolean
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
      strategyPreset: 'classic',
      balanceByTerm: false,
      stageFairnessRounds: 0,
      prioritizeUnpickedCount: 0,
      groupStrategy: 'random',
      pairAvoidRounds: 0,
      autoRelaxOnConflict: true
    }
  },
  'deep-focus': {
    pickCount: 1,
    animationStyle: 'flip',
    fairness: {
      weightedRandom: true,
      preventRepeat: true,
      cooldownRounds: 2,
      strategyPreset: 'balanced',
      balanceByTerm: true,
      stageFairnessRounds: 6,
      prioritizeUnpickedCount: 1,
      groupStrategy: 'balanced-score',
      pairAvoidRounds: 6,
      autoRelaxOnConflict: true
    }
  },
  'group-battle': {
    pickCount: 2,
    animationStyle: 'wheel',
    fairness: {
      weightedRandom: true,
      preventRepeat: false,
      cooldownRounds: 0,
      strategyPreset: 'momentum',
      balanceByTerm: false,
      stageFairnessRounds: 0,
      prioritizeUnpickedCount: 0,
      groupStrategy: 'balanced-score',
      pairAvoidRounds: 4,
      autoRelaxOnConflict: true
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
  soundIntensity: SoundIntensity
  confettiEnabled: boolean
  m3Mode: boolean
  backgroundImage?: string
  projectorMode: boolean
  activityPreset: ActivityPreset
  showClassroomFlow: boolean
  showClassroomTemplate: boolean
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
  onboardingCompleted: boolean
  revealSettleMs: number
  syncEnabled: boolean
  syncFolder?: string
  animationStyle: AnimationStyle
  animationSpeed: AnimationSpeed
  animationDurationScale: number
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
  ruleTemplates: RuleTemplateItem[]
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
  toggleSyncEnabled: () => void
  setSyncFolder: (path: string | undefined) => void
  toggleProjectorMode: () => void
  setActivityPreset: (preset: ActivityPreset) => void
  toggleShowClassroomFlow: () => void
  toggleShowClassroomTemplate: () => void
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
  completeOnboarding: () => void
  resetOnboarding: () => void
  setRevealSettleMs: (ms: number) => void
  setAnimationStyle: (style: AnimationStyle) => void
  setAnimationSpeed: (speed: AnimationSpeed) => void
  setAnimationDurationScale: (scale: number) => void
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
  addRuleTemplate: (template: Omit<RuleTemplateItem, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateRuleTemplate: (id: string, patch: Partial<RuleTemplateItem>) => void
  removeRuleTemplate: (id: string) => void
  replaceRuleTemplates: (templates: RuleTemplateItem[]) => void
  applyRuleTemplate: (id: string) => boolean
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
  activityPreset: 'quick-pick',
  showClassroomFlow: false,
  showClassroomTemplate: false,
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
  onboardingCompleted: false,
  revealSettleMs: 900,
  syncEnabled: false,
  animationStyle: 'slot',
  animationSpeed: 'balanced',
  animationDurationScale: 1,
  dynamicColor: false,
  pickCount: 1,
  maxHistoryRecords: 1000,
  shortcutKey: '',
  semester: null,
  ruleTemplates: [],
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
      soundIntensity,
      confettiEnabled,
      m3Mode,
      backgroundImage,
      projectorMode,
      activityPreset,
      showClassroomFlow,
      showClassroomTemplate,
      showTemporaryExclusion,
      showAutoDraw,
      showSelectionExplanation,
      showPickGenderFilter,
      showPickEligibleCount,
      showPickPreviewPanel,
      showPickMissReasonPanel,
      showTaskScorePanel,
      showBatchEditPanel,
      showScoreLogPanel,
      showGroupTaskTemplatePanel,
      onboardingCompleted,
      revealSettleMs,
      syncEnabled,
      syncFolder,
      animationStyle,
      animationSpeed,
      animationDurationScale,
      dynamicColor,
      fairness,
      pickCount,
      maxHistoryRecords,
      shortcutKey,
      semester,
      ruleTemplates,
      scoreRules
    } = state
    await window.electronAPI.writeJson('settings.json', {
      theme,
      colorTheme,
      customColor,
      designStyle,
      showStudentId,
      photoMode,
      soundEnabled,
      soundIntensity,
      confettiEnabled,
      m3Mode,
      backgroundImage,
      projectorMode,
      activityPreset,
      showClassroomFlow,
      showClassroomTemplate,
      showTemporaryExclusion,
      showAutoDraw,
      showSelectionExplanation,
      showPickGenderFilter,
      showPickEligibleCount,
      showPickPreviewPanel,
      showPickMissReasonPanel,
      showTaskScorePanel,
      showBatchEditPanel,
      showScoreLogPanel,
      showGroupTaskTemplatePanel,
      onboardingCompleted,
      revealSettleMs,
      syncEnabled,
      syncFolder,
      animationStyle,
      animationSpeed,
      animationDurationScale,
      dynamicColor,
      fairness,
      pickCount,
      maxHistoryRecords,
      shortcutKey,
      semester,
      ruleTemplates,
      scoreRules
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
          ruleTemplates: Array.isArray(raw.ruleTemplates)
            ? (raw.ruleTemplates as RuleTemplateItem[])
            : defaults.ruleTemplates,
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
  toggleShowStudentId: () => updateAndSave({ showStudentId: !get().showStudentId }, set, get),
  togglePhotoMode: () => updateAndSave({ photoMode: !get().photoMode }, set, get),
  toggleSoundEnabled: () => updateAndSave({ soundEnabled: !get().soundEnabled }, set, get),
  setSoundIntensity: (soundIntensity) => updateAndSave({ soundIntensity }, set, get),
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
  toggleShowClassroomFlow: () =>
    updateAndSave({ showClassroomFlow: !get().showClassroomFlow }, set, get),
  toggleShowClassroomTemplate: () =>
    updateAndSave({ showClassroomTemplate: !get().showClassroomTemplate }, set, get),
  toggleShowTemporaryExclusion: () =>
    updateAndSave({ showTemporaryExclusion: !get().showTemporaryExclusion }, set, get),
  toggleShowAutoDraw: () => updateAndSave({ showAutoDraw: !get().showAutoDraw }, set, get),
  toggleShowSelectionExplanation: () =>
    updateAndSave({ showSelectionExplanation: !get().showSelectionExplanation }, set, get),
  toggleShowPickGenderFilter: () =>
    updateAndSave(
      {
        showPickGenderFilter: !get().showPickGenderFilter,
        showPickEligibleCount: !get().showPickGenderFilter ? get().showPickEligibleCount : false
      },
      set,
      get
    ),
  toggleShowPickEligibleCount: () =>
    updateAndSave({ showPickEligibleCount: !get().showPickEligibleCount }, set, get),
  toggleShowPickPreviewPanel: () =>
    updateAndSave({ showPickPreviewPanel: !get().showPickPreviewPanel }, set, get),
  toggleShowPickMissReasonPanel: () =>
    updateAndSave({ showPickMissReasonPanel: !get().showPickMissReasonPanel }, set, get),
  toggleShowTaskScorePanel: () =>
    updateAndSave({ showTaskScorePanel: !get().showTaskScorePanel }, set, get),
  toggleShowBatchEditPanel: () =>
    updateAndSave({ showBatchEditPanel: !get().showBatchEditPanel }, set, get),
  toggleShowScoreLogPanel: () =>
    updateAndSave({ showScoreLogPanel: !get().showScoreLogPanel }, set, get),
  toggleShowGroupTaskTemplatePanel: () =>
    updateAndSave({ showGroupTaskTemplatePanel: !get().showGroupTaskTemplatePanel }, set, get),
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
  toggleSyncEnabled: () => updateAndSave({ syncEnabled: !get().syncEnabled }, set, get),
  setSyncFolder: (syncFolder) => updateAndSave({ syncFolder }, set, get),
  setAnimationStyle: (style) => updateAndSave({ animationStyle: style }, set, get),
  setAnimationSpeed: (speed) => updateAndSave({ animationSpeed: speed }, set, get),
  setAnimationDurationScale: (scale) =>
    updateAndSave({ animationDurationScale: Math.max(0.6, Math.min(1.8, scale)) }, set, get),
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
  addRuleTemplate: (template) => {
    const now = new Date().toISOString()
    const next: RuleTemplateItem = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    }
    updateAndSave({ ruleTemplates: [next, ...get().ruleTemplates].slice(0, 60) }, set, get)
  },
  updateRuleTemplate: (id, patch) => {
    updateAndSave(
      {
        ruleTemplates: get().ruleTemplates.map((item) =>
          item.id === id
            ? {
                ...item,
                ...patch,
                id: item.id,
                updatedAt: new Date().toISOString()
              }
            : item
        )
      },
      set,
      get
    )
  },
  removeRuleTemplate: (id) => {
    updateAndSave(
      {
        ruleTemplates: get().ruleTemplates.filter((item) => item.id !== id)
      },
      set,
      get
    )
  },
  replaceRuleTemplates: (templates) => {
    const normalized = templates
      .filter((item) => item && typeof item.name === 'string' && item.name.trim().length > 0)
      .map((item) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        name: item.name.trim(),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString()
      }))
      .slice(0, 60)
    updateAndSave({ ruleTemplates: normalized }, set, get)
  },
  applyRuleTemplate: (id) => {
    const target = get().ruleTemplates.find((item) => item.id === id)
    if (!target) return false
    updateAndSave(
      {
        pickCount: target.pickCount,
        animationStyle: target.animationStyle,
        fairness: target.fairness
      },
      set,
      get
    )
    return true
  },
  setScoreRules: (scoreRules) => {
    const safe = {
      maxScorePerStudent: Math.trunc(
        Math.max(-9999, Math.min(9999, scoreRules.maxScorePerStudent))
      ),
      minScorePerStudent: Math.trunc(
        Math.max(-9999, Math.min(9999, scoreRules.minScorePerStudent))
      ),
      maxDeltaPerOperation: Math.trunc(Math.max(1, Math.min(999, scoreRules.maxDeltaPerOperation))),
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
}))
