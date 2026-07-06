'use client'

import { useEffect } from 'react'
import { getApiUrl } from '@/lib/api'

/**
 * Wakes the (possibly sleeping) free-tier backend as soon as the app loads, so
 * it's usually ready by the time the user uploads — hiding most of the cold
 * start delay. Fire-and-forget; failures are ignored.
 */
export default function WarmUp() {
  useEffect(() => {
    fetch(getApiUrl('/health')).catch(() => {})
  }, [])
  return null
}
