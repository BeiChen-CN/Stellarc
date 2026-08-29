import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSettingsStore } from './settingsStore'

const writeJson = vi.fn<() => Promise<boolean>>()
const readJson = vi.fn<() => Promise<unknown>>()

beforeEach(() => {
  writeJson.mockResolvedValue(true)
  readJson.mockResolvedValue(null)
  vi.stubGlobal('window', {
    electronAPI: {
      readJson,
      writeJson,
      registerShortcut: vi.fn().mockResolvedValue(true),
      extractWallpaperColors: vi.fn().mockResolvedValue(null)
    }
  })
  useSettingsStore.setState({
    colorThemesExpanded: true,
    immersiveIslandStyle: 'classic'
  })
})

describe('settingsStore color theme expansion', () => {
  it('keeps theme colors expanded by default', () => {
    expect(useSettingsStore.getState().colorThemesExpanded).toBe(true)
  })

  it('persists the theme color expansion preference', () => {
    useSettingsStore.getState().setColorThemesExpanded(false)

    expect(writeJson).toHaveBeenCalledWith(
      'settings.json',
      expect.objectContaining({ colorThemesExpanded: false })
    )
  })

  it('loads the persisted theme color expansion preference', async () => {
    readJson.mockResolvedValue({ colorThemesExpanded: false })

    await useSettingsStore.getState().loadSettings()

    expect(useSettingsStore.getState().colorThemesExpanded).toBe(false)
  })
})

describe('settingsStore immersive island style', () => {
  it('keeps the classic island style by default', () => {
    expect(useSettingsStore.getState().immersiveIslandStyle).toBe('classic')
  })

  it('persists the immersive island style preference', () => {
    useSettingsStore.getState().setImmersiveIslandStyle('pulse')

    expect(writeJson).toHaveBeenCalledWith(
      'settings.json',
      expect.objectContaining({ immersiveIslandStyle: 'pulse' })
    )
  })

  it('loads the persisted immersive island style preference', async () => {
    readJson.mockResolvedValue({ immersiveIslandStyle: 'beam' })

    await useSettingsStore.getState().loadSettings()

    expect(useSettingsStore.getState().immersiveIslandStyle).toBe('beam')
  })
})

describe('settingsStore persistence whitelist', () => {
  it('persists optional fields instead of silently dropping them', () => {
    // 回归防护：saveSettings 按 defaults 的键做白名单，
    // 可选字段若未在 defaults 登记会被静默丢弃（重启后丢失）
    useSettingsStore.getState().setCustomColor('#123456')
    useSettingsStore.getState().setBackgroundImage('C:/wall.jpg')

    const payloads = (
      writeJson.mock.calls as unknown as Array<[string, Record<string, unknown>]>
    ).map((call) => call[1])
    expect(payloads.some((p) => p.customColor === '#123456')).toBe(true)
    expect(payloads.some((p) => p.backgroundImage === 'C:/wall.jpg')).toBe(true)
  })
})
