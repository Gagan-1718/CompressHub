'use client'

import { useState } from 'react'
import UploadDropZone from '@/components/UploadDropZone'
import CompressionForm from '@/components/CompressionForm'
import { X, Plus } from 'lucide-react'

export default function UploadPage() {
  const [uploadedImages, setUploadedImages] = useState([])
  const [showDropZone, setShowDropZone] = useState(true)

  const formatFileSize = (bytes) => {
    if (bytes == null) return '--'
    const kb = bytes / 1024
    if (kb >= 1024) {
      return `${(kb / 1024).toFixed(2)} MB`
    }
    return `${kb.toFixed(2)} KB`
  }

  const handleImagesSelect = (images) => {
    setUploadedImages((prev) => {
      // De-dupe by job_id in case the same file is added twice
      const seen = new Set(prev.map((img) => img.job_id))
      return [...prev, ...images.filter((img) => !seen.has(img.job_id))]
    })
    setShowDropZone(false)
  }

  const handleRemove = (jobId) => {
    setUploadedImages((prev) => {
      const next = prev.filter((img) => img.job_id !== jobId)
      if (next.length === 0) setShowDropZone(true)
      return next
    })
  }

  const hasImages = uploadedImages.length > 0

  return (
    <div className="min-h-screen bg-black pb-16">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 top-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-900/10 to-black" />
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">
            Compress your images
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Lossless Huffman compression &mdash; one image or a whole batch
          </p>
        </div>

        <div className="space-y-6 animate-fade-in">
          {(showDropZone || !hasImages) && (
            <UploadDropZone onImagesSelect={handleImagesSelect} />
          )}

          {hasImages && (
            <>
              {/* Uploaded images grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {uploadedImages.map((img) => (
                  <div
                    key={img.job_id}
                    className="group relative rounded-xl overflow-hidden border border-white/10 bg-black/50 hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="aspect-square w-full">
                      <img
                        src={img.preview}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => handleRemove(img.job_id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-red-500/80 hover:text-white transition-all"
                      aria-label={`Remove ${img.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                      <p className="text-xs text-white font-medium truncate" title={img.name}>{img.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {formatFileSize(img.size)} · {img.width}×{img.height}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add more tile */}
                {!showDropZone && (
                  <button
                    onClick={() => setShowDropZone(true)}
                    className="aspect-square rounded-xl border-2 border-dashed border-white/15 hover:border-blue-500/50 hover:bg-blue-500/5 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-blue-400 transition-all duration-300"
                  >
                    <Plus className="w-7 h-7" />
                    <span className="text-xs font-medium">Add more</span>
                  </button>
                )}
              </div>

              <CompressionForm images={uploadedImages} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
