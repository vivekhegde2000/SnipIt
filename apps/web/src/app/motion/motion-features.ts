// Loaded asynchronously by <MotionProvider> so animation features never block first paint.
// `domMax` = animations + gestures + layout animations (needed for reflow and sliding indicators).
import { domMax } from 'motion/react'

export default domMax
