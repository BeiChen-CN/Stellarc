import { useState, useEffect } from 'react'
import { Keyboard } from 'lucide-react'
import { cn } from '../../lib/utils'

const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta'])

function keyEventToAccelerator(e: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(e.key)) return null
  const parts: string[] = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  if (parts.length === 0) return null

  let key = e.key
  if (key === ' ') key = 'Space'
  else if (key.length === 1) key = key.toUpperCase()
  else if (key.startsWith('Arrow')) key = key
  parts.push(key)
  return parts.join('+')
}

export function formatAccelerator(acc: string): string {
  return acc
    .replace(/Ctrl/g, 'Ctrl')
    .replace(/Alt/g, 'Alt')
    .replace(/Shift/g, 'Shift')
    .replace(/\+/g, ' + ')
}

export function ShortcutRecorder({
  shortcutKey,
  setShortcutKey
}: {
  shortcutKey: string
  setShortcutKey: (key: string) => Promise<boolean>
}) {
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    if (!recording) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const acc = keyEventToAccelerator(e)
      if (acc) {
        setShortcutKey(acc).then((ok) => {
          if (ok) {
            setRecording(false)
          }
        })
      }
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRecording(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleEsc, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleEsc, true)
    }
  }, [recording, setShortcutKey])

  return (
    <div className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-primary/10 text-primary rounded-full">
          <Keyboard className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-medium text-on-surface">全局快捷键</h4>
          <p className="text-xs text-on-surface-variant mt-0.5">在任意界面按下快捷键触发抽选</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {shortcutKey && (
          <button
            onClick={() => {
              setShortcutKey('')
            }}
            className="text-xs text-destructive hover:underline cursor-pointer"
          >
            清除
          </button>
        )}
        <button
          onClick={() => setRecording(!recording)}
          className={cn(
            'min-w-[140px] px-4 py-1.5 border rounded-full text-sm text-center outline-none transition-all cursor-pointer',
            recording
              ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
              : 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary/50'
          )}
        >
          {recording
            ? '请按下快捷键...'
            : shortcutKey
              ? formatAccelerator(shortcutKey)
              : '点击设置'}
        </button>
      </div>
    </div>
  )
}
