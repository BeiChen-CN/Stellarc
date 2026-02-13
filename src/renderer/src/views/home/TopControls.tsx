import { Shuffle, LayoutGrid, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../lib/utils'
import { ClassTimer } from '../../components/ClassTimer'

interface TopControlsProps {
  mode: 'pick' | 'group'
  pickCount: number
  groupCount: number
  isSpinning: boolean
  projectorMode: boolean
  onModeChange: (mode: 'pick' | 'group') => void
  onPickCountChange: (count: number) => void
  onGroupCountChange: (count: number) => void
}

export function TopControls({
  mode,
  pickCount,
  groupCount,
  isSpinning,
  projectorMode,
  onModeChange,
  onPickCountChange,
  onGroupCountChange
}: TopControlsProps) {
  return (
    <div
      className={cn(
        'absolute top-4 right-4 z-20 flex items-center gap-3',
        projectorMode && 'top-6 right-6 gap-4'
      )}
    >
      <div className="relative">
        <ClassTimer />
      </div>

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

      {mode === 'pick' ? (
        <div className="flex items-center bg-surface-container-high rounded-full px-3 py-1.5 elevation-1">
          <span className="text-sm font-medium mr-2 text-on-surface-variant flex items-center gap-1">
            <Users className="w-4 h-4" />
            人数
          </span>
          <button
            onClick={() => onPickCountChange(Math.max(1, pickCount - 1))}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-on-surface/10 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            disabled={isSpinning}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <span className="w-6 text-center font-bold text-primary">{pickCount}</span>
          <button
            onClick={() => onPickCountChange(Math.min(10, pickCount + 1))}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-on-surface/10 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            disabled={isSpinning}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      ) : (
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
