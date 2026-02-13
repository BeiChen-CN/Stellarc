import { dialog, BrowserWindow, OpenDialogOptions, SaveDialogOptions } from 'electron'
import path from 'path'
import { BaseController } from './BaseController'
import { FileController } from './FileController'

export class DialogController extends BaseController {

  constructor() {
    super()
  }

  protected init(): void {
    this.handle('select-file', this.selectFile)
    this.handle('select-files', this.selectFiles)
    this.handle('select-folder', this.selectFolder)
    this.handle('save-file', this.saveFile)
  }

  private getMainWindow(): BrowserWindow | null {
    return BrowserWindow.getAllWindows()[0] || null
  }

  private authorize(filePath: string): void {
    FileController.authorizedPaths.add(path.normalize(filePath))
  }

  private async selectFile(_event: any, options: OpenDialogOptions): Promise<string | null> {
    const win = this.getMainWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      ...options,
      properties: ['openFile']
    })
    if (result.canceled) return null
    this.authorize(result.filePaths[0])
    return result.filePaths[0]
  }

  private async selectFiles(_event: any, options: OpenDialogOptions): Promise<string[] | null> {
    const win = this.getMainWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      ...options,
      properties: ['openFile', 'multiSelections']
    })
    if (result.canceled) return null
    result.filePaths.forEach((p) => this.authorize(p))
    return result.filePaths
  }

  private async selectFolder(_event: any): Promise<string | null> {
    const win = this.getMainWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    })
    if (result.canceled) return null
    this.authorize(result.filePaths[0])
    return result.filePaths[0]
  }

  private async saveFile(_event: any, options: SaveDialogOptions): Promise<string | null> {
    const win = this.getMainWindow()
    if (!win) return null
    const result = await dialog.showSaveDialog(win, options)
    if (result.canceled || !result.filePath) return null
    this.authorize(result.filePath)
    return result.filePath
  }
}
