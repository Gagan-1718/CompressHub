'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, Menu, X } from 'lucide-react'

const NAV = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/enhance', label: 'Enhance' },
  { href: '/library', label: 'Library' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the mobile menu whenever the route changes
  useEffect(() => { setOpen(false) }, [pathname])

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

        {/* Desktop nav */}
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

        {/* Mobile: compress + hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          <Link href="/upload" className="btn btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Compress
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="p-2 rounded-lg text-gray-200 hover:bg-white/10 transition-colors"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="sm:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl">
          <div className="px-4 py-3 flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-3 text-gray-200 hover:text-white font-medium border-b border-white/5 last:border-0"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
