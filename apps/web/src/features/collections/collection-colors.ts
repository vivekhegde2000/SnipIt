import type { CollectionColor } from '@snipit/shared'

type ColorClasses = {
  label: string
  /** Solid swatch, e.g. a dot. */
  swatch: string
  /** Tinted background + readable text, for chips and tiles. */
  soft: string
}

/** Literal class names so Tailwind can see them at build time. */
export const COLLECTION_COLOR_CLASSES: Record<CollectionColor, ColorClasses> = {
  indigo: {
    label: 'Indigo',
    swatch: 'bg-indigo-500',
    soft: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  },
  sky: { label: 'Sky', swatch: 'bg-sky-500', soft: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  emerald: {
    label: 'Emerald',
    swatch: 'bg-emerald-500',
    soft: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  lime: { label: 'Lime', swatch: 'bg-lime-500', soft: 'bg-lime-500/10 text-lime-700 dark:text-lime-300' },
  amber: {
    label: 'Amber',
    swatch: 'bg-amber-500',
    soft: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  orange: {
    label: 'Orange',
    swatch: 'bg-orange-500',
    soft: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  },
  rose: { label: 'Rose', swatch: 'bg-rose-500', soft: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
  fuchsia: {
    label: 'Fuchsia',
    swatch: 'bg-fuchsia-500',
    soft: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300',
  },
  violet: {
    label: 'Violet',
    swatch: 'bg-violet-500',
    soft: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  },
  slate: {
    label: 'Slate',
    swatch: 'bg-slate-500',
    soft: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  },
}
