"use client"

import { useState } from "react"
import { AdminOverview } from "./sections/admin-overview"
import { AdminUsers } from "./sections/admin-users"
import { AdminContent } from "./sections/admin-content"
import { AdminRevenue } from "./sections/admin-revenue"
import { AdminEngagement } from "./sections/admin-engagement"
import { AdminModeration } from "./sections/admin-moderation"
import { AdminSystem } from "./sections/admin-system"
import {
  LayoutDashboard, Users, FileText, DollarSign,
  Activity, Shield, Server, Zap, Menu, X
} from "lucide-react"
import { cn } from "@/lib/utils"

const SECTIONS = [
  { id: "overview",    label: "Overview",     icon: LayoutDashboard },
  { id: "users",       label: "Usuarios",     icon: Users },
  { id: "content",     label: "Contenido",    icon: FileText },
  { id: "revenue",     label: "Ingresos",     icon: DollarSign },
  { id: "engagement",  label: "Engagement",   icon: Activity },
  { id: "moderation",  label: "Moderación",   icon: Shield },
  { id: "system",      label: "Sistema",      icon: Server },
]

export function Dashboard() {
  const [active, setActive] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-56 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
            <Zap className="h-4 w-4 text-black" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground">Sparkd</p>
            <p className="text-[10px] text-muted-foreground leading-none">Admin Panel</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => { setActive(s.id); setSidebarOpen(false) }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active === s.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <s.icon className="h-4 w-4 shrink-0" />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Sistema operativo</span>
          </div>
        </div>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur flex items-center gap-3 px-4 shrink-0">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-foreground">
              {SECTIONS.find(s => s.id === active)?.label}
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Sparkd · Panel de Administración
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </span>
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-[10px] font-black text-black">A</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {active === "overview"   && <AdminOverview />}
          {active === "users"      && <AdminUsers />}
          {active === "content"    && <AdminContent />}
          {active === "revenue"    && <AdminRevenue />}
          {active === "engagement" && <AdminEngagement />}
          {active === "moderation" && <AdminModeration />}
          {active === "system"     && <AdminSystem />}
        </main>
      </div>
    </div>
  )
}
