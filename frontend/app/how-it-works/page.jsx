'use client'

import Link from 'next/link'
import { ArrowLeft, Code2, Zap, BarChart3, Download, Check } from 'lucide-react'
import CompressionAnimation from '@/components/CompressionAnimation'

export default function HowItWorksPage() {
  const steps = [
    {
      number: 1,
      title: 'Upload Your Image',
      description: 'Select or drag-and-drop an image (JPG, PNG, or BMP) up to 50MB. The app reads your image file and prepares it for compression.',
      details: [
        'Supported formats: JPEG, PNG, BMP',
        'Maximum file size: 50MB',
        'Instant preview of your selection',
        'No data sent to external servers'
      ]
    },
    {
      number: 2,
      title: 'Delta Prediction Filter',
      description: 'Before encoding, each pixel value is replaced with its difference from the neighboring pixel (per color channel). Neighboring pixels in real images are usually similar, so the differences cluster tightly around zero — exactly the skewed distribution Huffman coding thrives on.',
      details: [
        'Same idea as the filter step in PNG',
        'Fully reversible — adds no data loss',
        'Output is the same size — all compression comes from Huffman',
        'Turns flat byte distributions into highly skewed ones'
      ]
    },
    {
      number: 3,
      title: 'Huffman Encoding',
      description: 'The compression algorithm analyzes the filtered pixel data and builds a frequency table. Less common values get longer codes, while frequent ones get shorter codes.',
      details: [
        'Analyzes value frequency patterns',
        'Builds optimal code tree',
        'Encodes each value with variable-length codes',
        'Stores encoding metadata for decompression'
      ]
    },
    {
      number: 4,
      title: 'Compression Process',
      description: 'The algorithm reduces file size by replacing frequent values with shorter binary codes. The compression ratio depends on image content — smooth images compress more.',
      details: [
        'Lossless compression - no data loss',
        'Works best with smooth gradients and repeated patterns',
        'Compressed file bundles the Huffman tree for decoding',
        'Processing time typically < 1 second'
      ]
    },
    {
      number: 5,
      title: 'View Results',
      description: 'See side-by-side comparison of original and compressed images with detailed metrics about file size, compression ratio, processing time, and more.',
      details: [
        'Original vs compressed comparison',
        'Compression ratio calculation',
        'File size reduction percentage',
        'Processing time benchmark',
        'Detailed analytics dashboard'
      ]
    }
  ]

  const concepts = [
    {
      title: 'Huffman Encoding',
      icon: Code2,
      description: 'A lossless data compression algorithm that uses variable-length codes. Frequently occurring data gets shorter bit sequences, while rare data gets longer sequences.',
      colorClass: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Delta Prediction',
      icon: BarChart3,
      description: 'A reversible transform that stores pixel differences instead of raw values. It compresses nothing by itself, but concentrates the distribution so Huffman coding can — the same principle PNG uses.',
      colorClass: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Compression Ratio',
      icon: Zap,
      description: 'The ratio of original file size to compressed file size (e.g., 2.5x means the original is 2.5 times larger). Higher ratios indicate better compression.',
      colorClass: 'from-green-500 to-green-600'
    },
    {
      title: 'Lossless Compression',
      icon: Check,
      description: 'Compression that preserves all original data. The decompressed image is identical to the original. Perfect for images where quality is critical.',
      colorClass: 'from-purple-500 to-purple-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 py-12 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="section-title">How It Works</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Learn how image compression using Huffman encoding works step by step
          </p>
        </div>

        {/* Animated explainer */}
        <div className="mb-16">
          <CompressionAnimation />
        </div>

        {/* Steps Section */}
        <div className="space-y-8 mb-16">
          {steps.map((step) => (
            <div key={step.number} className="card bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex gap-6">
                {/* Step Number */}
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-2xl shadow-lg">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 py-2">
                  <h3 className="subsection-title text-xl mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {step.description}
                  </p>
                  
                  {/* Details List */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <ul className="space-y-2">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-gray-300">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Key Concepts */}
        <div className="mb-16">
          <h2 className="section-title mb-8">Key Concepts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {concepts.map((concept) => {
              const IconComponent = concept.icon
              return (
                <div key={concept.title} className="card bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow hover:scale-105 duration-300">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${concept.colorClass} flex items-center justify-center mb-4 shadow-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="subsection-title text-lg mb-2">{concept.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {concept.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="section-title mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'What image formats are supported?',
                a: 'JPEG, PNG, and BMP formats are supported. Images must be less than 50MB in size.'
              },
              {
                q: 'Is the compression lossless?',
                a: 'Yes! This is lossless compression - the decompressed image will be identical to the original. No quality is lost.'
              },
              {
                q: 'How fast is the compression?',
                a: 'Most images are compressed in under 1 second. The time depends on image size and complexity of the compression algorithm.'
              },
              {
                q: 'What determines the compression ratio?',
                a: 'The compression ratio depends on image content. Images with repetitive patterns compress better. The algorithm analyzes pixel frequency to determine optimal code lengths.'
              },
              {
                q: 'Where is my image stored?',
                a: 'Images are processed locally on your device and the server. They are stored temporarily during compression and deleted after you download the result.'
              },
              {
                q: 'Can I compress any image?',
                a: 'Yes, but compression effectiveness varies. Images with highly repetitive patterns (like simple graphics) compress better than photographs with varied colors.'
              }
            ].map((faq, idx) => (
              <details key={idx} className="group card bg-white dark:bg-gray-900 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <summary className="flex items-center justify-between font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <span>{faq.q}</span>
                  <span className="text-gray-400 group-open:text-blue-600 dark:group-open:text-blue-400 transition-colors">▼</span>
                </summary>
                <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Ready to Try Section */}
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 shadow-lg">
          <div className="text-center">
            <h2 className="subsection-title text-2xl mb-4">Ready to Try It?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Now that you understand how the compression works, upload your own image and see the results in real-time with detailed analytics and metrics.
            </p>
            <Link href="/upload" className="btn btn-primary text-lg inline-flex items-center gap-2">
              <Download className="w-5 h-5" />
              Start Compressing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
