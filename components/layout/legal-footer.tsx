import Link from "next/link"

export function LegalFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Política de Privacidad
          </Link>
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Términos de Servicio
          </Link>
          <Link href="/community-guidelines" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Normas de la Comunidad
          </Link>
          <Link href="/delete-account" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Eliminar Cuenta
          </Link>
          <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Acerca de
          </Link>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Sparkd. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
