"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect } from "react"
import { Zap, Heart, MessageCircle, Users, Sparkles, ArrowRight, Shield, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SocialShare } from "@/components/ui/social-share"
import { SocialFooter } from "@/components/ui/social-footer"

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/feed")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Zap className="h-10 w-10 text-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">Cargando Sparkd...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-black">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-black to-secondary/20" />
        
        {/* Neon lines effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-secondary to-transparent opacity-60" 
               style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-3/4 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" 
               style={{ animationDelay: '1s' }} />
          
          <div className="absolute left-1/4 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-secondary to-transparent animate-pulse" 
               style={{ animationDelay: '0.3s' }} />
          <div className="absolute left-1/2 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-primary to-transparent opacity-60" 
               style={{ animationDelay: '0.8s' }} />
          <div className="absolute left-3/4 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-secondary to-transparent animate-pulse" 
               style={{ animationDelay: '1.2s' }} />
        </div>

        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/30 rounded-full blur-[120px] animate-pulse" 
             style={{ animationDelay: '1s' }} />
        
        <div className="relative z-10 w-full max-w-4xl px-6 py-6 md:py-12 text-center">
          {/* Logo with neon effect */}
          <div className="mb-6 md:mb-8 flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 blur-2xl bg-primary opacity-75 group-hover:opacity-100 transition-opacity rounded-full animate-pulse" />
              <div className="relative bg-black p-4 md:p-6 rounded-full border-2 border-primary shadow-[0_0_30px_rgba(var(--primary),0.5)]">
                <Zap className="h-12 w-12 md:h-16 md:w-16 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-3 md:mb-4 tracking-tight">
            <span className="inline-block bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse"
                  style={{ backgroundSize: '200% auto', animation: 'gradient 3s linear infinite' }}>
              SPARKD
            </span>
            {/* SEO H1 oculto */}
            <span className="sr-only">- Red Social y App de Citas para Conocer Gente Nueva</span>
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-3 md:mb-4 font-light tracking-wide">
            Donde las conexiones cobran vida
          </p>
          
          <p className="text-primary/80 mb-8 md:mb-12 text-xs md:text-sm uppercase tracking-widest font-semibold">
            ⚡ La nueva era del dating ⚡
          </p>

          {/* Features grid */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12 max-w-3xl mx-auto">
            <div className="group relative p-4 md:p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 hover:border-primary/50 transition-all hover:scale-105 backdrop-blur-sm">
              <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="mb-3 md:mb-4 inline-block p-2 md:p-3 rounded-full bg-primary/20 border border-primary/30">
                  <Heart className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <h2 className="font-bold text-base md:text-lg mb-1 md:mb-2 text-white">Match Perfecto</h2>
                <p className="text-xs md:text-sm text-gray-400">Algoritmo inteligente de compatibilidad</p>
              </div>
            </div>
            
            <div className="group relative p-4 md:p-6 rounded-2xl bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20 hover:border-secondary/50 transition-all hover:scale-105 backdrop-blur-sm">
              <div className="absolute inset-0 bg-secondary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="mb-3 md:mb-4 inline-block p-2 md:p-3 rounded-full bg-secondary/20 border border-secondary/30">
                  <MessageCircle className="h-6 w-6 md:h-8 md:w-8 text-secondary" />
                </div>
                <h2 className="font-bold text-base md:text-lg mb-1 md:mb-2 text-white">Chat Instantáneo</h2>
                <p className="text-xs md:text-sm text-gray-400">Conversaciones en tiempo real</p>
              </div>
            </div>
            
            <div className="group relative p-4 md:p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 hover:border-primary/50 transition-all hover:scale-105 backdrop-blur-sm">
              <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="mb-3 md:mb-4 inline-block p-2 md:p-3 rounded-full bg-primary/20 border border-primary/30">
                  <Users className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <h2 className="font-bold text-base md:text-lg mb-1 md:mb-2 text-white">Red Social</h2>
                <p className="text-xs md:text-sm text-gray-400">Comparte tu vida auténtica</p>
              </div>
            </div>
          </div>

          {/* SEO Content - Oculto visualmente pero visible para buscadores */}
          <div className="sr-only">
            <h2>La Mejor App de Citas y Red Social</h2>
            <p>
              Sparkd es la plataforma definitiva para conocer gente nueva y encontrar conexiones auténticas. Nuestra app combina lo mejor de las redes sociales con un sistema avanzado de matching que te ayuda a encontrar personas compatibles con tus intereses y valores.
            </p>
            <p>
              Con Sparkd puedes hacer match con personas cercanas, chatear en tiempo real, compartir momentos de tu vida y construir relaciones significativas. Ya sea que busques amor, amistad o simplemente expandir tu círculo social, Sparkd es el lugar perfecto para ti.
            </p>
            
            <h3>¿Por Qué Elegir Sparkd?</h3>
            <ul>
              <li>Algoritmo inteligente que encuentra personas compatibles contigo</li>
              <li>Chat en tiempo real para conversaciones fluidas y naturales</li>
              <li>Comparte fotos, videos y momentos con tu comunidad</li>
              <li>Privacidad y seguridad garantizadas en cada interacción</li>
              <li>Encuentra personas cerca de ti con intereses similares</li>
            </ul>
            
            <h3>Cómo Funciona Sparkd</h3>
            <p>
              Crear tu perfil en Sparkd es rápido y sencillo. Solo necesitas registrarte, completar tu perfil con tus intereses y preferencias, y comenzar a explorar. Nuestro sistema te mostrará perfiles de personas compatibles que puedes dar like o pasar. Cuando hay match mutuo, ¡pueden comenzar a chatear!
            </p>
            <p>
              Además del sistema de matching, Sparkd funciona como una red social donde puedes publicar contenido, reaccionar a posts de otros usuarios, comentar y construir una comunidad auténtica. Es la combinación perfecta entre dating app y red social.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center max-w-md mx-auto">
            <Button 
              size="lg" 
              className="w-full sm:w-auto px-6 md:px-8 py-4 md:py-6 text-base md:text-lg font-bold bg-gradient-to-r from-primary to-secondary text-black hover:scale-105 transition-transform shadow-[0_0_30px_rgba(var(--primary),0.5)] hover:shadow-[0_0_50px_rgba(var(--primary),0.8)] border-2 border-primary/50"
              onClick={() => router.push("/register")}
            >
              <Sparkles className="mr-2 h-5 w-5 md:h-6 md:w-6" />
              Comenzar Gratis
              <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6" />
            </Button>
            
            <Button 
              size="lg" 
              className="w-full sm:w-auto px-6 md:px-8 py-4 md:py-6 text-base md:text-lg font-semibold bg-transparent border-2 border-primary/50 text-primary hover:bg-primary/10 hover:scale-105 transition-all backdrop-blur-sm"
              onClick={() => router.push("/login")}
            >
              Iniciar Sesión
            </Button>
          </div>
          
          {/* Social Share */}
{/*           <div className="mt-6 mb-3 md:mt-8 flex justify-center">
            <SocialShare 
              url="https://www.mysparkd.com"
              title="Sparkd - Red Social y Dating App"
              description="Conoce gente nueva, haz match y chatea. Únete a Sparkd!"
              hashtags={["Sparkd", "Dating", "RedSocial", "Match"]}
              size="lg"
              variant="outline"
              showLabel
            />
          </div> */}
          
          <div className="mt-6 md:mt-8 ">
            <div className="flex flex-wrap justify-center">
              <Link 
                href="/about" 
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors mb-2"
              >
                <Info className="h-4 w-4" />
                Acerca de Sparkd
              </Link>
        {/*       <Link 
                href="/terms" 
                className="text-sm text-gray-400 hover:text-primary transition-colors"
              >
                Términos de Servicio
              </Link>
              <Link 
                href="/privacy" 
                className="text-sm text-gray-400 hover:text-primary transition-colors"
              >
                Privacidad
              </Link> */}
            </div>
          </div>
          
          <p className="mt-1 md:mt-6 text-xs text-gray-500 uppercase tracking-wider">
            Únete a miles de personas conectando ahora
          </p>
          
          <div className="mt-3 md:mt-4 text-xs text-gray-600 max-w-md mx-auto px-4">
            <p className="mb-2">
              Al registrarte, confirmas que tienes al menos 18 años y aceptas nuestros{" "}
              <Link href="/terms" className="text-primary hover:underline">Términos de Servicio</Link> y{" "}
              <Link href="/privacy" className="text-primary hover:underline">Política de Privacidad</Link>.
            </p>
            <p className="text-gray-700">
              🔒 Tu privacidad es nuestra prioridad. Tus datos están protegidos y nunca serán compartidos sin tu consentimiento.
            </p>
          </div>
          
          {/* Social Media Links */}
          <div className="mt-8 md:mt-12">
            <p className="text-sm text-gray-500 mb-4 text-center">Síguenos en redes sociales</p>
            <SocialFooter />
          </div>
        </div>

        <style jsx global>{`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </div>
    )
  }

  return null
}
