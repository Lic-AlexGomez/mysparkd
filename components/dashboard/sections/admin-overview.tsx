"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard, MiniBar, ProgressRow } from "./shared"
import {
  Users, Heart, MessageCircle, DollarSign,
  Activity, FileText, Shield, UserPlus, Crown, Globe, Loader2
} from "lucide-react"
import { api } from "@/lib/api"

interface AdminStats {
  totalUsers: number
  totalPosts: number
  totalReports: number
  pendingReports: number
  newUsersThisWeek: number
  newUsersToday: number
  premiumUsers: number
  disabledUsers: number
}

const DAILY_USERS   = [820, 940, 880, 1100, 1250, 1380, 1203]
const DAILY_MATCHES = [1800, 2100, 1950, 2400, 2800, 3100, 2341]
const DAILY_REVENUE = [120, 145, 130, 160, 175, 190, 143]

const TOP_COUNTRIES = [
  { label: "Venezuela", value: 4820 },
  { label: "Colombia",  value: 2340 },
  { label: "México",    value: 1890 },
  { label: "Argentina", value: 1240 },
  { label: "España",    value: 980  },
  { label: "Otros",     value: 1577 },
]

export function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<AdminStats>('/api/admin/stats')
      .then(setStats)
      .catch(() => {}) // endpoint aún no existe, silencioso
      .finally(() => setLoading(false))
  }, [])

  const KPI = [
    { label: "Usuarios totales",   value: stats ? stats.totalUsers.toLocaleString()       : "—", change: 0, icon: Users,         color: "bg-violet-500" },
    { label: "Nuevos hoy",         value: stats ? stats.newUsersToday.toLocaleString()     : "—", change: 0, icon: UserPlus,      color: "bg-primary" },
    { label: "Nuevos esta semana", value: stats ? stats.newUsersThisWeek.toLocaleString()  : "—", change: 0, icon: Activity,      color: "bg-emerald-500" },
    { label: "Premium activos",    value: stats ? stats.premiumUsers.toLocaleString()      : "—", change: 0, icon: Crown,         color: "bg-amber-500" },
    { label: "Posts publicados",   value: stats ? stats.totalPosts.toLocaleString()        : "—", change: 0, icon: FileText,      color: "bg-orange-500" },
    { label: "Reportes pendientes",value: stats ? stats.pendingReports.toLocaleString()    : "—", change: 0, icon: Shield,        color: "bg-rose-500" },
    { label: "Total reportes",     value: stats ? stats.totalReports.toLocaleString()      : "—", change: 0, icon: Shield,        color: "bg-blue-500" },
    { label: "Deshabilitados",     value: stats ? stats.disabledUsers.toLocaleString()     : "—", change: 0, icon: Users,         color: "bg-muted-foreground" },
  ]

  return (
    <div className="space-y-6">

      {/* KPIs */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {KPI.map(k => <StatCard key={k.label} {...k} />)}
        </div>
      )}

      {/* Gráficas (hardcodeadas hasta que el backend tenga series temporales) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Usuarios activos (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-foreground mb-3">
              {stats ? stats.totalUsers.toLocaleString() : "—"}
            </p>
            <MiniBar data={DAILY_USERS} color="bg-primary" />
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

      {/* Países */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-secondary" /> Usuarios por país
              <Badge className="ml-auto text-[10px] border-0 bg-muted text-muted-foreground">Estimado</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {TOP_COUNTRIES.map(c => (
              <ProgressRow key={c.label} label={c.label} value={c.value} max={4820} color="bg-secondary" />
            ))}
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
              { label: "Usuarios premium",     value: stats ? `${stats.premiumUsers}` : "—",        color: "text-amber-500" },
              { label: "Usuarios deshabilitados", value: stats ? `${stats.disabledUsers}` : "—",    color: "text-rose-500" },
              { label: "Reportes pendientes",  value: stats ? `${stats.pendingReports}` : "—",      color: "text-orange-500" },
              { label: "Total posts",          value: stats ? `${stats.totalPosts}` : "—",          color: "text-blue-500" },
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
