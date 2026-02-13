import { classesV2Schema, type ClassesV2 } from '../schemas'

const SCHEMA_VERSION = 2

export function migrateClassesToV2(input: unknown, appVersion: string): ClassesV2 {
  const now = new Date().toISOString()

  const base: Partial<ClassesV2> = {
    classes: [],
    currentClassId: null
  }

  if (Array.isArray(input)) {
    base.classes = input
    base.currentClassId = input[0]?.id ?? null
  } else if (input && typeof input === 'object') {
    const raw = input as Record<string, unknown>
    base.classes = Array.isArray(raw.classes) ? raw.classes : []
    base.currentClassId = typeof raw.currentClassId === 'string' ? raw.currentClassId : null
  }

  const parsed = classesV2Schema.parse(base)
  return {
    ...parsed,
    _meta: {
      schemaVersion: SCHEMA_VERSION,
      migratedAt: now,
      appVersion
    }
  }
}
