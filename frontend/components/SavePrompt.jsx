'use client'

import { Save, X } from 'lucide-react'

/**
 * Small non-blocking "save to library?" prompt that slides in at the top-right
 * corner. Unlike a modal, it doesn't cover the page or block interaction — the
 * user can keep browsing and answer (or ignore) whenever.
 */
export default function SavePrompt({ open, message = 'Save this to your library?', onYes, onNo, busy = false }) {
  if (!open) return null

  return (
    <div className="fixed top-24 right-4 sm:right-6 z-50 w-[300px] max-w-[calc(100vw-2rem)] animate-slide-in-right">
      <div className="rounded-xl border border-white/10 bg-[#12121a]/95 backdrop-blur-sm shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/15 border border-blue-500/25 flex-shrink-0">
            <Save className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-sm text-white font-medium flex-1 leading-snug">{message}</p>
          <button
            onClick={onNo}
            className="p-1 -m-1 rounded text-gray-500 hover:text-white transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            onClick={onNo}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            No
          </button>
          <button
            onClick={onYes}
            disabled={busy}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Yes, save'}
          </button>
        </div>
      </div>
    </div>
  )
}
