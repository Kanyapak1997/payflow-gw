import { useEffect, useState } from 'react'

/**
 * Mimics the brief fetch a real dashboard would perform, so skeleton states are
 * exercised rather than decorative. Kept short enough to stay out of the way.
 */
export function useSimulatedLoading(duration = 380) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), duration)
    return () => clearTimeout(timer)
  }, [duration])

  return loading
}
