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
import { DASHBOARD_ADMIN_NAV_GROUPS } from "@/lib/dashboard-admin-nav-groups"

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
          "fixed inset-y-0 left-0 z-50 flex w-[17.5rem] flex-col border-r border-border/70 bg-sidebar/90 shadow-[8px_0_32px_-12px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_45%_at_50%_-10%,var(--primary)_0%,transparent_55%)] opacity-[0.07]"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/80 to-transparent" aria-hidden />

        {/* Logo */}
        <div className="relative flex h-[4.25rem] shrink-0 items-center gap-3 border-b border-sidebar-border/80 px-4">
          <div
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg ring-2 ring-background/80",
              isAdmin ? "from-primary to-secondary shadow-primary/25" : "from-secondary to-accent shadow-secondary/25"
            )}
          >
            <Zap className={cn("h-[1.15rem] w-[1.15rem]", isAdmin ? "text-black" : "text-white")} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black tracking-tight text-foreground">Sparkd</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {isAdmin ? "Admin" : "Manager"}
            </p>
          </div>
          <button type="button" className="relative shrink-0 rounded-lg p-1.5 hover:bg-muted/50 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {/* Admin: subgrupos */}
          {isAdmin &&
            DASHBOARD_ADMIN_NAV_GROUPS.map((group, gi) => (
              <div key={group.label} className="space-y-0.5 pb-2">
                <p
                  className={cn(
                    "px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/90",
                    gi === 0 ? "pt-1" : "pt-3",
                  )}
                >
                  {group.label}
                </p>
                {group.ids.map((id) => {
                  const s = adminSections.find((x) => x.id === id)
                  if (!s) return null
                  return (
                    <NavButton
                      key={s.id}
                      section={s}
                      active={active}
                      isAdmin={isAdmin}
                      integration={DASHBOARD_SECTION_INTEGRATION[s.id]}
                      onSelect={(sid) => {
                        setActive(sid)
                        setSidebarOpen(false)
                      }}
                    />
                  )
                })}
              </div>
            ))}

          {/* Grupo Manager */}
          {managerSections.length > 0 && (
            <>
              <p className="px-3 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/90">
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
        <div className="relative shrink-0 border-t border-sidebar-border/70 bg-muted/15 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Leyenda API
          </p>
          <div className="space-y-2 rounded-xl border border-border/50 bg-card/50 p-2.5 backdrop-blur-sm">
            <p className="flex items-start gap-2 text-[10px] leading-snug text-muted-foreground">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span>
                <span className="font-semibold text-emerald-200/90">API</span> — datos en vivo
              </span>
            </p>
            <p className="flex items-start gap-2 text-[10px] leading-snug text-muted-foreground">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              <span>
                <span className="font-semibold text-amber-100/90">Parcial</span> — datos efímeros en servidor
              </span>
            </p>
            <p className="flex items-start gap-2 text-[10px] leading-snug text-muted-foreground">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/70" />
              <span>
                <span className="font-semibold text-foreground/75">Demo</span> — maqueta sin API
              </span>
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_50%_-15%,rgba(0,229,255,0.07),transparent_52%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-muted/25"
          aria-hidden
        />

        <header className="relative z-10 shrink-0 border-b border-border/60 bg-background/55 shadow-sm shadow-black/20 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4">
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
           {/*      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Sparkd · {isAdmin ? "Panel de administración" : "Panel de manager"}
                </p> */}
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    {activeSection?.label}
                  </h1>
               {/*    {activeSection && DASHBOARD_SECTION_INTEGRATION[activeSection.id] && (
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
                  )} */}
                </div>
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

        <main className="relative flex-1 overflow-y-auto px-3 py-5 sm:px-4 lg:px-6 lg:py-8">
          <div className="mx-auto w-full max-w-6xl space-y-5">
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
        "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? cn(
              "border-l-2 shadow-inner shadow-black/10 ring-1 ring-white/[0.04]",
              isAdmin && section.group === "admin"
                ? "border-primary bg-primary/[0.09] text-primary"
                : "border-secondary bg-secondary/[0.09] text-secondary",
            )
          : "border-l-2 border-transparent text-muted-foreground hover:bg-muted/45 hover:text-foreground",
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
