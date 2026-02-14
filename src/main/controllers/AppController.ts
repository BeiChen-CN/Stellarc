import { app, nativeTheme, globalShortcut, shell, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import archiver from 'archiver'
import extractZip from 'extract-zip'
import { z } from 'zod/v4'
import log from 'electron-log'
import { BaseController } from './BaseController'
import { FileController } from './FileController'
import { detectSyncConflict } from '../sync/conflict'

const shortcutSchema = z.tuple([z.string(), z.string()])
const pathSchema = z.tuple([z.string().min(1)])
const pathBoolSchema = z.tuple([z.string().min(1), z.boolean()])
const restorePointNameSchema = z.tuple([z.string().min(1).max(80)])
const urlSchema = z.tuple([z.string().url()])
const boolSchema = z.tuple([z.boolean()])

type SyncResultCode =
  | 'SYNC_OK'
  | 'SYNC_PULL_OK'
  | 'SYNC_SOURCE_MISSING'
  | 'SYNC_CONFLICT'
  | 'SYNC_INVALID_SOURCE'
  | 'SYNC_ACCESS_DENIED'
  | 'SYNC_IO_ERROR'

interface SyncResult {
  ok: boolean
  code: SyncResultCode
  message: string
  localFingerprint?: string
  remoteFingerprint?: string
}

interface SyncManifest {
  schemaVersion: 1
  updatedAt: string
  fingerprint: string
}

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
    this.handleValidated('sync-data-to-folder', pathSchema, this.syncDataToFolder)
    this.handleValidated('sync-data-from-folder', pathSchema, this.syncDataFromFolder)
    this.handleValidated('sync-data-to-folder-v2', pathSchema, this.syncDataToFolderV2)
    this.handleValidated('sync-data-from-folder-v2', pathBoolSchema, this.syncDataFromFolderV2)
    this.handleValidated('get-sync-status', pathSchema, this.getSyncStatus)
    this.handleValidated('create-restore-point', restorePointNameSchema, this.createRestorePoint)
    this.handle('list-restore-points', this.listRestorePoints)
    this.handleValidated('restore-from-point', pathSchema, this.restoreFromPoint)
  }

  private restorePointsDir(): string {
    return path.join(path.dirname(this.dataPath), 'restore-points')
  }

  private sanitizeRestorePointName(rawName: string): string {
    const trimmed = rawName.trim()
    const normalized = trimmed
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50)
    return normalized || 'restore-point'
  }

  private async createRestorePoint(
    _event: Electron.IpcMainInvokeEvent,
    customName: string
  ): Promise<{ ok: boolean; name?: string; message?: string }> {
    try {
      const dir = this.restorePointsDir()
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      const safeName = this.sanitizeRestorePointName(customName)
      const name = `${safeName}-${Date.now()}.zip`
      const targetPath = path.join(dir, name)
      const ok = await this.backupData({} as Electron.IpcMainInvokeEvent, targetPath)
      if (!ok) {
        return { ok: false, message: '创建恢复点失败' }
      }
      this.appendDiagnosticEvent({
        category: 'sync',
        level: 'info',
        code: 'RESTORE_POINT_CREATED',
        message: 'Restore point created',
        context: { name }
      })
      return { ok: true, name }
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) }
    }
  }

  private async listRestorePoints(): Promise<{ name: string; path: string; createdAt: number }[]> {
    const dir = this.restorePointsDir()
    if (!fs.existsSync(dir)) {
      return []
    }

    return fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.zip'))
      .map((name) => {
        const fullPath = path.join(dir, name)
        const stat = fs.statSync(fullPath)
        return { name, path: fullPath, createdAt: stat.mtimeMs }
      })
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  private async restoreFromPoint(
    _event: Electron.IpcMainInvokeEvent,
    restorePointPath: string
  ): Promise<boolean> {
    const normalized = path.normalize(restorePointPath)
    if (!normalized.startsWith(path.normalize(this.restorePointsDir()))) {
      throw new Error('Access denied: restore point path is invalid')
    }
    return this.restoreData(_event, normalized)
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

  private computeDataFingerprint(dirPath: string): string {
    const files = ['classes.json', 'history.json', 'settings.json', 'strategy-plugins.json']
    const hash = crypto.createHash('sha256')

    files.forEach((name) => {
      const filePath = path.join(dirPath, name)
      hash.update(name)
      if (!fs.existsSync(filePath)) {
        hash.update('missing')
        return
      }

      try {
        const buf = fs.readFileSync(filePath)
        hash.update(buf)
      } catch {
        hash.update('read-error')
      }
    })

    return hash.digest('hex')
  }

  private getSyncManifestPath(syncRoot: string): string {
    return path.join(syncRoot, 'manifest.json')
  }

  private writeSyncManifest(syncRoot: string, manifest: SyncManifest): void {
    const manifestPath = this.getSyncManifestPath(syncRoot)
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
  }

  private readSyncManifest(syncRoot: string): SyncManifest | null {
    const manifestPath = this.getSyncManifestPath(syncRoot)
    if (!fs.existsSync(manifestPath)) {
      return null
    }
    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8')
      const parsed = JSON.parse(raw) as SyncManifest
      if (parsed && parsed.schemaVersion === 1 && typeof parsed.fingerprint === 'string') {
        return parsed
      }
      return null
    } catch {
      return null
    }
  }

  private ensureAuthorizedFolder(folderPath: string): string {
    const normalized = path.normalize(folderPath)
    if (!FileController.authorizedPaths.has(normalized)) {
      throw new Error('Access denied: folder not authorized by file dialog')
    }
    return normalized
  }

  private async syncDataToFolder(
    _event: Electron.IpcMainInvokeEvent,
    folderPath: string
  ): Promise<boolean> {
    const result = await this.syncDataToFolderV2(_event, folderPath)
    return result.ok
  }

  private async syncDataToFolderV2(
    _event: Electron.IpcMainInvokeEvent,
    folderPath: string
  ): Promise<SyncResult> {
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
      const localFingerprint = this.computeDataFingerprint(this.dataPath)
      const manifest: SyncManifest = {
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        fingerprint: localFingerprint
      }
      this.writeSyncManifest(targetDir, manifest)

      this.appendDiagnosticEvent({
        category: 'sync',
        level: 'info',
        code: 'SYNC_PUSH_OK',
        message: 'Data pushed to sync folder',
        context: { folderPath: authorizedFolder, localFingerprint }
      })

      return {
        ok: true,
        code: 'SYNC_OK',
        message: '同步成功',
        localFingerprint
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const accessDenied = message.includes('Access denied')
      this.appendDiagnosticEvent({
        category: 'sync',
        level: 'error',
        code: accessDenied ? 'SYNC_ACCESS_DENIED' : 'SYNC_IO_ERROR',
        message: 'Failed to sync data to folder',
        context: { folderPath, error: message }
      })
      log.error('Failed to sync data to folder:', error)
      return {
        ok: false,
        code: accessDenied ? 'SYNC_ACCESS_DENIED' : 'SYNC_IO_ERROR',
        message: accessDenied ? '目录未授权，请重新选择目录' : '同步失败，请稍后重试'
      }
    }
  }

  private async syncDataFromFolder(
    _event: Electron.IpcMainInvokeEvent,
    folderPath: string
  ): Promise<boolean> {
    const result = await this.syncDataFromFolderV2(_event, folderPath, false)
    return result.ok
  }

  private async getSyncStatus(
    _event: Electron.IpcMainInvokeEvent,
    folderPath: string
  ): Promise<SyncResult> {
    try {
      const authorizedFolder = this.ensureAuthorizedFolder(folderPath)
      const syncRoot = path.join(authorizedFolder, 'stellarc-sync')
      const sourceDataPath = path.join(syncRoot, 'data')

      if (!fs.existsSync(sourceDataPath)) {
        return {
          ok: false,
          code: 'SYNC_SOURCE_MISSING',
          message: '同步目录中未找到数据'
        }
      }

      const localFingerprint = this.computeDataFingerprint(this.dataPath)
      const remoteManifest = this.readSyncManifest(syncRoot)
      const remoteFingerprint =
        remoteManifest?.fingerprint ?? this.computeDataFingerprint(path.join(syncRoot, 'data'))

      const isSame = localFingerprint === remoteFingerprint
      return {
        ok: true,
        code: 'SYNC_OK',
        message: isSame ? '本地与远端一致' : '检测到远端变化',
        localFingerprint,
        remoteFingerprint
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const accessDenied = message.includes('Access denied')
      return {
        ok: false,
        code: accessDenied ? 'SYNC_ACCESS_DENIED' : 'SYNC_IO_ERROR',
        message: accessDenied ? '目录未授权，请重新选择目录' : '状态检查失败'
      }
    }
  }

  private async syncDataFromFolderV2(
    _event: Electron.IpcMainInvokeEvent,
    folderPath: string,
    force: boolean
  ): Promise<SyncResult> {
    const backupDataPath = path.join(path.dirname(this.dataPath), 'data_sync_backup_' + Date.now())
    try {
      const authorizedFolder = this.ensureAuthorizedFolder(folderPath)
      const syncRoot = path.join(authorizedFolder, 'stellarc-sync')
      const sourceDataPath = path.join(syncRoot, 'data')

      if (!fs.existsSync(sourceDataPath)) {
        log.error('Sync source does not exist:', sourceDataPath)
        return {
          ok: false,
          code: 'SYNC_SOURCE_MISSING',
          message: '共享目录中没有可拉取的数据'
        }
      }

      const localFingerprint = this.computeDataFingerprint(this.dataPath)
      const remoteManifest = this.readSyncManifest(syncRoot)
      const remoteFingerprint =
        remoteManifest?.fingerprint ?? this.computeDataFingerprint(sourceDataPath)

      if (detectSyncConflict({ localFingerprint, remoteFingerprint, force })) {
        this.appendDiagnosticEvent({
          category: 'sync',
          level: 'warn',
          code: 'SYNC_CONFLICT',
          message: 'Sync conflict detected before pulling',
          context: { folderPath: authorizedFolder, localFingerprint, remoteFingerprint }
        })
        return {
          ok: false,
          code: 'SYNC_CONFLICT',
          message: '检测到本地与远端数据不一致，请确认后强制拉取',
          localFingerprint,
          remoteFingerprint
        }
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
        return {
          ok: false,
          code: 'SYNC_INVALID_SOURCE',
          message: '远端数据无效，已自动回滚'
        }
      }

      if (fs.existsSync(backupDataPath)) {
        fs.rmSync(backupDataPath, { recursive: true, force: true })
      }

      if (!fs.existsSync(this.photosPath)) {
        fs.mkdirSync(this.photosPath, { recursive: true })
      }

      const finalFingerprint = this.computeDataFingerprint(this.dataPath)
      this.appendDiagnosticEvent({
        category: 'sync',
        level: 'info',
        code: 'SYNC_PULL_OK',
        message: 'Data pulled from sync folder',
        context: { folderPath: authorizedFolder, finalFingerprint }
      })
      return {
        ok: true,
        code: 'SYNC_PULL_OK',
        message: '拉取成功',
        localFingerprint: finalFingerprint,
        remoteFingerprint
      }
    } catch (error) {
      log.error('Failed to sync data from folder:', error)
      if (fs.existsSync(backupDataPath) && !fs.existsSync(this.dataPath)) {
        fs.renameSync(backupDataPath, this.dataPath)
      }
      const message = error instanceof Error ? error.message : String(error)
      const accessDenied = message.includes('Access denied')
      this.appendDiagnosticEvent({
        category: 'sync',
        level: 'error',
        code: accessDenied ? 'SYNC_ACCESS_DENIED' : 'SYNC_IO_ERROR',
        message: 'Failed to sync data from folder',
        context: { folderPath, error: message }
      })
      return {
        ok: false,
        code: accessDenied ? 'SYNC_ACCESS_DENIED' : 'SYNC_IO_ERROR',
        message: accessDenied ? '目录未授权，请重新选择目录' : '拉取失败，请稍后重试'
      }
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
