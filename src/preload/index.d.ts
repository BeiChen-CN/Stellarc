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
      extractWallpaperColors: (
        imagePath: string
      ) => Promise<{
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
      openExternal: (url: string) => Promise<boolean>
      setAutoLaunch: (enabled: boolean) => Promise<boolean>
      getAutoLaunch: () => Promise<boolean>
      syncDataToFolder: (folderPath: string) => Promise<boolean>
      syncDataFromFolder: (folderPath: string) => Promise<boolean>
      checkForUpdates: () => Promise<boolean>
      downloadUpdate: () => Promise<boolean>
      installUpdate: () => Promise<void>
      onUpdateStatus: (callback: (status: string, info?: Record<string, unknown>) => void) => () => void
    }
  }
}
