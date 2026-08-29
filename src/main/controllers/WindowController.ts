import { BrowserWindow, screen } from 'electron'
import { z } from 'zod/v4'
import { BaseController } from './BaseController'
import {
  createImmersiveWindowController,
  isImmersiveWindowPhase,
  type ImmersiveWindowPhaseOptions
} from '../immersiveWindow'

const immersivePhaseSchema = z.tuple([
  z.unknown(),
  z.object({ anchor: z.object({ x: z.number(), y: z.number() }).optional() }).optional()
])

/** 窗口控制与沉浸模式窗口壳切换 */
export class WindowController extends BaseController {
  private immersiveWindowControllers = new WeakMap<
    BrowserWindow,
    ReturnType<typeof createImmersiveWindowController>
  >()

  constructor() {
    super()
  }

  protected init(): void {
    this.handle('window-minimize', this.windowMinimize)
    this.handle('window-maximize', this.windowMaximize)
    this.handle('window-close', this.windowClose)
    this.handle('window-is-maximized', this.windowIsMaximized)
    this.handleValidated('set-immersive-window-phase', immersivePhaseSchema, this.setImmersivePhase)
  }

  private getFocusedWindow(): BrowserWindow | null {
    return BrowserWindow.getFocusedWindow()
  }

  private getImmersiveController(win: BrowserWindow) {
    const existing = this.immersiveWindowControllers.get(win)
    if (existing) return existing
    const controller = createImmersiveWindowController(win)
    this.immersiveWindowControllers.set(win, controller)
    return controller
  }

  private async windowMinimize(): Promise<void> {
    this.getFocusedWindow()?.minimize()
  }

  private async windowMaximize(): Promise<void> {
    const win = this.getFocusedWindow()
    if (win) {
      win.isMaximized() ? win.unmaximize() : win.maximize()
    }
  }

  private async windowClose(): Promise<void> {
    this.getFocusedWindow()?.close()
  }

  private async windowIsMaximized(): Promise<boolean> {
    return this.getFocusedWindow()?.isMaximized() ?? false
  }

  private async setImmersivePhase(
    _event: Electron.IpcMainInvokeEvent,
    phase: unknown,
    options?: ImmersiveWindowPhaseOptions
  ): Promise<boolean> {
    if (!isImmersiveWindowPhase(phase)) return false
    const win =
      BrowserWindow.fromWebContents(_event.sender) ??
      BrowserWindow.getFocusedWindow() ??
      BrowserWindow.getAllWindows()[0]
    if (!win || win.isDestroyed()) return false

    const workArea = screen.getDisplayMatching(win.getBounds()).workArea
    this.getImmersiveController(win).setPhase(phase, workArea, options)
    return true
  }
}
