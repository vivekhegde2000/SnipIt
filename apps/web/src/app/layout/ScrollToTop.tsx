import { useEffect } from 'react'
import { useLocation } from 'react-router'

/** Resets scroll when the page (pathname) changes; filter changes keep the position. */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return null
}
