import { app, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import archiver from 'archiver'
import extractZip from 'extract-zip'
import log from 'electron-log'
import { z } from 'zod/v4'
import { BaseController } from './BaseController'

const pathSchema = z.tuple([z.string().min(1)])
const urlSchema = z.tuple([z.string().url()])
const boolSchema = z.tuple([z.boolean()])

/** 系统级操作：数据备份/恢复与开机自启动 */
export class SystemController extends BaseController {
  private dataPath: string
  private photosPath: string

  constructor(dataPath: string) {
    super()
    this.dataPath = dataPath
    this.photosPath = path.join(this.dataPath, 'photos')
  }

  protected init(): void {
    this.handleValidated('backup-data', pathSchema, this.backupData)
    this.handleValidated('restore-data', pathSchema, this.restoreData)
    this.handleValidated('set-auto-launch', boolSchema, this.setAutoLaunch)
    this.handle('get-auto-launch', this.getAutoLaunch)
    this.handleValidated('open-external', urlSchema, this.openExternal)
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
