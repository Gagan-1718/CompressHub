'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import ImageComparison from '@/components/ImageComparison'
import AlgorithmAnalysis from '@/components/AlgorithmAnalysis'
import AiCaption from '@/components/AiCaption'
import TiltCard from '@/components/TiltCard'
import { getApiUrl } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Download, ArrowLeft, Loader, BarChart3, Maximize2, Wand2 } from 'lucide-react'

function formatBytes(bytes) {
  if (bytes == null) return '--'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${bytes} B`
}

async function downloadJob(jobId) {
  const response = await fetch(getApiUrl(`/api/compression/download/${jobId}`))
  if (!response.ok) throw new Error('Download failed')

  const contentDisposition = response.headers.get('content-disposition')
  let filename = 'compressed_image.png'
  if (contentDisposition) {
    const match = contentDisposition.match(/filename[^;=\n]*=(["']?)([^"';]*)\1/)
    if (match) filename = match[2]
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(link)
}

function ResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null) // job_id | 'all' | null

  const openInEnhance = (result) => {
    try {
      sessionStorage.setItem('enhance:image', result.original_image)
      sessionStorage.setItem('enhance:name', result.filename || 'image')
    } catch (_) {}
    router.push('/enhance')
  }

  useEffect(() => {
    const jobIdsParam = searchParams.get('jobIds')
    const jobIdParam = searchParams.get('jobId')
    const jobIds = jobIdsParam
      ? jobIdsParam.split(',').filter(Boolean)
      : jobIdParam
        ? [jobIdParam]
        : []

    if (jobIds.length === 0) {
      setLoading(false)
      return
    }

    const fetchAll = async () => {
      setLoading(true)
      try {
        const settled = await Promise.allSettled(
          jobIds.map(async (id) => {
            const res = await fetch(getApiUrl(`/api/compression/job/${id}`))
            if (!res.ok) throw new Error(`Job ${id} not found`)
            return res.json()
          })
        )
        setResults(
          settled
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value)
        )
      } catch (error) {
        console.error('Error fetching compression results:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [searchParams])

  const handleDownload = async (jobId) => {
    setDownloading(jobId)
    try {
      await downloadJob(jobId)
    } catch (error) {
      console.error('Error downloading image:', error)
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadAll = async () => {
    setDownloading('all')
    try {
      for (const result of results) {
        await downloadJob(result.job_id)
        // brief gap so the browser accepts each download
        await new Promise((r) => setTimeout(r, 400))
      }
    } catch (error) {
      console.error('Error downloading images:', error)
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">Loading compression results...</p>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">No results found</p>
          <Link href="/upload" className="btn btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Try Again
          </Link>
        </div>
      </div>
    )
  }

  // ---------- SINGLE IMAGE: full detail view ----------
  if (results.length === 1) {
    const compressionResult = results[0]
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 py-12 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header Navigation */}
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Upload
              </Link>
              <h1 className="section-title">Compression Results</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                File: <span className="font-semibold text-gray-900 dark:text-white">{compressionResult.filename}</span>
              </p>
            </div>
          </div>

          {/* Result preview */}
          <section className="card bg-gradient-to-br from-slate-900/85 via-slate-900 to-slate-950 border border-white/10 shadow-[0_0_45px_rgba(15,23,42,0.9)] p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
              <div>
                <h2 className="subsection-title text-white">Result preview</h2>
                <p className="mt-1 text-xs sm:text-sm text-gray-400">
                  Your original and compressed image, side-by-side. Click either to inspect.
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-black/40 ring-1 ring-white/10 overflow-hidden">
              <ImageComparison compressionResult={compressionResult} />
            </div>

            {compressionResult.original_image && (
              <AiCaption imageUrl={compressionResult.original_image} />
            )}

            {compressionResult.original_image && (
              <button
                onClick={() => openInEnhance(compressionResult)}
                className="w-full rounded-xl border border-amber-500/25 bg-amber-500/[0.05] hover:bg-amber-500/[0.1] transition-colors p-5 flex items-center justify-between gap-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Wand2 className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Enhance this image</p>
                    <p className="text-sm text-gray-400">Open the studio to adjust brightness, color, warmth and more</p>
                  </div>
                </div>
                <span className="text-amber-300 text-sm font-semibold shrink-0">Open studio →</span>
              </button>
            )}
          </section>

          {/* Primary actions */}
          <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
            <button
              onClick={() => handleDownload(compressionResult.job_id)}
              disabled={downloading !== null}
              className="w-full sm:w-auto btn btn-primary text-base px-8 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              {downloading ? 'Downloading…' : 'Download compressed image'}
            </button>
            <Link
              href="/upload"
              className="w-full sm:w-auto btn btn-outline text-base px-8 py-3 font-semibold flex items-center justify-center gap-2"
            >
              Compress another
            </Link>
            <Link
              href={`/analytics?jobId=${compressionResult.job_id}`}
              className="w-full sm:w-auto btn btn-outline text-base px-8 py-3 font-semibold flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              Detailed analytics
            </Link>
          </section>

          {/* Algorithm analysis */}
          {compressionResult.metrics?.analysis && (
            <section className="card bg-white/80 dark:bg-gray-900/90 border border-white/10 dark:border-gray-800 p-6 sm:p-8">
              <AlgorithmAnalysis
                analysis={compressionResult.metrics.analysis}
                fileSizes={compressionResult.metrics.file_sizes}
              />
            </section>
          )}
        </div>
      </div>
    )
  }

  // ---------- BATCH: summary + per-image cards ----------
  const totals = results.reduce(
    (acc, r) => {
      const fs = r.metrics?.file_sizes
      if (fs) {
        acc.original += fs.original_bytes || 0
        acc.compressed += fs.compressed_bytes || 0
      }
      return acc
    },
    { original: 0, compressed: 0 }
  )
  const totalSavedPct = totals.original > 0
    ? ((totals.original - totals.compressed) / totals.original) * 100
    : 0

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 py-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header + batch summary */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Upload
            </Link>
            <h1 className="section-title">Batch results</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
              {results.length} images · {formatBytes(totals.original)} → {formatBytes(totals.compressed)}
              <span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">
                {Math.max(0, totalSavedPct).toFixed(1)}% saved overall
              </span>
            </p>
          </div>

          <button
            onClick={handleDownloadAll}
            disabled={downloading !== null}
            className="btn btn-primary text-base px-8 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            {downloading === 'all' ? 'Downloading…' : `Download all (${results.length})`}
          </button>
        </div>

        {/* Per-image cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result) => {
            const fs = result.metrics?.file_sizes
            const pct = result.metrics?.compression?.percentage
            return (
              <TiltCard key={result.job_id} className="rounded-2xl">
                <div className="rounded-2xl overflow-hidden border border-white/10 dark:border-gray-800 bg-white/80 dark:bg-gray-900/90 shadow-lg">
                  <div className="relative aspect-[4/3] bg-black">
                    {result.compressed_image && (
                      <img
                        src={result.compressed_image}
                        alt={result.filename}
                        className="w-full h-full object-contain"
                      />
                    )}
                    {pct != null && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-xs font-bold text-white shadow">
                        {Math.max(0, pct).toFixed(1)}% saved
                      </span>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={result.filename}>
                      {result.filename}
                    </p>
                    {fs && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {fs.original_formatted} → <span className="text-gray-900 dark:text-white font-medium">{fs.compressed_formatted}</span>
                      </p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleDownload(result.job_id)}
                        disabled={downloading !== null}
                        className="flex-1 btn btn-outline text-xs py-2 flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloading === result.job_id ? 'Saving…' : 'Download'}
                      </button>
                      <Link
                        href={`/results?jobId=${result.job_id}`}
                        className="flex-1 btn btn-outline text-xs py-2 flex items-center justify-center gap-1.5"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              </TiltCard>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center"><Loader className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" /></div>}>
      <ResultsContent />
    </Suspense>
  )
}
