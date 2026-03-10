"use client"

import Link from "next/link"
import { Zap, Heart, MessageCircle, Users, Shield, Sparkles, ArrowLeft, Code } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <div className="relative min-h-svh bg-black overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes lightningFall {
          0% {
            transform: translateY(-100vh) rotate(-15deg);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
        }
      `}} />
      {/* Background effects - Xenon style */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-40 blur-3xl animate-pulse"
           style={{ background: "radial-gradient(circle, #8B5CF6, transparent)" }} />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full opacity-40 blur-3xl animate-pulse"
           style={{ background: "radial-gradient(circle, #EC4899, transparent)", animationDelay: "1s" }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl animate-pulse"
           style={{ background: "radial-gradient(circle, #3B82F6, transparent)", animationDelay: "0.5s" }} />
      
      {/* Neon grid lines */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-1/4 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-secondary to-transparent" 
             style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-3/4 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" 
             style={{ animationDelay: '1s' }} />
        
        <div className="absolute left-1/4 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-secondary to-transparent animate-pulse" 
             style={{ animationDelay: '0.3s' }} />
        <div className="absolute left-1/2 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-primary to-transparent" 
             style={{ animationDelay: '0.8s' }} />
        <div className="absolute left-3/4 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-secondary to-transparent animate-pulse" 
             style={{ animationDelay: '1.2s' }} />
      </div>

      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 hover:scale-105 transition-transform">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
          
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="relative group mb-4" style={{ animation: 'lightningFall 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
              <div className="absolute inset-0 blur-2xl bg-primary opacity-75 group-hover:opacity-100 transition-opacity rounded-full animate-pulse" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-black border-2 border-primary shadow-[0_0_30px_rgba(139,92,246,0.6)]">
                <Zap className="h-10 w-10 text-primary drop-shadow-[0_0_15px_rgba(139,92,246,0.8)]" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent"
                style={{ backgroundSize: '200% auto', animation: 'gradient 3s linear infinite' }}>
              Sobre Sparkd
            </h1>
          </div>
          <p className="text-lg text-primary/80 font-medium text-center">
            Conecta, Comparte, Encuentra
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <div className="p-6 rounded-2xl bg-black/80 backdrop-blur-xl border-2 border-primary/30 shadow-[0_0_30px_rgba(139,92,246,0.3)] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <h2 className="text-2xl font-bold mb-4 text-white">Nuestra Misión</h2>
            <p className="text-gray-300 leading-relaxed">
              Sparkd es más que una app de citas, es una plataforma completa donde puedes conectar, 
              compartir y encontrar personas afines a ti. Nuestra misión es crear conexiones auténticas 
              y significativas en la era digital.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="p-6 rounded-2xl bg-black/60 backdrop-blur-xl border-2 border-primary/30 hover:border-primary/60 hover:scale-105 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all duration-300">
              <Heart className="h-8 w-8 text-primary mb-3 animate-pulse drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
              <h3 className="font-bold text-lg mb-2 text-white">Match Perfecto</h3>
              <p className="text-sm text-gray-400">
                Algoritmo inteligente de compatibilidad que te ayuda a encontrar personas afines.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-black/60 backdrop-blur-xl border-2 border-secondary/30 hover:border-secondary/60 hover:scale-105 hover:shadow-[0_0_40px_rgba(236,72,153,0.4)] transition-all duration-300">
              <MessageCircle className="h-8 w-8 text-secondary mb-3 animate-pulse drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]" style={{ animationDelay: "0.2s" }} />
              <h3 className="font-bold text-lg mb-2 text-white">Chat en Tiempo Real</h3>
              <p className="text-sm text-gray-400">
                Conversaciones instantáneas con mensajes, imágenes y archivos.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-black/60 backdrop-blur-xl border-2 border-primary/30 hover:border-primary/60 hover:scale-105 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all duration-300">
              <Users className="h-8 w-8 text-primary mb-3 animate-pulse drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]" style={{ animationDelay: "0.4s" }} />
              <h3 className="font-bold text-lg mb-2 text-white">Red Social</h3>
              <p className="text-sm text-gray-400">
                Comparte tu vida auténtica con publicaciones, historias y más.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-black/80 backdrop-blur-xl border-2 border-primary/30 shadow-[0_0_30px_rgba(139,92,246,0.3)] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <h2 className="text-2xl font-bold mb-4 text-white">Tecnología de Vanguardia</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Con tecnología de última generación y un algoritmo inteligente de compatibilidad, 
              te ayudamos a encontrar a las personas que realmente importan. Comparte tu vida, 
              tus intereses y descubre una comunidad vibrante esperándote.
            </p>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all">
              <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
              <div>
                <h3 className="font-semibold mb-1 text-white">Seguridad y Privacidad</h3>
                <p className="text-sm text-gray-400">
                  Tu seguridad es nuestra prioridad. Implementamos las mejores prácticas de seguridad 
                  y verificación para garantizar una experiencia segura y confiable.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30 shadow-[0_0_30px_rgba(139,92,246,0.2)] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
              <Sparkles className="h-6 w-6 text-primary drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
              ¿Listo para comenzar?
            </h2>
            <p className="text-gray-300 mb-4">
              Únete a miles de personas que ya están conectando en Sparkd.
            </p>
            <div className="flex gap-3">
              <Link href="/register">
                <Button className="bg-gradient-to-r from-primary to-secondary text-black hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all">
                  Crear cuenta
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="border-2 border-primary/50 text-white hover:bg-primary/20 hover:border-primary hover:scale-105 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all">
                  Iniciar sesión
                </Button>
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-black/80 backdrop-blur-xl border-2 border-primary/30 shadow-[0_0_30px_rgba(139,92,246,0.3)] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
              <Code className="h-6 w-6 text-primary drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
              Fundadores
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="group p-6 rounded-xl bg-black/60 backdrop-blur-xl border-2 border-primary/30 hover:border-primary/60 hover:scale-105 hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all duration-300">
                <div className="flex items-center gap-4 mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/50 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                    <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-primary shadow-[0_0_20px_rgba(139,92,246,0.6)]">
                      <img src="/alex-profile.jpeg" alt="Alex M. Gomez Salazar" className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-white">Alex M. Gomez Salazar</p>
                    <p className="text-sm text-primary font-medium drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]">Fundador & CEO</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Visionario en tecnología y experiencia de usuario, liderando la innovación en Sparkd.
                </p>
              </div>

              <div className="group p-6 rounded-xl bg-black/60 backdrop-blur-xl border-2 border-secondary/30 hover:border-secondary/60 hover:scale-105 hover:shadow-[0_0_40px_rgba(236,72,153,0.5)] transition-all duration-300">
                <div className="flex items-center gap-4 mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-secondary/50 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                    <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-secondary shadow-[0_0_20px_rgba(236,72,153,0.6)]">
                      <img src="/johan-profile.png" alt="Johan M. Jones" className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-white">Johan M. Jones</p>
                    <p className="text-sm text-secondary font-medium drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]">Fundador & CEO</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Experto en arquitectura de software y sistemas escalables, construyendo el futuro de las conexiones.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
