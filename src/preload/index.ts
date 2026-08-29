import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { ImmersiveWindowPhase, ImmersiveWindowPhaseOptions } from '../shared/types'

// Custom APIs for renderer
const api = {
  // Logging（渲染端 error/warn 转发主进程 electron-log 落盘）
  appendLog: (level: 'error' | 'warn' | 'info', message: string): Promise<boolean> =>
    ipcRenderer.invoke('renderer-log', level, message),

  // Data Storage
  readJson: (filename: string): Promise<unknown> => ipcRenderer.invoke('read-json', filename),
  writeJson: (filename: string, data: unknown): Promise<boolean> =>
    ipcRenderer.invoke('write-json', filename, data),

  // File Dialogs
  selectFile: (options: Electron.OpenDialogOptions): Promise<string | null> =>
    ipcRenderer.invoke('select-file', options),
  saveFile: (options: Electron.SaveDialogOptions): Promise<string | null> =>
    ipcRenderer.invoke('save-file', options),

  // File Operations
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  readTextFile: (filePath: string) => ipcRenderer.invoke('read-text-file', filePath),
  writeExportFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('write-export-file', filePath, content),

  // Photo Management
  copyPhoto: (sourcePath: string, targetName: string) =>
    ipcRenderer.invoke('copy-photo', sourcePath, targetName),

  // Color Extraction
  extractWallpaperColors: (imagePath: string) =>
    ipcRenderer.invoke('extract-wallpaper-colors', imagePath),

  // Shortcuts
  registerShortcut: (accelerator: string, action: string) =>
    ipcRenderer.invoke('register-shortcut', accelerator, action),
  onShortcutTriggered: (callback: (action: string) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, action: string): void =>
      callback(action)
    ipcRenderer.on('shortcut-triggered', subscription)
    return () => ipcRenderer.removeListener('shortcut-triggered', subscription)
  },

  // External Links
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  // Backup & Restore
  backupData: (targetPath: string) => ipcRenderer.invoke('backup-data', targetPath),
  restoreData: (sourcePath: string) => ipcRenderer.invoke('restore-data', sourcePath),

  // Auto Launch
  setAutoLaunch: (enabled: boolean) => ipcRenderer.invoke('set-auto-launch', enabled),
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),

  // Auto Update
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback: (status: string, info?: Record<string, unknown>) => void) => {
    const subscription = (
      _event: Electron.IpcRendererEvent,
      status: string,
      info?: Record<string, unknown>
    ): void => callback(status, info)
    ipcRenderer.on('update-status', subscription)
    return () => ipcRenderer.removeListener('update-status', subscription)
  },

  // Window Controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  setImmersiveWindowPhase: (
    phase: ImmersiveWindowPhase,
    options?: ImmersiveWindowPhaseOptions
  ): Promise<boolean> => ipcRenderer.invoke('set-immersive-window-phase', phase, options)
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
  const legacyWindow = window as unknown as Window & {
    electron: typeof electronAPI
    electronAPI: typeof api
  }
  legacyWindow.electron = electronAPI
  legacyWindow.electronAPI = api
}
