import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
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
            <div className="font-bold text-xl text-gray-900 flex items-center gap-2">
              <span className="text-2xl">🩺</span> Health Track
            </div>
            <div className="text-sm font-medium text-gray-500 hidden sm:block">
              Know what's in your food
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
