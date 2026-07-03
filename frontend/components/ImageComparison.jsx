"use client"

import { useState, useEffect } from "react"
import { ZoomIn, ZoomOut, X } from "lucide-react"

export default function ImageComparison({ compressionResult }) {
  const [zoom, setZoom] = useState(100)
  const [lightbox, setLightbox] = useState(null) // null | 'original' | 'compressed'

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(null)
      if (e.key === "ArrowLeft") setLightbox("original")
      if (e.key === "ArrowRight") setLightbox("compressed")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox])

  const metrics = compressionResult.metrics || {}
  const fileSizes = metrics.file_sizes || {}
  const compression = metrics.compression || {}

  const formatKb = (bytes) => {
    if (bytes == null) return "--"
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  if (!compressionResult) {
    return (
      <div className="h-96 flex items-center justify-center">
        <p className="text-gray-400">No image available for comparison</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Zoom controls */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(75, z - 25))}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4 text-gray-400" />
        </button>
        <span className="text-sm text-gray-400 min-w-12 text-center">{zoom}%</span>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(200, z + 25))}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Side-by-side split view */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Original Image */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">Original</h3>
          <div
            onClick={() => setLightbox("original")}
            className="relative rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/40 bg-black transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] cursor-zoom-in"
          >
            <div className="aspect-[4/3] w-full flex items-center justify-center">
              <img
                src={compressionResult.original_image}
                alt="Original"
                className="w-full h-full object-contain p-4"
                style={{ transform: `scale(${zoom / 100})` }}
              />
            </div>
            <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur rounded-full text-xs font-semibold text-gray-300">
              {formatKb(fileSizes.original_bytes)}
            </div>
          </div>
        </div>

        {/* Compressed Image */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gradient-primary">Compressed</h3>
          <div
            onClick={() => setLightbox("compressed")}
            className="relative rounded-2xl overflow-hidden border border-blue-500/40 bg-black transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_0_35px_rgba(129,140,248,0.5)] cursor-zoom-in"
          >
            <div className="aspect-[4/3] w-full flex items-center justify-center">
              <img
                src={compressionResult.compressed_image}
                alt="Compressed"
                className="w-full h-full object-contain p-4"
                style={{ transform: `scale(${zoom / 100})` }}
              />
            </div>
            <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 backdrop-blur rounded-full text-xs font-semibold text-white">
              {formatKb(fileSizes.compressed_bytes)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Footer: key sizes and reduction */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-elevated p-4 text-center group">
          <p className="text-gray-400 text-sm mb-2">Original size</p>
          <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500">
            {fileSizes.original_formatted || formatKb(fileSizes.original_bytes)}
          </p>
        </div>
        <div className="card-elevated p-4 text-center group">
          <p className="text-gray-400 text-sm mb-2">Compressed size</p>
          <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-500">
            {fileSizes.compressed_formatted || formatKb(fileSizes.compressed_bytes)}
          </p>
        </div>
        <div className="card-elevated p-4 text-center group">
          <p className="text-sm font-semibold label-gradient-soft mb-2">Size reduction</p>
          <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400">
            {compression.percentage != null ? `${Math.max(0, compression.percentage)}%` : "--"}
          </p>
        </div>
      </div>

      {/* Fullscreen lightbox: click a thumbnail to inspect at full size */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Original / Compressed toggle */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex gap-2 mb-4 bg-white/10 rounded-full p-1"
          >
            <button
              type="button"
              onClick={() => setLightbox("original")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                lightbox === "original" ? "bg-white text-black" : "text-gray-300 hover:text-white"
              }`}
            >
              Original {fileSizes.original_formatted ? `(${fileSizes.original_formatted})` : ""}
            </button>
            <button
              type="button"
              onClick={() => setLightbox("compressed")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                lightbox === "compressed" ? "bg-white text-black" : "text-gray-300 hover:text-white"
              }`}
            >
              Compressed {fileSizes.compressed_formatted ? `(${fileSizes.compressed_formatted})` : ""}
            </button>
          </div>

          <img
            onClick={(e) => e.stopPropagation()}
            src={lightbox === "original" ? compressionResult.original_image : compressionResult.compressed_image}
            alt={lightbox === "original" ? "Original (full size)" : "Compressed (full size)"}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />

          <p className="text-gray-400 text-sm mt-4">
            Use ← → to switch, Esc or click outside to close
          </p>
        </div>
      )}
    </div>
  )
}
