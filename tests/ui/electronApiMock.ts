import type { Page } from '@playwright/test'

export async function installElectronApiMock(
  page: Page,
  seed: Record<string, unknown> = {}
): Promise<void> {
  await page.addInitScript((initialSeed: Record<string, unknown>) => {
    const jsonStore = new Map<string, unknown>([
      ['settings.json', { onboardingCompleted: true }],
      ['classes.json', { classes: [], currentClassId: null }],
      ['history.json', { records: [] }],
      ['migration-state.json', { status: 'ok' }],
      [
        'health-report.json',
        { summary: { ok: 0, warning: 0, error: 0, repaired: 0 }, checks: [], items: [] }
      ],
      ['diagnostics-events.json', []]
    ])
    Object.entries(initialSeed).forEach(([filename, data]) => {
      jsonStore.set(filename, data)
    })
    const immersivePhases: string[] = []
    const immersivePhaseSnapshots: Array<{
      phase: string
      htmlBackground: string
      bodyBackground: string
      rootBackground: string
    }> = []
    let selectFileResult: string | null = null
    const textFiles = new Map<string, string>()

    const getBackgroundSnapshot = (
      phase: string
    ): {
      phase: string
      htmlBackground: string
      bodyBackground: string
      rootBackground: string
    } => {
      const root = document.getElementById('root')
      return {
        phase,
        htmlBackground: window.getComputedStyle(document.documentElement).backgroundColor,
        bodyBackground: window.getComputedStyle(document.body).backgroundColor,
        rootBackground: root ? window.getComputedStyle(root).backgroundColor : ''
      }
    }

    const api = {
      readJson: async (filename: string): Promise<unknown> => jsonStore.get(filename) ?? null,
      writeJson: async (filename: string, data: unknown): Promise<boolean> => {
        jsonStore.set(filename, data)
        return true
      },
      selectFile: async (): Promise<string | null> => selectFileResult,
      selectFiles: async (): Promise<string[] | null> => null,
      selectFolder: async (): Promise<string | null> => null,
      saveFile: async (): Promise<string | null> => null,
      readFile: async (): Promise<Uint8Array> => new Uint8Array(),
      readTextFile: async (path: string): Promise<string> => textFiles.get(path) ?? '',
      writeExportFile: async (): Promise<boolean> => true,
      writeBinaryFile: async (): Promise<boolean> => true,
      copyPhoto: async (): Promise<string> => '',
      deletePhoto: async (): Promise<boolean> => true,
      getPhotoPath: async (): Promise<string | null> => null,
      getDataPath: async (): Promise<string> => '',
      extractWallpaperColors: async (): Promise<null> => null,
      getSystemTheme: async (): Promise<string> => 'light',
      onSystemThemeChanged: (): (() => void) => () => undefined,
      registerShortcut: async (): Promise<boolean> => true,
      onShortcutTriggered: (): (() => void) => () => undefined,
      backupData: async (): Promise<boolean> => true,
      restoreData: async (): Promise<boolean> => true,
      appendDiagnosticEvent: async (): Promise<boolean> => true,
      openExternal: async (): Promise<boolean> => true,
      setAutoLaunch: async (): Promise<boolean> => true,
      getAutoLaunch: async (): Promise<boolean> => false,
      checkForUpdates: async (): Promise<boolean> => false,
      downloadUpdate: async (): Promise<boolean> => false,
      installUpdate: async (): Promise<void> => undefined,
      onUpdateStatus: (): (() => void) => () => undefined,
      windowMinimize: async (): Promise<void> => undefined,
      windowMaximize: async (): Promise<void> => undefined,
      windowClose: async (): Promise<void> => undefined,
      windowIsMaximized: async (): Promise<boolean> => false,
      setImmersiveWindowPhase: async (phase: string): Promise<boolean> => {
        immersivePhases.push(phase)
        immersivePhaseSnapshots.push(getBackgroundSnapshot(phase))
        return true
      }
    }

    const target = window as unknown as {
      electron: Record<string, unknown>
      electronAPI: typeof api
      __electronApiMock: {
        setJson: (filename: string, data: unknown) => void
        getJson: (filename: string) => unknown
        setSelectFileResult: (path: string | null) => void
        setTextFile: (path: string, content: string) => void
        getImmersivePhases: () => string[]
        getImmersivePhaseSnapshots: () => Array<{
          phase: string
          htmlBackground: string
          bodyBackground: string
          rootBackground: string
        }>
      }
    }
    target.electron = {}
    target.electronAPI = api
    target.__electronApiMock = {
      setJson: (filename: string, data: unknown) => {
        jsonStore.set(filename, data)
      },
      getJson: (filename: string) => jsonStore.get(filename),
      setSelectFileResult: (path: string | null) => {
        selectFileResult = path
      },
      setTextFile: (path: string, content: string) => {
        textFiles.set(path, content)
      },
      getImmersivePhases: () => [...immersivePhases],
      getImmersivePhaseSnapshots: () => immersivePhaseSnapshots.map((snapshot) => ({ ...snapshot }))
    }
  }, seed)
}
