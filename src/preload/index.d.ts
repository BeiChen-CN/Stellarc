import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    electronAPI: {
      readJson: (filename: string) => Promise<unknown>
      writeJson: (filename: string, data: unknown) => Promise<boolean>
      selectFile: (options: Electron.OpenDialogOptions) => Promise<string | null>
      selectFiles: (options: Electron.OpenDialogOptions) => Promise<string[] | null>
      selectFolder: () => Promise<string | null>
      saveFile: (options: Electron.SaveDialogOptions) => Promise<string | null>
      readFile: (filePath: string) => Promise<Uint8Array>
      readTextFile: (filePath: string) => Promise<string>
      writeExportFile: (filePath: string, content: string) => Promise<boolean>
      writeBinaryFile: (filePath: string, buffer: ArrayBuffer) => Promise<boolean>
      copyPhoto: (sourcePath: string, targetName: string) => Promise<string>
      deletePhoto: (photoPath: string) => Promise<boolean>
      getPhotoPath: (relativePath: string) => Promise<string | null>
      getDataPath: () => Promise<string>
      extractWallpaperColors: (imagePath: string) => Promise<{
        hue: number
        saturation: number
        lightness: number
        tertiaryHue: number
      } | null>
      getSystemTheme: () => Promise<string>
      onSystemThemeChanged: (callback: (theme: string) => void) => () => void
      registerShortcut: (accelerator: string, action: string) => Promise<boolean>
      onShortcutTriggered: (callback: (action: string) => void) => () => void
      backupData: (targetPath: string) => Promise<boolean>
      restoreData: (sourcePath: string) => Promise<boolean>
      createRestorePoint: (
        name: string
      ) => Promise<{ ok: boolean; name?: string; message?: string }>
      listRestorePoints: () => Promise<Array<{ name: string; path: string; createdAt: number }>>
      restoreFromPoint: (restorePointPath: string) => Promise<boolean>
      deleteRestorePoint: (restorePointPath: string) => Promise<boolean>
      deleteOldRestorePointsKeep: (keepCount: number) => Promise<{ ok: boolean; deleted: number }>
      deleteRestorePointsOlderThanDays: (days: number) => Promise<{ ok: boolean; deleted: number }>
      appendDiagnosticEvent: (event: {
        category: 'sync' | 'shortcut' | 'plugin' | 'self-check'
        level: 'info' | 'warn' | 'error'
        code: string
        message: string
        context?: Record<string, unknown>
      }) => Promise<boolean>
      openExternal: (url: string) => Promise<boolean>
      setAutoLaunch: (enabled: boolean) => Promise<boolean>
      getAutoLaunch: () => Promise<boolean>
      syncDataToFolder: (folderPath: string) => Promise<boolean>
      syncDataFromFolder: (folderPath: string) => Promise<boolean>
      syncDataToFolderV2: (folderPath: string) => Promise<{
        ok: boolean
        code: string
        message: string
        localFingerprint?: string
        remoteFingerprint?: string
      }>
      syncDataFromFolderV2: (
        folderPath: string,
        force: boolean
      ) => Promise<{
        ok: boolean
        code: string
        message: string
        localFingerprint?: string
        remoteFingerprint?: string
      }>
      getSyncStatus: (folderPath: string) => Promise<{
        ok: boolean
        code: string
        message: string
        localFingerprint?: string
        remoteFingerprint?: string
      }>
      checkForUpdates: () => Promise<boolean>
      downloadUpdate: () => Promise<boolean>
      installUpdate: () => Promise<void>
      onUpdateStatus: (
        callback: (status: string, info?: Record<string, unknown>) => void
      ) => () => void
      windowMinimize: () => Promise<void>
      windowMaximize: () => Promise<void>
      windowClose: () => Promise<void>
      windowIsMaximized: () => Promise<boolean>
    }
  }
}
