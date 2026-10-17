import { Scissors } from 'lucide-react'
import { cn } from '@/lib/utils'

type LogoProps = {
  /** Show the "SnipIt" word mark next to the icon. */
  withText?: boolean
  className?: string
}

export function Logo({ withText = true, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30"
      >
        <Scissors className="size-4 -rotate-90" strokeWidth={2.25} />
      </span>
      {withText ? (
        <span className="text-[17px] font-semibold tracking-tight">
          Snip<span className="text-primary">It</span>
        </span>
      ) : (
        <span className="sr-only">SnipIt</span>
      )}
    </span>
  )
}
