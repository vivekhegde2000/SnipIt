import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { m } from 'motion/react'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: ReactNode
  /** Buttons or links shown under the text. */
  children?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, children, className }: EmptyStateProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={TRANSITION.base}
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/40 px-6 py-16 text-center',
        className,
      )}
    >
      <m.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...TRANSITION.pop, delay: 0.05 }}
        className="mb-5 grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground ring-8 ring-accent/40"
      >
        <Icon className="size-6" aria-hidden="true" />
      </m.div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-pretty text-muted-foreground">{description}</p>
      )}
      {children && <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </m.div>
  )
}
