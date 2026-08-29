import { useEffect, useRef, useState, type ReactElement } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'

export interface DropdownOption {
  value: string
  label: string
}

export interface DropdownProps {
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  placeholder: string
  /** 触发按钮样式（各页面密度/圆角不同，由调用方传入） */
  triggerClassName: string
  panelClassName: string
  itemClassName: string
}

/**
 * 通用下拉选择：点击外部关闭、选中高亮、图标槽位对齐。
 * 交互逻辑收敛在此，外观由调用方通过 className 定制。
 */
export function Dropdown({
  value,
  options,
  onChange,
  placeholder,
  triggerClassName,
  panelClassName,
  itemClassName
}: DropdownProps): ReactElement {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = options.find((item) => item.value === value)

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((prev) => !prev)} className={triggerClassName}>
        <span>{current?.label || placeholder}</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-on-surface-variant transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className={panelClassName}>
          {options.map((item) => {
            const selected = value === item.value
            return (
              <button
                key={item.value}
                onClick={() => {
                  onChange(item.value)
                  setOpen(false)
                }}
                className={cn(
                  itemClassName,
                  selected
                    ? 'bg-secondary-container text-secondary-container-foreground'
                    : 'text-on-surface hover:bg-surface-container-high'
                )}
              >
                <span className="w-3.5 h-3.5 inline-flex items-center justify-center shrink-0">
                  {selected ? <Check className="w-3.5 h-3.5" /> : null}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
