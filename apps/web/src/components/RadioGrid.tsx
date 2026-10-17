import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type RadioGridOption = {
  value: string
  /** Accessible name (also the tooltip). */
  label: string
  content: ReactNode
}

type RadioGridProps = {
  id?: string
  'aria-labelledby'?: string
  options: readonly RadioGridOption[]
  value: string
  onChange: (value: string) => void
  /** Columns used for ↑/↓ navigation; must match the visual grid. */
  columns: number
  className?: string
  optionClassName?: (selected: boolean) => string
}

/**
 * Accessible grid of radio options (colour swatches, emoji…). One tab stop (roving tabindex);
 * arrow keys move in 2D, Home/End jump to the ends — the WAI-ARIA radio group pattern.
 */
export function RadioGrid({
  id,
  'aria-labelledby': labelledBy,
  options,
  value,
  onChange,
  columns,
  className,
  optionClassName,
}: RadioGridProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  const select = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    refs.current[index]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = options.length - 1
    const moves: Record<string, number> = {
      ArrowRight: selectedIndex + 1,
      ArrowLeft: selectedIndex - 1,
      ArrowDown: selectedIndex + columns,
      ArrowUp: selectedIndex - columns,
      Home: 0,
      End: last,
    }
    const next = moves[event.key]
    if (next === undefined) return
    event.preventDefault()
    select(Math.min(last, Math.max(0, next)))
  }

  return (
    <div
      id={id}
      role="radiogroup"
      aria-labelledby={labelledBy}
      onKeyDown={handleKeyDown}
      className={cn('grid gap-2', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((option, index) => {
        const selected = index === selectedIndex && option.value === value
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            tabIndex={index === selectedIndex ? 0 : -1}
            onClick={() => select(index)}
            className={cn(
              'grid aspect-square place-items-center rounded-lg transition-[background-color,box-shadow,transform] duration-150',
              'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-95',
              optionClassName?.(selected),
            )}
          >
            {option.content}
          </button>
        )
      })}
    </div>
  )
}
