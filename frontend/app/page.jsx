'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function HomePage() {

  const handleScrollToUpload = (event) => {
    event.preventDefault()
    const target = document.getElementById('upload-section')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.location.href = '/upload'
    }
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10 top-20">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900/80 to-black" />
      </div>

      {/* Hero Section with Wave Animation */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 hero-mouse-glow">
        {/* Animated Wave SVG Background */}
        <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 1200 600">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <path
            d="M0,320 Q300,220 600,320 T1200,320 L1200,600 L0,600 Z"
            fill="none"
            stroke="url(#waveGradient)"
            strokeWidth="2"
            opacity="0.22"
          />
        </svg>
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold text-blue-400 uppercase tracking-widest">Lossless Image Compression</span>
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
            Shrink your images.
            <br />
            <span className="text-gradient-primary">Not their quality.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Smaller image files, same pixel-perfect quality.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/upload"
              onClick={handleScrollToUpload}
              className="btn btn-primary text-lg px-10 py-4"
            >
              <span>Try it yourself</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#live-demo"
              className="px-6 py-3 rounded-xl border border-white/20 text-sm sm:text-base text-gray-200 hover:bg-white/5 transition-colors duration-200"
            >
              See demo
            </Link>
          </div>
        </div>
      </section>
      {/* Section divider between hero and demo */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700/70 to-transparent" />
      </div>
      {/* Live Demo Section */}
      <section
        id="live-demo"
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24"
      >
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-8 sm:p-10 shadow-xl shadow-black/40">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            {/* Demo Images */}
            <div className="space-y-6">
              <p className="text-sm font-semibold text-blue-300 uppercase tracking-[0.25em]">Live demo</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Imagine reducing image size by <span className="text-blue-300">40%</span> — without losing quality.
              </h2>
              <p className="text-sm text-gray-400 max-w-md">
                Below is a sample landscape image, compressed using our lossless Huffman-based engine.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Original */}
                <div className="group space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-semibold text-white">Original</span>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-md shadow-black/40">
                    <div className="aspect-[4/3] w-full overflow-hidden">
                      <img
                        src="/demo-nature.svg"
                        alt="Sample landscape (original)"
                        className="w-full h-full object-cover scale-100 group-hover:scale-[1.01] transition-transform duration-500 ease-out"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    File size: <span className="text-gray-200 font-medium">4.8 MB</span>
                  </p>
                </div>

                {/* Compressed */}
                <div className="group space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-semibold text-white">Compressed</span>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-blue-400/50 bg-black/60 shadow-md shadow-blue-900/60">
                    <div className="aspect-[4/3] w-full overflow-hidden">
                      <img
                        src="/demo-nature.svg"
                        alt="Sample landscape (compressed preview)"
                        className="w-full h-full object-cover scale-100 group-hover:scale-[1.01] transition-transform duration-500 ease-out"
                      />
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-blue-600/80 text-[11px] font-semibold tracking-wide text-white/95">
                      40% smaller
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    File size: <span className="text-blue-300 font-medium">2.9 MB</span>
                  </p>
                </div>
              </div>

              <p className="text-sm font-semibold text-gray-100 mt-2">
                Same quality. <span className="text-emerald-400">Smaller size.</span>
              </p>
            </div>

            {/* Supporting copy */}
            <div className="space-y-6">
              <p className="text-sm font-semibold text-blue-300 uppercase tracking-[0.25em]">Why teams use CompressHub</p>
              <p className="text-base text-gray-300">
                Ship faster websites, leaner products, and snappier experiences without asking designers to compromise on visuals.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs text-gray-400 mb-1">Average size reduction</p>
                  <p className="text-2xl font-black text-emerald-300">35%–45%</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs text-gray-400 mb-1">Visual fidelity</p>
                  <p className="text-2xl font-black text-sky-300">Pixel perfect</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 text-center">How it works</h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto text-center mb-12">Go from heavy assets to optimized images in just a few steps.</p>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Upload', desc: 'Select or drag your image', icon: '📁' },
            { step: '2', title: 'Analyze', desc: 'We model redundancy in your data', icon: '🧠' },
            { step: '3', title: 'Compress', desc: 'Huffman encoding removes only the waste', icon: '⚡' },
            { step: '4', title: 'Download', desc: 'Get a smaller, pixel-perfect file', icon: '💾' },
          ].map(({ step, title, desc, icon }, index) => (
            <div key={index} className="relative">
              <div className="card p-6 text-center">
                <div className="text-4xl mb-4">{icon}</div>
                <div className="inline-block px-3 py-1 bg-blue-500/20 rounded-full text-sm font-semibold text-blue-400 mb-3">
                  Step {step}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
              {index < 3 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Upload Section anchor for scroll CTA */}
      <section
        id="upload-section"
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 text-center"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 via-purple-600/40 to-emerald-500/30 rounded-2xl blur-2xl opacity-40" />
          <div className="relative card p-10 sm:p-14 border-2 border-blue-500/30">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Ready to try it on your own images?
            </h2>
            <p className="text-base sm:text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Open the compression studio, upload any JPG, PNG, or BMP, and see how much weight you can drop — with zero visual loss.
            </p>
            <Link
              href="/upload"
              className="btn btn-primary text-lg px-10 py-4 inline-flex items-center gap-2 justify-center"
            >
              Open upload studio
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
