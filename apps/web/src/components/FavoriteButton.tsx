import type { ComponentProps } from 'react'
import { m } from 'motion/react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'

type FavoriteButtonProps = Omit<ComponentProps<typeof Button>, 'onClick' | 'children'> & {
  isFavorite: boolean
  onToggle: () => void
}

/** Star toggle. Pops when it turns on; click events don't bubble (safe inside clickable cards). */
export function FavoriteButton({
  isFavorite,
  onToggle,
  className,
  size = 'icon-sm',
  ...props
}: FavoriteButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      className={cn(
        'text-muted-foreground hover:text-favorite',
        isFavorite && 'text-favorite hover:text-favorite',
        className,
      )}
      {...props}
    >
      <m.span
        key={String(isFavorite)}
        initial={isFavorite ? { scale: 0.3, rotate: -40 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={TRANSITION.pop}
        className="grid place-items-center"
        aria-hidden="true"
      >
        <Star className={cn('size-[18px]', isFavorite && 'fill-current')} />
      </m.span>
    </Button>
  )
}
