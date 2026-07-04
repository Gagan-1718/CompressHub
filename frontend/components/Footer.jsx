'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  // The Enhance studio is a full-height, no-scroll workspace — no footer there.
  if (pathname === '/enhance') return null

  return (
    <footer className="relative bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-white font-bold">Image Compression Lab</p>
            <p className="text-xs text-gray-500 mt-1">
              Lossless delta prediction + Huffman coding, verified on every run
            </p>
          </div>

          <nav className="flex items-center gap-6 text-sm">
            <Link href="/upload" className="text-gray-400 hover:text-white transition-colors">
              Compress
            </Link>
            <Link href="/library" className="text-gray-400 hover:text-white transition-colors">
              Library
            </Link>
            <Link href="/how-it-works" className="text-gray-400 hover:text-white transition-colors">
              How it works
            </Link>
          </nav>
        </div>

        <p className="text-xs text-gray-600 text-center sm:text-left mt-6">
          © 2026 Image Compression Lab
        </p>
      </div>
    </footer>
  )
}
