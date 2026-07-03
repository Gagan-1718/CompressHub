'use client'

import Link from 'next/link'
import { ImageIcon, Sparkles } from 'lucide-react'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo & Branding */}
        <Link href="/" className="flex items-center gap-3 group hover:opacity-90 transition-opacity">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(139,92,246,0.55)] group-hover:scale-105">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-black tracking-tight text-white">
              <span className="text-gradient-primary">CompressHub</span>
            </span>
            <p className="text-xs text-gray-500 font-medium">Smart Image Optimization</p>
          </div>
        </Link>

        {/* Navigation & CTA */}
        <div className="flex items-center gap-8">
          <Link 
            href="/" 
            className="text-gray-300 hover:text-white font-medium transition-colors duration-200 hidden sm:block"
          >
            Home
          </Link>
          
          <Link 
            href="/upload" 
            className="btn btn-primary text-sm px-6 py-2 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Image</span>
            <span className="sm:hidden">Upload</span>
          </Link>
        </div>
      </nav>
    </header>
  )
}
