import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { z } from 'zod/v4'
import log from 'electron-log'

export abstract class BaseController {
  constructor() {
    this.init()
  }

  protected abstract init(): void

  protected handle(channel: string, handler: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any>): void {
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        return await handler.call(this, event, ...args)
      } catch (error) {
        log.error(`[IPC Error] ${channel}:`, error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }
    })
  }

  protected handleValidated<T extends z.ZodTuple>(
    channel: string,
    schema: T,
    handler: (event: IpcMainInvokeEvent, ...args: z.infer<T>) => Promise<any>
  ): void {
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        const parsed = schema.parse(args)
        return await handler.call(this, event, ...parsed)
      } catch (error) {
        if (error instanceof z.ZodError) {
          log.error(`[IPC Validation Error] ${channel}:`, error.issues)
          return { success: false, error: 'Invalid parameters' }
        }
        log.error(`[IPC Error] ${channel}:`, error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }
    })
  }
}
