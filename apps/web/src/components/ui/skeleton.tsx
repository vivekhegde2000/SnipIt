import { cn } from 'cn'

/** Loading placeholder with a soft travelling shimmer (static under reduced motion). */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'animate-shimmer rounded-md bg-muted bg-[linear-gradient(90deg,transparent_0%,color-mix(in_oklch,var(--foreground)_6%,transparent)_50%,transparent_100%)] bg-size-[200%_100%] bg-no-repeat motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
