import { BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import { BaseController } from './BaseController'

/** 自动更新：IPC 查询/下载/安装 + 状态事件广播 */
export class UpdateController extends BaseController {
  constructor() {
    super()
  }

  protected init(): void {
    autoUpdater.logger = log
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true
    this.wireUpdaterEvents()
    this.handle('check-for-updates', this.checkForUpdates)
    this.handle('download-update', this.downloadUpdate)
    this.handle('install-update', this.installUpdate)
  }

  private sendUpdateStatus(status: string, info?: Record<string, unknown>): void {
    const win = BrowserWindow.getAllWindows()[0]
    if (win && !win.isDestroyed()) {
      win.webContents.send('update-status', status, info)
    }
  }

  private wireUpdaterEvents(): void {
    autoUpdater.on('checking-for-update', () => this.sendUpdateStatus('checking'))
    autoUpdater.on('update-available', (info) =>
      this.sendUpdateStatus('available', { version: info.version, releaseNotes: info.releaseNotes })
    )
    autoUpdater.on('update-not-available', () => this.sendUpdateStatus('up-to-date'))
    autoUpdater.on('download-progress', (progress) =>
      this.sendUpdateStatus('downloading', {
        percent: Math.round(progress.percent),
        transferred: progress.transferred,
        total: progress.total,
        bytesPerSecond: progress.bytesPerSecond
      })
    )
    autoUpdater.on('update-downloaded', (info) =>
      this.sendUpdateStatus('downloaded', { version: info.version })
    )
    autoUpdater.on('error', (err) => this.sendUpdateStatus('error', { message: err.message }))
  }

  private async checkForUpdates(): Promise<boolean> {
    try {
      await autoUpdater.checkForUpdates()
      return true
    } catch (err) {
      log.error('[Updater] check failed:', err)
      return false
    }
  }

  private async downloadUpdate(): Promise<boolean> {
    try {
      await autoUpdater.downloadUpdate()
      return true
    } catch (err) {
      log.error('[Updater] download failed:', err)
      return false
    }
  }

  private async installUpdate(): Promise<void> {
    autoUpdater.quitAndInstall()
  }
}
