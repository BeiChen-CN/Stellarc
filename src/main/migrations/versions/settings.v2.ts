import { settingsV2Schema, type SettingsV2 } from '../schemas'

const SCHEMA_VERSION = 2

const m3ThemeMigration: Record<string, string> = {
  'm3-indigo': 'indigo',
  'm3-sakura': 'sakura',
  'm3-forest': 'forest',
  'm3-ocean': 'ocean',
  'm3-mocha': 'mocha'
}

export function migrateSettingsToV2(input: unknown, appVersion: string): SettingsV2 {
  const now = new Date().toISOString()

  const raw = input && typeof input === 'object' ? ({ ...input } as Record<string, unknown>) : {}

  if (typeof raw.colorTheme === 'string' && raw.colorTheme in m3ThemeMigration) {
    raw.colorTheme = m3ThemeMigration[raw.colorTheme]
    if (raw.m3Mode === undefined) {
      raw.m3Mode = true
    }
  }

  const parsed = settingsV2Schema.parse(raw)
  return {
    ...parsed,
    _meta: {
      schemaVersion: SCHEMA_VERSION,
      migratedAt: now,
      appVersion
    }
  }
}
