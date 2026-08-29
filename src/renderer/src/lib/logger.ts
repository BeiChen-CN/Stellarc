/**
 * 渲染进程日志工具
 * - error/warn 始终经 IPC 转发到主进程 electron-log 落盘（生产可诊断）
 * - 控制台输出仅在开发环境启用（生产下用户侧无噪音）
 */
const isDev = import.meta.env.DEV

function formatMsg(tag: string, msg: string): string {
  return `[${tag}] ${msg}`
}

function serializeArg(arg: unknown): string {
  if (typeof arg === 'string') return arg
  if (arg instanceof Error) return arg.stack || arg.message
  try {
    return JSON.stringify(arg)
  } catch {
    return String(arg)
  }
}

function forwardToMain(level: 'error' | 'warn' | 'info', tag: string, msg: string, args: unknown[]): void {
  try {
    const message = [formatMsg(tag, msg), ...args.map(serializeArg)].join(' ')
    void window.electronAPI?.appendLog?.(level, message)
  } catch {
    // 日志转发自身失败时静默，绝不能影响业务流程
  }
}

export const logger = {
  error(tag: string, msg: string, ...args: unknown[]) {
    if (isDev) console.error(formatMsg(tag, msg), ...args)
    forwardToMain('error', tag, msg, args)
  },
  warn(tag: string, msg: string, ...args: unknown[]) {
    if (isDev) console.warn(formatMsg(tag, msg), ...args)
    forwardToMain('warn', tag, msg, args)
  },
  info(tag: string, msg: string, ...args: unknown[]) {
    if (isDev) console.info(formatMsg(tag, msg), ...args)
  }
}
