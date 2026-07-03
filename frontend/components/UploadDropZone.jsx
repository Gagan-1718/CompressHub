'use client'

import { useState, useRef } from 'react'
import { Upload, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

// Constants
const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/bmp', 'image/webp', 'image/gif', 'image/tiff']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export default function UploadDropZone({ onImageSelect }) {
  const fileInputRef = useRef(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const validateFile = (file) => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      setError('Please upload a JPG, PNG, BMP, WEBP, GIF, or TIFF image')
      return false
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 50MB')
      return false
    }

    return true
  }

  const uploadFile = async (file) => {
    console.log('[UPLOAD] Starting upload for:', file.name)
    
    if (!validateFile(file)) {
      console.log('[UPLOAD] Validation failed')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Step 1: Create preview
      console.log('[UPLOAD] Creating preview...')
      const preview = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          console.log('[UPLOAD] Preview created')
          resolve(e.target.result)
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })

      // Step 2: Upload to backend
      console.log('[UPLOAD] Sending to backend...')
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(getApiUrl('/api/compression/upload'), {
        method: 'POST',
        body: formData,
      })

      console.log('[UPLOAD] Backend response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[UPLOAD] Backend error:', errorText)

        // Surface the backend's actual error detail; only fall back to the
        // generic status text if the body isn't JSON. (Throwing inside the
        // try block would get caught by its own catch and swallowed.)
        let message = `Upload failed: ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.detail) message = errorData.detail
        } catch (e) {
          // non-JSON error body; keep the generic message
        }
        throw new Error(message)
      }

      const data = await response.json()
      console.log('[UPLOAD] Backend response:', data)

      // Step 3: Call parent callback
      console.log('[UPLOAD] Calling onImageSelect...')
      onImageSelect({
        file,
        preview,
        name: file.name,
        size: file.size,
        type: file.type,
        job_id: data.job_id,
        image_info: data.image_info,
        width: data.image_info?.width,
        height: data.image_info?.height,
      })

      console.log('[UPLOAD] Upload complete!')
    } catch (err) {
      console.error('[UPLOAD] Error:', err.message)
      setError(err.message || 'Upload failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Drag handlers
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('[DRAG] Drag enter')
    setIsDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('[DRAG] Drag leave')
    setIsDragActive(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('[DROP] Files dropped')
    setIsDragActive(false)

    const files = e.dataTransfer?.files
    if (files?.[0]) {
      console.log('[DROP] Processing dropped file:', files[0].name)
      uploadFile(files[0])
    }
  }

  // Click handler
  const handleClick = () => {
    console.log('[CLICK] Upload zone clicked')
    if (!isLoading) {
      fileInputRef.current?.click()
    }
  }

  // Sample image handler: fetch a bundled demo image and run it through
  // the exact same upload path as a user-selected file
  const handleSample = async (e, filename, label) => {
    e.stopPropagation() // don't trigger the drop zone's file picker
    if (isLoading) return
    try {
      const res = await fetch(`/samples/${filename}`)
      const blob = await res.blob()
      uploadFile(new File([blob], filename, { type: blob.type || 'image/png' }))
    } catch (err) {
      setError(`Could not load sample: ${label}`)
    }
  }

  // File input handler
  const handleFileChange = (e) => {
    const files = e.target.files
    console.log('[INPUT] File selected:', files?.[0]?.name)
    if (files?.[0]) {
      uploadFile(files[0])
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`relative w-full rounded-2xl border-2 transition-all duration-300 p-12 text-center cursor-pointer group overflow-hidden ${
        isDragActive
          ? 'border-blue-400 bg-gradient-to-br from-blue-500/10 to-purple-500/10 scale-105'
          : 'border-dashed border-white/20 bg-gradient-to-br from-white/5 to-white/0 hover:border-blue-500/50 hover:from-blue-500/5'
      }`}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/bmp,image/webp,image/gif,image/tiff,.jfif"
        className="hidden"
        disabled={isLoading}
      />

      {/* Animated Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-r from-blue-600/0 via-purple-600/0 to-pink-600/0 transition-all duration-300 ${isDragActive ? 'from-blue-600/10 via-purple-600/10 to-pink-600/10' : ''}`} />

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
            isDragActive
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 scale-110 shadow-[0_0_30px_rgba(139,92,246,0.5)]'
              : 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 group-hover:from-blue-500/40 group-hover:to-purple-600/40'
          }`}
        >
          {isLoading ? (
            <div className="animate-spin">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          ) : (
            <Upload
              className={`w-10 h-10 transition-all ${
                isDragActive
                  ? 'text-white scale-110'
                  : 'text-blue-400 group-hover:text-blue-300'
              }`}
            />
          )}
        </div>

        <h3 className="text-2xl font-bold text-white mb-2 transition-colors">
          {isLoading ? 'Processing Your Image...' : isDragActive ? 'Release to Upload' : 'Drop Your Image Here'}
        </h3>

        <p className="text-gray-400 mb-6 transition-colors">
          or click to browse from your device
        </p>

        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold rounded-full">JPG</span>
          <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold rounded-full">PNG</span>
          <span className="px-3 py-1 bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-semibold rounded-full">BMP</span>
          <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-full">WEBP</span>
          <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-full">GIF</span>
          <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold rounded-full">TIFF</span>
        </div>

        <p className="text-xs text-gray-500 transition-colors mb-2">
          Maximum file size: 50MB
        </p>

        {/* One-click samples: best case, typical case, worst case */}
        <div className="mt-4 pt-4 border-t border-white/10 w-full">
          <p className="text-xs text-gray-500 mb-3">
            No image handy? Try a sample and see how the algorithm behaves:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={(e) => handleSample(e, 'gradient.png', 'Smooth gradient')}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
            >
              🌅 Smooth gradient <span className="text-emerald-400/60">(best case)</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleSample(e, 'landscape.png', 'Landscape')}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/25 transition-colors disabled:opacity-50"
            >
              🏞️ Landscape <span className="text-blue-400/60">(typical)</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleSample(e, 'noise.png', 'Random noise')}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition-colors disabled:opacity-50"
            >
              🎲 Random noise <span className="text-rose-400/60">(worst case)</span>
            </button>
          </div>
        </div>

        {isDragActive && (
          <div className="flex items-center gap-2 mt-4 text-blue-400">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Ready to upload!</span>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3 animate-slide-in">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  )
}
