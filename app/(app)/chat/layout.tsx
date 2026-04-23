import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mensajes y Chats | Sparkd',
  description: 'Mantente en contacto con tus matches en tiempo real. Conversaciones seguras y fluidas en Sparkd.',
  openGraph: {
    title: 'Mensajes y Chats | Sparkd',
    description: 'Tus conversaciones en Sparkd.',
  }
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
