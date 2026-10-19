import { m } from 'motion/react'
import { Plus } from 'lucide-react'
import { useNewSnippet } from '@/features/snippets/use-new-snippet'
import { useHideOnScroll } from '@/hooks/use-hide-on-scroll'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * Floating "new snippet" action for phones, above the bottom navigation. Slides away while
 * scrolling down so it never sits on top of a card's Copy button, and returns on scroll up.
 */
export function NewSnippetFab() {
  const { triggerProps } = useNewSnippet()
  const hidden = useHideOnScroll()

  return (
    <m.button
      type="button"
      aria-label="New snippet"
      {...triggerProps}
      // Touch devices have no hover: warm the editor as soon as the finger lands.
      onPointerDown={triggerProps.onPointerEnter}
      tabIndex={hidden ? -1 : 0}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: hidden ? 0.8 : 1, opacity: hidden ? 0 : 1, y: hidden ? 24 : 0 }}
      whileTap={{ scale: 0.92 }}
      transition={TRANSITION.pop}
      className={cn(
        'fixed right-4 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1rem)] z-30 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 focus-visible:ring-4 focus-visible:ring-ring/50 focus-visible:outline-none',
        hidden && 'pointer-events-none',
      )}
    >
      <Plus className="size-6" aria-hidden="true" />
    </m.button>
  )
}
