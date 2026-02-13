import { useState, useEffect, useCallback } from 'react'
import { Minus, Square, X, Maximize2 } from 'lucide-react'

export function TitleBar() {
  const [maximized, setMaximized] = useState(false)

  const syncMaximized = useCallback(async () => {
    const val = await window.electronAPI.windowIsMaximized()
    setMaximized(val)
  }, [])

  useEffect(() => {
    syncMaximized()
    window.addEventListener('resize', syncMaximized)
    return () => window.removeEventListener('resize', syncMaximized)
  }, [syncMaximized])

  const isMac = navigator.platform.toLowerCase().includes('mac')

  // macOS uses native traffic lights via titleBarStyle: 'hiddenInset'
  if (isMac) {
    return (
      <div
        className="h-8 w-full shrink-0 select-none"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />
    )
  }

  return (
    <div
      className="h-9 w-full shrink-0 flex items-center justify-between select-none bg-surface-container-low/60 backdrop-blur-sm border-b border-outline-variant/20"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 pl-3">
        <span className="text-xs font-medium text-on-surface-variant tracking-wide">Stellarc</span>
      </div>

      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => window.electronAPI.windowMinimize()}
          className="h-full px-3.5 flex items-center justify-center text-on-surface-variant hover:bg-on-surface/8 transition-colors cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            window.electronAPI.windowMaximize()
            setTimeout(syncMaximized, 50)
          }}
          className="h-full px-3.5 flex items-center justify-center text-on-surface-variant hover:bg-on-surface/8 transition-colors cursor-pointer"
        >
          {maximized ? <Maximize2 className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => window.electronAPI.windowClose()}
          className="h-full px-3.5 flex items-center justify-center text-on-surface-variant hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
