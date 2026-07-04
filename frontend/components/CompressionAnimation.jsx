'use client'

import { useEffect, useState } from 'react'

/**
 * A looping ~12s animated explainer of the compression pipeline:
 *   raw pixels → delta filter → frequency skew → Huffman codes → smaller file
 * Pure React state + CSS transitions (no video, no dependencies), so it stays
 * crisp at any size and loads instantly.
 */

const STAGES = [
  { key: 'pixels', title: 'Raw pixels', caption: 'Each pixel is a number 0–255. Neighbors are usually similar.' },
  { key: 'delta', title: 'Delta filter', caption: 'Store each pixel as its difference from the previous one.' },
  { key: 'freq', title: 'Frequency skew', caption: 'Now most values are near 0 — a lopsided distribution.' },
  { key: 'codes', title: 'Huffman codes', caption: 'Frequent values get the shortest codes. The file shrinks.' },
]

// A small run of "pixel" brightness values and their deltas
const PIXELS = [128, 130, 129, 131, 132, 130, 129, 130]
const DELTAS = PIXELS.map((p, i) => (i === 0 ? p : p - PIXELS[i - 1]))
// Huffman-ish codes for the delta values (frequent → short)
const CODE_FOR = { 0: '1', 1: '011', 2: '010', '-1': '001', '-2': '0001', 128: '0000' }

export default function CompressionAnimation() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 3000)
    return () => clearInterval(id)
  }, [])

  const current = STAGES[stage]

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 sm:p-8">
      {/* Stage tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STAGES.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setStage(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
              i === stage
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {i + 1}. {s.title}
          </button>
        ))}
      </div>

      {/* Stage viewport */}
      <div className="min-h-[180px] flex items-center justify-center">
        <div className="flex items-end justify-center gap-2 sm:gap-3">
          {PIXELS.map((p, i) => {
            const showDelta = stage >= 1
            const value = showDelta ? DELTAS[i] : p
            const isZeroish = showDelta && Math.abs(DELTAS[i]) <= 1 && i > 0

            // Bar height: in freq/codes stages, height encodes "commonness"
            // (near-zero deltas are tall = frequent)
            let barHeight = 40
            if (stage >= 2) {
              barHeight = isZeroish ? 96 : 30
            }

            // Code label appears in the final stage
            const code = CODE_FOR[String(value)] ?? '0000'

            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className={`flex items-center justify-center rounded-lg font-mono text-sm font-bold transition-all duration-700 ease-out ${
                    isZeroish
                      ? 'bg-gradient-to-b from-blue-400 to-blue-600 text-white'
                      : showDelta
                        ? 'bg-white/10 text-blue-200'
                        : 'bg-white/10 text-gray-200'
                  }`}
                  style={{
                    width: stage >= 2 ? 34 : 44,
                    height: stage >= 2 ? barHeight : 44,
                  }}
                >
                  {stage < 3 ? (value > 0 && showDelta ? `+${value}` : value) : ''}
                </div>

                {/* Code label in final stage */}
                <span
                  className={`font-mono text-[11px] transition-all duration-500 ${
                    stage >= 3 ? 'opacity-100 text-purple-300' : 'opacity-0'
                  }`}
                >
                  {stage >= 3 ? code : ' '}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Caption + progress */}
      <div className="mt-6 text-center">
        <p className="text-white font-semibold">{current.title}</p>
        <p className="text-sm text-gray-400 mt-1 min-h-[2.5rem]">{current.caption}</p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mt-2">
        {STAGES.map((s, i) => (
          <span
            key={s.key}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === stage ? 'w-6 bg-blue-400' : 'w-1.5 bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
