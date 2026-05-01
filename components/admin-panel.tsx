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
import { useManagerReportsPendingCount } from "@/hooks/use-manager-reports-pending-count"
import {
  DASHBOARD_SECTION_INTEGRATION,
  type DashboardSectionIntegration,
} from "@/lib/dashboard-section-integration"
import { IntegrationBanner } from "@/components/dashboard/integration-banner"
import { AdminApiHealthStrip } from "@/components/dashboard/admin-api-health-strip"

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
  { id: "m-reports",    label: "Reportes",         icon: Flag,            group: "manager" },
  { id: "m-messages",   label: "Mensajes",         icon: MessageCircle,   group: "manager" },
]

interface AdminPanelProps {
  role: Role
}

export function AdminPanel({ role }: AdminPanelProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { count: pendingReportsCount, refresh: refreshPendingReports } = useManagerReportsPendingCount()
  const sections = role === "admin"
    ? ALL_SECTIONS
    : ALL_SECTIONS.filter(s => s.group === "manager")

  const [active, setActive] = useState(sections[0].id)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const adminSections = sections.filter(s => s.group === "admin")
  const managerSections = sections.filter(s => s.group === "manager")

  const activeSection = sections.find(s => s.id === active)
  const activeIntegration = activeSection
    ? DASHBOARD_SECTION_INTEGRATION[activeSection.id]
    : undefined
  const isAdmin = role === "admin"

  return (
    <div className="flex min-h-screen bg-background">

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[15rem] flex-col border-r border-border/80 bg-card/95 backdrop-blur-sm transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border/80 px-4">
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
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {/* Grupo Admin */}
          {isAdmin && adminSections.length > 0 && (
            <>
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Admin
              </p>
              {adminSections.map((s) => (
                <NavButton
                  key={s.id}
                  section={s}
                  active={active}
                  isAdmin={isAdmin}
                  integration={DASHBOARD_SECTION_INTEGRATION[s.id]}
                  onSelect={(id) => {
                    setActive(id)
                    setSidebarOpen(false)
                  }}
                />
              ))}
            </>
          )}

          {/* Grupo Manager */}
          {managerSections.length > 0 && (
            <>
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Manager
              </p>
              {managerSections.map((s) => (
                <NavButton
                  key={s.id}
                  section={s}
                  active={active}
                  isAdmin={isAdmin}
                  integration={DASHBOARD_SECTION_INTEGRATION[s.id]}
                  pendingReportsOverride={s.id === "m-reports" ? pendingReportsCount : undefined}
                  onSelect={(id) => {
                    setActive(id)
                    setSidebarOpen(false)
                  }}
                />
              ))}
            </>
          )}
        </nav>
        <div className="shrink-0 border-t border-border/60 p-3 text-[10px] leading-relaxed text-muted-foreground">
          <p className="mb-1.5 font-semibold uppercase tracking-wide text-foreground/70">
            Conexión API
          </p>
          <div className="space-y-1">
            <p>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> API — datos
              reales
            </p>
            <p>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" /> Parcial — API
              real, datos poco duraderos en servidor
            </p>
            <p>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground" /> Demo —
              maqueta
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col bg-gradient-to-b from-background to-muted/10">
        <header className="z-10 shrink-0 border-b border-border/80 bg-card/90 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-2.5">
            <div className="flex min-w-0 items-start gap-3 sm:items-center">
              <button
                className="mt-0.5 shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 lg:hidden"
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                    {activeSection?.label}
                  </h1>
                  {activeSection && DASHBOARD_SECTION_INTEGRATION[activeSection.id] && (
                    <Badge
                      className={cn(
                        "border-0 text-[10px] font-semibold",
                        DASHBOARD_SECTION_INTEGRATION[activeSection.id].source === "live" &&
                          "bg-emerald-500/20 text-emerald-300",
                        DASHBOARD_SECTION_INTEGRATION[activeSection.id].source === "partial" &&
                          "bg-amber-500/20 text-amber-200",
                        DASHBOARD_SECTION_INTEGRATION[activeSection.id].source === "demo" &&
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {DASHBOARD_SECTION_INTEGRATION[activeSection.id].shortLabel}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground sm:line-clamp-1 sm:max-w-2xl">
                  {activeSection && DASHBOARD_SECTION_INTEGRATION[activeSection.id]?.detail
                    ? DASHBOARD_SECTION_INTEGRATION[activeSection.id].detail
                    : `Sparkd · ${isAdmin ? "Panel de Administración" : "Panel de Manager"}`}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 pl-8 sm:pl-0">
              <Badge
                className={cn(
                  "hidden border-0 text-[10px] sm:inline-flex",
                  isAdmin ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"
                )}
              >
                {isAdmin ? "Admin" : "Manager"}
              </Badge>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {new Date().toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
              <button
                type="button"
                onClick={() => router.push("/feed")}
                className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground sm:px-3"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Volver al app</span>
                <span className="sm:hidden">App</span>
              </button>
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br",
                  isAdmin ? "from-primary to-secondary" : "from-secondary to-accent"
                )}
              >
                {user?.profilePictureUrl ? (
                  <img
                    src={user.profilePictureUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    className={cn("text-[10px] font-black", isAdmin ? "text-black" : "text-white")}
                  >
                    {user?.nombres?.[0]?.toUpperCase() ?? (isAdmin ? "A" : "M")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
          <div className="mx-auto w-full max-w-6xl space-y-4">
            {isAdmin && <AdminApiHealthStrip />}
            {activeIntegration && (
              <IntegrationBanner
                source={activeIntegration.source}
                detail={activeIntegration.detail}
              />
            )}
            <div className="space-y-0">
              {active === "overview" && <AdminOverview />}
              {active === "users" && <AdminUsers />}
              {active === "content" && <AdminContent />}
              {active === "revenue" && <AdminRevenue />}
              {active === "engagement" && <AdminEngagement />}
              {active === "moderation" && <AdminModeration />}
              {active === "geo" && <AdminGeo />}
              {active === "notifications" && <AdminNotifications />}
              {active === "abtesting" && <AdminABTesting />}
              {active === "benchmarks" && <AdminBenchmarks />}
              {active === "auditlog" && <AdminAuditLog />}
              {active === "system" && <AdminSystem />}
              {active === "m-activity" && <ManagerActivity />}
              {active === "m-users" && <ManagerUsers />}
              {active === "m-content" && <ManagerContent />}
              {active === "m-reports" && (
                <ManagerReports onReportsMutated={() => void refreshPendingReports()} />
              )}
              {active === "m-messages" && <ManagerMessages />}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function NavButton({
  section,
  active,
  isAdmin,
  onSelect,
  pendingReportsOverride,
  integration,
}: {
  section: Section
  active: string
  isAdmin: boolean
  onSelect: (id: string) => void
  /** Reportes row: live PENDING count from API (0 = hide badge). */
  pendingReportsOverride?: number
  integration?: DashboardSectionIntegration
}) {
  const isActive = active === section.id
  const badge =
    pendingReportsOverride !== undefined
      ? pendingReportsOverride > 0
        ? pendingReportsOverride
        : null
      : section.badge != null && section.badge > 0
        ? section.badge
        : null
  const statusDot =
    integration?.source === "live"
      ? "bg-emerald-400"
      : integration?.source === "partial"
        ? "bg-amber-400"
        : "bg-muted-foreground/60"
  return (
    <button
      type="button"
      onClick={() => onSelect(section.id)}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-all",
        isActive
          ? isAdmin && section.group === "admin"
            ? "bg-primary/12 text-primary shadow-sm"
            : "bg-secondary/12 text-secondary shadow-sm"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <span
        className={cn("h-2 w-2 shrink-0 rounded-full", statusDot, !integration && "bg-transparent")}
        title={integration?.shortLabel}
        aria-hidden
      />
      <section.icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">{section.label}</span>
      {badge != null && (
        <Badge className="h-4 min-w-4 border-0 bg-rose-500 px-1 text-[10px] tabular-nums text-white">
          {badge > 99 ? "99+" : badge}
        </Badge>
      )}
    </button>
  )
}
