import Link from "next/link"
import { ArrowLeft, Users, Shield, Flag, Ban, UserX, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CommunityGuidelinesPage() {
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
          <Users className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Normas de la Comunidad
          </h1>
        </div>
        <p className="text-muted-foreground mb-2">
          En Sparkd, nuestra prioridad es crear un entorno seguro, respetuoso e inclusivo para todos los usuarios.
        </p>
        <p className="text-muted-foreground mb-8">
          Estas normas te ayudarán a entender qué tipo de comportamiento y contenido se espera en nuestra plataforma. El incumplimiento puede resultar en la eliminación de contenido, suspensión o terminación de tu cuenta.
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <Ban className="h-6 w-6 text-destructive" />
              1. No al Acoso
            </h2>
            <p className="text-muted-foreground">
              No toleramos el acoso de ningún tipo. Esto incluye:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Enviar mensajes no deseados o repetitivos</li>
              <li>Comentarios ofensivos o degradantes sobre apariencia, raza, género, religión, orientación sexual o cualquier otra característica personal</li>
              <li>Intimidación, amenazas o comportamiento agresivo</li>
              <li>Seguir a un usuario a través de diferentes secciones de la plataforma después de que te haya pedido que te detengas</li>
              <li>Compartir información personal de otros usuarios sin su consentimiento (doxing)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <Ban className="h-6 w-6 text-destructive" />
              2. No al Discurso de Odio
            </h2>
            <p className="text-muted-foreground">
              Está estrictamente prohibido cualquier contenido que promueva o incite al odio, la violencia o la discriminación contra personas o grupos basados en:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Raza, color de piel u origen étnico</li>
              <li>Religión o credo</li>
              <li>Género, identidad de género o expresión de género</li>
              <li>Orientación sexual</li>
              <li>Edad</li>
              <li>Discapacidad física o mental</li>
              <li>Nacionalidad o estatus migratorio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              3. No a Contenido Explícito o Ilegal
            </h2>
            <p className="text-muted-foreground">
              No se permite compartir ningún tipo de contenido ilegal o explícito no consensuado, incluyendo:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Desnudez, contenido sexual explícito o pornográfico</li>
              <li>Violencia gráfica o contenido perturbador</li>
              <li>Contenido que promueva actividades ilegales (drogas, armas, terrorismo)</li>
              <li>Imágenes íntimas compartidas sin consentimiento</li>
              <li>Contenido que exploite o ponga en riesgo a menores</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <UserX className="h-6 w-6 text-destructive" />
              4. No a la Suplantación
            </h2>
            <p className="text-muted-foreground">
              Está prohibido hacerse pasar por otra persona o entidad. Esto incluye:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Usar fotos o información de otra persona sin su permiso</li>
              <li>Crear cuentas falsas</li>
              <li>Suplantar a celebridades, figuras públicas o marcas</li>
              <li>Falsificar tu edad, ubicación o identidad</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <Ban className="h-6 w-6 text-destructive" />
              5. No a Spam y Estafas
            </h2>
            <p className="text-muted-foreground">
              Prohibimos cualquier forma de spam, fraude o actividad engañosa:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Mensajes comerciales no solicitados o publicidad no autorizada</li>
              <li>Enlaces a sitios web maliciosos o de phishing</li>
              <li>Solicitudes de dinero o información financiera</li>
              <li>Promesas falsas, esquemas piramidales o estafas</li>
              <li>Automatización de mensajes o uso de bots</li>
              <li>Promoción de servicios de citas, webcams o contenido para adultos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              6. Herramientas de Reporte y Bloqueo
            </h2>
            <p className="text-muted-foreground mb-2">
              Para mantener la comunidad segura, ponemos a tu disposición las siguientes herramientas:
            </p>
            <div className="space-y-3 mt-3">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Flag className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">Reportar contenido o usuarios</h3>
                    <p className="text-sm text-muted-foreground">
                      Puedes reportar cualquier publicación, mensaje o perfil que consideres que viola estas normas usando la opción &quot;Reportar&quot;. Nuestro equipo de moderación revisará cada reporte y tomará las medidas apropiadas.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <UserX className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">Bloquear usuarios</h3>
                    <p className="text-sm text-muted-foreground">
                      Puedes bloquear a cualquier usuario para evitar que te envíe mensajes, vea tu perfil o interactúe contigo en la plataforma. Los usuarios bloqueados no serán notificados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Consecuencias</h2>
            <p className="text-muted-foreground">
              El incumplimiento de estas normas puede resultar en:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Eliminación del contenido infractor</li>
              <li>Advertencia por parte del equipo de moderación</li>
              <li>Suspensión temporal de la cuenta</li>
              <li>Terminación permanente de la cuenta</li>
              <li>Reporte a las autoridades legales si es necesario</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Contacto</h2>
            <p className="text-muted-foreground">
              Si tienes preguntas sobre estas normas, has sido testigo de una violación o necesitas ayuda, contáctanos en:
            </p>
            <ul className="list-none text-muted-foreground space-y-1 mt-2">
              <li>📧 Email: <a href="mailto:seguridad@sparkd.app" className="text-primary hover:underline">seguridad@sparkd.app</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
