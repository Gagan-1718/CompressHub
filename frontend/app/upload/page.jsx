'use client'

import { useState } from 'react'
import UploadDropZone from '@/components/UploadDropZone'
import ImagePreview from '@/components/ImagePreview'
import CompressionForm from '@/components/CompressionForm'
import { Upload, Sparkles } from 'lucide-react'

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
    if (type.includes('jpeg') || type.includes('jpg')) return 'JPEG'
    if (type.includes('png')) return 'PNG'
    if (type.includes('bmp')) return 'BMP'
    return type
  }

  const handleImageSelect = (imageData) => {
    setUploadedImage(imageData)
  }

  const handleClear = () => {
    setUploadedImage(null)
  }

  return (
    <div className="min-h-screen bg-black pb-12">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 top-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-900/10 to-black" />
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold text-blue-400 uppercase tracking-widest">Compression Studio</span>
          </div>
          <h1 className="section-title text-5xl sm:text-6xl font-black text-white mb-3 flex items-center justify-center gap-3">
            <Upload className="w-10 h-10 text-blue-400" />
            Upload & Compress
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Select your image and watch us optimize it with advanced Huffman encoding. Supported: JPG, PNG, BMP
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN - Image Upload & Preview */}
          <div className="space-y-6 animate-slide-in-left">
            {!uploadedImage ? (
              <div className="h-full min-h-96">
                <UploadDropZone onImageSelect={handleImageSelect} />
              </div>
            ) : (
              <>
                <div className="card p-8 border-2 border-blue-500/30 hover:border-pink-500/30">
                  <ImagePreview image={uploadedImage} />
                </div>
                
                {/* Image Metadata */}
                <div className="card bg-white/5 border-white/10 p-4 sm:p-5 space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em]">
                    Image details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="text-left">
                      <p className="text-[11px] text-gray-400 mb-1 uppercase tracking-[0.18em]">
                        File name
                      </p>
                      <p className="text-sm font-medium text-white truncate" title={uploadedImage.name}>
                        {uploadedImage.name}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] text-gray-400 mb-1 uppercase tracking-[0.18em]">
                        File size
                      </p>
                      <p className="text-sm font-semibold text-blue-300">
                        {formatFileSize(uploadedImage.size)}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] text-gray-400 mb-1 uppercase tracking-[0.18em]">
                        Dimensions
                      </p>
                      <p className="text-sm font-semibold text-white">
                        {uploadedImage.width}×{uploadedImage.height}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] text-gray-400 mb-1 uppercase tracking-[0.18em]">
                        File type
                      </p>
                      <p className="text-sm font-semibold text-gray-200">
                        {getFileTypeLabel(uploadedImage.type)}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleClear}
                  className="w-full btn btn-outline hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  Choose Different Image
                </button>
              </>
            )}
          </div>

          {/* RIGHT COLUMN - Compression Controls (Sticky) */}
          <div className="animate-slide-in-right">
            {uploadedImage ? (
              <div className="sticky top-24">
                <CompressionForm image={uploadedImage} />
              </div>
            ) : (
              <div className="card h-80 flex flex-col items-center justify-center text-center min-h-96 bg-gradient-to-br from-white/5 to-white/0 border-2 border-dashed border-blue-500/20">
                <div className="text-6xl mb-4">📤</div>
                <p className="text-gray-400 text-lg font-medium">
                  Upload an image to begin
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Compression settings will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
