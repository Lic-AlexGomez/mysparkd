import Link from "next/link"
import { ArrowLeft, Scale } from "lucide-react"
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

        <div className="flex items-center gap-3 mb-4">
          <Scale className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Términos de Servicio
          </h1>
        </div>
        <p className="text-muted-foreground mb-8">Última actualización: {new Date().toLocaleDateString("es-ES")}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Aceptación de los Términos</h2>
            <p className="text-muted-foreground">
              Al acceder, registrarte o usar Sparkd (la &quot;Plataforma&quot;), aceptas estar sujeto a estos Términos de Servicio y todas las leyes y regulaciones aplicables. Si no estás de acuerdo con alguno de estos términos, no uses nuestro servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Requisitos de Elegibilidad</h2>
            <p className="text-muted-foreground mb-2">Para usar Sparkd debes:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li><strong>Tener al menos 18 años</strong> (o la mayoría de edad legal en tu país de residencia)</li>
              <li>Tener capacidad legal para aceptar estos términos</li>
              <li>No ser un delincuente sexual registrado</li>
              <li>Proporcionar información precisa, veraz y actualizada</li>
              <li>No tener una cuenta de Sparkd previamente suspendida o eliminada por violación de términos</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Al crear una cuenta, confirmas que cumples con todos estos requisitos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Cuenta y Seguridad</h2>
            <p className="text-muted-foreground mb-2">Eres responsable de:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Mantener la confidencialidad de tu contraseña</li>
              <li>Todas las actividades que ocurran bajo tu cuenta</li>
              <li>No crear múltiples cuentas</li>
              <li>No compartir tu cuenta con terceros</li>
              <li>Notificarnos inmediatamente sobre cualquier uso no autorizado</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Contenido del Usuario</h2>
            <p className="text-muted-foreground">
              Eres el único responsable del contenido que publicas, compartes o transmites en la Plataforma, incluyendo fotos, videos, textos y cualquier otro material.
            </p>
            <p className="text-muted-foreground mt-2 mb-2">Al compartir contenido en Sparkd:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Conservas todos tus derechos de propiedad intelectual sobre tu contenido</li>
              <li>Nos otorgas una licencia no exclusiva, transferible y mundial para usar, modificar y distribuir ese contenido en relación con la operación de la Plataforma</li>
              <li>Confirmas que tienes los derechos necesarios para compartir dicho contenido</li>
              <li>Aceptas que tu contenido cumple con nuestras Normas de la Comunidad</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Conducta Prohibida</h2>
            <p className="text-muted-foreground mb-2">Está estrictamente prohibido:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Publicar contenido ilegal, ofensivo, violento, pornográfico o inapropiado</li>
              <li>Acosar, intimidar, amenazar o discriminar a otros usuarios</li>
              <li>Suplantar la identidad de otra persona o entidad</li>
              <li>Usar la plataforma para fines ilegales o fraudulentos</li>
              <li>Enviar spam, mensajes comerciales no solicitados o estafas</li>
              <li>Recopilar datos de otros usuarios sin su consentimiento</li>
              <li>Usar bots, scripts o automatización no autorizada</li>
              <li>Interferir con el funcionamiento del servicio o sus sistemas de seguridad</li>
              <li>Compartir información personal de otros usuarios sin su permiso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Moderación, Reportes y Bloqueos</h2>
            <p className="text-muted-foreground mb-2">
              Sparkd se compromete a mantener un entorno seguro y respetuoso. Para ello:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li><strong>Reportar contenido:</strong> Puedes reportar publicaciones, mensajes o perfiles que violen estas normas usando la opción &quot;Reportar&quot; disponible en cada elemento</li>
              <li><strong>Bloquear usuarios:</strong> Puedes bloquear a cualquier usuario para evitar que te contacte o vea tu perfil</li>
              <li><strong>Moderación:</strong> Nuestro equipo de moderación revisa los reportes y toma las medidas apropiadas, incluyendo la eliminación de contenido y suspensión de cuentas</li>
              <li><strong>Herramientas de privacidad:</strong> Puedes controlar quién ve tu perfil y tu contenido desde la configuración de privacidad</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Terminación de Cuenta</h2>
            <p className="text-muted-foreground mb-2">
              Nos reservamos el derecho de suspender o terminar tu cuenta en las siguientes circunstancias:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Violación de estos términos o de las Normas de la Comunidad</li>
              <li>Conducta ilegal o fraudulenta</li>
              <li>Solicitud de las autoridades legales</li>
              <li>Inactividad prolongada de la cuenta</li>
              <li>A nuestra discreción, cuando consideremos que tu presencia en la plataforma representa un riesgo para otros usuarios</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              <strong>Tú también puedes eliminar tu cuenta en cualquier momento</strong> desde Ajustes → Cuenta → Eliminar cuenta. Al eliminar tu cuenta, todo tu contenido y datos serán eliminados o anonimizados según nuestra Política de Privacidad.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Suscripciones y Pagos</h2>
            <p className="text-muted-foreground">
              Sparkd ofrece funciones premium mediante suscripciones. Los pagos se procesan a través de Stripe. Las suscripciones se renuevan automáticamente a menos que se cancelen antes de la fecha de renovación. No se ofrecen reembolsos por períodos no utilizados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Limitación de Responsabilidad</h2>
            <p className="text-muted-foreground">
              Sparkd se proporciona &quot;tal cual&quot; sin garantías de ningún tipo, expresas o implícitas. No somos responsables de daños indirectos, incidentales o consecuentes que surjan del uso o la imposibilidad de usar el servicio, incluyendo pero no limitado a daños por pérdida de datos, ingresos o interacciones entre usuarios.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Cambios en los Términos</h2>
            <p className="text-muted-foreground">
              Podemos modificar estos términos en cualquier momento. Te notificaremos sobre cambios significativos por email o mediante un aviso en la plataforma. El uso continuado del servicio después de los cambios constituye tu aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Contacto</h2>
            <p className="text-muted-foreground">
              Si tienes preguntas sobre estos términos, contáctanos en:
            </p>
            <ul className="list-none text-muted-foreground space-y-1 mt-2">
              <li>📧 Email: <a href="mailto:legal@sparkd.com" className="text-primary hover:underline">legal@sparkd.com</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
