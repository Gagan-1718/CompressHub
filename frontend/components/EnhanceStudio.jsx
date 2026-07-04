'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Download, RotateCcw, ZoomIn, ZoomOut, Maximize, ImageIcon, Wand2,
} from 'lucide-react'

/**
 * Enhance Studio — a full in-browser photo editor. Open any image (upload or
 * handed off from the results page), adjust it live with a full set of sliders,
 * zoom/pan the preview, apply mood presets, and download the result. All
 * processing is on-device via canvas — no upload, no API key.
 */

const DEFAULTS = {
  brightness: 0,   // -100..100  -> filter brightness 0..2
  exposure: 0,     // -100..100  -> added to brightness
  contrast: 0,     // -100..100  -> filter contrast 0..2
  saturation: 0,   // -100..100  -> filter saturate 0..2
  warmth: 0,       // -100..100  -> warm/cool color wash
  tint: 0,         // -100..100  -> hue-rotate -40..40deg
  sharpen: 0,      // 0..100
  blur: 0,         // 0..100     -> 0..10px
  vignette: 0,     // 0..100
  grain: 0,        // 0..100
  fade: 0,         // 0..100     -> lifted blacks (matte)
  sepia: 0,        // 0..100
  grayscale: 0,    // 0..100
}

const GROUPS = [
  {
    name: 'Light',
    items: [
      { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
      { key: 'exposure', label: 'Exposure', min: -100, max: 100 },
      { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
      { key: 'fade', label: 'Fade', min: 0, max: 100 },
    ],
  },
  {
    name: 'Color',
    items: [
      { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
      { key: 'warmth', label: 'Warmth', min: -100, max: 100 },
      { key: 'tint', label: 'Tint', min: -100, max: 100 },
    ],
  },
  {
    name: 'Detail',
    items: [
      { key: 'sharpen', label: 'Sharpen', min: 0, max: 100 },
      { key: 'blur', label: 'Blur', min: 0, max: 100 },
    ],
  },
  {
    name: 'Effects',
    items: [
      { key: 'vignette', label: 'Vignette', min: 0, max: 100 },
      { key: 'grain', label: 'Grain', min: 0, max: 100 },
      { key: 'sepia', label: 'Sepia', min: 0, max: 100 },
      { key: 'grayscale', label: 'B&W', min: 0, max: 100 },
    ],
  },
]

const PRESETS = {
  Warm: { brightness: 6, contrast: 8, saturation: 14, warmth: 32 },
  Cool: { brightness: 4, contrast: 6, saturation: 8, warmth: -30, tint: -10 },
  Vintage: { contrast: -8, saturation: -18, warmth: 26, sepia: 32, vignette: 45, fade: 30 },
  Cinematic: { contrast: 22, saturation: 12, warmth: -14, vignette: 55, sharpen: 20 },
  Vivid: { brightness: 6, contrast: 16, saturation: 40, sharpen: 25 },
  'B&W': { contrast: 16, grayscale: 100, vignette: 30 },
}

// Pre-baked noise tile for grain
let noiseCanvas = null
function getNoiseCanvas() {
  if (noiseCanvas) return noiseCanvas
  const n = document.createElement('canvas')
  n.width = 160
  n.height = 160
  const nctx = n.getContext('2d')
  const img = nctx.createImageData(160, 160)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  nctx.putImageData(img, 0, 0)
  noiseCanvas = n
  return n
}

function buildFilter(adj) {
  const brightness = 1 + (adj.brightness + adj.exposure) / 100
  const contrast = 1 + adj.contrast / 100
  const saturate = 1 + adj.saturation / 100
  const hue = (adj.tint / 100) * 40
  const parts = [
    `brightness(${Math.max(0, brightness).toFixed(3)})`,
    `contrast(${Math.max(0, contrast).toFixed(3)})`,
    `saturate(${Math.max(0, saturate).toFixed(3)})`,
  ]
  if (hue) parts.push(`hue-rotate(${hue.toFixed(1)}deg)`)
  if (adj.sepia) parts.push(`sepia(${(adj.sepia / 100).toFixed(3)})`)
  if (adj.grayscale) parts.push(`grayscale(${(adj.grayscale / 100).toFixed(3)})`)
  if (adj.blur) parts.push(`blur(${((adj.blur / 100) * 10).toFixed(2)}px)`)
  return parts.join(' ')
}

function applySharpen(ctx, w, h, amount) {
  const amt = amount / 100
  const src = ctx.getImageData(0, 0, w, h)
  const dst = ctx.createImageData(w, h)
  const s = src.data
  const d = dst.data
  const center = 1 + 4 * amt
  const side = -amt
  const W4 = w * 4
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        d[i] = s[i]; d[i + 1] = s[i + 1]; d[i + 2] = s[i + 2]; d[i + 3] = s[i + 3]
        continue
      }
      for (let c = 0; c < 3; c++) {
        const v =
          s[i + c] * center +
          s[i - 4 + c] * side + s[i + 4 + c] * side +
          s[i - W4 + c] * side + s[i + W4 + c] * side
        d[i + c] = v < 0 ? 0 : v > 255 ? 255 : v
      }
      d[i + 3] = s[i + 3]
    }
  }
  ctx.putImageData(dst, 0, 0)
}

