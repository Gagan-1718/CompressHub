'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader, AlertCircle, Zap, Sparkles, Lock } from 'lucide-react'
import { LoadingOverlay } from './Loading'
import { getApiUrl } from '@/lib/api'
import { useToast } from './Toast'

export default function CompressionForm({ images }) {
  const router = useRouter()
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progressText, setProgressText] = useState('')

  const count = images?.length || 0

  const handleCompress = async () => {
    if (count === 0) return

    setIsLoading(true)
    setError(null)

    const completed = []
    const failed = []

    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      setProgressText(count > 1 ? `Compressing ${i + 1} of ${count} — ${img.name}` : `Building the Huffman tree for ${img.name}...`)
      try {
        const response = await fetch(
          `${getApiUrl('/api/compression/compress')}/${img.job_id}`,
          { method: 'POST' }
        )
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || errorData.message || 'Compression failed')
        }
        const result = await response.json()
        completed.push(result.job_id)
      } catch (err) {
        failed.push(`${img.name}: ${err.message}`)
      }
    }

    if (completed.length === 0) {
      setIsLoading(false)
      const message = failed.join(' · ') || 'Compression failed'
      setError(message)
      addToast(message, 'error')
      return
    }

    if (failed.length > 0) {
      addToast(`${failed.length} image(s) failed: ${failed.join(' · ')}`, 'error')
    }

    addToast(
      completed.length === 1 ? 'Compression complete' : `${completed.length} images compressed`,
      'success'
    )

    router.push(
      completed.length === 1
        ? `/results?jobId=${completed[0]}`
        : `/results?jobIds=${completed.join(',')}`
    )
  }

  return (
    <>
      <LoadingOverlay isVisible={isLoading} message={progressText || 'Compressing...'} />

      <div className="card card-premium flex flex-col gap-5">
        {/* Algorithm summary — the only "setting" is that there are none */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Delta prediction + Huffman coding</h3>
            <p className="text-gray-400 text-sm leading-relaxed mt-1">
              A Huffman tree is built specifically for each image&rsquo;s pixel statistics.
              No quality settings &mdash; the compression is fully lossless.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Lock className="w-3.5 h-3.5" />
          Pixel-identical output, verified by round-trip decode
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3 animate-slide-in">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleCompress}
          disabled={isLoading || count === 0}
          className="w-full btn btn-primary text-lg py-4 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Compressing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {count > 1 ? `Compress ${count} images` : 'Compress image'}
            </>
          )}
        </button>
      </div>
    </>
  )
}
