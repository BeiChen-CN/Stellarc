import { app, nativeTheme, globalShortcut, shell, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import archiver from 'archiver'
import extractZip from 'extract-zip'
import { z } from 'zod/v4'
import log from 'electron-log'
import { BaseController } from './BaseController'
import { FileController } from './FileController'

const shortcutSchema = z.tuple([z.string(), z.string()])
const pathSchema = z.tuple([z.string().min(1)])
const urlSchema = z.tuple([z.string().url()])
const boolSchema = z.tuple([z.boolean()])

export class AppController extends BaseController {
  private dataPath: string
  private photosPath: string
  private registeredShortcut: string | null = null

  constructor(dataPath: string) {
    super()
    this.dataPath = dataPath
    this.photosPath = path.join(this.dataPath, 'photos')

    nativeTheme.on('updated', () => {
      const win = BrowserWindow.getAllWindows()[0]
      if (win && !win.isDestroyed()) {
        win.webContents.send(
          'system-theme-changed',
          nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
        )
      }
    })
  }

  protected init(): void {
    this.handle('get-system-theme', this.getSystemTheme)
    this.handleValidated('register-shortcut', shortcutSchema, this.registerShortcut)
    this.handleValidated('backup-data', pathSchema, this.backupData)
    this.handleValidated('restore-data', pathSchema, this.restoreData)
    this.handleValidated('open-external', urlSchema, this.openExternal)
    this.handleValidated('set-auto-launch', boolSchema, this.setAutoLaunch)
    this.handle('get-auto-launch', this.getAutoLaunch)
    this.handleValidated('sync-data-to-folder', pathSchema, this.syncDataToFolder)
    this.handleValidated('sync-data-from-folder', pathSchema, this.syncDataFromFolder)
  }

  private ensureAuthorizedFolder(folderPath: string): string {
    const normalized = path.normalize(folderPath)
    if (!FileController.authorizedPaths.has(normalized)) {
      throw new Error('Access denied: folder not authorized by file dialog')
    }
    return normalized
  }

  private async syncDataToFolder(_event: Electron.IpcMainInvokeEvent, folderPath: string): Promise<boolean> {
    try {
      const authorizedFolder = this.ensureAuthorizedFolder(folderPath)
      const targetDir = path.join(authorizedFolder, 'stellarc-sync')
      const targetDataPath = path.join(targetDir, 'data')

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }

      if (fs.existsSync(targetDataPath)) {
        fs.rmSync(targetDataPath, { recursive: true, force: true })
      }

      fs.cpSync(this.dataPath, targetDataPath, { recursive: true })
      return true
    } catch (error) {
      log.error('Failed to sync data to folder:', error)
      return false
    }
  }

  private async syncDataFromFolder(_event: Electron.IpcMainInvokeEvent, folderPath: string): Promise<boolean> {
    const backupDataPath = path.join(path.dirname(this.dataPath), 'data_sync_backup_' + Date.now())
    try {
      const authorizedFolder = this.ensureAuthorizedFolder(folderPath)
      const sourceDataPath = path.join(authorizedFolder, 'stellarc-sync', 'data')

      if (!fs.existsSync(sourceDataPath)) {
        log.error('Sync source does not exist:', sourceDataPath)
        return false
      }

      if (fs.existsSync(this.dataPath)) {
        fs.renameSync(this.dataPath, backupDataPath)
      }
      fs.cpSync(sourceDataPath, this.dataPath, { recursive: true })

      // Validate critical data files exist after sync
      const classesFile = path.join(this.dataPath, 'classes.json')
      const settingsFile = path.join(this.dataPath, 'settings.json')
      if (!fs.existsSync(classesFile) && !fs.existsSync(settingsFile)) {
        log.error('Sync source missing critical data files, rolling back')
        fs.rmSync(this.dataPath, { recursive: true, force: true })
        if (fs.existsSync(backupDataPath)) {
          fs.renameSync(backupDataPath, this.dataPath)
        }
        return false
      }

      if (fs.existsSync(backupDataPath)) {
        fs.rmSync(backupDataPath, { recursive: true, force: true })
      }

      if (!fs.existsSync(this.photosPath)) {
        fs.mkdirSync(this.photosPath, { recursive: true })
      }
      return true
    } catch (error) {
      log.error('Failed to sync data from folder:', error)
      if (fs.existsSync(backupDataPath) && !fs.existsSync(this.dataPath)) {
        fs.renameSync(backupDataPath, this.dataPath)
      }
      return false
    }
  }

  private async getSystemTheme(): Promise<string> {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  }

  private async registerShortcut(
    _event: Electron.IpcMainInvokeEvent,
    accelerator: string,
    action: string
  ): Promise<boolean> {
    try {
      if (this.registeredShortcut) {
        globalShortcut.unregister(this.registeredShortcut)
        this.registeredShortcut = null
      }

      const normalized = accelerator.trim().replace(/Ctrl/g, 'CommandOrControl')
      if (normalized) {
        const ok = globalShortcut.register(normalized, () => {
          const win = BrowserWindow.getAllWindows()[0]
          if (win && !win.isDestroyed()) {
            win.webContents.send('shortcut-triggered', action)
          }
        })
        if (!ok) {
          log.warn('Failed to register shortcut: invalid or occupied accelerator', normalized)
          return false
        }
        this.registeredShortcut = normalized
      }
      return true
    } catch (error) {
      log.error('Failed to register shortcut:', error)
      return false
    }
  }

  private async backupData(_event: Electron.IpcMainInvokeEvent, targetPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const output = fs.createWriteStream(targetPath)
        const archive = archiver('zip', { zlib: { level: 9 } })

        output.on('close', () => resolve(true))
        archive.on('error', (err) => {
          log.error('Backup failed:', err)
          resolve(false)
        })

        archive.pipe(output)
        archive.directory(this.dataPath, false)
        archive.finalize()
      } catch (e) {
        log.error('Backup error:', e)
        resolve(false)
      }
    })
  }

  private async restoreData(_event: Electron.IpcMainInvokeEvent, sourcePath: string): Promise<boolean> {
    const parentDir = path.dirname(this.dataPath)
    const tempExtractPath = path.join(parentDir, 'temp_restore_' + Date.now())
    const backupDataPath = path.join(parentDir, 'data_backup_' + Date.now())

    try {
      if (!fs.existsSync(tempExtractPath)) {
        fs.mkdirSync(tempExtractPath, { recursive: true })
      }

      await extractZip(sourcePath, { dir: tempExtractPath })

      if (fs.existsSync(this.dataPath)) {
        fs.renameSync(this.dataPath, backupDataPath)
      }

      fs.renameSync(tempExtractPath, this.dataPath)

      if (fs.existsSync(backupDataPath)) {
        fs.rmSync(backupDataPath, { recursive: true, force: true })
      }

      if (!fs.existsSync(this.photosPath)) {
        fs.mkdirSync(this.photosPath, { recursive: true })
      }

      return true
    } catch (error) {
      log.error('Restore failed:', error)

      if (fs.existsSync(backupDataPath) && !fs.existsSync(this.dataPath)) {
        log.info('Rolling back data restoration...')
        fs.renameSync(backupDataPath, this.dataPath)
      }

      try {
        if (fs.existsSync(tempExtractPath)) {
          fs.rmSync(tempExtractPath, { recursive: true, force: true })
        }
        if (fs.existsSync(backupDataPath)) {
          fs.rmSync(backupDataPath, { recursive: true, force: true })
        }
      } catch (cleanupErr) {
        log.warn('Failed to clean up temp directories after restore failure:', cleanupErr)
      }

      return false
    }
  }

  private async openExternal(_event: Electron.IpcMainInvokeEvent, url: string): Promise<boolean> {
    try {
      await shell.openExternal(url)
      return true
    } catch (error) {
      log.error('Failed to open external link:', error)
      return false
    }
  }

  private async setAutoLaunch(_event: Electron.IpcMainInvokeEvent, enabled: boolean): Promise<boolean> {
    try {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        path: process.execPath,
        args: []
      })
      return true
    } catch (error) {
      log.error('Failed to set auto launch:', error)
      return false
    }
  }

  private async getAutoLaunch(): Promise<boolean> {
    try {
      const settings = app.getLoginItemSettings()
      return settings.openAtLogin
    } catch (error) {
      log.error('Failed to get auto launch status:', error)
      return false
    }
  }
}
