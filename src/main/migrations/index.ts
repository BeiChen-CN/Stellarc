import path from 'path'

import { createBackup, ensureDir, readJsonFile, rollbackFromBackup, writeJsonAtomic } from './io'
import { migrateClassesToV2 } from './versions/classes.v2'
import { migrateHistoryToV2 } from './versions/history.v2'
import { migrateSettingsToV2 } from './versions/settings.v2'
import type { MigrationErrorCode, MigrationResult, MigrationState } from './types'

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function writeState(filePath: string, state: MigrationState): void {
  writeJsonAtomic(filePath, state)
}

function getSchemaVersion(input: unknown): number {
  if (!input || typeof input !== 'object') {
    return 0
  }

  const meta = (input as Record<string, unknown>)._meta
  if (!meta || typeof meta !== 'object') {
    return 0
  }

  const version = (meta as Record<string, unknown>).schemaVersion
  return typeof version === 'number' ? version : 0
}

export function runDataMigrations(dataPath: string, appVersion: string): MigrationResult {
  ensureDir(dataPath)

  const stateFilePath = path.join(dataPath, 'migration-state.json')
  const classesPath = path.join(dataPath, 'classes.json')
  const historyPath = path.join(dataPath, 'history.json')
  const settingsPath = path.join(dataPath, 'settings.json')

  const classesInput = readJsonFile(classesPath)
  const historyInput = readJsonFile(historyPath)
  const settingsInput = readJsonFile(settingsPath)

  const hasV2Data =
    getSchemaVersion(classesInput) >= 2 &&
    getSchemaVersion(historyInput) >= 2 &&
    getSchemaVersion(settingsInput) >= 2

  if (hasV2Data) {
    const now = new Date().toISOString()
    writeState(stateFilePath, {
      status: 'success',
      startedAt: now,
      finishedAt: now,
      backupPath: '',
      appVersion
    })
    return {
      success: true,
      skipped: true,
      backupPath: '',
      stateFilePath
    }
  }

  const backupPath = createBackup(dataPath)
  const startedAt = new Date().toISOString()

  writeState(stateFilePath, {
    status: 'running',
    startedAt,
    backupPath,
    appVersion
  })

  try {
    const classesV2 = migrateClassesToV2(classesInput, appVersion)
    const historyV2 = migrateHistoryToV2(historyInput, appVersion)
    const settingsV2 = migrateSettingsToV2(settingsInput, appVersion)

    writeJsonAtomic(classesPath, classesV2)
    writeJsonAtomic(historyPath, historyV2)
    writeJsonAtomic(settingsPath, settingsV2)

    writeState(stateFilePath, {
      status: 'success',
      startedAt,
      finishedAt: new Date().toISOString(),
      backupPath,
      appVersion
    })

    return {
      success: true,
      backupPath,
      stateFilePath
    }
  } catch (error) {
    const message = toErrorMessage(error)

    let errorCode: MigrationErrorCode = 'MIGRATION_UNKNOWN_ERROR'
    if (message.includes('Unexpected token') || message.includes('JSON')) {
      errorCode = 'MIGRATION_PARSE_ERROR'
    }

    try {
      rollbackFromBackup(dataPath, backupPath)
      writeState(stateFilePath, {
        status: 'failed',
        startedAt,
        finishedAt: new Date().toISOString(),
        backupPath,
        appVersion,
        errorCode,
        errorMessage: message
      })
    } catch (rollbackError) {
      const rollbackMessage = toErrorMessage(rollbackError)
      writeState(stateFilePath, {
        status: 'failed',
        startedAt,
        finishedAt: new Date().toISOString(),
        backupPath,
        appVersion,
        errorCode: 'MIGRATION_ROLLBACK_ERROR',
        errorMessage: rollbackMessage
      })

      return {
        success: false,
        backupPath,
        stateFilePath,
        errorCode: 'MIGRATION_ROLLBACK_ERROR',
        errorMessage: rollbackMessage
      }
    }

    return {
      success: false,
      backupPath,
      stateFilePath,
      errorCode,
      errorMessage: message
    }
  }
}
