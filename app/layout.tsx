import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { structuredData } from '@/lib/metadata'
import { ClearServiceWorker } from './components/clear-service-worker'
import './globals.css'

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'RE-Novate - Entrepreneurial Skills Platform',
    template: '%s | RE-Novate'
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  description: 'Interactive entrepreneurial skills development platform for high school students. Learn business fundamentals through AI-powered simulations and real-world scenarios.',
  keywords: [
    'entrepreneurship',
    'education',
    'high school',
    'business skills',
    'simulation',
    'learning platform',
    'career development',
    'AI-powered learning'
  ],
  authors: [{ name: 'RE-Novate Team' }],
  creator: 'RE-Novate',
  publisher: 'RE-Novate',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://capstone-solution-c30f.onrender.com/'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'RE-Novate - Entrepreneurial Skills Platform',
    description: 'Interactive entrepreneurial skills development platform for high school students. Learn business fundamentals through AI-powered simulations and real-world scenarios.',
    siteName: 'RE-Novate',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RE-Novate - Entrepreneurial Skills Platform',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RE-Novate - Entrepreneurial Skills Platform',
    description: 'Interactive entrepreneurial skills development platform for high school students. Learn business fundamentals through AI-powered simulations.',

  images: ['/og-image.png'],
    creator: '@renovate_edu',
    site: '@renovate_edu',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
  category: 'education',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Preload hero background image to reduce perceived load time */}
        <link rel="preload" as="image" href="/referrals-landing.jpg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData.website)
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData.educationalOrganization)
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData.course)
          }}
        />
      </head>
      <body className={`${geist.className} antialiased`}>
        <ClearServiceWorker />
        {children}
        <Toaster position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
