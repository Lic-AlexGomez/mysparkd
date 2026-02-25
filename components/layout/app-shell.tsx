"use client"

import { TopNavbar } from "./top-navbar"
import { BottomNav } from "./bottom-nav"
import { SidebarNav } from "./sidebar-nav"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <SidebarNav />
      <TopNavbar />
      <div className="lg:pl-64">
        <main className="min-h-[calc(100svh-4rem)] pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
