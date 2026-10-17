import { Fragment } from 'react'
import { Keyboard } from 'lucide-react'
import { Kbd } from '@/components/Kbd'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { SHORTCUT_GROUPS } from './shortcuts'

type ShortcutsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Keyboard cheat sheet, generated from the shortcut registry. */
export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] gap-0 overflow-y-auto p-0 sm:max-w-3xl">
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Keyboard className="size-[18px]" aria-hidden="true" />
          </span>
          <div>
            <DialogTitle className="text-lg font-semibold tracking-tight">Keyboard shortcuts</DialogTitle>
            <DialogDescription>Work through your snippets without touching the mouse.</DialogDescription>
          </div>
        </div>
        <div className="grid gap-x-10 gap-y-7 px-6 py-6 sm:grid-cols-2">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title} aria-labelledby={`shortcuts-${group.title}`}>
              <h3
                id={`shortcuts-${group.title}`}
                className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                {group.title}
              </h3>
              <dl className="divide-y">
                {group.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 py-2">
                    <dt className="text-sm">{item.label}</dt>
                    <dd className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                      {item.keys.map((combo, index) => (
                        <Fragment key={combo.join('+')}>
                          {index > 0 && <span>{item.joiner ?? 'or'}</span>}
                          <Kbd keys={combo} />
                        </Fragment>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
