"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard, MiniBar, ProgressRow } from "./shared"
import {
  Users, Heart, MessageCircle, DollarSign,
  Activity, FileText, Shield, UserPlus, Crown, Globe, Loader2
} from "lucide-react"
import { adminService } from "@/lib/services/profile"
import type { AdminStats, UserGrowth } from "@/lib/types"

const DAILY_MATCHES = [1800, 2100, 1950, 2400, 2800, 3100, 2341]
const DAILY_REVENUE = [120, 145, 130, 160, 175, 190, 143]

export function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [growth, setGrowth] = useState<UserGrowth[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    Promise.all([
      adminService.getStats(),
      adminService.getGrowth()
    ]).then(([s, g]) => {
      setStats(s)
      setGrowth(g)
      if (!s) setForbidden(true)
    }).finally(() => setLoading(false))
  }, [])

  // Últimos 7 días de crecimiento para el mini bar
  const growthData = growth.slice(-7).map(g => g.count)

  const KPI = [
    { label: "Usuarios totales",      value: stats ? stats.totalUsers.toLocaleString()          : "—", change: 0, icon: Users,    color: "bg-violet-500" },
    { label: "Nuevos (7 días)",        value: stats ? stats.newUsersLast7Days.toLocaleString()   : "—", change: 0, icon: UserPlus, color: "bg-primary" },
    { label: "Activos (24h)",          value: stats ? stats.activeUsersLast24h.toLocaleString()  : "—", change: 0, icon: Activity, color: "bg-emerald-500" },
    { label: "Premium activos",        value: stats ? stats.premiumUsers.toLocaleString()        : "—", change: 0, icon: Crown,    color: "bg-amber-500" },
    { label: "Usuarios free",          value: stats ? stats.freeUsers.toLocaleString()           : "—", change: 0, icon: Users,    color: "bg-orange-500" },
    { label: "Usuarios activos",       value: stats ? stats.activeUsers.toLocaleString()         : "—", change: 0, icon: Activity, color: "bg-blue-500" },
    { label: "Usuarios bloqueados",    value: stats ? stats.lockedUsers.toLocaleString()         : "—", change: 0, icon: Shield,   color: "bg-rose-500" },
    { label: "Total usuarios",         value: stats ? stats.totalUsers.toLocaleString()          : "—", change: 0, icon: Users,    color: "bg-muted-foreground" },
  ]

  const providerEntries = stats ? Object.entries(stats.usersByProvider) : []
  const maxProvider = providerEntries.reduce((max, [, v]) => Math.max(max, v), 1)

  return (
    <div className="space-y-6">

      {/* KPIs */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : forbidden ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Shield className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Acceso restringido</p>
          <p className="text-xs text-muted-foreground">Tu cuenta no tiene rol ADMIN para ver estas estadísticas</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {KPI.map(k => <StatCard key={k.label} {...k} />)}
        </div>
      )}

      {/* Gráficas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Crecimiento de usuarios (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-foreground mb-3">
              {stats ? stats.totalUsers.toLocaleString() : "—"}
            </p>
            <MiniBar data={growthData.length > 0 ? growthData : [0,0,0,0,0,0,0]} color="bg-primary" />
            <div className="flex justify-between mt-1">
              {growth.slice(-7).map((g, i) => (
                <span key={i} className="text-[10px] text-muted-foreground flex-1 text-center">
                  {new Date(g.date).getDate()}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" /> Matches (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-foreground mb-3">—</p>
            <MiniBar data={DAILY_MATCHES} color="bg-rose-500" />
            <div className="flex justify-between mt-1">
              {["L","M","X","J","V","S","D"].map(d => (
                <span key={d} className="text-[10px] text-muted-foreground flex-1 text-center">{d}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" /> Ingresos diarios ($)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-foreground mb-3">—</p>
            <MiniBar data={DAILY_REVENUE} color="bg-amber-500" />
            <div className="flex justify-between mt-1">
              {["L","M","X","J","V","S","D"].map(d => (
                <span key={d} className="text-[10px] text-muted-foreground flex-1 text-center">{d}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Providers + Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-secondary" /> Usuarios por proveedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {providerEntries.length > 0 ? (
              providerEntries.map(([provider, count]) => (
                <ProgressRow key={provider} label={provider} value={count} max={maxProvider} color="bg-secondary" />
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Sin datos</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Resumen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Usuarios premium",    value: stats ? `${stats.premiumUsers}`       : "—", color: "text-amber-500" },
              { label: "Usuarios free",        value: stats ? `${stats.freeUsers}`          : "—", color: "text-blue-500" },
              { label: "Activos últimas 24h",  value: stats ? `${stats.activeUsersLast24h}` : "—", color: "text-emerald-500" },
              { label: "Bloqueados",           value: stats ? `${stats.lockedUsers}`        : "—", color: "text-rose-500" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
