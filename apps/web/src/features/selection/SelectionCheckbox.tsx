import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type SelectionCheckboxProps = {
  checked: boolean
  /** Accessible name, e.g. "Select Git undo". */
  label: string
  onToggle: (options: { range: boolean }) => void
  /** Reachable with Tab (only in selection mode; otherwise `X` on the focused item does it). */
  focusable?: boolean
  className?: string
}

/**
 * Round tick used to select a snippet. A 32 px hit area (40 px on touch screens) around a 20 px
 * visual; clicks don't bubble, so it is safe inside clickable cards.
 */
export function SelectionCheckbox({
  checked,
  label,
  onToggle,
  focusable = true,
  className,
}: SelectionCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      tabIndex={focusable ? 0 : -1}
      onClick={(event) => {
        event.stopPropagation()
        onToggle({ range: event.shiftKey })
      }}
      className={cn(
        'group/check grid size-8 shrink-0 place-items-center rounded-full outline-none pointer-coarse:size-10',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-5 place-items-center rounded-full border-2 shadow-xs transition-[background-color,border-color,box-shadow] duration-150',
          'group-focus-visible/check:ring-3 group-focus-visible/check:ring-ring/50',
          checked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/50 bg-card group-hover/check:border-primary',
        )}
      >
        <Check className={cn('size-3 stroke-[3]', !checked && 'opacity-0')} />
      </span>
    </button>
  )
}
