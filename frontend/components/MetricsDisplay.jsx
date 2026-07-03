'use client'

import { TrendingDown, BarChart3, Clock, HardDrive, Zap } from 'lucide-react'

export default function MetricsDisplay({ metrics }) {
  if (!metrics) return null

  const formatFileSize = (bytes) => {
    // Plain Huffman coding can occasionally grow a file slightly (tree
    // metadata overhead), in which case there is nothing to report as
    // "saved" -- Math.log() of a non-positive number is NaN, so clamp first.
    if (bytes <= 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const {
    file_sizes,
    compression,
    image_info,
    timestamp,
  } = metrics

  return (
    <div className="space-y-4 fade-in">
      {/* Main Compression Ratio Card */}
      <div className="card bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-blue-100 text-sm font-medium">Compression Ratio</p>
            <p className="text-4xl font-bold mt-3 leading-tight">
              {compression.ratio.toFixed(2)}x
            </p>
          </div>
          <TrendingDown className="w-12 h-12 text-blue-300 opacity-40" />
        </div>
        <p className="text-blue-100 text-sm font-medium">
          {compression.percentage.toFixed(1)}% size reduction
        </p>
      </div>

      {/* File Sizes Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Original</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {file_sizes.original_formatted}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {(file_sizes.original_bytes / 1000).toFixed(0)} KB
          </p>
        </div>

        <div className="card bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Compressed</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {file_sizes.compressed_formatted}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {(file_sizes.compressed_bytes / 1000).toFixed(0)} KB
          </p>
        </div>
      </div>

      {/* Space Saved Card */}
      <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border border-green-200 dark:border-green-700/50">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-green-700 dark:text-green-400 text-sm font-medium">Space Saved</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
              {formatFileSize(file_sizes.original_bytes - file_sizes.compressed_bytes)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {Math.max(0, compression.percentage).toFixed(0)}%
            </p>
            <p className="text-xs text-green-700 dark:text-green-500 font-semibold mt-1">reduction</p>
          </div>
        </div>
      </div>

      {/* Processing Time Card */}
      <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-700/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Processing Time</h3>
        </div>
        <div className="flex items-end gap-4">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Compression</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {compression.compression_time_ms.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">milliseconds</p>
          </div>
          {compression.decompression_time_ms > 0 && (
            <div className="flex-1">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Decompression</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {compression.decompression_time_ms.toFixed(2)}ms
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Information Card */}
      {image_info && (
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 border border-orange-200 dark:border-orange-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Image Information</h3>
          </div>
          <div className="space-y-2">
            {image_info.format && (
              <div className="flex justify-between items-center py-1.5 border-b border-orange-200 dark:border-orange-700/50 last:border-b-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">Format</span>
                <span className="font-semibold text-gray-900 dark:text-white">{image_info.format}</span>
              </div>
            )}
            {image_info.original_width && image_info.original_height && (
              <div className="flex justify-between items-center py-1.5 border-b border-orange-200 dark:border-orange-700/50 last:border-b-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">Original Size</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {image_info.original_width}×{image_info.original_height}
                </span>
              </div>
            )}
            {image_info.compressed_width && image_info.compressed_height && (
              <div className="flex justify-between items-center py-1.5 border-b border-orange-200 dark:border-orange-700/50 last:border-b-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">Compressed Size</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {image_info.compressed_width}×{image_info.compressed_height}
                </span>
              </div>
            )}
            {image_info.color_mode && (
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-gray-600 dark:text-gray-400">Color Mode</span>
                <span className="font-semibold text-gray-900 dark:text-white">{image_info.color_mode}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamp */}
      {timestamp && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Processed on {new Date(timestamp.end * 1000).toLocaleString()}
        </p>
      )}
    </div>
  )
}
