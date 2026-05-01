"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard, ProgressRow, MiniBar } from "./shared"
import { AdminAreaChart, AdminDonutChart } from "@/components/dashboard/charts/admin-recharts"
import { chartDayLabel } from "@/lib/chart-day-label"
import { FileText, Image, Loader2, ShieldAlert, Trash2 } from "lucide-react"
import { adminService, type AdminContentStats } from "@/lib/services/admin"
import { toast } from "sonner"

export function AdminContent() {
  const [data, setData] = useState<AdminContentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService
      .getContentStats(30)
      .then(setData)
      .catch((error: any) => toast.error(error?.message || "No se pudo cargar analítica de contenido"))
      .finally(() => setLoading(false))
  }, [])

  const postsSeriesChart = useMemo(
    () =>
      (data?.series || []).map((p) => ({
        name: chartDayLabel(p.date),
        value: p.count,
      })),
    [data],
  )

  const postsSparkline = useMemo(
    () => (data?.series || []).slice(-14).map((p) => p.count),
    [data],
  )

  const distributionDonut = useMemo(() => {
    if (!data) return []
    return [
      { name: "Activos", value: data.activePosts },
      { name: "Eliminados", value: data.deletedPosts },
      { name: "Con media", value: data.postsWithMedia },
    ]
  }, [data])
  const mediaPct = useMemo(() => {
    if (!data?.activePosts) return 0
    return Math.round((data.postsWithMedia / data.activePosts) * 100)
  }, [data])

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
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Sin datos de contenido.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Posts activos" value={data.activePosts.toLocaleString()} icon={FileText} color="bg-orange-500" />
        <StatCard label="Posts eliminados" value={data.deletedPosts.toLocaleString()} icon={Trash2} color="bg-rose-500" />
        <StatCard label="Posts con media" value={data.postsWithMedia.toLocaleString()} icon={Image} color="bg-violet-500" />
        <StatCard label="Posts reportados" value={data.totalReports.toLocaleString()} icon={ShieldAlert} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/80 shadow-md shadow-black/10">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-500" /> Nuevos posts (30d)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="mb-1 text-2xl font-black">{data.newPostsLastDays.toLocaleString()}</p>
            <p className="mb-2 text-[11px] text-muted-foreground">Posts nuevos por día</p>
            {postsSparkline.length > 0 ? (
              <div className="mb-3">
                <MiniBar data={postsSparkline} color="bg-orange-500" />
              </div>
            ) : null}
            <AdminAreaChart
              data={postsSeriesChart}
              gradientId="content-posts"
              color="#fb923c"
              valueLabel="Posts"
              height={240}
            />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribución de posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AdminDonutChart data={distributionDonut} height={200} />
            <div className="space-y-2.5 border-t border-border/60 pt-3">
              <ProgressRow label="Activos" value={data.activePosts} max={Math.max(data.totalPosts, 1)} color="bg-emerald-500" />
              <ProgressRow label="Eliminados" value={data.deletedPosts} max={Math.max(data.totalPosts, 1)} color="bg-rose-500" />
              <ProgressRow label="Con media" value={data.postsWithMedia} max={Math.max(data.activePosts, 1)} color="bg-violet-500" />
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">% con media</span>
                  <span className="font-semibold text-foreground">{mediaPct}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total posts</span>
                  <span className="font-semibold text-foreground">{data.totalPosts.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
