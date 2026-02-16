import type { LucideIcon } from 'lucide-react'
import type { ReactElement } from 'react'

export function StatePanel({
  icon: Icon,
  title,
  description,
  compact = false
}: {
  icon: LucideIcon
  title: string
  description: string
  compact?: boolean
}): ReactElement {
  return (
    <div
      className={
        compact
          ? 'flex flex-col items-center justify-center py-8 text-on-surface-variant'
          : 'flex flex-col items-center justify-center h-full text-on-surface-variant py-20'
      }
    >
      <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 opacity-45" />
      </div>
      <p className="text-sm sm:text-base text-on-surface">{title}</p>
      <p className="text-xs sm:text-sm mt-1 opacity-80">{description}</p>
    </div>
  )
}
