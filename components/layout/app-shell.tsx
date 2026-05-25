"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { TopNavbar } from "./top-navbar"
import { BottomNav } from "./bottom-nav"
import { SparkdDock } from "./sparkd-dock"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/manager')
  const isChatRoomRoute = pathname.startsWith('/chat/') || /^\/events\/[^/]+\/chat(\/|$)/.test(pathname)

  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <div className="min-h-svh bg-background">
      {!isChatRoomRoute && <TopNavbar />}
      <div className={isChatRoomRoute ? "pt-0" : "pt-16"}>
        <main className="min-h-svh pb-32 lg:pb-32 [&:has(.chat-room)]:pb-0 [&:has(.chat-room)]:min-h-0 [&:has(.chat-room)]:overflow-hidden">
          {children}
        </main>
      </div>
      {!isChatRoomRoute && <BottomNav />}
      {!isChatRoomRoute && <SparkdDock />}
      {!isChatRoomRoute && (
        <footer className="border-t border-border/40 bg-background py-6">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary transition-colors">Política de Privacidad</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Términos de Servicio</Link>
              <Link href="/community-guidelines" className="hover:text-primary transition-colors">Normas de la Comunidad</Link>
              <Link href="/delete-account" className="hover:text-primary transition-colors">Eliminar Cuenta</Link>
              <Link href="/about" className="hover:text-primary transition-colors">Acerca de</Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
