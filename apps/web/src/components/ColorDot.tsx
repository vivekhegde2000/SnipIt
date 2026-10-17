import type { CollectionColor } from '@snipit/shared'
import { cn } from '@/lib/utils'
import { COLLECTION_COLOR_CLASSES } from '@/features/collections/collection-colors'

type ColorDotProps = {
  color: CollectionColor
  className?: string
}

/** Small decorative colour swatch for a collection. */
export function ColorDot({ color, className }: ColorDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block size-2.5 shrink-0 rounded-full',
        COLLECTION_COLOR_CLASSES[color].swatch,
        className,
      )}
    />
  )
}
