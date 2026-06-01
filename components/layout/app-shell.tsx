"use client"

import { usePathname } from "next/navigation"
import { TopNavbar } from "./top-navbar"
import { WebBottomNav } from "./web-bottom-nav"
import { isStoriesRoute } from "@/lib/is-stories-route"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/manager')
  const isChatRoomRoute = pathname.startsWith('/chat/')
  const hideChrome = isChatRoomRoute || isStoriesRoute(pathname)

  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <div className="min-h-svh bg-background">
      {!hideChrome && <TopNavbar />}
      <div className={hideChrome ? "pt-0" : "pt-16"}>
        <main
          className={
            hideChrome
              ? "min-h-svh [&:has(.chat-room)]:pb-0 [&:has(.chat-room)]:min-h-0 [&:has(.chat-room)]:overflow-hidden"
              : "min-h-svh pb-32 lg:pb-32 [&:has(.chat-room)]:pb-0 [&:has(.chat-room)]:min-h-0 [&:has(.chat-room)]:overflow-hidden"
          }
        >
          {children}
        </main>
      </div>
      {!hideChrome && <WebBottomNav />}
    </div>
  )
}
