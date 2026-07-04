'use client'

import { useEffect, useRef } from 'react'

/**
 * Soft volumetric light rays fanning from a top-center source (CSS gradients,
 * no WebGL). Decorative overlay meant to sit above a dark background with a
 * screen blend. Optionally drifts slightly with the pointer for a living feel.
 *
 * Props mirror the common ReactBits LightRays API; the visually meaningful
 * ones are implemented, the rest are accepted for compatibility.
 */
export default function LightRays({
  raysColor = '#ffffff',
  lightSpread = 0.8,
  rayLength = 2.1,
  fadeDistance = 0.5,
  followMouse = true,
  mouseInfluence = 0.2,
  className = '',
}) {
  const ref = useRef(null)

  useEffect(() => {
    if (!followMouse) return
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    let raf = null
    let targetX = 0
    let currentX = 0

    const onMove = (e) => {
      const rel = (e.clientX / window.innerWidth) - 0.5 // -0.5..0.5
      targetX = rel * mouseInfluence * 120 // px drift
    }
    const tick = () => {
      currentX += (targetX - currentX) * 0.08
      el.style.transform = `translateX(${currentX.toFixed(2)}px)`
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [followMouse, mouseInfluence])

  // Soft rays: a repeating conic gradient of faint slivers emanating from the
  // top-center, blurred and masked so they fade with distance.
  const spreadDeg = 30 + lightSpread * 40 // wider slivers for higher spread
  const fadeStop = `${Math.round(45 + fadeDistance * 45)}%`

  // Fanned god-rays: soft slivers emanating from the top-center, blurred and
  // masked so they fade with distance.
  const raysStyle = {
    position: 'absolute',
    top: `-${Math.round(rayLength * 8)}%`,
    left: '-20%',
    right: '-20%',
    height: `${Math.round(rayLength * 75)}%`,
    background: `repeating-conic-gradient(from 180deg at 50% 0%,
      rgba(255,255,255,0) 0deg,
      rgba(255,255,255,0) 2.5deg,
      ${hexToRgba(raysColor, 0.05)} 4deg,
      rgba(255,255,255,0) 5.5deg,
      rgba(255,255,255,0) ${(spreadDeg / 6).toFixed(1)}deg)`,
    WebkitMaskImage: `radial-gradient(ellipse 60% 100% at 50% 0%, black 0%, transparent ${fadeStop})`,
    maskImage: `radial-gradient(ellipse 60% 100% at 50% 0%, black 0%, transparent ${fadeStop})`,
    filter: 'blur(6px)',
    mixBlendMode: 'screen',
  }

  // Bright central beam — the defined spotlight core from the reference.
  const beamStyle = {
    position: 'absolute',
    top: '-10%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '30%',
    height: '85%',
    background: `radial-gradient(ellipse 42% 70% at 50% 0%, ${hexToRgba(raysColor, 0.11)}, transparent 62%)`,
    filter: 'blur(16px)',
    mixBlendMode: 'screen',
    pointerEvents: 'none',
  }

  // Hot source point at the very top-center
  const sourceStyle = {
    position: 'absolute',
    top: '-16%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '40%',
    height: '48%',
    background: `radial-gradient(ellipse 55% 55% at 50% 0%, ${hexToRgba(raysColor, 0.14)}, transparent 55%)`,
    filter: 'blur(20px)',
    mixBlendMode: 'screen',
    pointerEvents: 'none',
  }

  return (
    <div aria-hidden="true" className={`pointer-events-none overflow-hidden ${className}`}>
      <div ref={ref} style={{ position: 'absolute', inset: 0 }}>
        <div style={raysStyle} />
        <div style={beamStyle} />
        <div style={sourceStyle} />
      </div>
    </div>
  )
}

function hexToRgba(hex, alpha) {
  const m = hex.replace('#', '')
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
