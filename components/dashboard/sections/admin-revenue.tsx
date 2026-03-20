"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard, MiniBar, ProgressRow } from "./shared"
import { DollarSign, Crown, TrendingUp, TrendingDown, CreditCard, Users, AlertCircle } from "lucide-react"

const STATS = [
  { label: "MRR",              value: "$4,460",  change: +5,  icon: DollarSign, color: "bg-emerald-500" },
  { label: "ARR proyectado",   value: "$53,520", change: +5,  icon: TrendingUp, color: "bg-teal-500" },
  { label: "Suscriptores",     value: "892",     change: +5,  icon: Crown,      color: "bg-amber-500" },
  { label: "Churn mensual",    value: "3.2%",    change: -1,  icon: TrendingDown, color: "bg-rose-500" },
]

const MRR_WEEKLY = [3800, 3950, 4100, 4050, 4200, 4380, 4460]
const SUBS_WEEKLY = [820, 835, 848, 855, 867, 880, 892]

const TRANSACTIONS = [
  { user: "sofia_m",   amount: "$4.99", plan: "Premium",  date: "hace 2h",   status: "exitoso" },
  { user: "pedro_g",   amount: "$4.99", plan: "Premium",  date: "hace 5h",   status: "exitoso" },
  { user: "jose_r",    amount: "$4.99", plan: "Premium",  date: "hace 8h",   status: "exitoso" },
  { user: "ana_lopez", amount: "$4.99", plan: "Premium",  date: "hace 1d",   status: "exitoso" },
  { user: "luis_m",    amount: "$4.99", plan: "Premium",  date: "hace 1d",   status: "fallido" },
  { user: "carmen_v",  amount: "$4.99", plan: "Premium",  date: "hace 2d",   status: "exitoso" },
  { user: "roberto_k", amount: "$4.99", plan: "Premium",  date: "hace 2d",   status: "reembolso" },
]

const CANCELLATIONS = [
  { reason: "Muy caro",           pct: 38 },
  { reason: "No encontré pareja", pct: 27 },
  { reason: "Usé otra app",       pct: 18 },
  { reason: "Problemas técnicos", pct: 10 },
  { reason: "Otro",               pct: 7  },
]

export function AdminRevenue() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" /> MRR (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black mb-1">$4,460</p>
            <p className="text-xs text-emerald-500 mb-3">+$80 vs semana pasada</p>
            <MiniBar data={MRR_WEEKLY} color="bg-emerald-500" />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" /> Suscriptores activos (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black mb-1">892</p>
            <p className="text-xs text-emerald-500 mb-3">+12 esta semana</p>
            <MiniBar data={SUBS_WEEKLY} color="bg-amber-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Métricas clave */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Métricas Stripe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Precio mensual",      value: "$4.99" },
              { label: "LTV promedio",         value: "$34.93" },
              { label: "CAC estimado",         value: "$2.10" },
              { label: "LTV/CAC ratio",        value: "16.6x" },
              { label: "Nuevos este mes",      value: "47" },
              { label: "Cancelaciones mes",    value: "18" },
              { label: "Reembolsos mes",       value: "3" },
              { label: "Tasa conversión free→premium", value: "6.9%" },
            ].map(m => (
              <div key={m.label} className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <span className="text-sm font-bold text-foreground">{m.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Razones de cancelación */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" /> Razones de cancelación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {CANCELLATIONS.map(c => (
              <ProgressRow key={c.reason} label={c.reason} value={c.pct} max={38} color="bg-rose-500" />
            ))}
          </CardContent>
        </Card>

        {/* Proyección */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Proyección 12 meses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "MRR objetivo",     value: "$12,000", color: "text-emerald-500" },
              { label: "Suscriptores obj.", value: "2,400",  color: "text-amber-500" },
              { label: "Crecimiento req.",  value: "+169%",  color: "text-primary" },
              { label: "Crecimiento actual","value": "+5%/mes", color: "text-foreground" },
            ].map(m => (
              <div key={m.label} className="flex justify-between items-center py-1 border-b border-border last:border-0">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <span className={`text-sm font-black ${m.color}`}>{m.value}</span>
              </div>
            ))}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-1.5">Progreso hacia objetivo MRR</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: "37%" }} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">37% del objetivo ($4,460 / $12,000)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transacciones recientes */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" /> Transacciones recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Usuario</span><span>Monto</span><span>Fecha</span><span>Estado</span>
          </div>
          <div className="divide-y divide-border">
            {TRANSACTIONS.map((t, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 px-4 py-3 items-center hover:bg-muted/20">
                <span className="text-xs font-semibold text-foreground">@{t.user}</span>
                <span className="text-xs font-bold text-emerald-500">{t.amount}</span>
                <span className="text-xs text-muted-foreground">{t.date}</span>
                <Badge className={`text-[10px] border-0 w-fit ${
                  t.status === "exitoso"   ? "bg-emerald-500/15 text-emerald-500" :
                  t.status === "fallido"   ? "bg-rose-500/15 text-rose-500" :
                  "bg-amber-500/15 text-amber-500"
                }`}>{t.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
