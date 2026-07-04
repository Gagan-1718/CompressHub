'use client'

import { useEffect, useRef } from 'react'

/**
 * Interactive dot field (canvas). A faint, transparent grid of dots; dots
 * within the cursor's radius brighten (glow) and push gently outward (bulge),
 * so a soft lens of light follows the pointer. The base is transparent
 * (clearRect, no fill) so the light ray behind shows between the dots.
 *
 * Static on touch / reduced-motion. Self-heals against layout timing by
 * re-syncing size each frame.
 */
export default function DotField({
  spacing = 24,
  dotRadius = 1.3,
  baseAlpha = 0.2,
  cursorRadius = 200,
  bulgeStrength = 20,
  glowRadius = 100,
  dotColor = '200, 185, 245',
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    const ctx = canvas.getContext('2d')

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const staticOnly = reduce || coarse

    let W = 0
    let H = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let dots = []
    const mouse = { x: -9999, y: -9999 }
    let raf = null

    const build = () => {
      dots = []
      for (let y = spacing / 2; y < H; y += spacing) {
        for (let x = spacing / 2; x < W; x += spacing) {
          dots.push({ x, y })
        }
      }
    }

    const resize = () => {
      const r = parent.getBoundingClientRect()
      W = r.width
      H = r.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      build()
    }

    const render = () => {
      ctx.clearRect(0, 0, W, H)
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i]
        let x = d.x
        let y = d.y
        let r = dotRadius
        let alpha = baseAlpha

        const dx = d.x - mouse.x
        const dy = d.y - mouse.y
        const dist = Math.hypot(dx, dy)

        if (dist < cursorRadius) {
          const t = 1 - dist / cursorRadius
          const push = t * t * bulgeStrength
          const ang = Math.atan2(dy, dx)
          x += Math.cos(ang) * push
          y += Math.sin(ang) * push
        }
        if (dist < glowRadius) {
          const g = 1 - dist / glowRadius
          r += g * 1.7
          alpha = Math.min(0.9, alpha + g * 0.55)
        }

        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${dotColor}, ${alpha})`
        ctx.fill()
      }
    }

    const loop = () => {
      const r = parent.getBoundingClientRect()
      if (Math.abs(r.width - W) > 1 || Math.abs(r.height - H) > 1) resize()
      render()
      raf = requestAnimationFrame(loop)
    }

    const onMove = (e) => {
      const r = parent.getBoundingClientRect()
      mouse.x = e.clientX - r.left
      mouse.y = e.clientY - r.top
    }
    const onLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    resize()
    const ro = new ResizeObserver(() => {
      resize()
      if (staticOnly) render()
    })
    ro.observe(parent)

    if (staticOnly) {
      render()
    } else {
      window.addEventListener('mousemove', onMove, { passive: true })
      window.addEventListener('mouseleave', onLeave)
      loop()
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [spacing, dotRadius, baseAlpha, cursorRadius, bulgeStrength, glowRadius, dotColor])

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 w-full h-full" />
}
