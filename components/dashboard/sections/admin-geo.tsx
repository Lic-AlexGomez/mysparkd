"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard, ProgressRow } from "./shared"
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
  const maxRegion = useMemo(
    () => Math.max(...(data?.byRegion.map((r) => r.count) || [1])),
    [data]
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Usuarios por región
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {data.byRegion.length === 0 && (
              <p className="text-xs text-muted-foreground">Sin datos de región.</p>
            )}
            {data.byRegion.map((c) => (
              <div key={c.region} className="flex items-center gap-3">
                <span className="text-xs text-foreground w-32 shrink-0">{c.region}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(c.count / maxRegion) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-foreground w-12 text-right">{c.count.toLocaleString()}</span>
              </div>
            ))}
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
