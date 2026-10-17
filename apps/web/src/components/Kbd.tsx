import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { modKeyLabel } from '@/lib/platform'

type KbdProps = ComponentProps<'kbd'> & {
  /** Keys to show; the token `Mod` renders as ⌘ on Apple platforms and Ctrl elsewhere. */
  keys: readonly string[]
}

/** Keyboard shortcut hint, e.g. `<Kbd keys={['Mod', 'K']} />`. */
export function Kbd({ keys, className, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'pointer-events-none inline-flex h-5 items-center gap-0.5 rounded-md border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground select-none',
        className,
      )}
      {...props}
    >
      {keys.map((key) => (key === 'Mod' ? modKeyLabel : key)).join(' ')}
    </kbd>
  )
}
