'use client'

import { useEffect, useRef } from 'react'

/**
 * Site-wide cursor spotlight: a soft radial glow that trails the pointer.
 * Renders a single fixed, pointer-events-none layer; position updates are
 * batched through requestAnimationFrame with a gentle lerp for the trail.
 * No-ops on touch devices (no persistent cursor to follow).
 */
export default function MouseGlow() {
  const glowRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    const el = glowRef.current
    if (!el) return

    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 3
    let x = targetX
    let y = targetY
    let raf

    const onMove = (e) => {
      targetX = e.clientX
      targetY = e.clientY
      el.style.opacity = '1'
    }

    const tick = () => {
      // Lerp toward the cursor for a soft trailing feel
      x += (targetX - x) * 0.12
      y += (targetY - y) * 0.12
      el.style.transform = `translate3d(${x - 300}px, ${y - 300}px, 0)`
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="fixed top-0 left-0 w-[600px] h-[600px] pointer-events-none z-0 opacity-0 transition-opacity duration-700"
      style={{
        background:
          'radial-gradient(circle, rgba(59,130,246,0.09) 0%, rgba(139,92,246,0.05) 35%, transparent 65%)',
      }}
    />
  )
}
