import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Data Storage
  readJson: (filename: string): Promise<unknown> => ipcRenderer.invoke('read-json', filename),
  writeJson: (filename: string, data: unknown): Promise<boolean> =>
    ipcRenderer.invoke('write-json', filename, data),

  // File Dialogs
  selectFile: (options: Electron.OpenDialogOptions): Promise<string | null> =>
    ipcRenderer.invoke('select-file', options),
  selectFiles: (options: Electron.OpenDialogOptions): Promise<string[] | null> =>
    ipcRenderer.invoke('select-files', options),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  saveFile: (options: Electron.SaveDialogOptions): Promise<string | null> =>
    ipcRenderer.invoke('save-file', options),

  // File Operations
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  readTextFile: (filePath: string) => ipcRenderer.invoke('read-text-file', filePath),
  writeExportFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('write-export-file', filePath, content),
  writeBinaryFile: (filePath: string, buffer: ArrayBuffer) =>
    ipcRenderer.invoke('write-binary-file', filePath, buffer),

  // Photo Management
  copyPhoto: (sourcePath: string, targetName: string) =>
    ipcRenderer.invoke('copy-photo', sourcePath, targetName),
  deletePhoto: (photoPath: string) => ipcRenderer.invoke('delete-photo', photoPath),
  getPhotoPath: (relativePath: string) => ipcRenderer.invoke('get-photo-path', relativePath),

  // Path
  getDataPath: () => ipcRenderer.invoke('get-data-path'),

  // Color Extraction
  extractWallpaperColors: (imagePath: string) =>
    ipcRenderer.invoke('extract-wallpaper-colors', imagePath),

  // System Theme
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  onSystemThemeChanged: (callback: (theme: string) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, theme: string) => callback(theme)
    ipcRenderer.on('system-theme-changed', subscription)
    return () => ipcRenderer.removeListener('system-theme-changed', subscription)
  },

  // Shortcuts
  registerShortcut: (accelerator: string, action: string) =>
    ipcRenderer.invoke('register-shortcut', accelerator, action),
  onShortcutTriggered: (callback: (action: string) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, action: string) => callback(action)
    ipcRenderer.on('shortcut-triggered', subscription)
    return () => ipcRenderer.removeListener('shortcut-triggered', subscription)
  },

  // Backup & Restore
  backupData: (targetPath: string) => ipcRenderer.invoke('backup-data', targetPath),
  restoreData: (sourcePath: string) => ipcRenderer.invoke('restore-data', sourcePath),

  // External Links
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  // Auto Launch
  setAutoLaunch: (enabled: boolean) => ipcRenderer.invoke('set-auto-launch', enabled),
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  syncDataToFolder: (folderPath: string) => ipcRenderer.invoke('sync-data-to-folder', folderPath),
  syncDataFromFolder: (folderPath: string) =>
    ipcRenderer.invoke('sync-data-from-folder', folderPath),

  // Auto Update
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback: (status: string, info?: Record<string, unknown>) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, status: string, info?: Record<string, unknown>) =>
      callback(status, info)
    ipcRenderer.on('update-status', subscription)
    return () => ipcRenderer.removeListener('update-status', subscription)
  },

  // Window Controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('electronAPI', api)
  } catch (error) {
    console.error(error)
  }
} else {
  ;(window as any).electron = electronAPI
  ;(window as any).electronAPI = api
}
