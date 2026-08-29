import path from 'path'

/**
 * 文件对话框授权白名单：只有用户通过原生对话框显式选择的路径才允许被
 * 主进程读写。收敛在此模块统一管理，避免跨 controller 操作静态集合。
 *
 * 采用有上限的 LRU：桌面场景下用户反复导出到同一个目录，容量上限可防止
 * 授权路径集合随使用无限增长。
 */
const MAX_AUTHORIZED_PATHS = 64

const authorizedPaths = new Map<string, true>()

export function authorizePath(filePath: string): void {
  const normalized = path.normalize(filePath)
  authorizedPaths.delete(normalized)
  authorizedPaths.set(normalized, true)
  while (authorizedPaths.size > MAX_AUTHORIZED_PATHS) {
    const oldest = authorizedPaths.keys().next().value
    if (oldest === undefined) break
    authorizedPaths.delete(oldest)
  }
}

export function assertPathAuthorized(filePath: string): void {
  if (!authorizedPaths.has(path.normalize(filePath))) {
    throw new Error('Access denied: Path not authorized by file dialog')
  }
}
