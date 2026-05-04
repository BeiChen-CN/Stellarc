import { app, nativeTheme, globalShortcut, shell, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import archiver from 'archiver'
import extractZip from 'extract-zip'
import { z } from 'zod/v4'
import log from 'electron-log'
import { BaseController } from './BaseController'

const shortcutSchema = z.tuple([z.string(), z.string()])
const pathSchema = z.tuple([z.string().min(1)])
const urlSchema = z.tuple([z.string().url()])
const boolSchema = z.tuple([z.boolean()])
const diagnosticEventSchema = z.tuple([
  z.object({
    category: z.enum(['sync', 'shortcut', 'plugin', 'self-check']),
    level: z.enum(['info', 'warn', 'error']),
    code: z.string().min(1).max(80),
    message: z.string().min(1).max(200),
    context: z.record(z.string(), z.unknown()).optional()
  })
])

interface DiagnosticEvent {
  id: string
  timestamp: string
  category: 'sync' | 'shortcut' | 'plugin' | 'self-check'
  level: 'info' | 'warn' | 'error'
  code: string
  message: string
  context?: Record<string, unknown>
}

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
    this.handleValidated(
      'append-diagnostic-event',
      diagnosticEventSchema,
      this.appendDiagnosticEventFromIPC
    )
  }

  private async appendDiagnosticEventFromIPC(
    _event: Electron.IpcMainInvokeEvent,
    payload: Omit<DiagnosticEvent, 'id' | 'timestamp'>
  ): Promise<boolean> {
    try {
      this.appendDiagnosticEvent(payload)
      return true
    } catch (error) {
      log.error('Failed to append diagnostic event from IPC:', error)
      return false
    }
  }

  private diagnosticLogPath(): string {
    return path.join(this.dataPath, 'diagnostics-events.json')
  }

  private appendDiagnosticEvent(event: Omit<DiagnosticEvent, 'id' | 'timestamp'>): void {
    const filePath = this.diagnosticLogPath()
    let existing: DiagnosticEvent[] = []
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8')
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          existing = parsed as DiagnosticEvent[]
        }
      }
    } catch (error) {
      log.warn('Failed to read diagnostics log before append:', error)
    }

    const next: DiagnosticEvent[] = [
      ...existing.slice(-199),
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...event
      }
    ]

    try {
      fs.writeFileSync(filePath, JSON.stringify(next, null, 2), 'utf-8')
    } catch (error) {
      log.warn('Failed to write diagnostics log:', error)
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
          this.appendDiagnosticEvent({
            category: 'shortcut',
            level: 'warn',
            code: 'SHORTCUT_REGISTER_FAILED',
            message: 'Shortcut register failed',
            context: { accelerator: normalized }
          })
          return false
        }
        this.registeredShortcut = normalized
        this.appendDiagnosticEvent({
          category: 'shortcut',
          level: 'info',
          code: 'SHORTCUT_REGISTER_OK',
          message: 'Shortcut registered',
          context: { accelerator: normalized }
        })
      }
      return true
    } catch (error) {
      log.error('Failed to register shortcut:', error)
      this.appendDiagnosticEvent({
        category: 'shortcut',
        level: 'error',
        code: 'SHORTCUT_REGISTER_ERROR',
        message: 'Shortcut register threw exception',
        context: { error: error instanceof Error ? error.message : String(error) }
      })
      return false
    }
  }

  private async backupData(
    _event: Electron.IpcMainInvokeEvent,
    targetPath: string
  ): Promise<boolean> {
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

  private async restoreData(
    _event: Electron.IpcMainInvokeEvent,
    sourcePath: string
  ): Promise<boolean> {
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

  private async setAutoLaunch(
    _event: Electron.IpcMainInvokeEvent,
    enabled: boolean
  ): Promise<boolean> {
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
