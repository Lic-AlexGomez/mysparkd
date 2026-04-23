import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Descubrir Personas | Sparkd Match',
  description: 'Encuentra personas compatibles contigo en Sparkd. Haz match, chatea y comienza nuevas historias hoy mismo.',
  openGraph: {
    title: 'Descubrir Personas | Sparkd Match',
    description: 'Encuentra a tu próxima conexión en Sparkd.',
  }
}

export default function SwipesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
