import { create } from 'zustand'

interface MigrationState {
  status: string
  startedAt?: string
  finishedAt?: string
  backupPath?: string
  appVersion?: string
  errorCode?: string
  errorMessage?: string
}

interface HealthReport {
  summary: {
    repaired: number
    error: number
    skipped: number
  }
  appVersion?: string
  timestamp?: string
  checks?: Array<{
    name: string
    status: string
    message?: string
  }>
}

interface DiagnosticsState {
  loading: boolean
  migrationState: MigrationState | null
  healthReport: HealthReport | null
  lastLoadedAt: string | null
  loadDiagnostics: () => Promise<void>
}

export const useDiagnosticsStore = create<DiagnosticsState>((set) => ({
  loading: false,
  migrationState: null,
  healthReport: null,
  lastLoadedAt: null,

  loadDiagnostics: async () => {
    set({ loading: true })
    try {
      const [migrationState, healthReport] = await Promise.all([
        window.electronAPI.readJson('migration-state.json'),
        window.electronAPI.readJson('health-report.json')
      ])

      set({
        loading: false,
        migrationState: (migrationState as MigrationState) ?? null,
        healthReport: (healthReport as HealthReport) ?? null,
        lastLoadedAt: new Date().toISOString()
      })
    } catch {
      set({ loading: false, lastLoadedAt: new Date().toISOString() })
    }
  }
}))
