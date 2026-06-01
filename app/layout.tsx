import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth-context'
import { LanguageProvider } from '@/lib/i18n'
import { AppearanceProvider } from '@/lib/appearance/appearance-provider'
import { SyncPreferredLanguage } from '@/components/sync-preferred-language'
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
  authors: [{ name: 'Alex Manuel Gomez Salazar ', url: 'https://www.mysparkd.com' }],
  creator: 'Johan M. Jones Anderson y Alex Manuel Gomez Salazar',
  publisher: 'Johan M. Jones Anderson y Alex Manuel Gomez Salazar',
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
    title: 'MySparkd - Red Social y Dating App',
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
        url: '/icon-new.svg?v=5',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-touch-icon.svg?v=5',
  },
}

export const viewport: Viewport = {
  themeColor: '#13141a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon-new.svg?v=5" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg?v=5" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://sparkd1-0.onrender.com" />
        <link rel="preconnect" href="https://www.mysparkd.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <meta name="application-name" content="Sparkd" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sparkd" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <LanguageProvider>
          <AppearanceProvider>
            <AuthProvider>
              <SyncPreferredLanguage />
              {children}
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
          </AppearanceProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
