import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement
} from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function DatePicker({
  value,
  onChange,
  disabled,
  placeholder
}: {
  value: string
  onChange: (date: string) => void
  disabled?: boolean
  placeholder?: string
}): ReactElement {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [popupStyle, setPopupStyle] = useState<CSSProperties>({})

  // Parse value or default to current month
  const parsed = value ? new Date(value + 'T00:00:00') : null
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() || new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? new Date().getMonth())

  const handleClickOutside = useCallback((e: MouseEvent): void => {
    if (
      ref.current &&
      !ref.current.contains(e.target as Node) &&
      btnRef.current &&
      !btnRef.current.contains(e.target as Node)
    ) {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      // Calculate position relative to viewport
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const panelHeight = 340
        if (spaceBelow < panelHeight) {
          // Open upward
          setPopupStyle({
            position: 'fixed',
            left: rect.left,
            bottom: window.innerHeight - rect.top + 4,
            zIndex: 9999
          })
        } else {
          // Open downward
          setPopupStyle({ position: 'fixed', left: rect.left, top: rect.bottom + 4, zIndex: 9999 })
        }
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, handleClickOutside])

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const prevMonth = (): void => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else setViewMonth(viewMonth - 1)
  }
  const nextMonth = (): void => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else setViewMonth(viewMonth + 1)
  }

  const selectDay = (day: number): void => {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${viewYear}-${m}-${d}`)
    setOpen(false)
  }

  const formatDisplay = (v: string): string => {
    if (!v) return ''
    const [y, m, d] = v.split('-')
    return `${y} 年 ${parseInt(m)} 月 ${parseInt(d)} 日`
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-xl text-sm bg-surface-container-low transition-colors text-left',
          disabled
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:bg-surface-container-high/60 cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary'
        )}
      >
        <CalendarDays className="w-4 h-4 text-on-surface-variant shrink-0" />
        {value ? (
          <span className="text-on-surface">{formatDisplay(value)}</span>
        ) : (
          <span className="text-on-surface-variant">{placeholder || '选择日期'}</span>
        )}
      </button>

      {open && (
        <div
          ref={ref}
          style={popupStyle}
          className="bg-surface-container rounded-2xl elevation-3 border border-outline-variant/30 p-3 w-[280px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={prevMonth}
              className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-on-surface">
              {viewYear} 年 {viewMonth + 1} 月
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="text-center text-[10px] text-on-surface-variant font-medium py-1"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const m = String(viewMonth + 1).padStart(2, '0')
              const d = String(day).padStart(2, '0')
              const dateStr = `${viewYear}-${m}-${d}`
              const isSelected = dateStr === value
              const isToday = dateStr === new Date().toISOString().slice(0, 10)
              return (
                <button
                  key={day}
                  onClick={() => selectDay(day)}
                  className={cn(
                    'w-8 h-8 mx-auto rounded-full text-xs font-medium flex items-center justify-center transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : isToday
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : 'text-on-surface hover:bg-surface-container-high'
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Clear */}
          {value && (
            <button
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="mt-2 w-full text-center text-xs text-destructive hover:text-destructive/80 cursor-pointer py-1"
            >
              清除日期
            </button>
          )}
        </div>
      )}
    </div>
  )
}
