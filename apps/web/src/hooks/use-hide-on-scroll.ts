import { useEffect, useState } from 'react'

/** Ignore tiny scroll jitter (px). */
const THRESHOLD = 8
/** Never hide near the top of the page (px). */
const TOP_ZONE = 80

/**
 * `true` while the user scrolls down (content in focus), `false` when scrolling up, near the top,
 * or at the end of the page. Used to tuck away floating controls that would cover content.
 * Passive listener, at most one state update per animation frame.
 */
export function useHideOnScroll(): boolean {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    let frame = 0

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const y = window.scrollY
        const delta = y - lastY
        if (Math.abs(delta) < THRESHOLD) return
        const atEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 24
        setHidden(delta > 0 && y > TOP_ZONE && !atEnd)
        lastY = y
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return hidden
}
