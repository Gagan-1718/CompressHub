'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Github, Linkedin } from 'lucide-react'

const CREATORS = [
  {
    name: 'Gagandeep N',
    github: 'https://github.com/Gagan-1718',
    linkedin: 'https://linkedin.com/in/gagandeep1718',
  },
  {
    name: 'Harsha K',
    github: 'https://github.com/Harsha-Kamaraj',
    linkedin: 'https://linkedin.com/in/harshak2006',
  },
]

export default function Footer() {
  const pathname = usePathname()
  // The Enhance studio is a full-height, no-scroll workspace — no footer there.
  if (pathname === '/enhance') return null

  return (
    <footer className="relative bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="text-xl font-black tracking-tight">
              <span className="text-white">Compress</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Hub</span>
            </p>
            <p className="text-xs text-gray-500 mt-3 max-w-xs leading-relaxed">
              Lossless image compression with an in-browser enhance studio. Every
              output is pixel-identical to the original.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/upload" className="text-gray-400 hover:text-white transition-colors">Compress</Link></li>
              <li><Link href="/enhance" className="text-gray-400 hover:text-white transition-colors">Enhance</Link></li>
              <li><Link href="/library" className="text-gray-400 hover:text-white transition-colors">Library</Link></li>
              <li><Link href="/how-it-works" className="text-gray-400 hover:text-white transition-colors">How it works</Link></li>
            </ul>
          </div>

          {/* Created by / Connect */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Created by</h4>
            <ul className="space-y-3.5 text-sm">
              {CREATORS.map((c) => (
                <li key={c.name} className="flex items-center gap-3">
                  <span className="text-gray-300 font-medium">{c.name}</span>
                  <a
                    href={c.github}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-500 hover:text-white transition-colors"
                    aria-label={`${c.name} on GitHub`}
                  >
                    <Github className="w-4 h-4" />
                  </a>
                  <a
                    href={c.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-500 hover:text-blue-400 transition-colors"
                    aria-label={`${c.name} on LinkedIn`}
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6">
          <p className="text-xs text-gray-600">© 2026 CompressHub</p>
        </div>
      </div>
    </footer>
  )
}
