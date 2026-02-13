/**
 * 渲染进程日志工具
 * 生产环境静默，开发环境输出到控制台
 */
const isDev = import.meta.env.DEV

function formatMsg(tag: string, msg: string): string {
  return `[${tag}] ${msg}`
}

export const logger = {
  error(tag: string, msg: string, ...args: unknown[]) {
    if (isDev) console.error(formatMsg(tag, msg), ...args)
  },
  warn(tag: string, msg: string, ...args: unknown[]) {
    if (isDev) console.warn(formatMsg(tag, msg), ...args)
  },
  info(tag: string, msg: string, ...args: unknown[]) {
    if (isDev) console.info(formatMsg(tag, msg), ...args)
  }
}
