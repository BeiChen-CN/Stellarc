import { AnimatePresence, motion } from 'framer-motion'
import { useConfirmStore } from '../store/confirmStore'
import { AlertTriangle } from 'lucide-react'

export function ConfirmDialog() {
  const { open, title, message, onConfirm, close } = useConfirmStore()

  const handleConfirm = () => {
    onConfirm?.()
    close()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="bg-surface-container rounded-[28px] elevation-3 p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
            </div>
            <p className="text-sm text-on-surface-variant mb-6 pl-12">{message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={close}
                className="px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="px-5 py-2.5 text-sm font-medium bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors cursor-pointer"
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
