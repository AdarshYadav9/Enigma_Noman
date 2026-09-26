import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Health Track',
  description: 'Know what is really in your food',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="font-bold text-xl text-gray-900 flex items-center gap-2">
              <span className="text-2xl">🩺</span> Health Track
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/tracker" className="text-sm font-medium text-gray-600 hover:text-red-600">
                Daily Tracker
              </Link>
              <Link href="/compare" className="text-sm font-medium text-gray-600 hover:text-red-600">
                Compare
              </Link>
              <div className="text-sm font-medium text-gray-400 hidden sm:block border-l pl-6">
                Know what's in your food
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
