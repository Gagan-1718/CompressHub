'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="group">
          <span className="text-2xl font-black tracking-tight transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]">
            <span className="text-white">Compress</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Hub</span>
          </span>
        </Link>

        {/* Navigation & CTA */}
        <div className="flex items-center gap-8">
          <Link
            href="/how-it-works"
            className="text-gray-300 hover:text-white font-medium transition-colors duration-200 hidden sm:block"
          >
            How it works
          </Link>
          <Link
            href="/library"
            className="text-gray-300 hover:text-white font-medium transition-colors duration-200 hidden sm:block"
          >
            Library
          </Link>

          <Link
            href="/upload"
            className="btn btn-primary text-sm px-6 py-2 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Compress</span>
            <span className="sm:hidden">Upload</span>
          </Link>
        </div>
      </nav>
    </header>
  )
}
