import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'

const COPIED_FEEDBACK_MS = 1600

type CopyButtonProps = Omit<ComponentProps<typeof Button>, 'onClick' | 'children'> & {
  /** Performs the copy; resolve `true` on success to show the "Copied" state. */
  onCopy: () => Promise<boolean>
  label?: string
  copiedLabel?: string
  /** Icon only (label becomes the accessible name). */
  iconOnly?: boolean
}

/**
 * Copy action with a satisfying confirmation: the icon morphs into a check and the button turns
 * green for ~1.6 s. Click events don't bubble, so it is safe inside clickable cards.
 */
export function CopyButton({
  onCopy,
  label = 'Copy',
  copiedLabel = 'Copied',
  iconOnly = false,
  className,
  variant = 'default',
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const handleClick = async (event: React.MouseEvent) => {
    event.stopPropagation()
    if (!(await onCopy())) return
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
  }

  return (
    <Button
      type="button"
      variant={variant}
      data-copied={copied}
      aria-label={iconOnly ? (copied ? copiedLabel : label) : undefined}
      onClick={handleClick}
      className={cn(
        'relative overflow-hidden',
        variant === 'default'
          ? 'data-[copied=true]:bg-emerald-700 data-[copied=true]:text-white data-[copied=true]:shadow-emerald-700/25 dark:data-[copied=true]:bg-emerald-600'
          : 'data-[copied=true]:text-emerald-700 dark:data-[copied=true]:text-emerald-400',
        className,
      )}
      {...props}
    >
      <span className="relative grid size-4 place-items-center" aria-hidden="true">
        <AnimatePresence initial={false} mode="popLayout">
          <m.span
            key={copied ? 'check' : 'copy'}
            initial={{ scale: 0.4, opacity: 0, rotate: copied ? -45 : 45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={TRANSITION.pop}
            className="grid place-items-center"
          >
            {copied ? <Check className="size-4" strokeWidth={2.75} /> : <Copy className="size-4" />}
          </m.span>
        </AnimatePresence>
      </span>
      {!iconOnly && <span>{copied ? copiedLabel : label}</span>}
      {/* Announce the result for screen readers (the toast also announces it). */}
      <span className="sr-only" aria-live="polite">
        {copied ? copiedLabel : ''}
      </span>
    </Button>
  )
}