function renderTo(canvas, img, adj, w, h) {
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, w, h)

  ctx.filter = buildFilter(adj)
  ctx.drawImage(img, 0, 0, w, h)
  ctx.filter = 'none'

  // Warmth (temperature) color wash
  if (adj.warmth !== 0) {
    const amt = (Math.abs(adj.warmth) / 100) * 0.5
    ctx.globalCompositeOperation = 'soft-light'
    ctx.fillStyle = adj.warmth > 0 ? `rgba(255,150,40,${amt})` : `rgba(40,150,255,${amt})`
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }

  // Fade (lifted blacks / matte)
  if (adj.fade) {
    ctx.globalCompositeOperation = 'lighten'
    ctx.fillStyle = `rgba(60,58,74,${(adj.fade / 100) * 0.5})`
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }

  // Sharpen (convolution) — after tone, before overlays
  if (adj.sharpen) applySharpen(ctx, w, h, adj.sharpen)

  // Vignette
  if (adj.vignette) {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, `rgba(0,0,0,${(adj.vignette / 100) * 0.85})`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }

  // Grain
  if (adj.grain) {
    const noise = getNoiseCanvas()
    ctx.globalAlpha = (adj.grain / 100) * 0.16
    ctx.globalCompositeOperation = 'overlay'
    const pattern = ctx.createPattern(noise, 'repeat')
    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
}

