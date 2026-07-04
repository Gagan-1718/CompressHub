'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Wand2, Download, Check } from 'lucide-react'

/**
 * Enhance — real-time photographic mood grading, done on a canvas entirely
 * in the browser (free, instant, on-device; no API key, no upload). Each
 * preset is a color grade: base adjustments via ctx.filter, plus optional
 * color-wash overlays and a vignette. The graded image can be downloaded.
 *
 * `imageUrl` is the source (a data URL or normal URL).
 */

const PRESETS = [
  { key: 'original', label: 'Original', filter: 'none' },
  {
    key: 'beautify', label: 'Beautify',
    filter: 'brightness(1.06) contrast(1.08) saturate(1.18)',
  },
  {
    key: 'warm', label: 'Warm',
    filter: 'brightness(1.04) saturate(1.15) sepia(0.18)',
    wash: { color: 'rgba(255, 170, 80, 0.10)', mode: 'soft-light' },
  },
  {
    key: 'cool', label: 'Cool',
    filter: 'brightness(1.02) saturate(1.08) hue-rotate(-8deg)',
    wash: { color: 'rgba(80, 150, 255, 0.12)', mode: 'soft-light' },
  },
  {
    key: 'vintage', label: 'Vintage',
    filter: 'sepia(0.45) contrast(0.92) brightness(1.05) saturate(0.85)',
    wash: { color: 'rgba(120, 80, 40, 0.12)', mode: 'multiply' },
    vignette: 0.55,
  },
  {
    key: 'cinematic', label: 'Cinematic',
    filter: 'contrast(1.18) saturate(1.1) brightness(0.96)',
    wash: { color: 'rgba(0, 90, 120, 0.14)', mode: 'soft-light' },
    vignette: 0.7,
  },
  {
    key: 'noir', label: 'B&W',
    filter: 'grayscale(1) contrast(1.15) brightness(1.02)',
    vignette: 0.45,
  },
]

export default function ImageEnhance({ imageUrl }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const [active, setActive] = useState('original')
  const [ready, setReady] = useState(false)

  // Load the source image once
  useEffect(() => {
    if (!imageUrl) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imgRef.current = img
      setReady(true)
    }
    img.src = imageUrl
  }, [imageUrl])

  const draw = useCallback((presetKey) => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const preset = PRESETS.find((p) => p.key === presetKey) || PRESETS[0]

    // Cap canvas size for preview/perf while keeping aspect ratio
    const maxDim = 1400
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, w, h)
    ctx.filter = preset.filter || 'none'
    ctx.drawImage(img, 0, 0, w, h)
    ctx.filter = 'none'

    if (preset.wash) {
      ctx.globalCompositeOperation = preset.wash.mode
      ctx.fillStyle = preset.wash.color
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'source-over'
    }

    if (preset.vignette) {
      const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(1, `rgba(0,0,0,${preset.vignette})`)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
    }
  }, [])

  useEffect(() => {
    if (ready) draw(active)
  }, [ready, active, draw])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `enhanced-${active}.png`
      document.body.appendChild(link)
      link.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(link)
    }, 'image/png')
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
          <Wand2 className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-bold text-white">Enhance</h3>
          <p className="text-sm text-gray-400 mt-0.5">
            Set the mood — graded live in your browser, then download.
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl overflow-hidden bg-black ring-1 ring-white/10 flex items-center justify-center min-h-[200px]">
        <canvas ref={canvasRef} className="max-w-full max-h-[440px] object-contain" />
      </div>

      {/* Preset chips */}
      <div className="flex flex-wrap gap-2 mt-4">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setActive(p.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              active === p.key
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {active === p.key && <Check className="w-3.5 h-3.5" />}
            {p.label}
          </button>
        ))}
      </div>

      {/* Download */}
      <button
        onClick={handleDownload}
        disabled={!ready}
        className="mt-4 btn btn-outline text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        Download {active === 'original' ? 'image' : `“${PRESETS.find((p) => p.key === active)?.label}”`}
      </button>
    </div>
  )
}
