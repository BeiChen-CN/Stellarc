export type MigrationErrorCode =
  | 'MIGRATION_PARSE_ERROR'
  | 'MIGRATION_WRITE_ERROR'
  | 'MIGRATION_ROLLBACK_ERROR'
  | 'MIGRATION_UNKNOWN_ERROR'

export interface MigrationState {
  status: 'running' | 'success' | 'failed'
  startedAt: string
  finishedAt?: string
  backupPath: string
  appVersion: string
  errorCode?: MigrationErrorCode
  errorMessage?: string
}

export interface MigrationResult {
  success: boolean
  skipped?: boolean
  backupPath: string
  stateFilePath: string
  errorCode?: MigrationErrorCode
  errorMessage?: string
}
