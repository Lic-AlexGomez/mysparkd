"use client"

import { usePathname } from "next/navigation"
import { TopNavbar } from "./top-navbar"
import { BottomNav } from "./bottom-nav"
import { SidebarNav } from "./sidebar-nav"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/manager')

  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <div className="min-h-svh bg-background">
      <SidebarNav />
      <TopNavbar />
      <div className="lg:ml-20 xl:ml-72 pt-16">
        <main className="min-h-svh pb-20 lg:pb-6 [&:has(.chat-room)]:pb-0 [&:has(.chat-room)]:min-h-0 [&:has(.chat-room)]:overflow-hidden">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
