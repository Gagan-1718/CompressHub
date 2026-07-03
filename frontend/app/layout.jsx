import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ToastProvider } from '@/components/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata = {
  title: 'Image Compression Lab - Interactive Compression Tool',
  description: 'Compress your images using advanced Huffman encoding with real-time metrics and visualization.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-black text-white transition-colors duration-300">
        <ErrorBoundary>
          <ToastProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow pt-20">{children}</main>
              <Footer />
            </div>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
