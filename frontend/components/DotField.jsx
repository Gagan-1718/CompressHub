'use client'

import { useEffect, useRef } from 'react'

/**
 * Interactive dot-field background (canvas). A grid of faint dots sits over a
 * soft radial tint; dots near the cursor "bulge" outward and brighten, giving
 * a subtle lens/glow that tracks the pointer. Purely decorative — rendered
 * behind content with pointer-events disabled.
 *
 * Respects prefers-reduced-motion (renders a calm static field) and pauses
 * when the tab is hidden. Props mirror the common ReactBits DotField API.
 */
export default function DotField({
  dotRadius = 2.2,
  dotSpacing = 22,
  cursorRadius = 380,
  bulgeStrength = 34,
  glowRadius = 110,
  gradientFrom = 'rgba(168, 85, 247, 0.30)',
  gradientTo = 'rgba(180, 151, 207, 0.18)',
  glowColor = '#0b0a0f',
  className = '',
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const parent = canvas.parentElement

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isCoarse = window.matchMedia('(pointer: coarse)').matches
    // Slightly sparser grid on small screens for performance
    const spacing = isCoarse ? dotSpacing * 1.4 : dotSpacing

    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let dots = []
    const mouse = { x: -9999, y: -9999 }
    let raf = null

    const buildDots = () => {
      dots = []
      // Soft glow center near top-middle to create the ambient brightening
      const gx = width * 0.5
      const gy = height * 0.18
      const maxDist = Math.hypot(width, height)
      for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) {
          const ambient = Math.max(0, 1 - Math.hypot(x - gx, y - gy) / (maxDist * 0.55))
          dots.push({ x, y, ambient })
        }
      }
    }

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      width = rect.width
      height = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildDots()
    }

    const drawBackground = () => {
      ctx.fillStyle = glowColor
      ctx.fillRect(0, 0, width, height)
      const grad = ctx.createRadialGradient(
        width * 0.5, height * 0.12, 0,
        width * 0.5, height * 0.12, Math.max(width, height) * 0.75
      )
      grad.addColorStop(0, gradientFrom)
      grad.addColorStop(0.55, gradientTo)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)
    }

    const render = () => {
      drawBackground()
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i]
        let x = d.x
        let y = d.y
        let r = dotRadius
        let alpha = 0.10 + d.ambient * 0.35

        const dx = d.x - mouse.x
        const dy = d.y - mouse.y
        const dist = Math.hypot(dx, dy)
        if (dist < cursorRadius) {
          const t = 1 - dist / cursorRadius
          const push = t * t * bulgeStrength
          const ang = Math.atan2(dy, dx)
          x += Math.cos(ang) * push
          y += Math.sin(ang) * push
          if (dist < glowRadius) {
            const g = 1 - dist / glowRadius
            r += g * 1.6
            alpha = Math.min(1, alpha + g * 0.6)
          }
        }

        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(196, 181, 253, ${alpha})`
        ctx.fill()
      }
    }

    const loop = () => {
      render()
      raf = requestAnimationFrame(loop)
    }

    const onMouseMove = (e) => {
      const rect = parent.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onMouseLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }
    const onVisibility = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf)
        raf = null
      } else if (!reduceMotion && !raf) {
        loop()
      }
    }

    // No cursor to react to (touch) or reduced-motion requested → draw a calm
    // static field instead of burning a rAF loop on an unchanging frame.
    const staticOnly = reduceMotion || isCoarse

    resize()
    const ro = new ResizeObserver(() => {
      resize()
      if (staticOnly) render() // keep the static frame after size changes
    })
    ro.observe(parent)

    if (staticOnly) {
      render()
    } else {
      window.addEventListener('mousemove', onMouseMove, { passive: true })
      window.addEventListener('mouseleave', onMouseLeave)
      document.addEventListener('visibilitychange', onVisibility)
      loop()
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [dotRadius, dotSpacing, cursorRadius, bulgeStrength, glowRadius, gradientFrom, gradientTo, glowColor])

  return <canvas ref={canvasRef} aria-hidden="true" className={`block ${className}`} />
}
