'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import MetricsDisplay from '@/components/MetricsDisplay'
import { getApiUrl } from '@/lib/api'
import { ArrowLeft, Loader } from 'lucide-react'

function AnalyticsContent() {
  const searchParams = useSearchParams()
  const [compressionResult, setCompressionResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const jobId = searchParams.get('jobId')
    if (jobId) {
      fetchCompressionResult(jobId)
    }
  }, [searchParams])

  const fetchCompressionResult = async (jobId) => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`/api/compression/job/${jobId}`))
      if (response.ok) {
        const data = await response.json()
        setCompressionResult(data)
      }
    } catch (error) {
      console.error('Error fetching compression result:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!compressionResult) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">No analytics data found</p>
          <Link href="/" className="btn btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 py-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <Link href={`/results?jobId=${compressionResult.job_id}`} className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </Link>
          <h1 className="section-title">Detailed Analytics & Metrics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive compression analysis for <span className="font-semibold text-gray-900 dark:text-white">{compressionResult.filename}</span>
          </p>
        </div>

        {/* Complete Metrics Display */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
          <div className="lg:col-span-4">
            <MetricsDisplay metrics={compressionResult.metrics} />
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div>
          <AnalyticsDashboard metrics={compressionResult.metrics} />
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center"><Loader className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" /></div>}>
      <AnalyticsContent />
    </Suspense>
  )
}
