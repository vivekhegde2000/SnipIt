/**
 * Fluid card grids: as many columns as fit, each at least `min` wide. Uses the full width on any
 * screen (1 column on phones, 3–4 on laptops, 6–7 on 27" monitors) without breakpoints.
 * `min(100%, …)` stops a single card from overflowing very narrow screens.
 */
export const SNIPPET_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-4 2xl:gap-5'

export const TILE_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] gap-4 2xl:gap-5'

/**
 * Hover "lift" for clickable surfaces (the element must be `relative`). Only transform and
 * border colour transition; the larger shadow lives on a pseudo-element whose opacity fades,
 * which is far cheaper than animating `box-shadow` across many cards.
 */
export const LIFT_ON_HOVER =
  'transition-[transform,border-color] duration-200 ease-out-expo hover:-translate-y-0.5 hover:border-foreground/15 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 before:shadow-lg before:shadow-black/5 before:transition-opacity before:duration-200 hover:before:opacity-100 dark:before:shadow-black/40'
