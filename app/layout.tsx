import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin', 'cyrillic'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'Трекер подписок',
  description: 'Отслеживайте регулярные платежи, расходы в месяц и ближайшие списания.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/subcription-tracker/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/subcription-tracker/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/subcription-tracker/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/subcription-tracker/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={geist.variable}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
