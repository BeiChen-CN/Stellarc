import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useConfirmStore } from '../store/confirmStore'
import { AlertTriangle } from 'lucide-react'
import { useSpeedFactor } from '../lib/useSpeedFactor'

export function ConfirmDialog() {
  const { open, title, message, onConfirm, promptMode, promptPlaceholder, onPromptConfirm, close } =
    useConfirmStore()
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const sf = useSpeedFactor()

  useEffect(() => {
    if (open && promptMode) {
      setInputValue('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, promptMode])

  const handleConfirm = () => {
    if (promptMode) {
      if (inputValue.trim()) {
        onPromptConfirm?.(inputValue.trim())
      }
    } else {
      onConfirm?.()
    }
    close()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 * sf }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 * sf }}
            className="bg-surface-container rounded-[28px] elevation-3 p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${promptMode ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                <AlertTriangle className={`w-5 h-5 ${promptMode ? 'text-primary' : 'text-destructive'}`} />
              </div>
              <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
            </div>
            <p className="text-sm text-on-surface-variant mb-4 pl-12">{message}</p>
            {promptMode && (
              <div className="mb-6 pl-12">
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                  placeholder={promptPlaceholder}
                  className="w-full px-4 py-2 border border-outline-variant rounded-full text-sm bg-surface-container-low focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors text-on-surface"
                />
              </div>
            )}
            {!promptMode && <div className="mb-2" />}
            <div className="flex justify-end gap-2">
              <button
                onClick={close}
                className="px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={promptMode && !inputValue.trim()}
                className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  promptMode
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                }`}
              >
                确认
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
