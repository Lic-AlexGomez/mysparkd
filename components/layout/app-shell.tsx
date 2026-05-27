"use client"

import { usePathname } from "next/navigation"
import { TopNavbar } from "./top-navbar"
import { WebBottomNav } from "./web-bottom-nav"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/manager')
  const isChatRoomRoute = pathname.startsWith('/chat/')

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
      {!isChatRoomRoute && <WebBottomNav />}
    </div>
  )
}
