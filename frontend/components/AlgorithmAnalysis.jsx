'use client'

import { FlaskConical, Binary, Gauge } from 'lucide-react'

/**
 * Educational analysis of the compression run:
 *  - the same pixels compressed three ways (algorithm comparison)
 *  - Shannon entropy floor vs what the encoder achieved
 *  - the actual Huffman code table built for this image
 *
 * Renders nothing if the backend didn't include the analysis payload.
 */
export default function AlgorithmAnalysis({ analysis, fileSizes }) {
  if (!analysis) return null

  const { algorithms = [], entropy, code_table: codeTable = [] } = analysis

  const formatBytes = (bytes) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${bytes} B`
  }

  return (
    <div className="space-y-8">
      {/* ---- 1. Algorithm comparison ---- */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">What the prediction filter buys you</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          The same raw pixel data ({fileSizes?.original_formatted}) compressed with and without the delta filter
        </p>

        <div className="space-y-4">
          {algorithms.map((algo) => {
            const savings = algo.savings_percent
            const barWidth = Math.max(0, Math.min(100, savings))
            return (
              <div key={algo.name}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {algo.name}
                    {algo.is_current && (
                      <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 rounded-full">
                        this app
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {savings.toFixed(1)}% saved
                    <span className="text-gray-500 dark:text-gray-500 font-normal"> · {formatBytes(algo.compressed_bytes)}</span>
                  </span>
                </div>
                <div
                  className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden"
                  title={`${algo.name}: ${algo.description}`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      algo.is_current
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                        : 'bg-blue-400/60 dark:bg-blue-500/40'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{algo.description}</p>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 mt-4 p-3 bg-blue-500/5 border border-blue-500/15 rounded-lg leading-relaxed">
          <strong className="text-gray-800 dark:text-gray-200">Why the filter helps:</strong>{' '}
          Huffman coding only exploits how <em>frequently</em> each value occurs. Raw pixels are spread
          across many values, but neighboring pixels are similar &mdash; so their <em>differences</em> cluster
          around zero, giving the coder a skewed distribution it can actually compress.
        </p>
      </div>

      {/* ---- 2. Entropy analysis ---- */}
      {entropy && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gauge className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">How close to optimal?</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
            Shannon entropy is the theoretical floor &mdash; no entropy coder can use fewer bits per byte
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Raw pixels</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{entropy.raw_bits_per_byte}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">bits/byte entropy</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">After delta filter</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{entropy.filtered_bits_per_byte}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">bits/byte entropy</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Achieved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{entropy.achieved_bits_per_byte}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">bits/byte encoded</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wide mb-1">Coding efficiency</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{entropy.coding_efficiency_percent}%</p>
              <p className="text-xs text-emerald-700/70 dark:text-emerald-500/70 mt-1">of theoretical optimum</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
            The delta filter lowered the entropy from {entropy.raw_bits_per_byte} to {entropy.filtered_bits_per_byte} bits/byte
            &mdash; that gap is exactly where the extra compression comes from.
            {entropy.one_bit_floor_applies && (
              <> Entropy here is below 1 bit/byte, but Huffman codes are whole bits, so 1 bit/byte is
              the real floor for this encoder &mdash; efficiency is measured against that.</>
            )}
          </p>
        </div>
      )}

      {/* ---- 3. Huffman code table ---- */}
      {codeTable.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Binary className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">The Huffman codes built for this image</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Most frequent pixel deltas get the shortest codes &mdash; that&rsquo;s the whole trick
          </p>

          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800/80 text-left">
                  <th className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-300">Pixel delta</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-300">Frequency</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-300">Huffman code</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-300 text-right">Bits</th>
                </tr>
              </thead>
              <tbody>
                {codeTable.map((row) => (
                  <tr key={row.delta} className="border-t border-gray-200 dark:border-gray-800">
                    <td className="px-4 py-2 font-mono font-semibold text-gray-900 dark:text-white">
                      {row.delta > 0 ? `+${row.delta}` : row.delta}
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                      {row.frequency.toLocaleString()}
                      <span className="text-gray-500 dark:text-gray-500"> ({row.frequency_percent}%)</span>
                    </td>
                    <td className="px-4 py-2 font-mono text-blue-600 dark:text-blue-400">{row.code}</td>
                    <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">{row.code_bits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
