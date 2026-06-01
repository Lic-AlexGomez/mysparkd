"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2, Heart, ArrowLeft } from "lucide-react"
import { swipeService } from "@/lib/services/swipe"
import { getDatingDisplayName, getProfilePath } from "@/lib/dm-eligibility"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import type { UserProfile } from "@/lib/types"

export default function ILikedPage() {
  const { user } = useAuth()
  const { te } = useI18n()
  const router = useRouter()
  const [rows, setRows] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void swipeService.getILiked().then((data) => {
      setRows(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{te("A quienes diste like", "People you liked")}</h1>
          <p className="text-sm text-muted-foreground">
            {te("Perfiles con swipe positivo", "Profiles you swiped right on")}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">
          {te("Aún no has dado like a nadie", "You haven't liked anyone yet")}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((p) => {
            const photo = p.profilePictureUrl || p.photos?.[0]?.url
            const name = getDatingDisplayName(p.nombres || p.username, p.username || "?")
            return (
              <li key={p.userId}>
                <Link
                  href={getProfilePath(p.userId, "DATING", { viewerUserId: user?.userId })}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 hover:border-primary/30"
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={photo} className="object-cover" />
                    <AvatarFallback>{name[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{name}</p>
                    {p.username && (
                      <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
                    )}
                  </div>
                  <Heart className="h-5 w-5 text-secondary fill-secondary shrink-0" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
