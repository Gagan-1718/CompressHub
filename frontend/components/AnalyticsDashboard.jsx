'use client'

import FileSizeComparisonChart from './FileSizeComparisonChart'
import CompressionPercentageChart from './CompressionPercentageChart'
import ProcessingTimeChart from './ProcessingTimeChart'
import { TrendingDown, Activity, Clock } from 'lucide-react'

export default function AnalyticsDashboard({ metrics }) {
  if (!metrics) return null

  const { file_sizes, compression } = metrics

  // Calculate savings
  const savedBytes = file_sizes.original_bytes - file_sizes.compressed_bytes
  const savedMB = (savedBytes / (1024 * 1024)).toFixed(2)

  // Plain Huffman coding on raw pixel bytes can legitimately fail to shrink
  // (or even slightly grow, once tree overhead is included) images whose
  // pixel values aren't skewed toward a few common values. These helpers
  // reflect that honestly instead of always claiming "Excellent".
  const qualityLabel = (pct) => {
    if (pct > 60) return 'Excellent'
    if (pct > 30) return 'Good'
    if (pct > 0) return 'Fair'
    return 'Limited'
  }
  const efficiencyScore = Math.max(0, Math.min(100, Math.round(compression.percentage)))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="fade-in">
        <h2 className="subsection-title flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Compression Analytics
        </h2>
        <p className="text-gray-600 dark:text-gray-400">Detailed visual analysis of compression performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-3 gap-4 fade-in" style={{ animationDelay: '0.1s' }}>
        {/* Compression Ratio */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border-b-4 border-blue-500 dark:border-blue-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-300 font-semibold">Compression Ratio</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {compression.ratio.toFixed(2)}x
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Smaller overall
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-20" />
          </div>
        </div>

        {/* Space Saved */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border-b-4 border-green-500 dark:border-green-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-800 dark:text-green-300 font-semibold">Space Saved</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {savedMB} MB
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                {compression.percentage.toFixed(1)}% reduction
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-500 opacity-20" />
          </div>
        </div>

        {/* Total Time */}
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 border-b-4 border-purple-500 dark:border-purple-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-purple-800 dark:text-purple-300 font-semibold">Total Time</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                {(compression.compression_time_ms + (compression.decompression_time_ms || 0)).toFixed(0)}ms
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                Compression + Decompression
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400 opacity-20" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6 fade-in" style={{ animationDelay: '0.2s' }}>
        {/* File Size Comparison - Larger */}
        <div className="lg:col-span-2">
          <div style={{ height: '300px' }}>
            <FileSizeComparisonChart metrics={metrics} />
          </div>
        </div>

        {/* Compression Percentage */}
        <div style={{ height: '300px' }}>
          <CompressionPercentageChart metrics={metrics} />
        </div>

        {/* Processing Time */}
        <div style={{ height: '300px' }}>
          <ProcessingTimeChart metrics={metrics} />
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="card fade-in bg-white dark:bg-gray-900" style={{ animationDelay: '0.3s' }}>
        <h3 className="subsection-title mb-6">Detailed Breakdown</h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Original Size */}
          <div className="border-l-4 border-red-500 dark:border-red-400 pl-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase">Original Size</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {file_sizes.original_formatted}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {(file_sizes.original_bytes / 1024).toFixed(0)} KB
            </p>
          </div>

          {/* Compressed Size */}
          <div className="border-l-4 border-green-500 dark:border-green-400 pl-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase">Compressed Size</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {file_sizes.compressed_formatted}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {(file_sizes.compressed_bytes / 1024).toFixed(0)} KB
            </p>
          </div>

          {/* Reduction Percentage */}
          <div className="border-l-4 border-blue-500 dark:border-blue-400 pl-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase">Reduction</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {compression.percentage.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Data eliminated
            </p>
          </div>

          {/* Compression Speed */}
          <div className="border-l-4 border-purple-500 dark:border-purple-400 pl-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase">Compression Speed</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {(file_sizes.original_bytes / 1024 / (compression.compression_time_ms / 1000)).toFixed(0)} KB/s
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Throughput
            </p>
          </div>
        </div>

        {/* Efficiency Score */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Efficiency Score</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {efficiencyScore}%
            </p>
          </div>
          <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${efficiencyScore}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Based on compression ratio and processing efficiency
          </p>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid sm:grid-cols-2 gap-4 fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="card bg-white dark:bg-gray-900">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Compression Quality</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Algorithm Efficiency</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{qualityLabel(compression.percentage)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Speed Rating</span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {compression.compression_time_ms < 100 ? 'Very Fast' : compression.compression_time_ms < 500 ? 'Fast' : 'Normal'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Compression Level</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {qualityLabel(compression.percentage)}
              </span>
            </div>
          </div>
        </div>

        <div className="card bg-white dark:bg-gray-900">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Image Statistics</h4>
          <div className="space-y-3">
            {metrics.image_info && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Format</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{metrics.image_info.format || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Dimensions</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {metrics.image_info.original_width && metrics.image_info.original_height
                      ? `${metrics.image_info.original_width}×${metrics.image_info.original_height}`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Megapixels</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {metrics.image_info.original_width && metrics.image_info.original_height
                      ? ((metrics.image_info.original_width * metrics.image_info.original_height) / 1000000).toFixed(2)
                      : 'N/A'}
                    {' '}MP
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
