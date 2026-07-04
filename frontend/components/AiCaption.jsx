'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, Loader, AlertCircle, Quote } from 'lucide-react'

/**
 * "Describe this image" — in-browser AI captioning.
 *
 * The model (~200MB) runs entirely in the visitor's browser via a Web Worker
 * (Transformers.js). It's opt-in: nothing downloads until the button is
 * clicked. The photo never leaves the device. First run is slow (model
 * download); later runs are fast (browser-cached).
 *
 * `imageUrl` may be a data URL or a normal URL.
 */
export default function AiCaption({ imageUrl }) {
  const workerRef = useRef(null)
  const [state, setState] = useState('idle') // idle | downloading | analyzing | done | error
  const [progress, setProgress] = useState(0)
  const [caption, setCaption] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Create the worker lazily on mount; tidy up on unmount
    const worker = new Worker(new URL('../lib/caption.worker.js', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker

    worker.onmessage = (e) => {
      const msg = e.data
      if (msg.status === 'progress') {
        // progress events fire per-file with a percentage while downloading
        if (typeof msg.data?.progress === 'number') {
          setState('downloading')
          setProgress(Math.round(msg.data.progress))
        }
      } else if (msg.status === 'analyzing') {
        setState('analyzing')
      } else if (msg.status === 'complete') {
        setCaption(msg.caption || 'No description produced.')
        setState('done')
      } else if (msg.status === 'error') {
        setError(msg.error)
        setState('error')
      }
    }

    return () => worker.terminate()
  }, [])

  const run = () => {
    if (!imageUrl || !workerRef.current) return
    setError('')
    setCaption('')
    setState('downloading')
    setProgress(0)
    workerRef.current.postMessage({ image: imageUrl })
  }

  const busy = state === 'downloading' || state === 'analyzing'

  return (
    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Describe this image with AI</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Runs entirely in your browser — the photo never leaves your device.
            </p>
          </div>
        </div>

        {state === 'idle' && (
          <button onClick={run} className="btn btn-outline text-sm px-5 py-2.5 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Describe
          </button>
        )}
      </div>

      {/* Progress / status */}
      {state === 'downloading' && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
            <Loader className="w-4 h-4 animate-spin text-purple-400" />
            Downloading the AI model (one-time)… {progress}%
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {state === 'analyzing' && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-300">
          <Loader className="w-4 h-4 animate-spin text-purple-400" />
          Analyzing the image…
        </div>
      )}

      {state === 'done' && (
        <div className="mt-4 flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
          <Quote className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="text-white text-lg leading-relaxed first-letter:uppercase">{caption}</p>
        </div>
      )}

      {state === 'done' && (
        <button onClick={run} className="mt-3 text-xs text-purple-300 hover:text-purple-200 font-medium">
          Regenerate
        </button>
      )}

      {state === 'error' && (
        <div className="mt-4 flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-200 text-sm">{error}</p>
            <button onClick={run} className="mt-2 text-xs text-red-300 hover:text-red-200 font-medium">
              Try again
            </button>
          </div>
        </div>
      )}

      {busy && (
        <p className="text-[11px] text-gray-500 mt-3">
          First run downloads the model (~200MB) and is slow; after that it&rsquo;s cached and quick.
        </p>
      )}
    </div>
  )
}
