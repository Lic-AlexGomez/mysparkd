"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard, ProgressRow, MiniBar } from "./shared"
import { MapPin, Globe, TrendingUp, Users, Smartphone } from "lucide-react"

const STATS = [
  { label: "Países activos",   value: "34",     icon: Globe,      color: "bg-primary" },
  { label: "Ciudad top",       value: "Caracas", icon: MapPin,     color: "bg-secondary" },
  { label: "Usuarios móvil",   value: "91%",    icon: Smartphone, color: "bg-emerald-500" },
  { label: "Idiomas",          value: "3",      icon: Globe,      color: "bg-amber-500" },
]

const COUNTRIES = [
  { label: "🇻🇪 Venezuela",   value: 4820, pct: 37.5 },
  { label: "🇨🇴 Colombia",    value: 2340, pct: 18.2 },
  { label: "🇲🇽 México",      value: 1890, pct: 14.7 },
  { label: "🇦🇷 Argentina",   value: 1240, pct: 9.6  },
  { label: "🇪🇸 España",      value: 980,  pct: 7.6  },
  { label: "🇵🇪 Perú",        value: 720,  pct: 5.6  },
  { label: "🇨🇱 Chile",       value: 480,  pct: 3.7  },
  { label: "🌍 Otros",        value: 377,  pct: 2.9  },
]

const CITIES = [
  { label: "Caracas",       value: 2840 },
  { label: "Bogotá",        value: 1120 },
  { label: "Ciudad de Méx", value: 980  },
  { label: "Buenos Aires",  value: 740  },
  { label: "Madrid",        value: 620  },
  { label: "Lima",          value: 480  },
  { label: "Santiago",      value: 310  },
  { label: "Medellín",      value: 290  },
]

const DEVICES = [
  { label: "Android",  value: 58, color: "bg-emerald-500" },
  { label: "iOS",      value: 33, color: "bg-blue-500"    },
  { label: "Web",      value: 9,  color: "bg-muted-foreground" },
]

const GROWTH_BY_COUNTRY = [
  { label: "🇻🇪 Venezuela",  weekly: [320, 380, 410, 390, 450, 510, 480], change: +12 },
  { label: "🇨🇴 Colombia",   weekly: [140, 160, 155, 180, 200, 220, 195], change: +18 },
  { label: "🇲🇽 México",     weekly: [90,  110, 105, 130, 150, 170, 145], change: +23 },
]

const LANGUAGES = [
  { label: "Español",   value: 94, color: "bg-primary" },
  { label: "Inglés",    value: 4,  color: "bg-secondary" },
  { label: "Portugués", value: 2,  color: "bg-amber-500" },
]

export function AdminGeo() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Países */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Usuarios por país
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {COUNTRIES.map(c => (
              <div key={c.label} className="flex items-center gap-3">
                <span className="text-xs text-foreground w-32 shrink-0">{c.label}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${c.pct}%` }} />
                </div>
                <span className="text-xs font-semibold text-foreground w-12 text-right">{c.value.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground w-8 text-right">{c.pct}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Ciudades */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-secondary" /> Top ciudades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {CITIES.map((c, i) => (
              <div key={c.label} className="flex items-center gap-3">
                <span className="text-xs font-black text-muted-foreground w-4 shrink-0">{i + 1}</span>
                <span className="text-xs text-foreground flex-1">{c.label}</span>
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: `${(c.value / 2840) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-foreground w-10 text-right">{c.value.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dispositivos */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-500" /> Dispositivos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {DEVICES.map(d => (
              <div key={d.label} className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${d.color} shrink-0`} />
                <span className="text-xs text-foreground flex-1">{d.label}</span>
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.value}%` }} />
                </div>
                <span className="text-xs font-bold text-foreground w-8 text-right">{d.value}%</span>
              </div>
            ))}
            <div className="pt-3 border-t border-border space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">PWA instalada</span><span className="font-semibold text-foreground">23%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Notif. push activas</span><span className="font-semibold text-foreground">61%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Versión app más usada</span><span className="font-semibold text-foreground">v2.1</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Idiomas */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Idiomas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {LANGUAGES.map(l => (
              <div key={l.label} className="flex items-center gap-3">
                <span className="text-xs text-foreground flex-1">{l.label}</span>
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${l.color} rounded-full`} style={{ width: `${l.value}%` }} />
                </div>
                <span className="text-xs font-bold text-foreground w-8 text-right">{l.value}%</span>
              </div>
            ))}
            <div className="pt-3 border-t border-border space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Zona horaria top</span><span className="font-semibold text-foreground">UTC-4 (VET)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Hora pico de uso</span><span className="font-semibold text-foreground">8pm - 11pm</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Crecimiento por país */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Crecimiento semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {GROWTH_BY_COUNTRY.map(g => (
              <div key={g.label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-foreground">{g.label}</span>
                  <Badge className="text-[10px] border-0 bg-emerald-500/15 text-emerald-500">+{g.change}%</Badge>
                </div>
                <MiniBar data={g.weekly} color="bg-primary" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
