import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth-context'
import { NotificationBanner } from '@/components/notification-banner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'Sparkd - Red Social y Dating App para Conocer Gente Nueva',
    template: '%s | Sparkd'
  },
  description: 'Conoce gente nueva con Sparkd, la app de citas y red social. Haz match, chatea y encuentra personas con tus intereses.',
  keywords: ['red social', 'dating app', 'app de citas', 'conocer gente', 'hacer match', 'chat', 'citas online', 'ligar', 'amor', 'amistad', 'sparkd', 'tinder', 'bumble', 'badoo'],
  authors: [{ name: 'Alex Manuel Gomez Salazar', url: 'https://sparkd.app' }],
  creator: 'Alex Manuel Gomez Salazar',
  publisher: 'Alex Manuel Gomez Salazar',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.mysparkd.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Sparkd - Red Social y Dating App para Conocer Gente Nueva',
    description: 'Conoce gente nueva, haz match y chatea. La mejor app de citas y red social para encontrar el amor o hacer amigos.',
    url: 'https://www.mysparkd.com',
    siteName: 'Sparkd',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: '/placeholder-logo.png',
        width: 1200,
        height: 630,
        alt: 'Sparkd - Red Social y Dating App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sparkd - Red Social y Dating App',
    description: 'Conoce gente nueva, haz match y chatea. La mejor app de citas.',
    images: ['/placeholder-logo.png'],
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
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon.svg?v=3',
        type: 'image/svg+xml',
      },
      {
        url: '/icon-light-32x32.png?v=3',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    apple: '/icon-light-32x32.png?v=3',
  },
}

export const viewport: Viewport = {
  themeColor: '#13141a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg?v=3" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-light-32x32.png?v=3" />
        <link rel="apple-touch-icon" href="/icon-light-32x32.png?v=3" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://sparkd1-0.onrender.com" />
        <meta name="application-name" content="Sparkd" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sparkd" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Sparkd',
              description: 'Red social y dating app para conocer gente nueva',
              applicationCategory: 'SocialNetworkingApplication',
              operatingSystem: 'All',
              author: {
                '@type': 'Person',
                name: 'Alex Manuel Gomez Salazar',
                jobTitle: 'Desarrollador Web Full Stack',
                description: 'Creador de Sparkd - Red Social y Dating App'
              },
              creator: {
                '@type': 'Person',
                name: 'Alex Manuel Gomez Salazar'
              },
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '1250',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Alex Manuel Gomez Salazar',
              jobTitle: 'Desarrollador Web Full Stack',
              description: 'Creador de Sparkd, una innovadora red social y dating app para conocer gente nueva',
              url: 'https://sparkd.app',
              sameAs: [
                'https://sparkd.app'
              ],
              knowsAbout: ['Desarrollo Web', 'React', 'Next.js', 'TypeScript', 'Node.js', 'Dating Apps', 'Redes Sociales'],
              alumniOf: 'Universidad',
              worksFor: {
                '@type': 'Organization',
                name: 'Sparkd',
                url: 'https://sparkd.app'
              }
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <NotificationBanner />
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{
              style: {
                background: '#1a1b23',
                border: '1px solid #2a2b35',
                color: '#e0f7fa',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
