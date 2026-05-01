"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard, ProgressRow } from "./shared"
import { AdminAreaChart, AdminEngagementComboChart } from "@/components/dashboard/charts/admin-recharts"
import { chartDayLabel } from "@/lib/chart-day-label"
import { BarChart3, Heart, Loader2, TrendingUp, Zap } from "lucide-react"
import { adminService, type AdminEngagementStats } from "@/lib/services/admin"
import { toast } from "sonner"

export function AdminEngagement() {
  const [days, setDays] = useState<7 | 14 | 30>(7)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AdminEngagementStats | null>(null)

  useEffect(() => {
    setLoading(true)
    adminService
      .getEngagement(days)
      .then(setData)
      .catch((error: any) => toast.error(error?.message || "No se pudo cargar engagement"))
      .finally(() => setLoading(false))
  }, [days])

  const dualSeries = useMemo(() => {
    const likes = data?.likesSeries || []
    const matches = data?.matchesSeries || []
    return likes.map((p, i) => ({
      name: chartDayLabel(p.date),
      likes: p.count,
      matches: matches[i]?.count ?? 0,
    }))
  }, [data])

  const likesOnlyChart = useMemo(
    () =>
      (data?.likesSeries || []).map((p) => ({
        name: chartDayLabel(p.date),
        value: p.count,
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
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Sin datos de engagement.
        </CardContent>
      </Card>
    )
  }

  const stats = [
    { label: "Swipes totales", value: data.totalSwipes.toLocaleString(), icon: Zap, color: "bg-primary" },
    { label: "Likes totales", value: data.totalLikes.toLocaleString(), icon: Heart, color: "bg-rose-500" },
    { label: "Matches totales", value: data.totalMatches.toLocaleString(), icon: TrendingUp, color: "bg-blue-500" },
    { label: "Match rate reciente", value: `${data.matchRateRecentPct.toFixed(2)}%`, icon: TrendingUp, color: "bg-emerald-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {[7, 14, 30].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setDays(option as 7 | 14 | 30)}
            className={`rounded-full border px-3 py-1 text-xs ${
              days === option
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {option}d
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/80 shadow-md shadow-black/10 lg:col-span-2">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" /> Likes vs matches ({days}d)
            </CardTitle>
            <p className="pt-1 text-[11px] font-normal text-muted-foreground">
              Recientes: {data.recentLikes.toLocaleString()} likes · {data.recentMatches.toLocaleString()} matches
            </p>
          </CardHeader>
          <CardContent className="pt-3">
            <AdminEngagementComboChart data={dualSeries} height={280} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="border-border/80 shadow-md shadow-black/10">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" /> Likes por día
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <AdminAreaChart
                data={likesOnlyChart}
                gradientId={`eg-likes-${days}`}
                color="#fb7185"
                valueLabel="Likes"
                height={200}
              />
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Dislikes ({days}d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black">{data.recentDislikes.toLocaleString()}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Serie temporal de dislikes no expuesta por el backend; solo total reciente.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-secondary" /> Conversión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <ProgressRow label="Likes/all swipes" value={data.totalLikes} max={Math.max(data.totalSwipes, 1)} color="bg-rose-500" />
            <ProgressRow label="Dislikes/all swipes" value={data.totalDislikes} max={Math.max(data.totalSwipes, 1)} color="bg-slate-500" />
            <ProgressRow label="Matches/all likes" value={data.totalMatches} max={Math.max(data.totalLikes, 1)} color="bg-emerald-500" />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Funnel de conversión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Usuarios", value: Number(data.funnel.totalUsers || 0), color: "bg-violet-500" },
              { label: "Swipes", value: Number(data.totalSwipes || 0), color: "bg-primary" },
              { label: "Likes", value: Number(data.totalLikes || 0), color: "bg-blue-500" },
              { label: "Matches", value: Number(data.totalMatches || 0), color: "bg-rose-500" },
            ].map((f, i, arr) => (
              <div key={f.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-semibold text-foreground">
                    {f.value.toLocaleString()}
                    {i > 0 && (
                      <span className="text-muted-foreground ml-1">
                        ({Math.round((f.value / Math.max(arr[0].value, 1)) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${f.color} rounded-full`}
                    style={{ width: `${(f.value / Math.max(arr[0].value, 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Match rate all time", value: `${data.matchRateAllTimePct.toFixed(2)}%`, sub: "matches / likes" },
          { label: `Match rate ${days}d`, value: `${data.matchRateRecentPct.toFixed(2)}%`, sub: "ventana reciente" },
          { label: `Likes ${days}d`, value: data.recentLikes.toLocaleString(), sub: "interacciones recientes" },
          { label: `Matches ${days}d`, value: data.recentMatches.toLocaleString(), sub: "coincidencias recientes" },
        ].map((m) => (
          <Card key={m.label} className="border-border">
            <CardContent className="p-4">
              <p className="text-2xl font-black text-foreground">{m.value}</p>
              <p className="text-xs font-semibold text-foreground mt-1">{m.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{m.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
