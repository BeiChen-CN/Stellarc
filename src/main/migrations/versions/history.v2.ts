import { historyV2Schema, type HistoryV2 } from '../schemas'

const SCHEMA_VERSION = 2

export function migrateHistoryToV2(input: unknown, appVersion: string): HistoryV2 {
  const now = new Date().toISOString()

  const base: Partial<HistoryV2> = {
    records: []
  }

  if (Array.isArray(input)) {
    base.records = input
  } else if (input && typeof input === 'object') {
    const raw = input as Record<string, unknown>
    base.records = Array.isArray(raw.records) ? raw.records : []
  }

  const parsed = historyV2Schema.parse(base)
  return {
    ...parsed,
    _meta: {
      schemaVersion: SCHEMA_VERSION,
      migratedAt: now,
      appVersion
    }
  }
}
