import { useState, useEffect } from 'react'
import { RefreshCw, Download, RotateCcw } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useToastStore } from '../../store/toastStore'

declare const __APP_VERSION__: string

interface UpdateInfo {
  version?: string
  releaseNotes?: string
  percent?: number
  transferred?: number
  total?: number
  bytesPerSecond?: number
  message?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function UpdateChecker() {
  const [status, setStatus] = useState<string>('idle')
  const [info, setInfo] = useState<UpdateInfo | null>(null)
  const addToast = useToastStore((state) => state.addToast)

  useEffect(() => {
    const cleanup = window.electronAPI.onUpdateStatus((s, i) => {
      setStatus(s)
      const data = (i ?? null) as UpdateInfo | null
      setInfo(data)
      if (s === 'error') addToast(`检查更新失败: ${data?.message || '未知错误'}`, 'error')
      if (s === 'up-to-date') addToast('当前已是最新版本', 'success')
      if (s === 'downloaded') addToast('更新已下载，重启后生效', 'success')
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

  const percent = info?.percent ?? 0

  return (
    <div className="bg-surface-container rounded-[28px] overflow-hidden">
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="p-2 bg-primary/10 text-primary rounded-full shrink-0">
            <RefreshCw
              className={cn(
                'w-5 h-5',
                status === 'checking' || status === 'downloading' ? 'animate-spin' : ''
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-on-surface">软件更新</h4>
            <p className="text-xs text-on-surface-variant mt-0.5">
              当前版本 v{__APP_VERSION__}
              {status === 'checking' && ' — 正在检查...'}
              {status === 'available' && ` — 发现新版本 v${info?.version}`}
              {status === 'downloaded' && ` — v${info?.version} 已就绪`}
              {status === 'up-to-date' && ' — 已是最新'}
            </p>
            {status === 'downloading' && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant mb-1">
                  <span>下载中 {percent}%</span>
                  <span>
                    {info?.transferred && info?.total
                      ? `${formatBytes(info.transferred)} / ${formatBytes(info.total)}`
                      : ''}
                    {info?.bytesPerSecond ? ` · ${formatBytes(info.bytesPerSecond)}/s` : ''}
                  </span>
                </div>
                <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {status === 'available' && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Download className="w-3.5 h-3.5" />
              下载更新
            </button>
          )}
          {status === 'downloaded' && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
            >
              <RotateCcw className="w-3.5 h-3.5" />
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
