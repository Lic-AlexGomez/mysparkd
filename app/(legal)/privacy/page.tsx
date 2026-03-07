import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
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
          <Shield className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Política de Privacidad
          </h1>
        </div>
        <p className="text-muted-foreground mb-8">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Información que Recopilamos</h2>
            <p className="text-muted-foreground mb-2">Recopilamos la siguiente información:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li><strong>Información de perfil:</strong> Nombre, edad, género, fotos, biografía</li>
              <li><strong>Información de contacto:</strong> Email, número de teléfono</li>
              <li><strong>Contenido:</strong> Mensajes, publicaciones, fotos compartidas</li>
              <li><strong>Datos de uso:</strong> Interacciones, preferencias, historial de matches</li>
              <li><strong>Información técnica:</strong> Dirección IP, tipo de dispositivo, navegador</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Cómo Usamos tu Información</h2>
            <p className="text-muted-foreground mb-2">Usamos tu información para:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Proporcionar y mejorar nuestros servicios</li>
              <li>Conectarte con otros usuarios compatibles</li>
              <li>Personalizar tu experiencia</li>
              <li>Comunicarnos contigo sobre el servicio</li>
              <li>Garantizar la seguridad y prevenir fraudes</li>
              <li>Cumplir con obligaciones legales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Compartir Información</h2>
            <p className="text-muted-foreground mb-2">
              Tu información puede ser compartida con:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li><strong>Otros usuarios:</strong> Tu perfil es visible para otros usuarios según tu configuración</li>
              <li><strong>Proveedores de servicios:</strong> Empresas que nos ayudan a operar la plataforma</li>
              <li><strong>Autoridades legales:</strong> Cuando sea requerido por ley</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              <strong>Nunca vendemos tu información personal a terceros.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Seguridad de los Datos</h2>
            <p className="text-muted-foreground">
              Implementamos medidas de seguridad técnicas y organizativas para proteger tu información, incluyendo:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Encriptación de datos en tránsito y en reposo</li>
              <li>Controles de acceso estrictos</li>
              <li>Monitoreo continuo de seguridad</li>
              <li>Auditorías de seguridad regulares</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Tus Derechos</h2>
            <p className="text-muted-foreground mb-2">Tienes derecho a:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li><strong>Acceder:</strong> Solicitar una copia de tu información</li>
              <li><strong>Rectificar:</strong> Corregir información inexacta</li>
              <li><strong>Eliminar:</strong> Solicitar la eliminación de tu cuenta y datos</li>
              <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado</li>
              <li><strong>Oposición:</strong> Oponerte al procesamiento de tus datos</li>
              <li><strong>Restricción:</strong> Limitar cómo usamos tu información</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Cookies y Tecnologías Similares</h2>
            <p className="text-muted-foreground">
              Usamos cookies y tecnologías similares para mejorar tu experiencia, analizar el uso del servicio y personalizar contenido. 
              Puedes controlar las cookies a través de la configuración de tu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Retención de Datos</h2>
            <p className="text-muted-foreground">
              Conservamos tu información mientras tu cuenta esté activa o según sea necesario para proporcionar servicios. 
              Cuando elimines tu cuenta, eliminaremos o anonimizaremos tu información, excepto cuando la ley requiera su retención.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Menores de Edad</h2>
            <p className="text-muted-foreground">
              Nuestro servicio está destinado a personas mayores de 18 años. No recopilamos intencionalmente información de menores. 
              Si descubrimos que hemos recopilado información de un menor, la eliminaremos inmediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Cambios en esta Política</h2>
            <p className="text-muted-foreground">
              Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos por email o mediante 
              un aviso en la plataforma. Te recomendamos revisar esta política regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Contacto</h2>
            <p className="text-muted-foreground">
              Para ejercer tus derechos o si tienes preguntas sobre esta política, contáctanos en:
            </p>
            <ul className="list-none text-muted-foreground space-y-1 mt-2">
              <li>📧 Email: <a href="mailto:privacy@sparkd.com" className="text-primary hover:underline">privacy@sparkd.com</a></li>
              <li>🔒 Oficial de Protección de Datos: <a href="mailto:dpo@sparkd.com" className="text-primary hover:underline">dpo@sparkd.com</a></li>
            </ul>
          </section>

          <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong className="text-primary">🔒 Tu privacidad es nuestra prioridad.</strong> Nos comprometemos a proteger tu información 
              y a ser transparentes sobre cómo la usamos. Si tienes alguna preocupación, no dudes en contactarnos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
