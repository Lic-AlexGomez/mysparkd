"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { usePremiumStatus } from "@/hooks/use-premium-status"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Heart, X, Star, Eye, User, Lock, Crown } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"

interface LikedMeProfile {
  profile: { userId: string; nombres: string; apellidos: string; sex: string; dateOfBirth: string; photos: { url: string; primary: boolean }[] }
  compatibilityScore: number
}

function LikesPaywall({ backendMessage }: { backendMessage?: string | null }) {
  const router = useRouter()
  const { te } = useI18n()
  return (
    <div className="relative mx-auto w-full max-w-[680px] min-h-[48vh] px-4 py-8">
      {/* Teaser: cartas difuminadas detrás del panel (#228) */}
      <div className="pointer-events-none absolute inset-x-4 top-8 grid grid-cols-2 gap-3 opacity-90 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`relative h-48 overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-muted to-card blur-md ${i % 2 ? "translate-y-4" : ""}`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-muted/30" />
            <div className="absolute bottom-3 left-3 h-4 w-24 rounded-md bg-white/20" />
            <div className="absolute bottom-8 left-3 h-3 w-16 rounded-md bg-white/10" />
          </div>
        ))}
      </div>
      <div className="relative z-10 flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-2xl border border-amber-500/20 bg-background/80 px-6 py-10 shadow-2xl shadow-black/10 backdrop-blur-md dark:bg-background/70">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-amber-500/20 rounded-full" />
          <div className="relative h-20 w-20 rounded-full border border-amber-500/30 bg-card flex items-center justify-center">
            <Lock className="h-9 w-9 text-amber-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-center">{te("Quién te dio like es Premium", "Who liked you is Premium")}</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {backendMessage || te("Los usuarios free no pueden ver la lista.", "Free users cannot view this list.")}
        </p>
        <Button onClick={() => router.push("/premium")} className="mt-2 bg-gradient-to-r from-primary to-secondary text-black font-bold px-8 py-6 rounded-2xl shadow-lg">
          <Crown className="h-4 w-4 mr-2" />{te("Desbloquear con Premium", "Unlock with Premium")}
        </Button>
      </div>
    </div>
  )
}

export function LikesSection() {
  const { te } = useI18n()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { isPremium, isLoading: subLoading } = usePremiumStatus()
  const [profiles, setProfiles] = useState<LikedMeProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiGated, setApiGated] = useState(false)
  const [apiGateMessage, setApiGateMessage] = useState<string | null>(null)

  const canSeeLikes = useMemo(() => Boolean(user?.premium || isPremium), [user?.premium, isPremium])
  const gatingLoading = authLoading || subLoading

  const fetchLikes = useCallback(async () => {
    if (!canSeeLikes) return
    setIsLoading(true); setApiGated(false); setApiGateMessage(null)
    try {
      const data = await api.get<LikedMeProfile[]>("/api/swipes/liked-me")
      setProfiles(Array.isArray(data) ? data : [])
    } catch (error) {
      setProfiles([])
      if (error instanceof ApiError && (error.status === 403 || error.status === 402)) {
        setApiGated(true); setApiGateMessage(error.message); return
      }
      toast.error(error instanceof ApiError ? error.message : te("No se pudo cargar la lista", "Could not load list"))
    } finally { setIsLoading(false) }
  }, [canSeeLikes])

  useEffect(() => {
    if (gatingLoading) return
    if (!canSeeLikes) { setIsLoading(false); setProfiles([]); return }
    void fetchLikes()
  }, [gatingLoading, canSeeLikes, fetchLikes])

  const handleSwipe = async (userId: string, type: "LIKE" | "DISLIKE") => {
    try {
      await api.post("/api/swipes/perform/swipe", { targetUserId: userId, type })
      setProfiles(prev => prev.filter(p => p.profile.userId !== userId))
      if (type === "LIKE") toast.success(te("¡Match realizado!", "Match created!"))
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) { toast.error(error.message || te("Límite diario alcanzado.", "Daily limit reached.")); return }
      toast.error(error instanceof ApiError ? error.message : te("Error al procesar", "Error processing"))
    }
  }

  const calculateAge = (dob: string) => {
    const today = new Date(); const birth = new Date(dob)
    let age = today.getFullYear() - birth.getFullYear()
    if (today.getMonth() - birth.getMonth() < 0 || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
    return age
  }

  if (gatingLoading || isLoading) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!canSeeLikes || apiGated) return <LikesPaywall backendMessage={apiGateMessage} />
  if (profiles.length === 0) return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 px-6">
      <Heart className="h-16 w-16 text-primary" />
      <p className="text-xl font-semibold">{te("Nadie te ha dado like aún", "No one has liked you yet")}</p>
      <Button onClick={() => router.push("/swipes")} className="bg-gradient-to-r from-primary to-secondary text-black font-semibold px-6 py-5 rounded-2xl">
        {te("Ir a Swipes", "Go to Swipes")}
      </Button>
    </div>
  )

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {profiles.map(item => {
        const p = item.profile
        const age = calculateAge(p.dateOfBirth)
        const photo = p.photos?.[0]?.url
        return (
          <div key={p.userId} className="relative overflow-hidden rounded-3xl border-2 border-primary/20 hover:border-primary/40 transition-all group bg-gradient-to-br from-card to-muted/20">
            <div className="relative h-80 overflow-hidden">
              {photo ? <img src={photo} alt={p.nombres} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                : <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><User className="h-32 w-32 text-primary/40" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {item.compatibilityScore > 70 && (
                <div className="absolute top-4 right-4 h-12 w-12 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg animate-pulse">
                  <Star className="h-6 w-6 text-black" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-2xl text-white">{p.nombres}</h3>
                    <p className="text-white/90 text-lg">{age} {te("años", "years")}</p>
                  </div>
                  <Badge className="bg-primary/90 text-white border-0"><Heart className="h-3 w-3 mr-1 fill-white" />{item.compatibilityScore}%</Badge>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleSwipe(p.userId, "DISLIKE")} size="icon" className="h-14 w-14 rounded-full bg-black/60 hover:bg-black/80 text-white border-2 border-white/20 hover:scale-110 transition-transform"><X className="h-6 w-6" /></Button>
                  <Button onClick={() => router.push(`/profile/${p.userId}`)} size="icon" className="h-14 w-14 rounded-full bg-black/60 hover:bg-black/80 text-white border-2 border-white/20 hover:scale-110 transition-transform"><Eye className="h-6 w-6" /></Button>
                  <Button onClick={() => handleSwipe(p.userId, "LIKE")} className="flex-1 h-14 rounded-full bg-gradient-to-r from-primary to-secondary text-black font-bold hover:scale-105 transition-transform shadow-lg">
                    <Heart className="h-5 w-5 mr-2 fill-current" />{te("Me gusta", "Like")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
