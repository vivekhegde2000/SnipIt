import type { ReactNode } from 'react'
import { LazyMotion, MotionConfig } from 'motion/react'
import { TRANSITION } from '@/lib/motion'

const loadFeatures = () => import('./motion-features').then((module) => module.default)

/**
 * App-wide animation setup:
 * - `LazyMotion` + `m.*` components keep the initial bundle small; features load in parallel.
 * - `strict` forbids the heavy `motion.*` components so nobody re-adds the full bundle by accident.
 * - `reducedMotion="user"` honours the OS "reduce motion" setting (transforms off, fades kept).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={TRANSITION.base}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
