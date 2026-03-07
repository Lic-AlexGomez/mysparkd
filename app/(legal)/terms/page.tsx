import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Términos de Servicio
        </h1>
        <p className="text-muted-foreground mb-8">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Aceptación de los Términos</h2>
            <p className="text-muted-foreground">
              Al acceder y usar Sparkd, aceptas estar sujeto a estos Términos de Servicio y todas las leyes y regulaciones aplicables. 
              Si no estás de acuerdo con alguno de estos términos, no uses nuestro servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Requisitos de Edad</h2>
            <p className="text-muted-foreground">
              Debes tener al menos 18 años para usar Sparkd. Al crear una cuenta, confirmas que tienes la edad legal requerida.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Uso del Servicio</h2>
            <p className="text-muted-foreground mb-2">Te comprometes a:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Proporcionar información precisa y veraz</li>
              <li>Mantener la seguridad de tu cuenta</li>
              <li>No usar el servicio para fines ilegales</li>
              <li>Respetar a otros usuarios</li>
              <li>No acosar, intimidar o amenazar a otros</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Contenido del Usuario</h2>
            <p className="text-muted-foreground">
              Eres responsable del contenido que publicas. Al compartir contenido, nos otorgas una licencia no exclusiva para usar, 
              modificar y distribuir ese contenido en nuestra plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Conducta Prohibida</h2>
            <p className="text-muted-foreground mb-2">Está prohibido:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Publicar contenido ofensivo, ilegal o inapropiado</li>
              <li>Suplantar la identidad de otra persona</li>
              <li>Usar bots o automatización no autorizada</li>
              <li>Recopilar datos de otros usuarios</li>
              <li>Interferir con el funcionamiento del servicio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Terminación</h2>
            <p className="text-muted-foreground">
              Nos reservamos el derecho de suspender o terminar tu cuenta si violas estos términos o por cualquier otra razón, 
              a nuestra discreción.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Limitación de Responsabilidad</h2>
            <p className="text-muted-foreground">
              Sparkd se proporciona "tal cual" sin garantías de ningún tipo. No somos responsables de daños indirectos, 
              incidentales o consecuentes que surjan del uso del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Cambios en los Términos</h2>
            <p className="text-muted-foreground">
              Podemos modificar estos términos en cualquier momento. Te notificaremos sobre cambios significativos. 
              El uso continuado del servicio después de los cambios constituye tu aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Contacto</h2>
            <p className="text-muted-foreground">
              Si tienes preguntas sobre estos términos, contáctanos en: <a href="mailto:legal@sparkd.com" className="text-primary hover:underline">legal@sparkd.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
