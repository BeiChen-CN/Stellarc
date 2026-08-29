import { describe, expect, it } from 'vitest'

import { migrateSettingsToV2 } from './settings.v2'

describe('migrateSettingsToV2', () => {
  it('migrates legacy m3 color theme and enables m3 mode', () => {
    const result = migrateSettingsToV2(
      {
        colorTheme: 'm3-ocean'
      },
      '1.0.0'
    )

    expect(result.colorTheme).toBe('ocean')
    expect(result.m3Mode).toBe(true)
    expect(result._meta?.schemaVersion).toBe(2)
  })

  it('maps m3-indigo to the existing blue theme (no indigo theme exists)', () => {
    const result = migrateSettingsToV2({ colorTheme: 'm3-indigo' }, '1.0.0')

    expect(result.colorTheme).toBe('blue')
  })

  it('defaults immersive island style to classic', () => {
    const result = migrateSettingsToV2({}, '1.0.0')

    expect(result.immersiveIslandStyle).toBe('classic')
  })

  it('keeps a persisted immersive island style', () => {
    const result = migrateSettingsToV2(
      {
        immersiveIslandStyle: 'pulse'
      },
      '1.0.0'
    )

    expect(result.immersiveIslandStyle).toBe('pulse')
  })
})
