"use client"

import { TopNavbar } from "./top-navbar"
import { BottomNav } from "./bottom-nav"
import { SidebarNav } from "./sidebar-nav"
import { MobileQuickMenu } from "./mobile-quick-menu"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <SidebarNav />
      <TopNavbar />
      <div className="lg:ml-20 xl:ml-72">
        <main className="min-h-svh pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
       {/* <MobileQuickMenu /> */}
    </div>
  )
}
