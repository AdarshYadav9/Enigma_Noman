import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import MobileBottomNav from '../components/MobileBottomNav';
import AuthProvider from '../components/AuthProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Clinical Food Intelligence',
  description: 'Personalized Hidden-Ingredient and Dietary-Risk Alert System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#F4F5F7] text-[#15171A] font-sans antialiased selection:bg-[#EAF3FF] selection:text-[#1677FF]" suppressHydrationWarning>
        <AuthProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            
            <div className="flex-1 flex flex-col md:pl-72 w-full h-full relative">
              <Topbar />
              <main className="flex-1 overflow-y-auto pb-24 md:pb-8 px-4 sm:px-8">
                <div className="max-w-5xl mx-auto w-full pt-4">
                  {children}
                </div>
              </main>
            </div>
            
            <MobileBottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
