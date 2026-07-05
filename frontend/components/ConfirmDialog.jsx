'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Small centered confirm dialog. Controlled via `open`; calls `onConfirm` or
 * `onCancel`. Closes on Escape / backdrop click.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Not now',
  icon: Icon,
  onConfirm,
  onCancel,
  busy = false,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onCancel?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          {Icon && (
            <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/25 flex-shrink-0">
              <Icon className="w-6 h-6 text-blue-400" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {message && <p className="text-sm text-gray-400 mt-1">{message}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={busy}
            className="btn btn-outline text-sm px-5 py-2.5 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="btn btn-primary text-sm px-5 py-2.5 disabled:opacity-60"
          >
            {busy ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
