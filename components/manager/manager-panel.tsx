"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ManagerUsers } from "./sections/manager-users"
import { ManagerContent } from "./sections/manager-content"
import { ManagerReports } from "./sections/manager-reports"
import { ManagerMessages } from "./sections/manager-messages"
import { ManagerActivity } from "./sections/manager-activity"
import { Users, FileText, Flag, MessageCircle, Activity, Zap, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useManagerReportsPendingCount } from "@/hooks/use-manager-reports-pending-count"

const SECTIONS = [
  { id: "activity",  label: "Actividad",  icon: Activity,      showPendingBadge: false },
  { id: "users",     label: "Usuarios",   icon: Users,         showPendingBadge: false },
  { id: "content",   label: "Contenido",  icon: FileText,      showPendingBadge: false },
  { id: "reports",   label: "Reportes",   icon: Flag,          showPendingBadge: true },
  { id: "messages",  label: "Mensajes",   icon: MessageCircle, showPendingBadge: false },
] as const

export function ManagerPanel() {
  const { user } = useAuth()
  const [active, setActive] = useState("activity")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { count: pendingReportsCount, refresh: refreshPendingReports } = useManagerReportsPendingCount()

  return (
    <div className="flex min-h-screen bg-background">

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-56 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-secondary to-accent">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground">Sparkd</p>
            <p className="text-[10px] text-muted-foreground leading-none">Manager Panel</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => { setActive(s.id); setSidebarOpen(false) }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active === s.id
                  ? "bg-secondary/10 text-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <s.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{s.label}</span>
              {s.showPendingBadge && pendingReportsCount > 0 && (
                <Badge className="text-[10px] border-0 bg-rose-500 text-white h-4 min-w-4 px-1 tabular-nums">
                  {pendingReportsCount > 99 ? "99+" : pendingReportsCount}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center shrink-0">
              <span className="text-[9px] font-black text-white">
                {user?.nombres?.[0]?.toUpperCase() ?? "M"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user?.nombres}</p>
              <p className="text-[10px] text-muted-foreground">Manager</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur flex items-center gap-3 px-4 shrink-0">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-foreground">
              {SECTIONS.find(s => s.id === active)?.label}
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Sparkd · Panel de Manager
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge className="text-[10px] border-0 bg-secondary/15 text-secondary">Manager</Badge>
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
              <span className="text-[10px] font-black text-white">
                {user?.nombres?.[0]?.toUpperCase() ?? "M"}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {active === "activity" && <ManagerActivity />}
          {active === "users"    && <ManagerUsers />}
          {active === "content"  && <ManagerContent />}
          {active === "reports"  && <ManagerReports onReportsMutated={() => void refreshPendingReports()} />}
          {active === "messages" && <ManagerMessages />}
        </main>
      </div>
    </div>
  )
}
