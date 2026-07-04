'use client'

import { useRef } from 'react'

/**
 * Cursor-tracking 3D tilt wrapper: the card tips gently toward the pointer
 * and a specular highlight follows it. Resets smoothly on leave.
 * Wrap any block-level content; `className` passes through to the wrapper.
 */
export default function TiltCard({ children, className = '', maxTilt = 5 }) {
  const ref = useRef(null)
  const glareRef = useRef(null)

  const onMouseMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width // 0..1
    const py = (e.clientY - rect.top) / rect.height

    const rx = (py - 0.5) * -2 * maxTilt
    const ry = (px - 0.5) * 2 * maxTilt
    el.style.transform = `perspective(800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`
    el.style.transition = 'transform 60ms linear'

    const glare = glareRef.current
    if (glare) {
      glare.style.opacity = '1'
      glare.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.08), transparent 55%)`
    }
  }

  const onMouseLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transition = 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)'
    el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)'
    if (glareRef.current) glareRef.current.style.opacity = '0'
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`relative will-change-transform ${className}`}
    >
      {children}
      <div
        ref={glareRef}
        aria-hidden="true"
        className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 transition-opacity duration-300"
      />
    </div>
  )
}
