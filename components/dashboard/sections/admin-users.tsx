"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { StatCard, SectionTitle, ProgressRow, MiniBar } from "./shared"
import { Users, UserPlus, Crown, UserX, Search, TrendingUp, MapPin, Calendar } from "lucide-react"

const STATS = [
  { label: "Total usuarios",      value: "12,847", change: +8,  icon: Users,    color: "bg-violet-500" },
  { label: "Nuevos hoy",          value: "47",     change: +23, icon: UserPlus, color: "bg-emerald-500" },
  { label: "Premium",             value: "892",    change: +5,  icon: Crown,    color: "bg-amber-500" },
  { label: "Baneados",            value: "23",     change: -2,  icon: UserX,    color: "bg-rose-500" },
]

const USERS = [
  { id: "u1", username: "sofia_m",    email: "sofia@gmail.com",   joined: "hace 2h",    premium: true,  status: "activo",   matches: 34, posts: 12 },
  { id: "u2", username: "carlos_r",   email: "carlos@gmail.com",  joined: "hace 5h",    premium: false, status: "activo",   matches: 8,  posts: 3  },
  { id: "u3", username: "ana_lopez",  email: "ana@gmail.com",     joined: "hace 1d",    premium: true,  status: "activo",   matches: 67, posts: 28 },
  { id: "u4", username: "miguel_v",   email: "miguel@gmail.com",  joined: "hace 2d",    premium: false, status: "inactivo", matches: 2,  posts: 1  },
  { id: "u5", username: "lucia_p",    email: "lucia@gmail.com",   joined: "hace 3d",    premium: false, status: "activo",   matches: 15, posts: 7  },
  { id: "u6", username: "pedro_g",    email: "pedro@gmail.com",   joined: "hace 5d",    premium: true,  status: "activo",   matches: 89, posts: 45 },
  { id: "u7", username: "maria_t",    email: "maria@gmail.com",   joined: "hace 1sem",  premium: false, status: "baneado",  matches: 0,  posts: 0  },
  { id: "u8", username: "jose_r",     email: "jose@gmail.com",    joined: "hace 2sem",  premium: true,  status: "activo",   matches: 123, posts: 67 },
]

const GROWTH_WEEKLY = [28, 35, 42, 38, 51, 63, 47]
const AGE_DIST = [
  { label: "18-24", value: 4120, color: "bg-primary" },
  { label: "25-34", value: 5270, color: "bg-secondary" },
  { label: "35-44", value: 2310, color: "bg-amber-500" },
  { label: "45+",   value: 1147, color: "bg-muted-foreground" },
]
const GENDER_DIST = [
  { label: "Mujeres", value: 54, color: "bg-pink-500" },
  { label: "Hombres", value: 38, color: "bg-blue-500" },
  { label: "Otro",    value: 8,  color: "bg-violet-500" },
]

export function AdminUsers() {
  const [search, setSearch] = useState("")
  const filtered = USERS.filter(u =>
    u.username.includes(search.toLowerCase()) || u.email.includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Crecimiento + Demografía */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Nuevos usuarios (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black mb-3">347 <span className="text-sm font-normal text-muted-foreground">esta semana</span></p>
            <MiniBar data={GROWTH_WEEKLY} color="bg-emerald-500" />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-secondary" /> Edad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {AGE_DIST.map(a => (
              <ProgressRow key={a.label} label={a.label} value={a.value} max={5270} color={a.color} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Género
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {GENDER_DIST.map(g => (
              <div key={g.label} className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${g.color}`} />
                <span className="text-xs text-foreground flex-1">{g.label}</span>
                <span className="text-xs font-bold text-foreground">{g.value}%</span>
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${g.color} rounded-full`} style={{ width: `${g.value}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Perfil completo</span><span className="font-semibold text-foreground">78%</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Con foto</span><span className="font-semibold text-foreground">91%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de usuarios */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-sm">Usuarios recientes</CardTitle>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="pl-8 h-8 text-xs bg-muted border-border"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-5 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span className="col-span-2">Usuario</span>
            <span>Estado</span>
            <span>Matches</span>
            <span>Posts</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map(u => (
              <div key={u.id} className="grid grid-cols-5 gap-2 px-4 py-3 items-center hover:bg-muted/20 transition-colors">
                <div className="col-span-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-foreground">{u.username[0].toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate flex items-center gap-1">
                        @{u.username}
                        {u.premium && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.joined}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <Badge className={`text-[10px] border-0 ${
                    u.status === "activo"   ? "bg-emerald-500/15 text-emerald-500" :
                    u.status === "baneado"  ? "bg-rose-500/15 text-rose-500" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {u.status}
                  </Badge>
                </div>
                <span className="text-xs text-foreground font-medium">{u.matches}</span>
                <span className="text-xs text-foreground font-medium">{u.posts}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
