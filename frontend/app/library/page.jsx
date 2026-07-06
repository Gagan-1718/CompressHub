'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import TiltCard from '@/components/TiltCard'
import { getLibraryItems, deleteLibraryItem, downloadDataUrl } from '@/lib/libraryDB'
import { Download, Loader, Trash2, ImageIcon, FolderOpen, Package, Wand2 } from 'lucide-react'

function formatBytes(bytes) {
  if (bytes == null) return '--'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${bytes} B`
}

function formatDate(ms) {
  if (!ms) return ''
  return new Date(ms).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function LibraryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)
  const [tab, setTab] = useState('compressed')

  useEffect(() => {
    getLibraryItems()
      .then(setItems)
      .catch((e) => console.error('Library load failed:', e))
      .finally(() => setLoading(false))
  }, [])

  const compressed = useMemo(() => items.filter((i) => i.kind !== 'enhanced'), [items])
  const enhanced = useMemo(() => items.filter((i) => i.kind === 'enhanced'), [items])
  const current = tab === 'enhanced' ? enhanced : compressed

  const handleDownload = (item) => {
    downloadDataUrl(item.image, `${(item.filename || 'image').replace(/\.[^.]+$/, '')}.png`)
  }

  const handleDownloadAll = async () => {
    setBusy('all')
    for (const item of current) {
      handleDownload(item)
      await new Promise((r) => setTimeout(r, 400))
    }
    setBusy(null)
  }

  const handleDelete = async (id) => {
    setBusy(id)
    try {
      await deleteLibraryItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (e) {
      console.error('Delete failed:', e)
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-black flex items-center justify-center">
        <Loader className="w-12 h-12 text-blue-400 animate-spin" />
      </div>
    )
  }

  const TabBox = ({ id, label, count, Icon }) => (
    <button
      onClick={() => setTab(id)}
      className={`flex-1 flex items-center gap-3 rounded-2xl border p-4 sm:p-5 text-left transition-all ${
        tab === id
          ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_25px_rgba(59,130,246,0.15)]'
          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
      }`}
    >
      <div className={`p-2.5 rounded-xl ${tab === id ? 'bg-blue-500/20' : 'bg-white/5'}`}>
        <Icon className={`w-6 h-6 ${tab === id ? 'text-blue-300' : 'text-gray-400'}`} />
      </div>
      <div>
        <p className={`font-bold ${tab === id ? 'text-white' : 'text-gray-300'}`}>{label}</p>
        <p className="text-sm text-gray-500">{count} {count === 1 ? 'image' : 'images'}</p>
      </div>
    </button>
  )

  return (
    <div className="min-h-screen bg-black pb-16">
      <div className="fixed inset-0 -z-10 top-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-900/10 to-black" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-float" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-center gap-3 animate-fade-in">
          <FolderOpen className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl sm:text-5xl font-black text-white">Library</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8">Saved on this device — private to you, kept between visits.</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-in">
          <TabBox id="compressed" label="Compressed" count={compressed.length} Icon={Package} />
          <TabBox id="enhanced" label="Enhanced" count={enhanced.length} Icon={Wand2} />
        </div>

        {current.length > 1 && (
          <div className="flex justify-end mb-6">
            <button
              onClick={handleDownloadAll}
              disabled={busy !== null}
              className="btn btn-primary px-6 py-2.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Download className="w-5 h-5" />
              {busy === 'all' ? 'Downloading…' : `Download all (${current.length})`}
            </button>
          </div>
        )}

        {current.length === 0 ? (
          <div className="card border border-white/10 p-16 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No {tab} images yet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {tab === 'enhanced'
                ? 'Edit an image in the Enhance studio and choose “Save to library”.'
                : 'Compress an image and choose “Save to library” to keep it here.'}
            </p>
            <Link href={tab === 'enhanced' ? '/enhance' : '/upload'} className="btn btn-primary px-8 py-3 inline-flex items-center gap-2">
              {tab === 'enhanced' ? 'Open Enhance studio' : 'Compress an image'}
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {current.map((item) => (
              <TiltCard key={item.id} className="rounded-2xl">
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900/80 shadow-lg hover:border-blue-500/30 transition-colors">
                  <div className="relative aspect-[4/3] bg-black">
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt={item.filename} className="w-full h-full object-contain" loading="lazy" />
                    )}
                    {item.kind !== 'enhanced' && item.savingsPercent != null && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-xs font-bold text-white shadow">
                        {Math.max(0, item.savingsPercent).toFixed(1)}% saved
                      </span>
                    )}
                    {item.kind === 'enhanced' && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-bold text-white shadow">
                        Enhanced
                      </span>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-white truncate" title={item.filename}>{item.filename}</p>
                      <p className="text-[11px] text-gray-500 whitespace-nowrap">{formatDate(item.createdAt)}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {item.kind === 'enhanced'
                        ? formatBytes(item.compressedSize)
                        : <>{formatBytes(item.originalSize)} → <span className="text-white font-medium">{formatBytes(item.compressedSize)}</span></>}
                    </p>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleDownload(item)}
                        className="flex-1 btn btn-outline text-xs py-2 flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={busy !== null}
                        className="btn btn-outline text-xs py-2 px-3 flex items-center justify-center text-red-400 hover:text-red-300 hover:border-red-500/40 disabled:opacity-60"
                        aria-label={`Delete ${item.filename}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
