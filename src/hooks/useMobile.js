import { useState, useEffect } from 'react'

/**
 * Returns true when the viewport width is below the md breakpoint (768px).
 * Updates reactively on resize.
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isMobile
}
