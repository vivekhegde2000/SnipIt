import { AnimatePresence, m } from 'motion/react'
import { CloudOff } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'

type OfflineBadgeProps = {
  /** `icon` for tight spaces (rail, mobile header); `full` shows the label. */
  variant?: 'full' | 'icon'
  className?: string
}

/**
 * Appears only while offline. Reassures rather than warns: the whole app keeps working because
 * everything is stored on this device.
 */
export function OfflineBadge({ variant = 'full', className }: OfflineBadgeProps) {
  const isOnline = useOnlineStatus()

  return (
    <AnimatePresence initial={false}>
      {!isOnline && (
        <m.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={TRANSITION.fast}
          className={cn('inline-flex', className)}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                role="status"
                tabIndex={0}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 font-medium text-amber-800 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:text-amber-300',
                  variant === 'full' ? 'h-7 px-2.5 text-xs' : 'size-8 justify-center',
                )}
              >
                <CloudOff className="size-3.5" aria-hidden="true" />
                {variant === 'full' ? 'Offline' : <span className="sr-only">Offline</span>}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              You're offline — everything still works. Your data is on this device.
            </TooltipContent>
          </Tooltip>
        </m.span>
      )}
    </AnimatePresence>
  )
}
