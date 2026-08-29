import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { z } from 'zod/v4'
import log from 'electron-log'

/**
 * 统一 IPC 错误契约：handler 抛出的异常记录日志后向渲染端透传 rejection，
 * 渲染端通过 await 的 try/catch 感知失败。禁止把错误包装成正常返回值
 * （否则渲染端会把失败结果当作数据使用）。
 */
export abstract class BaseController {
  constructor() {
    this.init()
  }

  protected abstract init(): void

  protected handle(
    channel: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any>
  ): void {
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        return await handler.call(this, event, ...args)
      } catch (error) {
        log.error(`[IPC Error] ${channel}:`, error)
        throw error instanceof Error ? error : new Error(String(error))
      }
    })
  }

  protected handleValidated<T extends z.ZodTuple>(
    channel: string,
    schema: T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (event: IpcMainInvokeEvent, ...args: z.infer<T>) => Promise<any>
  ): void {
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        const parsed = schema.parse(args)
        return await handler.call(this, event, ...parsed)
      } catch (error) {
        if (error instanceof z.ZodError) {
          log.error(`[IPC Validation Error] ${channel}:`, error.issues)
          throw new Error('Invalid parameters')
        }
        log.error(`[IPC Error] ${channel}:`, error)
        throw error instanceof Error ? error : new Error(String(error))
      }
    })
  }
}
