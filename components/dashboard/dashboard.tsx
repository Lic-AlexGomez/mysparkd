"use client"

import { useState } from "react"
import { AdminOverview } from "./sections/admin-overview"
import { AdminUsers } from "./sections/admin-users"
import { AdminContent } from "./sections/admin-content"
import { AdminRevenue } from "./sections/admin-revenue"
import { AdminEngagement } from "./sections/admin-engagement"
import { AdminModeration } from "./sections/admin-moderation"
import { AdminSystem } from "./sections/admin-system"
import { AdminGeo } from "./sections/admin-geo"
import { AdminNotifications } from "./sections/admin-notifications"
import { AdminABTesting } from "./sections/admin-abtesting"
import { AdminBenchmarks } from "./sections/admin-benchmarks"
import { AdminAuditLog } from "./sections/admin-auditlog"
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Activity,
  Shield,
  Server,
  Zap,
  Menu,
  X,
  MapPin,
  Bell,
  FlaskConical,
  BarChart3,
  ScrollText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DASHBOARD_SECTION_INTEGRATION } from "@/lib/dashboard-section-integration"
import { DASHBOARD_ADMIN_NAV_GROUPS } from "@/lib/dashboard-admin-nav-groups"
import { IntegrationBanner } from "@/components/dashboard/integration-banner"
import { AdminApiHealthStrip } from "@/components/dashboard/admin-api-health-strip"
import { Badge } from "@/components/ui/badge"

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "content", label: "Contenido", icon: FileText },
  { id: "revenue", label: "Ingresos", icon: DollarSign },
  { id: "engagement", label: "Engagement", icon: Activity },
  { id: "moderation", label: "Moderación", icon: Shield },
  { id: "geo", label: "Geografía", icon: MapPin },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "abtesting", label: "A/B Testing", icon: FlaskConical },
  { id: "benchmarks", label: "Benchmarks", icon: BarChart3 },
  { id: "auditlog", label: "Auditoría", icon: ScrollText },
  { id: "system", label: "Sistema", icon: Server },
] as const

export function Dashboard() {
  const [active, setActive] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const activeMeta = SECTIONS.find((s) => s.id === active)
  const activeIntegration = activeMeta ? DASHBOARD_SECTION_INTEGRATION[activeMeta.id] : undefined

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[17.5rem] flex-col border-r border-border/70 bg-sidebar/90 shadow-[8px_0_32px_-12px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_45%_at_50%_-10%,var(--primary)_0%,transparent_55%)] opacity-[0.07]"
          aria-hidden
        />
        <div className="relative flex h-[4.25rem] shrink-0 items-center gap-3 border-b border-sidebar-border/80 px-4">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/25 ring-2 ring-background/80">
            <Zap className="h-[1.15rem] w-[1.15rem] text-black" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black tracking-tight text-foreground">Sparkd</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Admin</p>
          </div>
          <button type="button" className="rounded-lg p-1.5 hover:bg-muted/50 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <nav className="relative flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {DASHBOARD_ADMIN_NAV_GROUPS.map((group, gi) => (
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
                const s = SECTIONS.find((x) => x.id === id)
                if (!s) return null
                const integ = DASHBOARD_SECTION_INTEGRATION[s.id]
                const isOn = active === s.id
                const dot =
                  integ?.source === "live"
                    ? "bg-emerald-400"
                    : integ?.source === "partial"
                      ? "bg-amber-400"
                      : "bg-muted-foreground/60"
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setActive(s.id)
                      setSidebarOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isOn
                        ? "border-l-2 border-primary bg-primary/[0.09] text-primary shadow-inner shadow-black/10 ring-1 ring-white/[0.04]"
                        : "border-l-2 border-transparent text-muted-foreground hover:bg-muted/45 hover:text-foreground",
                    )}
                  >
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} aria-hidden />
                    <s.icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate text-left">{s.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="relative shrink-0 border-t border-sidebar-border/70 bg-muted/15 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Estado</p>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium text-emerald-200/90">Panel operativo</span>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_50%_-15%,rgba(0,229,255,0.07),transparent_52%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-muted/25" aria-hidden />

        <header className="relative z-10 shrink-0 border-b border-border/60 bg-background/55 shadow-sm shadow-black/20 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-3 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <div className="flex min-w-0 items-start gap-3 sm:items-center">
              <button
                type="button"
                className="mt-0.5 shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Sparkd · Panel de administración
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight sm:text-xl">{activeMeta?.label}</h1>
                  {activeIntegration && (
                    <Badge
                      className={cn(
                        "border-0 text-[10px] font-semibold",
                        activeIntegration.source === "live" && "bg-emerald-500/20 text-emerald-300",
                        activeIntegration.source === "partial" && "bg-amber-500/20 text-amber-200",
                        activeIntegration.source === "demo" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {activeIntegration.shortLabel}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto px-3 py-5 sm:px-4 lg:px-6 lg:py-8">
          <div className="mx-auto w-full max-w-6xl space-y-5">
            <AdminApiHealthStrip />
            {activeIntegration && (
              <IntegrationBanner source={activeIntegration.source} detail={activeIntegration.detail} />
            )}
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
          </div>
        </main>
      </div>
    </div>
  )
}
