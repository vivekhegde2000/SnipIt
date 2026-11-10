import { LayoutGrid, ListChecks, Rows3, type LucideIcon } from 'lucide-react'
import { Kbd } from '@/components/Kbd'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSelectionActive, useSelectionStore } from '@/features/selection/selection-context'
import { cn } from '@/lib/utils'
import { setViewLayout, useViewLayout, type ViewLayout } from '../view-layout'

const LAYOUT_OPTIONS: { value: ViewLayout; label: string; icon: LucideIcon }[] = [
  { value: 'grid', label: 'Grid view', icon: LayoutGrid },
  { value: 'list', label: 'List view', icon: Rows3 },
]

/** Grid / list switch (`V` toggles it). Remembered per device. */
export function LayoutToggle() {
  const layout = useViewLayout()
  return (
    <div
      role="group"
      aria-label="Layout"
      className="inline-flex h-9 shrink-0 items-center rounded-lg border bg-background p-0.5 shadow-xs dark:border-input dark:bg-input/30 pointer-coarse:h-10"
    >
      {LAYOUT_OPTIONS.map(({ value, label, icon: Icon }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={label}
              aria-pressed={layout === value}
              aria-keyshortcuts="V"
              onClick={() => setViewLayout(value)}
              className={cn(
                'grid h-full w-8 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none pointer-coarse:w-9',
                layout === value && 'bg-accent text-accent-foreground hover:text-accent-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {label} <Kbd keys={['V']} className="ml-1" />
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

/** Turns selection mode on/off. Long-press (touch), Shift/Ctrl-click and `X` also start it. */
export function SelectButton() {
  const store = useSelectionStore()
  const active = useSelectionActive()
  return (
    <Button
      variant="outline"
      aria-pressed={active}
      onClick={() => (active ? store.clear() : store.start())}
      className={cn('shrink-0', active && 'border-primary/40 bg-accent text-accent-foreground')}
    >
      <ListChecks aria-hidden="true" />
      Select
    </Button>
  )
}
