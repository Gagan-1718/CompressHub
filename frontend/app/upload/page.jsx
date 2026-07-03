'use client'

import { useState } from 'react'
import UploadDropZone from '@/components/UploadDropZone'
import ImagePreview from '@/components/ImagePreview'
import CompressionForm from '@/components/CompressionForm'

export default function UploadPage() {
  const [uploadedImage, setUploadedImage] = useState(null)

  const formatFileSize = (bytes) => {
    if (bytes == null) return '--'
    const kb = bytes / 1024
    if (kb >= 1024) {
      return `${(kb / 1024).toFixed(2)} MB`
    }
    return `${kb.toFixed(2)} KB`
  }

  const getFileTypeLabel = (type) => {
    if (!type) return 'Unknown'
    const match = type.match(/image\/(\w+)/)
    return match ? match[1].toUpperCase() : type
  }

  const handleImageSelect = (imageData) => {
    setUploadedImage(imageData)
  }

  const handleClear = () => {
    setUploadedImage(null)
  }

  return (
    <div className="min-h-screen bg-black pb-16">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 top-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-900/10 to-black" />
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">
            Compress an image
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Lossless Huffman compression, built live for your image&rsquo;s pixels
          </p>
        </div>

        {!uploadedImage ? (
          <div className="animate-fade-in">
            <UploadDropZone onImageSelect={handleImageSelect} />
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Preview with inline metadata */}
            <div className="card p-6 sm:p-8 border border-white/10">
              <ImagePreview image={uploadedImage} />

              <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
                <span className="text-white font-medium truncate max-w-[16rem]" title={uploadedImage.name}>
                  {uploadedImage.name}
                </span>
                <span className="text-gray-400">{formatFileSize(uploadedImage.size)}</span>
                <span className="text-gray-400">{uploadedImage.width}×{uploadedImage.height}</span>
                <span className="text-gray-400">{getFileTypeLabel(uploadedImage.type)}</span>
                <button
                  onClick={handleClear}
                  className="ml-auto text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Change image
                </button>
              </div>
            </div>

            <CompressionForm image={uploadedImage} />
          </div>
        )}
      </div>
    </div>
  )
}
