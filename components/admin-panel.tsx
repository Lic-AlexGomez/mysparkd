"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { AdminOverview } from "@/components/dashboard/sections/admin-overview"
import { AdminUsers } from "@/components/dashboard/sections/admin-users"
import { AdminContent } from "@/components/dashboard/sections/admin-content"
import { AdminRevenue } from "@/components/dashboard/sections/admin-revenue"
import { AdminEngagement } from "@/components/dashboard/sections/admin-engagement"
import { AdminModeration } from "@/components/dashboard/sections/admin-moderation"
import { AdminSystem } from "@/components/dashboard/sections/admin-system"
import { AdminGeo } from "@/components/dashboard/sections/admin-geo"
import { AdminNotifications } from "@/components/dashboard/sections/admin-notifications"
import { AdminABTesting } from "@/components/dashboard/sections/admin-abtesting"
import { AdminBenchmarks } from "@/components/dashboard/sections/admin-benchmarks"
import { AdminAuditLog } from "@/components/dashboard/sections/admin-auditlog"
import { ManagerUsers } from "@/components/manager/sections/manager-users"
import { ManagerContent } from "@/components/manager/sections/manager-content"
import { ManagerReports } from "@/components/manager/sections/manager-reports"
import { ManagerMessages } from "@/components/manager/sections/manager-messages"
import { ManagerActivity } from "@/components/manager/sections/manager-activity"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard, Users, FileText, DollarSign, Activity,
  Shield, Server, MapPin, Bell, FlaskConical, BarChart3,
  ScrollText, Flag, MessageCircle, Zap, Menu, X, ArrowLeft,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Role = "admin" | "manager"

interface Section {
  id: string
  label: string
  icon: React.ElementType
  badge?: number | null
  group: "admin" | "manager"
}

const ALL_SECTIONS: Section[] = [
  // Admin
  { id: "overview",      label: "Overview",       icon: LayoutDashboard, group: "admin" },
  { id: "users",         label: "Usuarios",        icon: Users,           group: "admin" },
  { id: "content",       label: "Contenido",       icon: FileText,        group: "admin" },
  { id: "revenue",       label: "Ingresos",        icon: DollarSign,      group: "admin" },
  { id: "engagement",    label: "Engagement",      icon: Activity,        group: "admin" },
  { id: "moderation",    label: "Moderación",      icon: Shield,          group: "admin" },
  { id: "geo",           label: "Geografía",       icon: MapPin,          group: "admin" },
  { id: "notifications", label: "Notificaciones",  icon: Bell,            group: "admin" },
  { id: "abtesting",     label: "A/B Testing",     icon: FlaskConical,    group: "admin" },
  { id: "benchmarks",    label: "Benchmarks",      icon: BarChart3,       group: "admin" },
  { id: "auditlog",      label: "Auditoría",       icon: ScrollText,      group: "admin" },
  { id: "system",        label: "Sistema",         icon: Server,          group: "admin" },
  // Manager
  { id: "m-activity",   label: "Actividad",        icon: Activity,        group: "manager" },
  { id: "m-users",      label: "Usuarios",         icon: Users,           group: "manager" },
  { id: "m-content",    label: "Contenido",        icon: FileText,        group: "manager" },
  { id: "m-reports",    label: "Reportes",         icon: Flag,            group: "manager", badge: 7 },
  { id: "m-messages",   label: "Mensajes",         icon: MessageCircle,   group: "manager" },
]

interface AdminPanelProps {
  role: Role
}

