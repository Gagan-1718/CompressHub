'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

const NAV = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/enhance', label: 'Enhance' },
  { href: '/library', label: 'Library' },
]

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="group -ml-1 sm:-ml-2">
          <span className="text-2xl sm:text-3xl font-black tracking-tight transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]">
            <span className="text-white">Compress</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Hub</span>
          </span>
        </Link>

        {/* Desktop nav (unchanged) */}
        <div className="hidden sm:flex items-center gap-8">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-gray-300 hover:text-white font-medium transition-colors duration-200"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/upload" className="btn btn-primary text-sm px-6 py-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Compress
          </Link>
        </div>

        {/* Mobile nav: small text links (How it works stays in the footer). */}
        <div className="flex sm:hidden items-center gap-4">
          <Link href="/upload" className="text-xs text-gray-300 hover:text-white font-medium transition-colors">
            Compress
          </Link>
          <Link href="/enhance" className="text-xs text-gray-300 hover:text-white font-medium transition-colors">
            Enhance
          </Link>
          <Link href="/library" className="text-xs text-gray-300 hover:text-white font-medium transition-colors">
            Library
          </Link>
        </div>
      </nav>
    </header>
  )
}
