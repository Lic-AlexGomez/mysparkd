"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Users, Zap,
  Crown, BarChart3, Star, ArrowUpRight, ArrowDownRight, Flame,
  UserCheck, UserPlus, Repeat2, Share2, Bookmark, Clock,
  Activity, Target, Award, ChevronRight, Calendar, Globe,
} from "lucide-react"
import Link from "next/link"

// ─── Mock data ────────────────────────────────────────────────────────────────

const OVERVIEW_STATS = [
  { label: "Vistas de perfil", value: "3,842", change: +18, icon: Eye, color: "from-violet-500 to-purple-600" },
  { label: "Likes recibidos", value: "1,204", change: +12, icon: Heart, color: "from-pink-500 to-rose-600" },
  { label: "Nuevos seguidores", value: "247", change: +34, icon: UserPlus, color: "from-emerald-500 to-teal-600" },
  { label: "Matches", value: "58", change: -4, icon: Zap, color: "from-amber-500 to-orange-600" },
]

const ENGAGEMENT_WEEKLY = [
  { day: "Lun", likes: 42, comments: 18, views: 320 },
  { day: "Mar", likes: 67, comments: 24, views: 480 },
  { day: "Mié", likes: 38, comments: 12, views: 290 },
  { day: "Jue", likes: 91, comments: 35, views: 620 },
  { day: "Vie", likes: 124, comments: 48, views: 890 },
  { day: "Sáb", likes: 156, comments: 62, views: 1100 },
  { day: "Dom", likes: 88, comments: 31, views: 670 },
]

const TOP_POSTS = [
  { id: "1", body: "¡Increíble atardecer en la ciudad hoy 🌆", likes: 312, comments: 54, views: 2100, shares: 28, date: "hace 2 días" },
  { id: "2", body: "Nuevo proyecto en marcha, ¿quién se apunta? 🚀", likes: 245, comments: 89, views: 1840, shares: 41, date: "hace 4 días" },
  { id: "3", body: "Reflexión del día: el tiempo es lo más valioso...", likes: 198, comments: 37, views: 1320, shares: 15, date: "hace 1 semana" },
]

const RECENT_FOLLOWERS = [
  { userId: "u1", username: "sofia_m", name: "Sofía Martínez", photo: "", verified: true },
  { userId: "u2", username: "carlos_r", name: "Carlos Ruiz", photo: "", verified: false },
  { userId: "u3", username: "ana_lopez", name: "Ana López", photo: "", verified: true },
  { userId: "u4", username: "miguel_v", name: "Miguel Vargas", photo: "", verified: false },
  { userId: "u5", username: "lucia_p", name: "Lucía Pérez", photo: "", verified: false },
]

const AUDIENCE_BREAKDOWN = [
  { label: "Hombres", pct: 38, color: "bg-blue-500" },
  { label: "Mujeres", pct: 54, color: "bg-pink-500" },
  { label: "Otro", pct: 8, color: "bg-violet-500" },
]

const AGE_BREAKDOWN = [
  { label: "18-24", pct: 32, color: "bg-primary" },
  { label: "25-34", pct: 41, color: "bg-secondary" },
  { label: "35-44", pct: 18, color: "bg-amber-500" },
  { label: "45+", pct: 9, color: "bg-muted-foreground" },
]

const REACH_SOURCES = [
  { label: "Feed orgánico", pct: 48, icon: Globe },
  { label: "Búsqueda", pct: 22, icon: Target },
  { label: "Compartidos", pct: 18, icon: Share2 },
  { label: "Guardados", pct: 12, icon: Bookmark },
]

