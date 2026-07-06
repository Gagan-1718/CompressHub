import './globals.css'
import { Inter } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MouseGlow from '@/components/MouseGlow'
import WarmUp from '@/components/WarmUp'
import { ToastProvider } from '@/components/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// A bundled web font so the type looks identical on every device (instead of
// falling back to each OS's own system font — Segoe on Windows, San Francisco
// on iOS, Roboto on Android).
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800', '900'], display: 'swap' })

export const metadata = {
  title: 'CompressHub — Lossless Image Compression',
  description: 'Make your images smaller without losing any quality — fast, free, and right in your browser.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${inter.className}`} suppressHydrationWarning>
      <body className="bg-black text-white transition-colors duration-300">
        <ErrorBoundary>
          <ToastProvider>
            <WarmUp />
            <MouseGlow />
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
