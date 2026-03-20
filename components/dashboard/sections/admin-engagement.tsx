"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard, MiniBar, ProgressRow } from "./shared"
import { Heart, MessageCircle, Zap, Users, BarChart3, TrendingUp, Repeat2 } from "lucide-react"

const STATS = [
  { label: "Swipes hoy",      value: "34,821", change: +15, icon: Zap,           color: "bg-primary" },
  { label: "Matches hoy",     value: "2,341",  change: +18, icon: Heart,         color: "bg-rose-500" },
  { label: "Mensajes hoy",    value: "18,492", change: +31, icon: MessageCircle, color: "bg-blue-500" },
  { label: "Tasa de match",   value: "6.7%",   change: +2,  icon: TrendingUp,    color: "bg-emerald-500" },
]

const SWIPES_DAILY  = [28000, 32000, 29000, 35000, 38000, 42000, 34821]
const MATCHES_DAILY = [1800,  2100,  1950,  2400,  2800,  3100,  2341]
const MSGS_DAILY    = [12000, 14000, 13000, 16000, 19000, 22000, 18492]

const REACTIONS = [
  { label: "❤️ Like",    value: 184200, color: "bg-rose-500" },
  { label: "🔥 Fire",    value: 92400,  color: "bg-orange-500" },
  { label: "😂 Laugh",   value: 48300,  color: "bg-amber-500" },
  { label: "😮 Wow",     value: 31200,  color: "bg-violet-500" },
  { label: "😢 Sad",     value: 18900,  color: "bg-blue-500" },
  { label: "💕 Love",    value: 9400,   color: "bg-pink-500" },
]

const FUNNEL = [
  { label: "Usuarios registrados",  value: 12847, color: "bg-violet-500" },
  { label: "Perfil completado",     value: 10020, color: "bg-primary" },
  { label: "Primer swipe",          value: 8940,  color: "bg-blue-500" },
  { label: "Primer match",          value: 6230,  color: "bg-rose-500" },
  { label: "Primer mensaje",        value: 4180,  color: "bg-amber-500" },
  { label: "Suscripción premium",   value: 892,   color: "bg-emerald-500" },
]

export function AdminEngagement() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Swipes (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black mb-3">34,821</p>
            <MiniBar data={SWIPES_DAILY.map(v => v / 1000)} color="bg-primary" />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" /> Matches (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black mb-3">2,341</p>
            <MiniBar data={MATCHES_DAILY} color="bg-rose-500" />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-500" /> Mensajes (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black mb-3">18,492</p>
            <MiniBar data={MSGS_DAILY.map(v => v / 1000)} color="bg-blue-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reacciones */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-secondary" /> Reacciones totales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {REACTIONS.map(r => (
              <ProgressRow key={r.label} label={r.label} value={r.value} max={184200} color={r.color} />
            ))}
          </CardContent>
        </Card>

        {/* Funnel de conversión */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Funnel de conversión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {FUNNEL.map((f, i) => (
              <div key={f.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-semibold text-foreground">
                    {f.value.toLocaleString()}
                    {i > 0 && (
                      <span className="text-muted-foreground ml-1">
                        ({Math.round((f.value / FUNNEL[0].value) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${f.color} rounded-full`}
                    style={{ width: `${(f.value / FUNNEL[0].value) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Métricas de retención */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Retención día 1",   value: "68%", sub: "vuelven al día siguiente" },
          { label: "Retención día 7",   value: "42%", sub: "activos a la semana" },
          { label: "Retención día 30",  value: "28%", sub: "activos al mes" },
          { label: "Sesiones / usuario","value": "4.2", sub: "promedio diario" },
        ].map(m => (
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
