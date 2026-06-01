import Link from "next/link"
import { ArrowLeft, Trash2, Mail, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="h-10 w-10 text-destructive" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-destructive to-primary bg-clip-text text-transparent">
            Eliminar tu Cuenta
          </h1>
        </div>
        <p className="text-muted-foreground mb-4">
          Puedes eliminar tu cuenta de Sparkd en cualquier momento. A continuación te explicamos cómo hacerlo.
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              Método 1: Desde la aplicación (recomendado)
            </h2>
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-2">
              <p className="text-muted-foreground">
                Sigue estos pasos dentro de la app:
              </p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-4">
                <li>Abre la aplicación de Sparkd</li>
                <li>Ve a la sección de <strong>Ajustes</strong> o <strong>Configuración</strong></li>
                <li>Selecciona la opción <strong>Cuenta</strong></li>
                <li>Desplázate hasta el final y selecciona <strong>Eliminar cuenta</strong></li>
                <li>Confirma tu decisión</li>
              </ol>
              <p className="text-sm text-muted-foreground mt-2">
                Una vez confirmado, tu cuenta y todos tus datos personales serán eliminados en un plazo máximo de 30 días.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Método 2: Solicitud por correo electrónico
            </h2>
            <p className="text-muted-foreground">
              Si no puedes acceder a la aplicación, envía una solicitud de eliminación desde el correo electrónico asociado a tu cuenta a:
            </p>
            <div className="mt-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-center">
                <a href="mailto:soporte@sparkd.app" className="text-primary text-lg font-semibold hover:underline">
                  soporte@sparkd.app
                </a>
              </p>
            </div>
            <p className="text-muted-foreground mt-3">
              Incluye en el asunto: &quot;Solicitud de eliminación de cuenta&quot; y tu nombre de usuario de Sparkd. Procesaremos tu solicitud en un plazo máximo de 7 días hábiles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">¿Qué datos se eliminan?</h2>
            <p className="text-muted-foreground mb-2">Al eliminar tu cuenta, se eliminarán permanentemente:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Tu perfil y toda la información asociada</li>
              <li>Tus fotos y medios subidos</li>
              <li>Tus publicaciones, comentarios y reacciones</li>
              <li>Tus mensajes de chat (de los destinatarios se conservará una copia anonimizada)</li>
              <li>Tus matches, swipes y preferencias</li>
              <li>Tu información de ubicación almacenada</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Importante</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>La eliminación es permanente y no se puede deshacer</li>
              <li>Si tienes una suscripción premium activa, debes cancelarla antes de eliminar tu cuenta</li>
              <li>No se ofrecen reembolsos por suscripciones no utilizadas</li>
              <li>Conservaremos cierta información según lo requiera la ley (por ejemplo, registros de transacciones)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Alternativa: Desactivar cuenta</h2>
            <p className="text-muted-foreground">
              Si no estás seguro de querer eliminar tu cuenta permanentemente, puedes <strong>desactivarla temporalmente</strong> desde Ajustes → Cuenta → Desactivar cuenta. Tu perfil no será visible para otros usuarios y puedes reactivarlo cuando quieras iniciando sesión nuevamente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Contacto</h2>
            <p className="text-muted-foreground">
              Si tienes problemas para eliminar tu cuenta o tienes preguntas, contáctanos en:
            </p>
            <ul className="list-none text-muted-foreground space-y-1 mt-2">
              <li>📧 Email: <a href="mailto:soporte@sparkd.app" className="text-primary hover:underline">soporte@sparkd.app</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
