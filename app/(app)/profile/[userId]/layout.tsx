import type { Metadata, ResolvingMetadata } from 'next'

type Props = {
  params: Promise<{ userId: string }>
  children: React.ReactNode
}

export async function generateMetadata(
  { params }: { params: Promise<{ userId: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const userId = (await params).userId
  
  // En una app real, aquí llamaríamos a la API para obtener el nombre del usuario.
  // Como no podemos hacer fetch directo aquí sin el token del cliente fácilmente,
  // pondremos un título genérico que incluya el ID o algo descriptivo.
  // Idealmente el backend debería tener un endpoint público para metadatos.
  
  return {
    title: `Perfil de Usuario | Sparkd`,
    description: `Mira el perfil de este usuario en Sparkd, la red social y dating app.`,
  }
}

export default function ProfileLayout({
  children,
}: Props) {
  return <>{children}</>
}
