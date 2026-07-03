'use client'

import Image from 'next/image'
import { FileIcon, Sparkles } from 'lucide-react'

export default function ImagePreview({ image }) {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getImageFormat = (type) => {
    const formats = {
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/bmp': 'BMP',
    }
    return formats[type] || 'Image'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Image Preview Container */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-black via-blue-900/5 to-black border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-purple-600/0 to-pink-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative p-6 flex items-center justify-center min-h-80">
          <img
            src={image.preview}
            alt="Preview"
            className="w-full h-full object-contain max-w-full max-h-96"
          />
        </div>
        <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-xs font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-3 h-3" />
          Ready
        </div>
      </div>

      {/* File Details */}
      <div className="space-y-4">
        {/* File Name */}
        <div className="card p-4 group hover:border-blue-500/50">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 block">File Name</label>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FileIcon className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-white font-medium break-all text-sm">{image.name}</p>
          </div>
        </div>

        {/* File Metadata Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 group hover:border-purple-500/50 text-center">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 block">Format</label>
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {getImageFormat(image.type)}
            </p>
          </div>
          <div className="card p-4 group hover:border-pink-500/50 text-center">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 block">File Size</label>
            <p className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              {formatFileSize(image.size)}
            </p>
          </div>
        </div>

        {/* Dimension Info (if available) */}
        {image.width && image.height && (
          <div className="card p-4 group hover:border-blue-500/50">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 block">Dimensions</label>
            <p className="text-white font-medium">
              {image.width} × {image.height} px
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-300 font-medium">Image ready for compression</p>
        </div>
      </div>
    </div>
  )
}
