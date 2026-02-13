import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore } from '../store/toastStore'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { useSpeedFactor } from '../lib/useSpeedFactor'

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()
  const sf = useSpeedFactor()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 * sf }}
              className={cn(
                'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl elevation-2 min-w-[280px] max-w-[400px]',
                toast.type === 'success' && 'bg-secondary-container text-secondary-container-foreground',
                toast.type === 'error' && 'bg-destructive/10 text-destructive',
                toast.type === 'info' && 'bg-surface-container-high text-on-surface'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-full hover:bg-on-surface/10 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
