import { useEffect, type ComponentProps, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, m } from 'motion/react'
import { CheckCheck, X, type LucideIcon } from 'lucide-react'
import { Kbd } from '@/components/Kbd'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * Building blocks of the floating bar shown in selection mode (library and Trash).
 *
 * The bar is centred over the content column: above the bottom navigation on phones, clear of the
 * sidebar (72 px rail / 16 rem sidebar) on larger screens. Full width on phones (items spread
 * out), a pill on larger screens.
 */
const BAR_POSITION =
  'pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+0.75rem)] z-40 flex justify-center px-3 md:bottom-6 md:pl-[calc(72px+1.5rem)] lg:pl-[calc(16rem+1.5rem)]'

const BAR_SURFACE =
  'pointer-events-auto flex max-w-full items-center gap-1 rounded-2xl border bg-popover/95 p-1.5 text-popover-foreground shadow-xl shadow-black/10 backdrop-blur-md supports-backdrop-filter:bg-popover/85 max-sm:w-full max-sm:justify-between max-sm:gap-0 dark:shadow-black/40'

/** The bar's height on touch screens (40 px buttons + padding + border) plus a small gap. */
const TOAST_LIFT = '4rem'

/** Classes for a bar action button (icon + label; icon-only on phones). */
export const BAR_BUTTON_CLASSES =
  'h-9 gap-1.5 px-2.5 max-sm:w-9 max-sm:px-0 pointer-coarse:h-10 max-sm:pointer-coarse:w-10'

/**
 * Slides the bar in and out with selection mode. Portalled to `<body>`: pages animate in with a
 * transform, which would otherwise turn `position: fixed` into "fixed to the page wrapper".
 */
export function SelectionBar({
  show,
  label,
  children,
}: {
  show: boolean
  label: string
  children: ReactNode
}) {
  // On phones, toasts share the bar's spot: lift them above it while it is shown.
  useEffect(() => {
    if (!show) return
    const root = document.documentElement
    root.style.setProperty('--toast-lift', TOAST_LIFT)
    return () => {
      root.style.removeProperty('--toast-lift')
    }
  }, [show])

  return createPortal(
    <AnimatePresence>
      {show && (
        <div className={BAR_POSITION}>
          <m.div
            role="toolbar"
            aria-label={label}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96, transition: TRANSITION.fast }}
            transition={TRANSITION.pop}
            className={BAR_SURFACE}
          >
            {children}
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** An action: icon + label on wider screens, icon-only with a tooltip on phones. */
export function BarButton({
  icon: Icon,
  label,
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, 'children'> & { icon: LucideIcon; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" aria-label={label} className={cn(BAR_BUTTON_CLASSES, className)} {...props}>
          <Icon aria-hidden="true" />
          <span className="max-sm:sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="sm:hidden">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export function BarDivider() {
  return <span aria-hidden="true" className="mx-0.5 h-6 w-px shrink-0 bg-border max-sm:hidden" />
}

/** Exit button, "N selected" (announced) and "Select all". */
export function SelectionSummary({
  count,
  hidden = 0,
  canSelectAll,
  totalListed,
  onSelectAll,
  onExit,
  selectAllClassName,
}: {
  count: number
  /** Selected items the current search/filters don't show. */
  hidden?: number
  canSelectAll: boolean
  totalListed: number
  onSelectAll: () => void
  onExit: () => void
  selectAllClassName?: string
}) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Exit selection" onClick={onExit}>
            <X aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          Exit selection <Kbd keys={['Esc']} className="ml-1" />
        </TooltipContent>
      </Tooltip>
      <p className="min-w-0 px-1 text-sm leading-tight" aria-live="polite" aria-atomic="true">
        <span className="font-semibold tabular-nums">{count.toLocaleString()}</span>
        <span className="max-sm:sr-only"> selected</span>
        {hidden > 0 && (
          <span className="block text-xs text-muted-foreground sm:ml-1.5 sm:inline">
            {hidden.toLocaleString()} hidden<span className="max-sm:hidden"> by filters</span>
          </span>
        )}
      </p>
      {canSelectAll && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              aria-label={`Select all ${totalListed.toLocaleString()}`}
              onClick={onSelectAll}
              className={cn(BAR_BUTTON_CLASSES, 'text-primary hover:text-primary', selectAllClassName)}
            >
              <CheckCheck aria-hidden="true" />
              <span className="max-md:sr-only">Select all</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            Select all {totalListed.toLocaleString()} <Kbd keys={['Mod', 'A']} className="ml-1" />
          </TooltipContent>
        </Tooltip>
      )}
    </>
  )
}
