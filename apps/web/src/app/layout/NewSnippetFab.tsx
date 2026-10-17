import { Plus } from 'lucide-react'
import { useNewSnippet } from '@/features/snippets/use-new-snippet'

/** Floating "new snippet" action for phones, sitting above the bottom navigation. */
export function NewSnippetFab() {
  const newSnippet = useNewSnippet()

  return (
    <button
      type="button"
      onClick={newSnippet}
      aria-label="New snippet"
      className="fixed right-4 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1rem)] z-30 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-95"
    >
      <Plus className="size-6" aria-hidden="true" />
    </button>
  )
}
