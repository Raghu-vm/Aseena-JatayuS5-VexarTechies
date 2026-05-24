import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

/**
 * Load Geist (sans) and Geist Mono once at the root.
 *
 * Each call returns a `variable` we can spread onto <html> as a class.
 * Next.js injects `--font-geist-sans` / `--font-geist-mono` CSS variables
 * scoped to that element. We point our `--font-sans` and `--font-mono`
 * tokens at those variables in globals.css, so:
 *
 *   - Tailwind's `font-sans` class picks up Geist
 *   - Inline styles using `var(--font-sans)` pick up Geist
 *   - Every page renders with the same font on every browser
 */
const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7B5BFF',
  userScalable: true,
}

export const metadata: Metadata = {
  title: 'RAY - AI Assistant',
  description:
    'RAY is an intelligent AI assistant that helps you navigate and understand complex information. Search through your knowledge base with confidence.',
  generator: 'v0.app',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
