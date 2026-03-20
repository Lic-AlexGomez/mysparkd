"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "./shared"
import { FlaskConical, TrendingUp, Users, CheckCircle, Clock } from "lucide-react"

const STATS = [
  { label: "Tests activos",    value: "4",     icon: FlaskConical, color: "bg-primary" },
  { label: "Usuarios en test", value: "3,240", icon: Users,        color: "bg-secondary" },
  { label: "Tests ganadores",  value: "7",     icon: CheckCircle,  color: "bg-emerald-500" },
  { label: "En progreso",      value: "4",     icon: Clock,        color: "bg-amber-500" },
]

const TESTS = [
  {
    name: "Botón de match — color",
    hypothesis: "El botón verde convierte más que el rosa",
    variantA: { name: "Rosa (control)", users: 820, conversions: 55, rate: 6.7 },
    variantB: { name: "Verde (test)",   users: 810, conversions: 72, rate: 8.9 },
    status: "ganador_b",
    confidence: 94,
    started: "hace 14 días",
  },
  {
    name: "Onboarding — pasos",
    hypothesis: "Menos pasos = más completados",
    variantA: { name: "5 pasos (control)", users: 620, conversions: 434, rate: 70.0 },
    variantB: { name: "3 pasos (test)",    users: 618, conversions: 494, rate: 79.9 },
    status: "ganador_b",
    confidence: 97,
    started: "hace 21 días",
  },
  {
    name: "Precio premium — display",
    hypothesis: "Mostrar precio/día convierte más",
    variantA: { name: "$4.99/mes (control)", users: 480, conversions: 33, rate: 6.9 },
    variantB: { name: "$0.17/día (test)",    users: 475, conversions: 38, rate: 8.0 },
    status: "en_progreso",
    confidence: 71,
    started: "hace 7 días",
  },
  {
    name: "Feed — algoritmo",
    hypothesis: "Feed personalizado retiene más",
    variantA: { name: "Cronológico",    users: 760, conversions: 320, rate: 42.1 },
    variantB: { name: "Personalizado",  users: 755, conversions: 356, rate: 47.2 },
    status: "en_progreso",
    confidence: 83,
    started: "hace 10 días",
  },
]

const PAST_WINNERS = [
  { test: "CTA perfil incompleto",    improvement: "+18% completados",  date: "hace 1 mes" },
  { test: "Foto obligatoria en reg.", improvement: "+12% matches",       date: "hace 2 meses" },
  { test: "Notif. match inmediata",   improvement: "+31% apertura",      date: "hace 3 meses" },
]

export function AdminABTesting() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Tests activos */}
      <div className="space-y-4">
        {TESTS.map((t, i) => (
          <Card key={i} className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-sm">{t.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.hypothesis}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-muted-foreground">{t.started}</span>
                  <Badge className={`text-[10px] border-0 ${
                    t.status === "ganador_b"   ? "bg-emerald-500/15 text-emerald-500" :
                    t.status === "ganador_a"   ? "bg-blue-500/15 text-blue-500" :
                    "bg-amber-500/15 text-amber-500"
                  }`}>
                    {t.status === "ganador_b" ? "✓ B gana" : t.status === "ganador_a" ? "✓ A gana" : "En progreso"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[t.variantA, t.variantB].map((v, vi) => (
                  <div key={vi} className={`p-3 rounded-xl border ${
                    (t.status === "ganador_b" && vi === 1) || (t.status === "ganador_a" && vi === 0)
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-border bg-muted/20"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase">{vi === 0 ? "A" : "B"}</span>
                      {((t.status === "ganador_b" && vi === 1) || (t.status === "ganador_a" && vi === 0)) && (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs text-foreground font-medium mb-2">{v.name}</p>
                    <p className="text-xl font-black text-foreground">{v.rate}%</p>
                    <p className="text-[11px] text-muted-foreground">{v.conversions} / {v.users} usuarios</p>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${vi === 1 && t.status === "ganador_b" ? "bg-emerald-500" : "bg-primary"}`}
                        style={{ width: `${Math.min(v.rate * 5, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${t.confidence >= 95 ? "bg-emerald-500" : t.confidence >= 80 ? "bg-amber-500" : "bg-rose-500"}`}
                    style={{ width: `${t.confidence}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  Confianza: <span className={`font-bold ${t.confidence >= 95 ? "text-emerald-500" : t.confidence >= 80 ? "text-amber-500" : "text-rose-500"}`}>{t.confidence}%</span>
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tests ganadores históricos */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" /> Mejoras implementadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {PAST_WINNERS.map((w, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-xs text-foreground flex-1">{w.test}</span>
              <Badge className="text-[10px] border-0 bg-emerald-500/15 text-emerald-500">{w.improvement}</Badge>
              <span className="text-[11px] text-muted-foreground shrink-0">{w.date}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
