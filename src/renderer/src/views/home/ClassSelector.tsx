import { useState, useRef, useEffect } from 'react'
import { GraduationCap, ChevronDown, Users, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import type { ClassGroup } from '../../types'

interface ClassSelectorProps {
  classes: ClassGroup[]
  currentClassId: string | null
  currentClass: ClassGroup | undefined
  isSpinning: boolean
  onSelectClass: (id: string) => void
}

export function ClassSelector({
  classes,
  currentClassId,
  currentClass,
  isSpinning,
  onSelectClass
}: ClassSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="absolute top-4 left-4 z-20" ref={ref}>
      <button
        onClick={() => !isSpinning && setOpen(!open)}
        disabled={isSpinning}
        className="flex items-center gap-2.5 bg-surface-container-high border border-outline-variant rounded-full px-3 py-1.5 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-w-[140px] elevation-1 transition-colors hover:bg-surface-container-high/80"
      >
        {currentClass ? (
          <>
            <span className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
              {currentClass.name.slice(0, 1)}
            </span>
            <span className="font-medium truncate">{currentClass.name}</span>
          </>
        ) : (
          <>
            <GraduationCap className="w-4 h-4 text-on-surface-variant" />
            <span className="text-on-surface-variant">选择班级</span>
          </>
        )}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-on-surface-variant ml-auto shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-64 bg-surface-container-high border border-outline-variant/50 rounded-2xl elevation-2 overflow-hidden z-50"
          >
            <div className="p-1.5 max-h-[280px] overflow-y-auto custom-scrollbar">
              {classes.map((c) => {
                const isSelected = currentClassId === c.id
                const activeCount = c.students.filter((s) => s.status === 'active').length
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectClass(c.id)
                      setOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left',
                      isSelected
                        ? 'bg-secondary-container text-secondary-container-foreground'
                        : 'hover:bg-surface-container text-on-surface'
                    )}
                  >
                    <span
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 text-primary'
                      )}
                    >
                      {c.name.slice(0, 1)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{c.name}</div>
                      <div className="text-[11px] text-on-surface-variant/70 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {activeCount} 人可抽选
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                )
              })}
              {classes.length === 0 && (
                <div className="px-3 py-6 text-center text-on-surface-variant text-sm">
                  暂无班级
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