export function AdminPanel({ role }: AdminPanelProps) {
  const { user } = useAuth()
  const router = useRouter()
  const sections = role === "admin"
    ? ALL_SECTIONS
    : ALL_SECTIONS.filter(s => s.group === "manager")

  const [active, setActive] = useState(sections[0].id)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const adminSections = sections.filter(s => s.group === "admin")
  const managerSections = sections.filter(s => s.group === "manager")

  const activeSection = sections.find(s => s.id === active)
  const isAdmin = role === "admin"

  return (
    <div className="flex min-h-screen bg-background">

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-56 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border shrink-0">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br",
            isAdmin ? "from-primary to-secondary" : "from-secondary to-accent"
          )}>
            <Zap className={cn("h-4 w-4", isAdmin ? "text-black" : "text-white")} />
          </div>
          <div>
            <p className="text-sm font-black text-foreground">Sparkd</p>
            <p className="text-[10px] text-muted-foreground leading-none">
              {isAdmin ? "Admin Panel" : "Manager Panel"}
            </p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {/* Grupo Admin */}
          {isAdmin && adminSections.length > 0 && (
            <>
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Admin
              </p>
              {adminSections.map(s => (
                <NavButton key={s.id} section={s} active={active} isAdmin={isAdmin} onSelect={(id) => { setActive(id); setSidebarOpen(false) }} />
              ))}
            </>
          )}

          {/* Grupo Manager */}
          {managerSections.length > 0 && (
            <>
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Manager
              </p>
              {managerSections.map(s => (
                <NavButton key={s.id} section={s} active={active} isAdmin={isAdmin} onSelect={(id) => { setActive(id); setSidebarOpen(false) }} />
              ))}
            </>
          )}
        </nav>


      </aside>

      {/* Overlay móvil */}
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
            <h1 className="text-sm font-bold text-foreground">{activeSection?.label}</h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Sparkd · {isAdmin ? "Panel de Administración" : "Panel de Manager"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge className={cn(
              "text-[10px] border-0 hidden sm:flex",
              isAdmin ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"
            )}>
              {isAdmin ? "Admin" : "Manager"}
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </span>
            <button
              onClick={() => router.push('/feed')}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al app
            </button>
            <div className={cn(
              "h-7 w-7 rounded-full bg-gradient-to-br flex items-center justify-center overflow-hidden",
              isAdmin ? "from-primary to-secondary" : "from-secondary to-accent"
            )}>
              {user?.profilePictureUrl
                ? <img src={user.profilePictureUrl} className="h-full w-full object-cover" />
                : <span className={cn("text-[10px] font-black", isAdmin ? "text-black" : "text-white")}>
                    {user?.nombres?.[0]?.toUpperCase() ?? (isAdmin ? "A" : "M")}
                  </span>
              }
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Admin sections */}
          {active === "overview"      && <AdminOverview />}
          {active === "users"         && <AdminUsers />}
          {active === "content"       && <AdminContent />}
          {active === "revenue"       && <AdminRevenue />}
          {active === "engagement"    && <AdminEngagement />}
          {active === "moderation"    && <AdminModeration />}
          {active === "geo"           && <AdminGeo />}
          {active === "notifications" && <AdminNotifications />}
          {active === "abtesting"     && <AdminABTesting />}
          {active === "benchmarks"    && <AdminBenchmarks />}
          {active === "auditlog"      && <AdminAuditLog />}
          {active === "system"        && <AdminSystem />}
          {/* Manager sections */}
          {active === "m-activity"    && <ManagerActivity />}
          {active === "m-users"       && <ManagerUsers />}
          {active === "m-content"     && <ManagerContent />}
          {active === "m-reports"     && <ManagerReports />}
          {active === "m-messages"    && <ManagerMessages />}
        </main>
      </div>
    </div>
  )
}

function NavButton({ section, active, isAdmin, onSelect }: {
  section: Section
  active: string
  isAdmin: boolean
  onSelect: (id: string) => void
}) {
  const isActive = active === section.id
  return (
    <button
      onClick={() => onSelect(section.id)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
        isActive
          ? isAdmin && section.group === "admin"
            ? "bg-primary/10 text-primary"
            : "bg-secondary/10 text-secondary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <section.icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">{section.label}</span>
      {section.badge && (
        <Badge className="text-[10px] border-0 bg-rose-500 text-white h-4 min-w-4 px-1">
          {section.badge}
        </Badge>
      )}
    </button>
  )
}
