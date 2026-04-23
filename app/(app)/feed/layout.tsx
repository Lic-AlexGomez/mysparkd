import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Feed de Noticias | Sparkd - Conecta y Comparte',
  description: 'Explora las últimas publicaciones de personas cerca de ti y de todo el mundo en Sparkd. Mantente al día con tu comunidad.',
  openGraph: {
    title: 'Feed de Noticias | Sparkd',
    description: 'Mira lo que está pasando en Sparkd. Posts, fotos y más de tus conexiones.',
  }
}

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