export default function EnhanceStudio() {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const fileInputRef = useRef(null)
  const frameRef = useRef(0)
  const dragRef = useRef(null)

  const [adj, setAdj] = useState(DEFAULTS)
  const [hasImage, setHasImage] = useState(false)
  const [filename, setFilename] = useState('image')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const loadImage = useCallback((src, name) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imgRef.current = img
      setHasImage(true)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
      setAdj(DEFAULTS)
    }
    img.src = src
    if (name) setFilename(name.replace(/\.[^.]+$/, ''))
  }, [])

  // Preload an image handed off from the results page
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('enhance:image')
      if (stored) {
        const name = sessionStorage.getItem('enhance:name') || 'image'
        loadImage(stored, name)
        sessionStorage.removeItem('enhance:image')
        sessionStorage.removeItem('enhance:name')
      }
    } catch (_) {}
  }, [loadImage])

  // Live preview render (capped size for smooth sliders), throttled to a frame
  useEffect(() => {
    if (!hasImage || !imgRef.current) return
    cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      const img = imgRef.current
      const maxDim = 1400
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      renderTo(canvasRef.current, img, adj, Math.round(img.width * scale), Math.round(img.height * scale))
    })
    return () => cancelAnimationFrame(frameRef.current)
  }, [adj, hasImage])

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => loadImage(e.target.result, file.name)
    reader.readAsDataURL(file)
  }

  const handleDownload = () => {
    const img = imgRef.current
    if (!img) return
    const out = document.createElement('canvas')
    renderTo(out, img, adj, img.width, img.height) // full resolution
    out.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}_enhanced.png`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }, 'image/png')
  }

  const setVal = (key, v) => setAdj((a) => ({ ...a, [key]: v }))
  const applyPreset = (preset) => setAdj({ ...DEFAULTS, ...PRESETS[preset] })
  const reset = () => { setAdj(DEFAULTS); setZoom(1); setOffset({ x: 0, y: 0 }) }

  const isDefault = JSON.stringify(adj) === JSON.stringify(DEFAULTS)

  // Zoom / pan
  const onWheel = (e) => {
    if (!hasImage) return
    e.preventDefault()
    setZoom((z) => Math.min(6, Math.max(0.3, z * (e.deltaY < 0 ? 1.12 : 0.89))))
  }
  const onPointerDown = (e) => {
    if (!hasImage) return
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }
  const onPointerMove = (e) => {
    if (!dragRef.current) return
    setOffset({ x: dragRef.current.ox + (e.clientX - dragRef.current.x), y: dragRef.current.oy + (e.clientY - dragRef.current.y) })
  }
  const onPointerUp = () => { dragRef.current = null }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-[#0a0a0f] text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/10 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Wand2 className="w-5 h-5 text-amber-400 shrink-0" />
          <h1 className="font-bold text-lg">Enhance</h1>
          {hasImage && <span className="text-sm text-gray-400 truncate hidden sm:inline">· {filename}</span>}
        </div>

        <div className="flex items-center gap-2">
          {hasImage && (
            <div className="flex items-center gap-1 mr-1">
              <button onClick={() => setZoom((z) => Math.max(0.3, z * 0.83))} className="p-2 rounded-lg hover:bg-white/10" aria-label="Zoom out"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-xs text-gray-400 w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(6, z * 1.2))} className="p-2 rounded-lg hover:bg-white/10" aria-label="Zoom in"><ZoomIn className="w-4 h-4" /></button>
              <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }) }} className="p-2 rounded-lg hover:bg-white/10" aria-label="Fit"><Maximize className="w-4 h-4" /></button>
            </div>
          )}
          {hasImage && (
            <>
              <button onClick={reset} disabled={isDefault} className="btn btn-outline text-sm px-3 py-2 flex items-center gap-1.5 disabled:opacity-40">
                <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">Reset</span>
              </button>
              <button onClick={handleDownload} className="btn btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download</span>
              </button>
            </>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>

      {/* Main */}
      <div className="flex-1 flex min-h-0">
        {/* Canvas area */}
        <div
          className="flex-1 relative overflow-hidden bg-[#070709] flex items-center justify-center select-none"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }}
          style={{ cursor: hasImage ? (dragRef.current ? 'grabbing' : 'grab') : 'default' }}
        >
          {hasImage ? (
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain shadow-2xl"
              style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transition: dragRef.current ? 'none' : 'transform 0.08s' }}
            />
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-center p-10 rounded-2xl border-2 border-dashed border-white/15 hover:border-amber-400/50 hover:bg-white/[0.02] transition-all"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-lg font-semibold">Open an image to enhance</p>
              <p className="text-sm text-gray-400 mt-1">Click to browse, or drag &amp; drop</p>
            </button>
          )}
        </div>

        {/* Controls */}
        <aside className="w-72 sm:w-80 shrink-0 border-l border-white/10 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Presets */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Presets</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(PRESETS).map((p) => (
                  <button
                    key={p}
                    onClick={() => applyPreset(p)}
                    disabled={!hasImage}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-200 disabled:opacity-40 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider groups */}
            {GROUPS.map((group) => (
              <div key={group.name}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">{group.name}</p>
                <div className="space-y-4">
                  {group.items.map((item) => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm text-gray-300">{item.label}</label>
                        <button
                          onClick={() => setVal(item.key, DEFAULTS[item.key])}
                          className="text-xs text-gray-500 hover:text-white tabular-nums"
                          title="Double-purpose: click to reset"
                        >
                          {adj[item.key]}
                        </button>
                      </div>
                      <input
                        type="range"
                        min={item.min}
                        max={item.max}
                        step={1}
                        value={adj[item.key]}
                        disabled={!hasImage}
                        onChange={(e) => setVal(item.key, Number(e.target.value))}
                        className="w-full accent-amber-500 disabled:opacity-40"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
