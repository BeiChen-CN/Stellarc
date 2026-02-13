import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useToastStore } from '../../store/toastStore'

declare const __APP_VERSION__: string

export function UpdateChecker() {
  const [status, setStatus] = useState<string>('idle')
  const [info, setInfo] = useState<Record<string, unknown> | null>(null)
  const addToast = useToastStore((state) => state.addToast)

  useEffect(() => {
    const cleanup = window.electronAPI.onUpdateStatus((s, i) => {
      setStatus(s)
      setInfo(i ?? null)
      if (s === 'error') addToast(`检查更新失败: ${(i as any)?.message || '未知错误'}`, 'error')
      if (s === 'up-to-date') addToast('当前已是最新版本。', 'success')
      if (s === 'downloaded') addToast('更新已下载，重启后生效。', 'success')
    })
    return cleanup
  }, [])

  const handleCheck = () => {
    setStatus('checking')
    window.electronAPI.checkForUpdates()
  }

  const handleDownload = () => {
    window.electronAPI.downloadUpdate()
  }

  const handleInstall = () => {
    window.electronAPI.installUpdate()
  }

  return (
    <div className="bg-surface-container rounded-[28px] overflow-hidden">
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-primary/10 text-primary rounded-full">
            <RefreshCw
              className={cn(
                'w-5 h-5',
                status === 'checking' || status === 'downloading' ? 'animate-spin' : ''
              )}
            />
          </div>
          <div>
            <h4 className="font-medium text-on-surface">软件更新</h4>
            <p className="text-xs text-on-surface-variant mt-0.5">
              当前版本 v{__APP_VERSION__}
              {status === 'checking' && ' — 正在检查...'}
              {status === 'available' && ` — 发现新版本 v${(info as any)?.version}`}
              {status === 'downloading' && ` — 下载中 ${(info as any)?.percent || 0}%`}
              {status === 'downloaded' && ' — 更新已就绪'}
              {status === 'up-to-date' && ' — 已是最新'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'available' && (
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
            >
              下载更新
            </button>
          )}
          {status === 'downloaded' && (
            <button
              onClick={handleInstall}
              className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
            >
              重启安装
            </button>
          )}
          {(status === 'idle' || status === 'up-to-date' || status === 'error') && (
            <button
              onClick={handleCheck}
              className="px-4 py-1.5 border border-outline-variant rounded-full text-sm font-medium text-on-surface cursor-pointer hover:bg-surface-container-high transition-colors"
            >
              检查更新
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
