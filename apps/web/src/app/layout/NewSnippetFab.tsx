import { m } from 'motion/react'
import { Plus } from 'lucide-react'
import { useNewSnippet } from '@/features/snippets/use-new-snippet'
import { TRANSITION } from '@/lib/motion'

/** Floating "new snippet" action for phones, sitting above the bottom navigation. */
export function NewSnippetFab() {
  const { triggerProps } = useNewSnippet()

  return (
    <m.button
      type="button"
      aria-label="New snippet"
      {...triggerProps}
      // Touch devices have no hover: warm the editor as soon as the finger lands.
      onPointerDown={triggerProps.onPointerEnter}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.92 }}
      transition={TRANSITION.pop}
      className="fixed right-4 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1rem)] z-30 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 focus-visible:ring-4 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <Plus className="size-6" aria-hidden="true" />
    </m.button>
  )
}
