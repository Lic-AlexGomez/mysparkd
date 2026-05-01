"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard, MiniBar, ProgressRow } from "./shared"
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

  const series = useMemo(() => data?.series.map((p) => p.count) || [], [data])
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
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-500" /> Nuevos posts (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black mb-3">{data.newPostsLastDays.toLocaleString()}</p>
            <MiniBar data={series.length ? series : [0]} color="bg-orange-500" />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribución de posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <ProgressRow label="Activos" value={data.activePosts} max={Math.max(data.totalPosts, 1)} color="bg-emerald-500" />
            <ProgressRow label="Eliminados" value={data.deletedPosts} max={Math.max(data.totalPosts, 1)} color="bg-rose-500" />
            <ProgressRow label="Con media" value={data.postsWithMedia} max={Math.max(data.activePosts, 1)} color="bg-violet-500" />
            <div className="pt-3 border-t border-border space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">% con media</span>
                <span className="font-semibold text-foreground">{mediaPct}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total posts</span>
                <span className="font-semibold text-foreground">{data.totalPosts.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
