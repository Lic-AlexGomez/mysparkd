"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { StoryGroup, StoryResponse, StoryAudience } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  X,
  ChevronLeft,
  MoreHorizontal,
  Eye,
  Trash2,
  Send,
  Plus,
  Heart,
} from "lucide-react"
import { profileHref } from "@/lib/profile-route"
import { cn } from "@/lib/utils"
import { cloudinaryStoryDisplayUrl } from "@/lib/cloudinary-display-url"

const STORY_MS = 5000
const REACTIONS = ["❤️", "👍", "😂", "😮", "🔥"] as const

export type StoryViewerStats = {
  viewers: Array<{
    userId: string
    username: string
    profilePictureUrl?: string
  }>
  reactions: Array<{
    userId: string
    username: string
    profilePictureUrl?: string
    reaction: string
  }>
}

type Props = {
  groups: StoryGroup[]
  activeGroupIndex: number
  activeStoryIndex: number
  currentStory?: StoryResponse
  currentGroup?: StoryGroup
  isOwnStory: boolean
  viewerUserId?: string
  viewCount: number
  paused: boolean
  isLoadingInsights: boolean
  showInsights: boolean
  insights: StoryViewerStats
  showComposer: boolean
  isUploading: boolean
  audience: StoryAudience
  loadError: string | null
  isTargetFilter: boolean
  reactionEmoji: Record<string, string>
  te: (es: string, en: string) => string
  t: (key: string) => string
  onClose: () => void
  onPause: (paused: boolean) => void
  onBack: () => void
  onNext: () => void
  onOpenInsights: () => void
  onCloseInsights: () => void
  onDelete: () => void
  onReact: (emoji: string) => void
  onAudienceChange: (a: StoryAudience) => void
  onToggleComposer: () => void
  onUpload: (file: File) => void
  onReload: () => void
  onViewAll: () => void
  onSwitchGroup: (index: number) => void
}

