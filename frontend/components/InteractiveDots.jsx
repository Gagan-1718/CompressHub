'use client'

import { useEffect, useRef } from 'react'

/**
 * The hero dot grid with a subtle cursor parallax: the whole field drifts a
 * few pixels toward the pointer, smoothed with a rAF lerp for a gentle
 * "living" feel. Static (no listeners) on touch devices. The layer is inset
 * slightly beyond its container so the drift never reveals an edge gap.
 */
export default function InteractiveDots() {
  const ref = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const el = ref.current
    if (!el) return

    let targetX = 0
    let targetY = 0
    let curX = 0
    let curY = 0
    let raf
    const amount = 16 // max drift in px

    const onMove = (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * amount
      targetY = (e.clientY / window.innerHeight - 0.5) * amount
    }

    const tick = () => {
      curX += (targetX - curX) * 0.07
      curY += (targetY - curY) * 0.07
      el.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0)`
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
      ref={ref}
      aria-hidden="true"
      className="absolute inset-[-24px] will-change-transform"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(190, 175, 240, 0.22) 1.3px, transparent 1.7px)',
        backgroundSize: '24px 24px',
      }}
    />
  )
}