const ACHIEVEMENTS = [
  { label: "Creador activo", desc: "7 días seguidos publicando", icon: Flame, earned: true },
  { label: "Viral", desc: "Post con +1000 vistas", icon: TrendingUp, earned: true },
  { label: "Influencer", desc: "500 seguidores", icon: Star, earned: false },
  { label: "Top Match", desc: "50 matches en un mes", icon: Zap, earned: true },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ stat }: { stat: typeof OVERVIEW_STATS[0] }) {
  const positive = stat.change >= 0
  return (
    <Card className="border-border overflow-hidden">
      <CardContent className="p-0">
        <div className={`h-1.5 w-full bg-gradient-to-r ${stat.color}`} />
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <Badge
              variant="secondary"
              className={`text-xs font-semibold border-0 flex items-center gap-0.5 ${positive ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"}`}
            >
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(stat.change)}%
            </Badge>
          </div>
          <p className="mt-4 text-3xl font-black text-foreground">{stat.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function MiniBarChart() {
  const max = Math.max(...ENGAGEMENT_WEEKLY.map(d => d.views))
  return (
    <div className="flex items-end gap-1.5 h-28">
      {ENGAGEMENT_WEEKLY.map((d) => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col gap-0.5 items-center justify-end" style={{ height: 96 }}>
            <div
              className="w-full rounded-t-sm bg-gradient-to-t from-primary to-secondary opacity-80 transition-all duration-500"
              style={{ height: `${(d.views / max) * 96}px` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{d.day}</span>
        </div>
      ))}
    </div>
  )
}

function EngagementRow({ d }: { d: typeof ENGAGEMENT_WEEKLY[0] }) {
  const total = d.likes + d.comments
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-8 text-xs text-muted-foreground">{d.day}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
          style={{ width: `${(total / 220) * 100}%` }}
        />
      </div>
      <span className="w-8 text-xs text-right text-foreground font-medium">{total}</span>
    </div>
  )
}

function AudienceBar({ item }: { item: { label: string; pct: number; color: string } }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-xs text-muted-foreground">{item.label}</span>
      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${item.pct}%` }} />
      </div>
      <span className="w-8 text-xs font-semibold text-foreground text-right">{item.pct}%</span>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function Dashboard() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d")

  const displayName = user ? `${user.nombres}` : "Usuario"
  const initials = user ? `${user.nombres?.[0] ?? ""}${user.apellidos?.[0] ?? ""}` : "U"

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-primary/40">
            <AvatarImage src={user?.profilePictureUrl} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-black font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-black text-foreground">Hola, {displayName} 👋</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" /> Dashboard · última actualización hace 5 min
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d"] as const).map(p => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
              className={period === p ? "bg-primary text-black" : ""}
            >
              {p === "7d" ? "7 días" : p === "30d" ? "30 días" : "90 días"}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Overview stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {OVERVIEW_STATS.map(s => <StatCard key={s.label} stat={s} />)}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Actividad semanal */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Actividad semanal
              </CardTitle>
              <Badge variant="outline" className="text-xs">Vistas</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <MiniBarChart />
            <div className="border-t border-border pt-4 space-y-0.5">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Engagement por día</p>
              {ENGAGEMENT_WEEKLY.map(d => <EngagementRow key={d.day} d={d} />)}
            </div>
          </CardContent>
        </Card>

        {/* Resumen rápido */}
        <div className="flex flex-col gap-4">
          {/* Engagement rate */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Engagement Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-black text-foreground">6.8</span>
                <span className="text-lg text-muted-foreground mb-1">%</span>
                <Badge className="mb-1 bg-emerald-500/15 text-emerald-500 border-0 text-xs">
                  <ArrowUpRight className="h-3 w-3" />+1.2%
                </Badge>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: "68%" }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Promedio industria: 3.5%</p>
            </CardContent>
          </Card>

          {/* Fuentes de alcance */}
          <Card className="border-border flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-secondary" />
                Fuentes de alcance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {REACH_SOURCES.map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                    <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-foreground">{s.label}</span>
                      <span className="text-xs font-semibold text-foreground">{s.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Tabs: Posts / Audiencia / Logros ── */}
      <Tabs defaultValue="posts">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="posts">Top Posts</TabsTrigger>
          <TabsTrigger value="audience">Audiencia</TabsTrigger>
          <TabsTrigger value="achievements">Logros</TabsTrigger>
        </TabsList>

        {/* Top Posts */}
        <TabsContent value="posts" className="mt-4 space-y-3">
          {TOP_POSTS.map((post, idx) => (
            <Card key={post.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-black font-black text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-1">{post.body}</p>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Heart className="h-3 w-3 text-rose-500" /> {post.likes}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MessageCircle className="h-3 w-3 text-blue-500" /> {post.comments}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3 text-violet-500" /> {post.views}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Share2 className="h-3 w-3 text-emerald-500" /> {post.shares}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                        <Clock className="h-3 w-3" /> {post.date}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" className="w-full" asChild>
            <Link href="/feed">Ver todos los posts <ChevronRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </TabsContent>

        {/* Audiencia */}
        <TabsContent value="audience" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Género */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Género
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {AUDIENCE_BREAKDOWN.map(a => <AudienceBar key={a.label} item={a} />)}
              </CardContent>
            </Card>

            {/* Edad */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-secondary" /> Rango de edad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {AGE_BREAKDOWN.map(a => <AudienceBar key={a.label} item={a} />)}
              </CardContent>
            </Card>

            {/* Seguidores recientes */}
            <Card className="border-border md:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-500" /> Seguidores recientes
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
                    <Link href="/profile">Ver todos</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {RECENT_FOLLOWERS.map(f => (
                    <Link key={f.userId} href={`/profile/${f.userId}`} className="flex flex-col items-center gap-1.5 group">
                      <div className="relative">
                        <Avatar className="h-12 w-12 ring-2 ring-border group-hover:ring-primary transition-all">
                          <AvatarImage src={f.photo} />
                          <AvatarFallback className="bg-muted text-foreground text-xs font-bold">
                            {f.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {f.verified && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <Star className="h-2.5 w-2.5 text-black" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors max-w-[56px] truncate">
                        @{f.username}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logros */}
        <TabsContent value="achievements" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACHIEVEMENTS.map(a => (
              <Card key={a.label} className={`border-border transition-all ${a.earned ? "bg-gradient-to-br from-primary/5 to-secondary/5" : "opacity-50"}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${a.earned ? "bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30" : "bg-muted"}`}>
                    <a.icon className={`h-6 w-6 ${a.earned ? "text-black" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </div>
                  {a.earned ? (
                    <Badge className="bg-primary/20 text-primary border-0 text-xs shrink-0">Ganado</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs shrink-0">Pendiente</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Reputación */}
          <Card className="border-border mt-4">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <Award className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-foreground">Reputación</p>
                  <span className="text-lg font-black text-foreground">{user?.reputation ?? 420} pts</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    style={{ width: `${Math.min(((user?.reputation ?? 420) / 1000) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {1000 - (user?.reputation ?? 420)} pts para el siguiente nivel
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Quick actions ── */}
      <Card className="border-border bg-gradient-to-r from-primary/5 via-background to-secondary/5">
        <CardContent className="p-4">
          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" /> Acciones rápidas
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="bg-primary text-black hover:bg-primary/90" asChild>
              <Link href="/feed"><Zap className="h-3.5 w-3.5 mr-1.5" />Crear post</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/swipes"><Heart className="h-3.5 w-3.5 mr-1.5" />Explorar swipes</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/profile/edit"><UserCheck className="h-3.5 w-3.5 mr-1.5" />Editar perfil</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/premium"><Crown className="h-3.5 w-3.5 mr-1.5 text-amber-500" />Ver Premium</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
