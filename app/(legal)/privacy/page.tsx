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
        <p className="text-muted-foreground mb-8">Última actualización: {new Date().toLocaleDateString("es-ES")}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Información que Recopilamos</h2>
            <p className="text-muted-foreground mb-2">Recopilamos la siguiente información para proporcionar y mejorar nuestros servicios:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li><strong>Información de la cuenta:</strong> Nombre de usuario, dirección de correo electrónico, contraseña (almacenada de forma segura), fecha de registro</li>
              <li><strong>Información del perfil:</strong> Nombre, edad, fecha de nacimiento, género, biografía, fotos de perfil, fotos adicionales, preferencias</li>
              <li><strong>Fotos y medios:</strong> Imágenes, videos y notas de voz que subes a tu perfil o compartes en publicaciones y mensajes</li>
              <li><strong>Publicaciones, comentarios y reacciones:</strong> Contenido que publicas, comentarios que escribes y reacciones que envías a otras publicaciones</li>
              <li><strong>Chats y mensajes:</strong> Contenido de tus conversaciones, incluyendo mensajes de texto, imágenes y archivos compartidos</li>
              <li><strong>Ubicación:</strong> Si activas los servicios de ubicación, recopilamos tu ubicación aproximada (basada en IP) o precisa (GPS) para mostrarte personas y eventos cercanos</li>
              <li><strong>Datos de uso:</strong> Interacciones con la plataforma, preferencias, historial de swipes y matches, tiempo de sesión</li>
              <li><strong>Datos analíticos y de crash:</strong> Información técnica como dirección IP, tipo de dispositivo, sistema operativo, versión de la app, informes de fallos para diagnosticar problemas</li>
              <li><strong>Notificaciones push:</strong> Preferencias de notificaciones y tokens de dispositivo para enviar notificaciones push cuando sea necesario</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Cómo Usamos tu Información</h2>
            <p className="text-muted-foreground mb-2">Usamos tu información para:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Crear y gestionar tu cuenta</li>
              <li>Conectarte con otros usuarios compatibles según tus preferencias</li>
              <li>Personalizar tu experiencia y mostrarte contenido relevante</li>
              <li>Permitir la comunicación entre usuarios a través de chat y publicaciones</li>
              <li>Enviar notificaciones push sobre actividad relevante</li>
              <li>Mejorar nuestros servicios mediante análisis de uso</li>
              <li>Garantizar la seguridad, prevenir fraudes y hacer cumplir nuestras normas</li>
              <li>Cumplir con obligaciones legales y regulatorias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Compartir Información</h2>
            <p className="text-muted-foreground mb-2">
              Tu información puede ser compartida con:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li><strong>Otros usuarios:</strong> Tu perfil e información básica son visibles para otros usuarios según tu configuración de privacidad</li>
              <li><strong>Proveedores de servicios:</strong> Empresas que nos ayudan a operar la plataforma (alojamiento, analítica, push notifications, procesamiento de pagos)</li>
              <li><strong>Autoridades legales:</strong> Cuando sea requerido por ley o para proteger nuestros derechos legales</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              <strong>Nunca vendemos tu información personal a terceros.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Eliminación de Datos</h2>
            <p className="text-muted-foreground">
              Puedes eliminar tu cuenta y todos tus datos en cualquier momento desde la aplicación:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li><strong>En la app:</strong> Ajustes → Cuenta → Eliminar cuenta</li>
              <li><strong>Por email:</strong> Envía una solicitud a <a href="mailto:soporte@sparkd.app" className="text-primary hover:underline">soporte@sparkd.app</a> desde el correo asociado a tu cuenta</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Una vez eliminada tu cuenta, todos tus datos personales serán eliminados o anonimizados en un plazo máximo de 30 días, excepto cuando la ley requiera su retención.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Seguridad de los Datos</h2>
            <p className="text-muted-foreground">
              Implementamos medidas de seguridad técnicas y organizativas para proteger tu información, incluyendo:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Encriptación de datos en tránsito (HTTPS/TLS) y en reposo</li>
              <li>Controles de acceso estrictos a bases de datos</li>
              <li>Monitoreo continuo de seguridad</li>
              <li>Auditorías de seguridad regulares</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Tus Derechos</h2>
            <p className="text-muted-foreground mb-2">Tienes derecho a:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li><strong>Acceder:</strong> Solicitar una copia de tu información personal</li>
              <li><strong>Rectificar:</strong> Corregir información inexacta o incompleta</li>
              <li><strong>Eliminar:</strong> Solicitar la eliminación de tu cuenta y datos personales</li>
              <li><strong>Portabilidad:</strong> Recibir tus datos en un formato estructurado y de uso común</li>
              <li><strong>Oposición:</strong> Oponerte al procesamiento de tus datos para fines específicos</li>
              <li><strong>Restricción:</strong> Limitar el procesamiento de tu información en ciertas circunstancias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Cookies y Tecnologías Similares</h2>
            <p className="text-muted-foreground">
              Usamos cookies y tecnologías similares para mejorar tu experiencia, analizar el uso del servicio y personalizar contenido. Puedes controlar las cookies a través de la configuración de tu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Retención de Datos</h2>
            <p className="text-muted-foreground">
              Conservamos tu información mientras tu cuenta esté activa o según sea necesario para proporcionar servicios. Cuando elimines tu cuenta, eliminaremos o anonimizaremos tu información en un plazo máximo de 30 días, excepto cuando la ley requiera su retención.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Menores de Edad</h2>
            <p className="text-muted-foreground">
              Nuestro servicio está destinado exclusivamente a personas mayores de 18 años. No recopilamos intencionalmente información de menores de edad. Si descubrimos que hemos recopilado información de un menor, la eliminaremos inmediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Cambios en esta Política</h2>
            <p className="text-muted-foreground">
              Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos por email o mediante un aviso en la plataforma. Te recomendamos revisar esta política regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Contacto</h2>
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
              <strong className="text-primary">🔒 Tu privacidad es nuestra prioridad.</strong> Nos comprometemos a proteger tu información y a ser transparentes sobre cómo la usamos. Si tienes alguna preocupación, no dudes en contactarnos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
