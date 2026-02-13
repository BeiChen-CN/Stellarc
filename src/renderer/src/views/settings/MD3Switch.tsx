import { cn } from '../../lib/utils'

export function MD3Switch({
  checked,
  onClick,
  label
}: {
  checked: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'relative inline-flex items-center w-[52px] h-[32px] rounded-full transition-colors duration-200 cursor-pointer shrink-0',
        checked ? 'bg-primary' : 'bg-surface-container-high border-2 border-outline'
      )}
    >
      <span
        className={cn(
          'absolute transition-all duration-200 rounded-full',
          checked ? 'w-6 h-6 right-[3px] bg-primary-foreground' : 'w-4 h-4 left-[6px] bg-outline'
        )}
      />
    </button>
  )
}
