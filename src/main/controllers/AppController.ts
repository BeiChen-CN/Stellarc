import { nativeTheme, globalShortcut, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { z } from 'zod/v4'
import log from 'electron-log'
import { BaseController } from './BaseController'

const shortcutSchema = z.tuple([z.string(), z.string()])
const rendererLogSchema = z.tuple([z.enum(['error', 'warn', 'info']), z.string().max(4000)])
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
  private registeredShortcut: string | null = null

  constructor(dataPath: string) {
    super()
    this.dataPath = dataPath

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
    this.handleValidated('renderer-log', rendererLogSchema, this.appendRendererLog)
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

  /**
   * 渲染进程的 error/warn 转发到主进程 electron-log 落盘，
   * 保证生产环境下渲染侧故障可被诊断。
   */
  private async appendRendererLog(
    _event: Electron.IpcMainInvokeEvent,
    level: 'error' | 'warn' | 'info',
    message: string
  ): Promise<boolean> {
    log[level](`[Renderer] ${message}`)
    return true
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

}
