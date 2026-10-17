import type { Transition } from 'motion/react'

/**
 * Motion tokens — one source of truth for timing so the whole UI moves consistently.
 * CSS-driven animations use the matching `--ease-*` tokens in index.css.
 */
export const DURATION = {
  fast: 0.12,
  base: 0.2,
  slow: 0.3,
} as const

/** Strong ease-out: quick start, gentle settle. Same curve as `--ease-out-expo`. */
export const EASE_OUT: Transition['ease'] = [0.16, 1, 0.3, 1]

export const TRANSITION = {
  /** Default for fades / small moves. */
  base: { duration: DURATION.base, ease: EASE_OUT },
  fast: { duration: DURATION.fast, ease: EASE_OUT },
  /** Snappy spring for indicators that slide between items. */
  indicator: { type: 'spring', stiffness: 520, damping: 40, mass: 0.8 },
  /** Bouncy spring for small celebratory feedback (favorite, copied). */
  pop: { type: 'spring', stiffness: 600, damping: 18 },
  /** Layout reflow (grid items moving to new positions). */
  layout: { type: 'spring', stiffness: 380, damping: 38 },
} as const satisfies Record<string, Transition>

/** Max items that get a staggered entrance; the rest appear instantly (keeps big lists snappy). */
export const STAGGER_LIMIT = 12
export const STAGGER_STEP = 0.03
