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
    warning?: number
    ok?: number
  }
  appVersion?: string
  timestamp?: string
  checkedAt?: string
  checks?: Array<{
    name: string
    status: string
    message?: string
  }>
  items?: Array<{
    name: string
    status: string
    message?: string
  }>
}

interface DiagnosticEvent {
  id: string
  timestamp: string
  category: string
  level: 'info' | 'warn' | 'error'
  code: string
  message: string
  context?: Record<string, unknown>
}

interface DiagnosticsState {
  loading: boolean
  migrationState: MigrationState | null
  healthReport: HealthReport | null
  events: DiagnosticEvent[]
  lastLoadedAt: string | null
  loadDiagnostics: () => Promise<void>
}

export const useDiagnosticsStore = create<DiagnosticsState>((set) => ({
  loading: false,
  migrationState: null,
  healthReport: null,
  events: [],
  lastLoadedAt: null,

  loadDiagnostics: async () => {
    set({ loading: true })
    try {
      const [migrationState, healthReport, events] = await Promise.all([
        window.electronAPI.readJson('migration-state.json'),
        window.electronAPI.readJson('health-report.json'),
        window.electronAPI.readJson('diagnostics-events.json')
      ])

      set({
        loading: false,
        migrationState: (migrationState as MigrationState) ?? null,
        healthReport: (healthReport as HealthReport) ?? null,
        events: Array.isArray(events) ? (events.slice(-20) as DiagnosticEvent[]) : [],
        lastLoadedAt: new Date().toISOString()
      })
    } catch {
      set({ loading: false, lastLoadedAt: new Date().toISOString() })
    }
  }
}))
