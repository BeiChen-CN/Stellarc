import { dialog, BrowserWindow, OpenDialogOptions, SaveDialogOptions } from 'electron'
import log from 'electron-log'
import path from 'path'
import { BaseController } from './BaseController'
import { authorizePath } from '../fileAuth'

export class DialogController extends BaseController {

  constructor() {
    super()
  }

  protected init(): void {
    this.handle('select-file', this.selectFile)
    this.handle('save-file', this.saveFile)
  }

  private getMainWindow(): BrowserWindow | null {
    return BrowserWindow.getAllWindows()[0] || null
  }

  private authorize(filePath: string): void {
    authorizePath(path.normalize(filePath))
  }

  private async selectFile(_event: Electron.IpcMainInvokeEvent, options: OpenDialogOptions): Promise<string | null> {
    const win = this.getMainWindow()
    if (!win) return null
    const result = await this.showDialog(() =>
      dialog.showOpenDialog(win, { ...options, properties: ['openFile'] })
    )
    if (!result || result.canceled) return null
    this.authorize(result.filePaths[0])
    return result.filePaths[0]
  }



  private async saveFile(_event: Electron.IpcMainInvokeEvent, options: SaveDialogOptions): Promise<string | null> {
    const win = this.getMainWindow()
    if (!win) return null
    const result = await this.showDialog(() => dialog.showSaveDialog(win, options))
    if (!result || result.canceled || !result.filePath) return null
    this.authorize(result.filePath)
    return result.filePath
  }

  /**
   * 对话框打开失败时归约为 null（语义：未选择任何文件）。
   * null 才是渲染端已有的取消分支，避免错误对象被当作路径使用。
   */
  private async showDialog<T>(open: () => Promise<T>): Promise<T | null> {
    try {
      return await open()
    } catch (error) {
      log.error('[IPC Error] file dialog failed:', error)
      return null
    }
  }
}
