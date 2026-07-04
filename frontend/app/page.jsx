'use client'

import Link from 'next/link'
import { ArrowRight, Upload, BrainCircuit, Binary, Download, ShieldCheck, Gauge, FlaskConical } from 'lucide-react'
import DotField from '@/components/DotField'
import LightRays from '@/components/LightRays'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 top-20">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900/80 to-black" />
      </div>

      {/* Hero */}
      <section className="relative min-h-[88vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
        {/* Layered background: interactive dot field + light-ray tint */}
        <div className="absolute inset-0 -z-0">
          <DotField
            className="absolute inset-0 w-full h-full"
            dotRadius={2}
            dotSpacing={20}
            cursorRadius={420}
            bulgeStrength={40}
            glowRadius={120}
            gradientFrom="rgba(139, 92, 246, 0.20)"
            gradientTo="rgba(168, 151, 207, 0.06)"
            glowColor="#060509"
          />
          <LightRays
            className="absolute inset-0"
            raysColor="#ffffff"
            lightSpread={0.8}
            rayLength={2.1}
            fadeDistance={0.4}
            followMouse
            mouseInfluence={0.2}
          />
          {/* Fade the effect into the page below */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-black" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <p className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-6">
            Lossless image compression
          </p>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
            Shrink your images.
            <br />
            <span className="text-gradient-primary">Not their quality.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            A Huffman tree built live for every image, with the entropy math to prove it.
            Every output is pixel-identical to the original.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/upload" className="btn btn-primary text-lg px-10 py-4">
              <span>Compress an image</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/how-it-works"
              className="px-6 py-3 rounded-xl border border-white/20 text-sm sm:text-base text-gray-200 hover:bg-white/5 transition-colors duration-200"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* Real measured results */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-8 sm:p-10 shadow-xl shadow-black/40">
          <p className="text-sm font-semibold text-blue-300 uppercase tracking-[0.25em] mb-3">Measured, not marketed</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Real results from the built-in samples
          </h2>
          <p className="text-sm text-gray-400 max-w-2xl mb-8">
            Compression depends on image content &mdash; so we show the whole range, including the case
            no algorithm can win. Try each one yourself from the upload page.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5">
              <p className="text-xs text-gray-400 mb-1">Smooth gradient</p>
              <p className="text-3xl font-black text-emerald-300">87% smaller</p>
              <p className="text-xs text-gray-500 mt-2">Best case: highly predictable pixels</p>
            </div>
            <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-5">
              <p className="text-xs text-gray-400 mb-1">Landscape image</p>
              <p className="text-3xl font-black text-blue-300">41% smaller</p>
              <p className="text-xs text-gray-500 mt-2">Typical case: structure plus mild noise</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs text-gray-400 mb-1">Random noise</p>
              <p className="text-3xl font-black text-gray-300">~0%</p>
              <p className="text-xs text-gray-500 mt-2">Honest worst case: noise is incompressible</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              100% lossless &mdash; every run round-trip verified
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Gauge className="w-5 h-5 text-blue-400 flex-shrink-0" />
              88&ndash;99% of the Shannon entropy limit
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <FlaskConical className="w-5 h-5 text-purple-400 flex-shrink-0" />
              Live Huffman code table for every image
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 text-center">How it works</h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto text-center mb-12">
          From pixels to a purpose-built Huffman tree in under a second.
        </p>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Upload', desc: 'Select or drag any image', Icon: Upload },
            { step: '2', title: 'Predict', desc: 'Delta filter concentrates the byte distribution', Icon: BrainCircuit },
            { step: '3', title: 'Encode', desc: 'A Huffman tree assigns short codes to frequent values', Icon: Binary },
            { step: '4', title: 'Verify & download', desc: 'Round-trip decoded to prove pixel-identical output', Icon: Download },
          ].map(({ step, title, desc, Icon }, index) => (
            <div key={index} className="relative">
              <div className="card p-6 text-center h-full">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
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
    </div>
  )
}
