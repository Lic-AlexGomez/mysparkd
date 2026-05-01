"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard, ProgressRow } from "./shared"
import { AdminHorizontalBarChart } from "@/components/dashboard/charts/admin-recharts"
import { Globe, Loader2, MapPin, Smartphone, TrendingUp, Users } from "lucide-react"
import { adminService, type AdminGeoStats } from "@/lib/services/admin"
import { toast } from "sonner"

export function AdminGeo() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AdminGeoStats | null>(null)

  useEffect(() => {
    adminService
      .getGeo()
      .then(setData)
      .catch((error: any) => toast.error(error?.message || "No se pudo cargar geografía"))
      .finally(() => setLoading(false))
  }, [])

  const topRegion = useMemo(() => data?.byRegion[0]?.region || "—", [data])
  const topCount = useMemo(() => data?.byRegion[0]?.count || 0, [data])
  const regionChartData = useMemo(
    () =>
      (data?.byRegion || []).map((r) => ({
        name: r.region.length > 14 ? `${r.region.slice(0, 14)}…` : r.region,
        value: r.count,
      })),
    [data],
  )

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <Card className="border-border">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">Sin datos geográficos.</CardContent>
      </Card>
    )
  }

  const stats = [
    { label: "Regiones activas", value: String(data.byRegion.length), icon: Globe, color: "bg-primary" },
    { label: "Región top", value: topRegion, icon: MapPin, color: "bg-secondary" },
    { label: "Con ubicación", value: `${data.coveragePct.toFixed(2)}%`, icon: Smartphone, color: "bg-emerald-500" },
    { label: "Usuarios totales", value: data.totalUsers.toLocaleString(), icon: Users, color: "bg-amber-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/80 shadow-md shadow-black/10 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Usuarios por región (top 12)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byRegion.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin datos de región.</p>
            ) : (
              <AdminHorizontalBarChart data={regionChartData} barColor="#00e5ff" />
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-secondary" /> Cobertura de ubicación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <ProgressRow label="Con ubicación" value={data.usersWithLocation} max={Math.max(data.totalUsers, 1)} color="bg-secondary" />
            <ProgressRow label="Sin ubicación" value={data.usersWithoutLocation} max={Math.max(data.totalUsers, 1)} color="bg-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Top región: <span className="font-semibold text-foreground">{topRegion}</span> ({topCount.toLocaleString()} usuarios)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Estado de cobertura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Cobertura global de ubicación: <span className="font-semibold text-foreground">{data.coveragePct.toFixed(2)}%</span>
          </p>
          {data.coveragePct < 30 ? (
            <Badge className="bg-amber-500/15 text-amber-500 border-0">
              Baja cobertura de datos geográficos
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/15 text-emerald-500 border-0">
              Cobertura geográfica saludable
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