export function StoriesViewer({
  groups,
  activeGroupIndex,
  activeStoryIndex,
  currentStory,
  currentGroup,
  isOwnStory,
  viewerUserId,
  viewCount,
  paused,
  isLoadingInsights,
  showInsights,
  insights,
  showComposer,
  isUploading,
  audience,
  loadError,
  isTargetFilter,
  reactionEmoji,
  te,
  t,
  onClose,
  onPause,
  onBack,
  onNext,
  onOpenInsights,
  onCloseInsights,
  onDelete,
  onReact,
  onAudienceChange,
  onToggleComposer,
  onUpload,
  onReload,
  onViewAll,
  onSwitchGroup,
}: Props) {
  const router = useRouter()
  const [showReact, setShowReact] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [replyText, setReplyText] = useState("")
  const holdRef = useRef(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [exiting, setExiting] = useState(false)

  const requestClose = () => {
    if (exiting) return
    setExiting(true)
    window.setTimeout(() => onClose(), 200)
  }

  useEffect(() => {
    setShowReact(false)
    setShowMenu(false)
  }, [activeGroupIndex, activeStoryIndex])

  const hasMedia = Boolean(currentStory?.mediaUrl)
  const segmentCount = currentGroup?.stories.length ?? 0

  const displayMediaUrl = useMemo(() => {
    if (!currentStory?.mediaUrl) return ""
    const w = typeof window !== "undefined" ? window.innerWidth : 390
    const h = typeof window !== "undefined" ? window.innerHeight : 844
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2
    const isVideo = currentStory.mediaType === "VIDEO"
    return cloudinaryStoryDisplayUrl(currentStory.mediaUrl, {
      width: w,
      height: h,
      pixelRatio: dpr,
      isVideo,
    })
  }, [currentStory?.id, currentStory?.mediaUrl, currentStory?.mediaType])

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center bg-black text-white transition-opacity duration-200 ease-out",
        exiting && "pointer-events-none opacity-0"
      )}
    >
      <div className="relative flex h-full w-full max-w-[420px] flex-col bg-black">
      {/* Media */}
      <div
        className="relative min-h-0 flex-1 bg-black"
        onPointerDown={() => {
          holdRef.current = true
          onPause(true)
        }}
        onPointerUp={() => {
          if (holdRef.current) onPause(false)
          holdRef.current = false
        }}
        onPointerLeave={() => {
          if (holdRef.current) onPause(false)
          holdRef.current = false
        }}
      >
        {hasMedia ? (
          currentStory!.mediaType === "VIDEO" ? (
            <video
              key={currentStory!.id}
              src={displayMediaUrl || currentStory!.mediaUrl}
              className="h-full w-full object-contain"
              autoPlay
              muted
              playsInline
              onEnded={onNext}
            />
          ) : (
            <img
              key={currentStory!.id}
              src={displayMediaUrl || currentStory!.mediaUrl}
              alt=""
              className="h-full w-full object-contain"
              draggable={false}
              decoding="sync"
              fetchPriority="high"
            />
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/5">
              <span className="text-3xl">✦</span>
            </div>
            <div className="max-w-xs text-center">
              <p className="text-lg font-medium">
                {isTargetFilter
                  ? te("Sin historias", "No stories")
                  : te("Nada que ver", "Nothing to see")}
              </p>
              <p className="mt-2 text-sm text-white/50">
                {loadError ||
                  (isTargetFilter
                    ? te("Este usuario no tiene historias activas.", "No active stories from this user.")
                    : te("Publica la primera o explora el feed.", "Post the first one or browse the feed."))}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" size="sm" onClick={onReload}>
                {t("common.reload")}
              </Button>
              {isTargetFilter ? (
                <Button variant="ghost" size="sm" className="text-white" onClick={onViewAll}>
                  {te("Ver todas", "See all")}
                </Button>
              ) : (
                <Button size="sm" onClick={onToggleComposer}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  {te("Crear", "Create")}
                </Button>
              )}
            </div>
          </div>
        )}

        {paused && hasMedia ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
            <div className="rounded-md bg-black/55 px-3 py-1.5 text-xs font-medium tracking-wide text-white/90">
              {te("PAUSA", "PAUSED")}
            </div>
          </div>
        ) : null}
      </div>

      {/* Tap zones */}
      {hasMedia ? (
        <>
          <button
            type="button"
            className="absolute left-0 top-0 z-20 h-full w-[28%]"
            onClick={onBack}
            aria-label={te("Anterior", "Previous")}
          />
          <button
            type="button"
            className="absolute right-0 top-0 z-20 h-full w-[72%]"
            onClick={onNext}
            aria-label={te("Siguiente", "Next")}
          />
        </>
      ) : null}

      {/* Chrome superior */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-6 pt-[max(10px,env(safe-area-inset-top))]">
        {segmentCount > 0 ? (
          <div className="pointer-events-auto flex gap-[3px] px-2.5">
            {currentGroup!.stories.map((s, i) => (
              <div key={s.id} className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/35">
                <div
                  className={cn(
                    "h-full rounded-full bg-white",
                    i < activeStoryIndex && "w-full",
                    i > activeStoryIndex && "w-0",
                    i === activeStoryIndex &&
                      !paused &&
                      !showInsights &&
                      !showComposer &&
                      "story-progress-bar"
                  )}
                  key={
                    i === activeStoryIndex
                      ? `seg-${activeGroupIndex}-${activeStoryIndex}-${paused}`
                      : s.id
                  }
                  style={
                    i === activeStoryIndex && !paused && !showInsights && !showComposer
                      ? { animationDuration: `${STORY_MS}ms` }
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        ) : null}

        <div className="pointer-events-auto mt-3 flex items-center gap-2 px-3">
          <button
            type="button"
            onClick={requestClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/95"
            aria-label={te("Cerrar", "Close")}
          >
            <ChevronLeft className="h-7 w-7 stroke-[2.5]" />
          </button>

          {currentGroup ? (
            <button
              type="button"
              onClick={() => router.push(profileHref(currentGroup.userId, viewerUserId))}
              className="flex min-w-0 flex-1 items-center gap-2.5"
            >
              <Avatar className="h-9 w-9 ring-1 ring-white/25">
                <AvatarImage src={currentGroup.profilePictureUrl} />
                <AvatarFallback className="bg-white/10 text-xs">
                  {currentGroup.username?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-left leading-tight">
                <p className="truncate text-[15px] font-semibold">{currentGroup.username}</p>
                <p className="text-[11px] text-white/55">
                  {segmentCount > 0
                    ? `${activeStoryIndex + 1} / ${segmentCount}`
                    : te("Sin publicaciones", "No posts")}
                </p>
              </div>
            </button>
          ) : (
            <span className="flex-1 text-sm font-semibold">Stories</span>
          )}

          {isOwnStory && hasMedia ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white"
              >
                <MoreHorizontal className="h-6 w-6" />
              </button>
              {showMenu ? (
                <div className="absolute right-0 top-10 min-w-[160px] overflow-hidden rounded-xl border border-white/10 bg-zinc-900/95 py-1 shadow-xl backdrop-blur-md">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-white/10"
                    onClick={() => {
                      setShowMenu(false)
                      onOpenInsights()
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    {te("Vistas", "Views")} ({viewCount})
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-400 hover:bg-white/10"
                    onClick={() => {
                      setShowMenu(false)
                      onDelete()
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    {te("Eliminar", "Delete")}
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-white/10"
                    onClick={() => {
                      setShowMenu(false)
                      onToggleComposer()
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    {te("Nueva story", "New story")}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={requestClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      {/* Caption */}
      {currentStory?.caption ? (
        <div className="pointer-events-none absolute bottom-24 left-0 right-0 z-20 px-4">
          <p className="text-[15px] font-medium leading-snug drop-shadow-lg">{currentStory.caption}</p>
        </div>
      ) : null}

      {/* Footer: reply + react (others) */}
      {hasMedia && !isOwnStory && !showInsights && !showComposer ? (
        <div className="pointer-events-auto absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 to-transparent px-3 pb-[max(14px,env(safe-area-inset-bottom))] pt-8">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={te("Responder…", "Reply…")}
              className="h-11 flex-1 rounded-full border border-white/15 bg-white/10 px-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
              onFocus={() => onPause(true)}
              onBlur={() => onPause(false)}
            />
            <button
              type="button"
              onClick={() => setShowReact((v) => !v)}
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10",
                showReact && "border-pink-500/50 bg-pink-500/20"
              )}
            >
              <Heart className={cn("h-5 w-5", showReact && "fill-pink-500 text-pink-500")} />
            </button>
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black"
              onClick={() => {
                if (replyText.trim()) onReact("❤️")
              }}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>

          {showReact ? (
            <div className="mt-2 flex justify-between gap-1 rounded-2xl bg-black/50 px-2 py-2 backdrop-blur-sm">
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="flex h-11 flex-1 items-center justify-center rounded-xl text-2xl transition hover:bg-white/10 active:scale-110"
                  onClick={() => {
                    onReact(emoji)
                    setShowReact(false)
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Dots: cambiar de usuario (solo si hay varios) */}
      {groups.length > 1 && hasMedia && !showComposer && !showInsights ? (
        <div className="pointer-events-auto absolute bottom-[88px] left-0 right-0 z-20 flex justify-center gap-1.5">
          {groups.map((g, i) => (
            <button
              key={g.userId}
              type="button"
              onClick={() => {
                if (i !== activeGroupIndex) onSwitchGroup(i)
              }}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === activeGroupIndex ? "w-5 bg-white" : "w-1.5 bg-white/35 hover:bg-white/55"
              )}
              aria-label={g.username}
            />
          ))}
        </div>
      ) : null}

      {/* Composer sheet */}
      {showComposer ? (
        <div
          className="absolute inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
          onClick={onToggleComposer}
        >
          <div
            className="w-full rounded-t-2xl bg-zinc-900 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-white/20" />
            <p className="mb-4 text-center text-base font-semibold">
              {te("Nueva historia", "New story")}
            </p>
            <Select value={audience} onValueChange={(v) => onAudienceChange(v as StoryAudience)}>
              <SelectTrigger className="mb-3 border-white/10 bg-black/40 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">{te("Público", "Public")}</SelectItem>
                <SelectItem value="SPARKLING_LIST">Sparkling List</SelectItem>
              </SelectContent>
            </Select>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onUpload(f)
                e.target.value = ""
              }}
            />
            <Button
              className="w-full h-12 text-base"
              disabled={isUploading}
              onClick={() => fileRef.current?.click()}
            >
              {isUploading ? te("Subiendo…", "Uploading…") : te("Elegir de galería", "Choose from gallery")}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Insights sheet */}
      {showInsights ? (
        <div
          className="absolute inset-0 z-50 flex items-end bg-black/50"
          onClick={onCloseInsights}
        >
          <div
            className="max-h-[70vh] w-full overflow-y-auto rounded-t-2xl bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950 px-4 py-3">
              <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-white/20" />
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{te("Actividad", "Activity")}</h3>
                <button type="button" onClick={onCloseInsights} className="p-1 text-white/60">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {isLoadingInsights ? (
              <div className="py-12 text-center text-sm text-white/50">{te("Cargando…", "Loading…")}</div>
            ) : (
              <div className="space-y-6 px-4 py-4 pb-8">
                {insights.reactions.length > 0 ? (
                  <section>
                    <p className="mb-2 text-xs uppercase tracking-wider text-white/45">
                      {te("Reacciones", "Reactions")}
                    </p>
                    {insights.reactions.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 py-2">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={r.profilePictureUrl} />
                          <AvatarFallback>{r.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-sm">{r.username}</span>
                        <span>{reactionEmoji[r.reaction] || r.reaction}</span>
                      </div>
                    ))}
                  </section>
                ) : null}
                <section>
                  <p className="mb-2 text-xs uppercase tracking-wider text-white/45">
                    {te("Vistas", "Views")} · {insights.viewers.length}
                  </p>
                  {insights.viewers.length === 0 ? (
                    <p className="text-sm text-white/40">{te("Aún sin vistas", "No views yet")}</p>
                  ) : (
                    insights.viewers.map((v, i) => (
                      <div key={i} className="flex items-center gap-3 py-2">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={v.profilePictureUrl} />
                          <AvatarFallback>{v.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{v.username}</span>
                      </div>
                    ))
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      ) : null}
      </div>
    </div>
  )
}
