'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader, AlertCircle, Zap, Check, Sparkles } from 'lucide-react'
import { LoadingOverlay, ProgressBar } from './Loading'
import { getApiUrl } from '@/lib/api'
import { useToast } from './Toast'

export default function CompressionForm({ image }) {
  const router = useRouter()
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [quality, setQuality] = useState('high')

  const handleCompress = async () => {
    if (!image.job_id) {
      setError('Image not properly uploaded. Please upload again.')
      return
    }

    setIsLoading(true)
    setError(null)
    setProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + Math.random() * 30
          return next > 90 ? 90 : next
        })
      }, 500)

      // Call compress endpoint with job_id and quality
      const response = await fetch(
        `${getApiUrl('/api/compression/compress')}/${image.job_id}?quality=${quality}`,
        {
          method: 'POST',
        }
      )

      clearInterval(progressInterval)
      setProgress(95)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || errorData.detail || 'Compression failed'
        )
      }

      const result = await response.json()
      setProgress(100)

      // Show success notification
      addToast(
        `Image compression started with ${quality} quality settings. Processing...`,
        'success'
      )

      // Redirect to results page with job ID
      setTimeout(() => {
        router.push(`/results?jobId=${result.job_id}`)
      }, 500)
    } catch (err) {
      setProgress(0)
      const errorMessage = err.message || 'An error occurred during compression'
      setError(errorMessage)
      addToast(errorMessage, 'error')
      console.error('Compression error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <LoadingOverlay
        isVisible={isLoading}
        message="Compressing your image..."
        progress={progress}
      />

      <div className="card card-premium h-full flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h2 className="text-2xl font-black text-gradient-primary">Compression Settings</h2>
        </div>

        <div className="space-y-6 flex-grow">
          {/* Algorithm Info */}
          <div className="p-5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl transition-smooth hover:border-blue-400/60 hover:bg-blue-500/15">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-gradient-accent mb-1">Delta Prediction + Huffman Coding</h3>
                <p className="text-blue-200 text-sm leading-relaxed">
                  Neighboring-pixel differences concentrate the byte distribution, then Huffman coding assigns short codes to frequent values &mdash; fully lossless
                </p>
              </div>
            </div>
          </div>

          {/* Quality Settings */}
          <div>
            <label className="block text-sm font-bold text-gray-200 mb-4 uppercase tracking-widest">
              ⚙️ Compression Quality
            </label>
            <div
              className="space-y-2"
              role="radiogroup"
              aria-label="Compression quality"
            >
              {[
                {
                  value: 'high',
                  label: 'High Quality',
                  desc: 'Maximum compression, slower',
                  gradient: 'from-blue-500 to-blue-600',
                },
                {
                  value: 'medium',
                  label: 'Balanced',
                  desc: 'Good compression speed',
                  gradient: 'from-purple-500 to-purple-600',
                },
                {
                  value: 'fast',
                  label: 'Fast',
                  desc: 'Quick compression, good ratio',
                  gradient: 'from-pink-500 to-pink-600',
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQuality(opt.value)}
                  role="radio"
                  aria-checked={quality === opt.value}
                  className={`w-full flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/70 hover:-translate-y-0.5 ${
                    quality === opt.value
                      ? `border-blue-500 bg-gradient-to-r ${opt.gradient}/10`
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      quality === opt.value
                        ? 'border-blue-400 bg-gradient-to-r from-blue-500 to-blue-600'
                        : 'border-white/30'
                    }`}
                  >
                    {quality === opt.value && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-bold text-white">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                  {quality === opt.value && (
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Space Required */}
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
            <p className="text-xs text-gray-400 font-medium mb-2">PROCESSING INFO</p>
            <p className="text-sm text-gray-300">
              Compression time varies based on image size and quality setting
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3 animate-slide-in">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 text-sm font-bold">Error</p>
              <p className="text-red-200 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Compress Button */}
        <button
          onClick={handleCompress}
          disabled={isLoading || !image?.file}
          className="w-full btn btn-primary text-lg mt-6 py-4 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Compressing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Compress Image
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4 font-medium">
          💡 Pro tip: Higher quality provides better compression
        </p>
      </div>
    </>
  )
}
