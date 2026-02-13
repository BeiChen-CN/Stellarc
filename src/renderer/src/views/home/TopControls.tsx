import { Shuffle, LayoutGrid, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../lib/utils'

interface TopControlsProps {
  mode: 'pick' | 'group'
  groupCount: number
  projectorMode: boolean
  onModeChange: (mode: 'pick' | 'group') => void
  onGroupCountChange: (count: number) => void
}

export function TopControls({
  mode,
  groupCount,
  projectorMode,
  onModeChange,
  onGroupCountChange
}: TopControlsProps) {
  return (
    <div
      className={cn(
        'absolute top-4 right-4 z-20 flex items-center gap-3',
        projectorMode && 'top-6 right-6 gap-4'
      )}
    >
      <div className="flex rounded-full border border-outline-variant overflow-hidden elevation-1">
        <button
          onClick={() => onModeChange('pick')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer',
            mode === 'pick'
              ? 'bg-secondary-container text-secondary-container-foreground'
              : 'text-on-surface-variant hover:bg-surface-container-high/60'
          )}
        >
          <Shuffle className="w-3.5 h-3.5" />
          抽选
        </button>
        <button
          onClick={() => onModeChange('group')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer',
            mode === 'group'
              ? 'bg-secondary-container text-secondary-container-foreground'
              : 'text-on-surface-variant hover:bg-surface-container-high/60'
          )}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          分组
        </button>
      </div>

      {mode === 'group' && (
        <div className="flex items-center bg-surface-container-high rounded-full px-3 py-1.5 elevation-1">
          <span className="text-sm font-medium mr-2 text-on-surface-variant flex items-center gap-1">
            <LayoutGrid className="w-4 h-4" />
            组数
          </span>
          <button
            onClick={() => onGroupCountChange(Math.max(2, groupCount - 1))}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-on-surface/10 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <span className="w-6 text-center font-bold text-primary">{groupCount}</span>
          <button
            onClick={() => onGroupCountChange(Math.min(10, groupCount + 1))}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-on-surface/10 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
