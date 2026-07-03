'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import ImageComparison from '@/components/ImageComparison'
import AlgorithmAnalysis from '@/components/AlgorithmAnalysis'
import { getApiUrl } from '@/lib/api'
import { Download, ArrowLeft, Loader, BarChart3 } from 'lucide-react'

function ResultsContent() {
  const searchParams = useSearchParams()
  const [compressionResult, setCompressionResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    // Get the job ID from URL params
    const jobId = searchParams.get('jobId')
    if (jobId) {
      fetchCompressionResult(jobId)
    }
  }, [searchParams])

  const fetchCompressionResult = async (jobId) => {
    try {
      setLoading(true)
      // Try to fetch job status and info
      const response = await fetch(getApiUrl(`/api/compression/job/${jobId}`))
      if (response.ok) {
        const data = await response.json()
        setCompressionResult(data)
      } else if (response.status === 400) {
        // Job might not be completed yet, get partial data
        const jobResponse = await fetch(getApiUrl(`/api/compression/job/${jobId}`))
        if (jobResponse.ok) {
          const jobData = await jobResponse.json()
          setCompressionResult(jobData)
        }
      }
    } catch (error) {
      console.error('Error fetching compression result:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!compressionResult) return

    setIsDownloading(true)
    try {
      const response = await fetch(
        getApiUrl(`/api/compression/download/${compressionResult.job_id}`)
      )

      if (!response.ok) {
        throw new Error('Download failed')
      }

      // Get the filename from content-disposition header
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'compressed_image.jpg'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=(["\']?)([^"\';]*)\1/)
        if (match) {
          filename = match[2]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading image:', error)
    } finally {
      setIsDownloading(false)
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

  if (!compressionResult) {
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

        {/* SECTION 1: Result preview */}
        <section className="card bg-gradient-to-br from-slate-900/85 via-slate-900 to-slate-950 border border-white/10 shadow-[0_0_45px_rgba(15,23,42,0.9)] p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
            <div>
              <h2 className="subsection-title text-white">Result preview</h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-400">
                Your original and compressed image, side-by-side in the same dark studio.
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-black/40 ring-1 ring-white/10 overflow-hidden">
            <ImageComparison compressionResult={compressionResult} />
          </div>
        </section>

        {/* SECTION 2: Primary actions */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
          <button
            onClick={handleDownload}
            disabled={isDownloading || !compressionResult}
            className="w-full sm:w-auto btn btn-primary text-base px-8 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            {isDownloading ? 'Downloading…' : 'Download compressed image'}
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

        {/* SECTION 3: Algorithm analysis (how the compression actually worked) */}
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

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center"><Loader className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" /></div>}>
      <ResultsContent />
    </Suspense>
  )
}
