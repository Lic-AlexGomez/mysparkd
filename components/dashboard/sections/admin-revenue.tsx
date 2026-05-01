"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard, ProgressRow } from "./shared"
import { AdminAreaChart, AdminColumnBarChart } from "@/components/dashboard/charts/admin-recharts"
import { chartDayLabel } from "@/lib/chart-day-label"
import { AlertCircle, Crown, DollarSign, Loader2, PieChart, TrendingDown, TrendingUp } from "lucide-react"
import { adminService } from "@/lib/services/admin"
import { toast } from "sonner"

export function AdminRevenue() {
  const [loading, setLoading] = useState(true)
  const [mrr, setMrr] = useState<any>(null)
  const [active, setActive] = useState<any>(null)
  const [cancellations, setCancellations] = useState<any>(null)
  const [dailyRevenue, setDailyRevenue] = useState<Array<{ date: string; amountCents: number; amountUsd: string }>>([])
  const [churn, setChurn] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      adminService.getStripeMrr(),
      adminService.getStripeActiveSubscriptions(),
      adminService.getStripeCancellations(),
      adminService.getStripeDailyRevenue(),
      adminService.getStripeChurn(),
    ])
      .then(([mrrData, activeData, cancelData, revenueData, churnData]) => {
        setMrr(mrrData)
        setActive(activeData)
        setCancellations(cancelData)
        setDailyRevenue(Array.isArray(revenueData) ? revenueData : [])
        setChurn(churnData)
      })
      .catch((error: any) => toast.error(error?.message || "No se pudo cargar métricas de Stripe"))
      .finally(() => setLoading(false))
  }, [])

  const revenueStripeChart = useMemo(
    () =>
      dailyRevenue.slice(-14).map((r) => ({
        name: chartDayLabel(r.date),
        value: Number(r.amountCents || 0) / 100,
      })),
    [dailyRevenue],
  )

  const subscribersMixChart = useMemo(
    () => [
      { name: "Pagas", value: Number(active?.activePaid || 0) },
      { name: "Trial", value: Number(active?.activeTrial || 0) },
      { name: "Past due", value: Number(active?.pastDue || 0) },
      { name: "Cancel.", value: Number(active?.cancelled || 0) },
    ],
    [active],
  )

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!mrr || !active || !cancellations || !churn) {
    return (
      <Card className="border-border">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Sin datos de Stripe para mostrar.
        </CardContent>
      </Card>
    )
  }

  const mrrUsdNum = Number(mrr.mrrCents || 0) / 100
  const arrProjection = Number((Number(mrr.mrrCents || 0) * 12) / 100).toFixed(2)
  const fmtUsd = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }).format(n)
  const alexPct = 0.45
  const johanPct = 0.55
  const alexShareUsd = mrrUsdNum * alexPct
  const johanShareUsd = mrrUsdNum * johanPct
  const stats = [
    { label: "MRR", value: String(mrr.mrrUsd || "$0.00"), icon: DollarSign, color: "bg-emerald-500" },
    { label: "ARR proyectado", value: `$${arrProjection}`, icon: TrendingUp, color: "bg-teal-500" },
    { label: "Suscriptores activos", value: String(active.activeTotal ?? 0), icon: Crown, color: "bg-amber-500" },
    { label: "Churn mensual", value: `${Number(churn.churnRate || 0).toFixed(2)}%`, icon: TrendingDown, color: "bg-rose-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      <Card className="border-border border-emerald-500/20 bg-emerald-500/[0.03]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <PieChart className="h-4 w-4 text-emerald-500" />
            Reparto de ganancias (Alex / Johan)
          </CardTitle>
          <p className="text-[11px] text-muted-foreground font-normal leading-snug">
            Sobre la ganancia total mensual (MRR): Alex 45%, Johan 55%.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Ganancia total (MRR)</span>
            <span className="text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
              {fmtUsd(mrrUsdNum)}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted flex">
            <div
              className="h-full bg-sky-500/90"
              style={{ width: `${alexPct * 100}%` }}
              title="Alex 45%"
            />
            <div
              className="h-full bg-violet-500/90"
              style={{ width: `${johanPct * 100}%` }}
              title="Johan 55%"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-card/80 px-4 py-3">
              <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">Alex — 45%</p>
              <p className="mt-1 text-lg font-black tabular-nums">{fmtUsd(alexShareUsd)}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card/80 px-4 py-3">
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">Johan — 55%</p>
              <p className="mt-1 text-lg font-black tabular-nums">{fmtUsd(johanShareUsd)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" /> MRR (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black mb-1">{String(mrr.mrrUsd || "$0.00")}</p>
            <p className="text-xs text-muted-foreground mb-2">
              Precio mensual: {String(mrr.pricePerMonthUsd || "$0.00")}
            </p>
            <p className="text-[11px] text-muted-foreground mb-2">Ingresos diarios (Stripe, últimos 14d)</p>
            <AdminAreaChart
              data={revenueStripeChart}
              gradientId="rev-stripe-daily"
              color="#34d399"
              valueLabel="USD"
              height={220}
              formatValue={(n) =>
                n.toLocaleString("es-ES", { style: "currency", currency: "USD", maximumFractionDigits: 2 })
              }
            />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" /> Suscriptores activos (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black mb-1">{Number(active.activeTotal || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mb-2">
              Pagas: {Number(active.activePaid || 0)} · Trial: {Number(active.activeTrial || 0)}
            </p>
            <p className="text-[11px] text-muted-foreground mb-2">Desglose de estado</p>
            <AdminColumnBarChart
              data={subscribersMixChart}
              color="#fbbf24"
              height={216}
              valueLabel="Suscriptores"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Métricas Stripe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Precio mensual", value: String(mrr.pricePerMonthUsd || "$0.00") },
              { label: "MRR", value: String(mrr.mrrUsd || "$0.00") },
              { label: "Activas pagas", value: String(active.activePaid || 0) },
              { label: "Activas trial", value: String(active.activeTrial || 0) },
              { label: "Past due", value: String(active.pastDue || 0) },
              { label: "Canceladas totales", value: String(cancellations.totalCancellations || 0) },
              { label: "Cancelaciones mes", value: String(cancellations.cancellationsThisMonth || 0) },
              { label: "Churn mensual", value: `${Number(churn.churnRate || 0).toFixed(2)}%` },
            ].map((m) => (
              <div key={m.label} className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <span className="text-sm font-bold text-foreground">{m.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" /> Razones de cancelación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <ProgressRow label="Mes actual" value={Number(cancellations.cancellationsThisMonth || 0)} max={Math.max(Number(cancellations.totalCancellations || 1), 1)} color="bg-rose-500" />
            <ProgressRow label="Totales" value={Number(cancellations.totalCancellations || 0)} max={Math.max(Number(cancellations.totalCancellations || 1), 1)} color="bg-amber-500" />
            <ProgressRow label="Past due" value={Number(active.pastDue || 0)} max={Math.max(Number(active.activeTotal || 1), 1)} color="bg-orange-500" />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Proyección 12 meses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "MRR actual", value: String(mrr.mrrUsd || "$0.00"), color: "text-emerald-500" },
              { label: "ARR proyectado", value: `$${arrProjection}`, color: "text-amber-500" },
              { label: "Activas inicio mes", value: String(churn.activeAtStartOfMonth || 0), color: "text-primary" },
              { label: "Activas ahora", value: String(churn.currentActive || 0), color: "text-foreground" },
            ].map((m) => (
              <div key={m.label} className="flex justify-between items-center py-1 border-b border-border last:border-0">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <span className={`text-sm font-black ${m.color}`}>{m.value}</span>
              </div>
            ))}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-1.5">Indicador de churn</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    Number(churn.churnRate || 0) > 8
                      ? "bg-rose-500"
                      : Number(churn.churnRate || 0) > 4
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(Number(churn.churnRate || 0), 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{Number(churn.churnRate || 0).toFixed(2)}% del mes</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
