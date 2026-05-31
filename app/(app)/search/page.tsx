"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { UserProfile, Post } from "@/lib/types"
import { searchService, type HashtagResult } from "@/lib/services/search"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Loader2, User, Hash, FileText, TrendingUp, X, Trophy } from "lucide-react"
import { FeedRankingStrip } from "@/components/feed/feed-ranking-strip"
import { FeedEngagementSummary } from "@/components/feed/feed-engagement-summary"
import { PostCard } from "@/components/feed/post-card"
import { useExperienceMode } from "@/hooks/use-experience-mode"
import { useI18n } from "@/lib/i18n"
import { isDatingOnlySearchMode } from "@/lib/dm-eligibility"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { profileHref } from "@/lib/profile-route"

interface SearchResults {
  users: UserProfile[]
  posts: Post[]
  hashtags: HashtagResult[]
}

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const experienceMode = useExperienceMode()
  const { t, te } = useI18n()
  const { user } = useAuth()
  const datingSearchOnly = isDatingOnlySearchMode(experienceMode)

  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [activeTab, setActiveTab] = useState<"all" | "users" | "posts" | "hashtags">("all")
  const [results, setResults] = useState<SearchResults>({ users: [], posts: [], hashtags: [] })
  const [trendingHashtags, setTrendingHashtags] = useState<HashtagResult[]>([])
  const [autocomplete, setAutocomplete] = useState<SearchResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [usersPage, setUsersPage] = useState(0)
  const [postsPage, setPostsPage] = useState(0)
  const [canLoadMoreUsers, setCanLoadMoreUsers] = useState(false)
  const [canLoadMorePosts, setCanLoadMorePosts] = useState(false)
  const [rankingMode, setRankingMode] = useState<"global" | "local" | "following">("global")
  const [localFeedRadius, setLocalFeedRadius] = useState(50)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user?.userId) return
    try {
      const saved = localStorage.getItem(`sparkd_settings_${user.userId}`)
      if (saved) {
        const settings = JSON.parse(saved)
        setLocalFeedRadius(settings.localFeedRadius ?? 50)
      }
    } catch {
      /* ignore */
    }
  }, [user?.userId])

  useEffect(() => {
    searchService.getTrendingHashtags(10)
      .then(setTrendingHashtags)
      .catch(() => {})
  }, [])

  // Si viene con ?q= en la URL, buscar automáticamente
  useEffect(() => {
    const q = searchParams.get("q")
    if (q) { setQuery(q); doSearch(q) }
  }, [])

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    if (datingSearchOnly) return
    setIsLoading(true)
    setHasSearched(true)
    setAutocomplete(null)
    setUsersPage(0)
    setPostsPage(0)
    setCanLoadMoreUsers(false)
    setCanLoadMorePosts(false)

    try {
      // Búsqueda inteligente: detectar tipo por prefijo o buscar todo
      if (trimmed.startsWith("@")) {
        const userQuery = trimmed.slice(1)
        const usersRes = await searchService.searchUsers(userQuery, 0, 12)
        setResults({ users: usersRes.content || [], posts: [], hashtags: [] })
        setCanLoadMoreUsers(usersRes.number < usersRes.totalPages - 1)
        setActiveTab("users")
      } else if (trimmed.startsWith("#")) {
        const tag = trimmed.slice(1).trim()
        const [posts, hashtags] = await Promise.all([
          searchService.getPostsByHashtag(tag, 0, 12),
          searchService.searchHashtags(tag),
        ])
        setResults({ users: [], posts: posts.content || [], hashtags })
        setCanLoadMorePosts(posts.number < posts.totalPages - 1)
        setActiveTab("hashtags")
      } else {
        const intelligent = await searchService.searchIntelligent(trimmed)
        setResults({
          users: intelligent.users.slice(0, 12),
          posts: intelligent.posts.slice(0, 12),
          hashtags: intelligent.hashtags.slice(0, 12),
        })
        setCanLoadMoreUsers(intelligent.users.length >= 12)
        setCanLoadMorePosts(intelligent.posts.length >= 12)
        setActiveTab("all")
      }
    } catch {
      setResults({ users: [], posts: [], hashtags: [] })
    } finally {
      setIsLoading(false)
    }
  }, [datingSearchOnly])

  const handleQueryChange = (val: string) => {
    if (datingSearchOnly) return
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await searchService.autocomplete(val)
          const hasResults = (res.users?.length || 0) + (res.hashtags?.length || 0) + (res.posts?.length || 0) > 0
          setAutocomplete(hasResults ? res : null)
        } catch {}
      }, 300)
    } else {
      setAutocomplete(null)
    }
  }

  const handleSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    doSearch(query)
  }

  const clearSearch = () => {
    setQuery("")
    setAutocomplete(null)
    setHasSearched(false)
    setResults({ users: [], posts: [], hashtags: [] })
    setUsersPage(0)
    setPostsPage(0)
    setCanLoadMoreUsers(false)
    setCanLoadMorePosts(false)
    inputRef.current?.focus()
  }

  const handleLoadMoreUsers = async () => {
    if (isLoadingMore || !canLoadMoreUsers) return
    setIsLoadingMore(true)
    try {
      const q = query.trim().replace(/^@/, "")
      const nextPage = usersPage + 1
      const res = await searchService.searchUsers(q, nextPage, 12)
      setResults((prev) => ({ ...prev, users: [...prev.users, ...(res.content || [])] }))
      setUsersPage(nextPage)
      setCanLoadMoreUsers(res.number < res.totalPages - 1)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleLoadMorePosts = async () => {
    if (isLoadingMore || !canLoadMorePosts) return
    setIsLoadingMore(true)
    try {
      const nextPage = postsPage + 1
      const trimmed = query.trim()
      const postRes = trimmed.startsWith("#")
        ? await searchService.getPostsByHashtag(trimmed.slice(1), nextPage, 12)
        : await searchService.searchPosts(trimmed, nextPage, 12)
      setResults((prev) => ({ ...prev, posts: [...prev.posts, ...(postRes.content || [])] }))
      setPostsPage(nextPage)
      setCanLoadMorePosts(postRes.number < postRes.totalPages - 1)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const totalResults = results.users.length + results.posts.length + results.hashtags.length

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Buscar</h1>

      {datingSearchOnly && (
        <div className="mb-6 rounded-xl border border-primary/25 bg-primary/5 p-4 text-center">
          <p className="text-sm text-foreground">{t("dm.datingSearchRestricted")}</p>
          <Link
            href="/matches"
            className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
          >
            {t("dm.searchMatchesOnly")}
          </Link>
        </div>
      )}

      {/* Search input */}
      <div className="relative mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              placeholder={datingSearchOnly ? t("dm.searchMatchesOnly") : "Buscar usuarios, posts, #hashtags..."}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className={`pl-10 h-12 ${query ? "pr-10" : "pr-4"}`}
              autoFocus
              disabled={datingSearchOnly}
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label={te("Limpiar búsqueda", "Clear search")}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            onClick={handleSearch}
            disabled={datingSearchOnly || isLoading || !query.trim()}
            className="h-12 shrink-0 px-5"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : te("Buscar", "Search")}
          </Button>
        </div>

        {/* Autocomplete dropdown */}
        {autocomplete && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
            {autocomplete.users?.slice(0, 3).map((u, i) => (
              <button
                key={`ac-user-${u.userId || i}`}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                onClick={() => { setAutocomplete(null); router.push(profileHref(u.userId, user?.userId)) }}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={u.profilePictureUrl} />
                  <AvatarFallback className="text-xs">{u.nombres?.[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.nombres} {u.apellidos}</p>
                  {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                </div>
                <User className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
              </button>
            ))}
            {autocomplete.hashtags?.slice(0, 3).map((h, i) => (
              <button
                key={`ac-hashtag-${h.tag || i}`}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                onClick={() => { setQuery("#" + h.tag); setAutocomplete(null); doSearch("#" + h.tag) }}
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Hash className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">#{h.tag}</span>
                <span className="text-xs text-muted-foreground ml-auto">{h.usageCount} posts</span>
              </button>
            ))}
            {autocomplete.posts?.slice(0, 2).map((p, i) => (
              <button
                key={`ac-post-${p.id || i}`}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                onClick={() => { setAutocomplete(null); doSearch(query) }}
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm truncate flex-1">{p.body}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Explorar — ranking y tendencias (solo sin búsqueda activa) */}
      {!hasSearched && !datingSearchOnly && (
        <div className="mb-6 space-y-4">
          {user?.userId ? (
            <div>
              <p className="mb-2 text-sm font-semibold">
                {te("Tu actividad", "Your activity")}
              </p>
              <FeedEngagementSummary className="mx-0 mb-0 mt-0" />
            </div>
          ) : null}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">{te("Ranking", "Ranking")}</p>
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              {(
                [
                  { id: "global" as const, labelEs: "Global", labelEn: "Global" },
                  { id: "local" as const, labelEs: "Cerca", labelEn: "Nearby" },
                  { id: "following" as const, labelEs: "Siguiendo", labelEn: "Following" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setRankingMode(m.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    rankingMode === m.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {te(m.labelEs, m.labelEn)}
                </button>
              ))}
            </div>
            <FeedRankingStrip
              mode={rankingMode}
              radiusKm={localFeedRadius}
            />
          </div>
        </div>
      )}

      {/* Trending — solo cuando no hay búsqueda */}
      {!hasSearched && !datingSearchOnly && trendingHashtags.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Tendencias</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingHashtags.map(h => (
              <button
                key={h.tag}
                onClick={() => { setQuery("#" + h.tag); doSearch("#" + h.tag) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors"
              >
                <Hash className="h-3 w-3 text-primary" />
                <span className="text-sm text-primary font-medium">{h.tag}</span>
                <span className="text-xs text-muted-foreground">{h.usageCount}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resultados */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && hasSearched && (
        <>
          {totalResults === 0 ? (
            <div className="text-center py-20">
              <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="font-semibold text-foreground">Sin resultados para "{query}"</p>
              <p className="text-sm text-muted-foreground mt-1">Prueba con @usuario, #hashtag o texto del post</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="w-full grid grid-cols-4 mb-6">
                <TabsTrigger value="all">
                  Todo {totalResults > 0 && <span className="ml-1 text-xs opacity-70">({totalResults})</span>}
                </TabsTrigger>
                <TabsTrigger value="users">
                  <User className="h-3.5 w-3.5 mr-1" />
                  {results.users.length > 0 && <span className="text-xs opacity-70">({results.users.length})</span>}
                </TabsTrigger>
                <TabsTrigger value="posts">
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  {results.posts.length > 0 && <span className="text-xs opacity-70">({results.posts.length})</span>}
                </TabsTrigger>
                <TabsTrigger value="hashtags">
                  <Hash className="h-3.5 w-3.5 mr-1" />
                  {results.hashtags.length > 0 && <span className="text-xs opacity-70">({results.hashtags.length})</span>}
                </TabsTrigger>
              </TabsList>

              {/* Tab: Todo */}
              <TabsContent value="all" className="space-y-6">
                {results.users.length > 0 && (
                  <section>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Usuarios</p>
                    <div className="space-y-2">
                      {results.users.slice(0, 3).map(u => (
                        <UserCard key={u.userId} user={u} onClick={() => router.push(profileHref(u.userId, user?.userId))} />
                      ))}
                      {results.users.length > 3 && (
                        <button onClick={() => setActiveTab("users")} className="text-xs text-primary hover:underline pl-1">
                          Ver los {results.users.length} usuarios →
                        </button>
                      )}
                      {canLoadMoreUsers && (
                        <Button variant="outline" size="sm" onClick={handleLoadMoreUsers} disabled={isLoadingMore} className="mt-2">
                          {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Cargar más usuarios
                        </Button>
                      )}
                    </div>
                  </section>
                )}
                {results.hashtags.length > 0 && (
                  <section>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Hashtags</p>
                    <div className="flex flex-wrap gap-2">
                      {results.hashtags.slice(0, 6).map(h => (
                        <button
                          key={h.tag}
                          onClick={() => { setQuery("#" + h.tag); doSearch("#" + h.tag) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors"
                        >
                          <Hash className="h-3 w-3 text-primary" />
                          <span className="text-sm text-primary font-medium">{h.tag}</span>
                          <span className="text-xs text-muted-foreground">{h.usageCount}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
                {results.posts.length > 0 && (
                  <section>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Posts</p>
                    <div className="space-y-3">
                      {results.posts.slice(0, 3).map(post => (
                        <PostCard key={post.id} post={post} />
                      ))}
                      {results.posts.length > 3 && (
                        <button onClick={() => setActiveTab("posts")} className="text-xs text-primary hover:underline pl-1">
                          Ver los {results.posts.length} posts →
                        </button>
                      )}
                      {canLoadMorePosts && (
                        <Button variant="outline" size="sm" onClick={handleLoadMorePosts} disabled={isLoadingMore} className="mt-2">
                          {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Cargar más posts
                        </Button>
                      )}
                    </div>
                  </section>
                )}
              </TabsContent>

              {/* Tab: Usuarios */}
              <TabsContent value="users">
                {results.users.length > 0 ? (
                  <div className="space-y-2">
                    {results.users.map(u => (
                      <UserCard key={u.userId} user={u} onClick={() => router.push(profileHref(u.userId, user?.userId))} />
                    ))}
                    {canLoadMoreUsers && (
                      <Button variant="outline" className="w-full mt-2" onClick={handleLoadMoreUsers} disabled={isLoadingMore}>
                        {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Cargar más usuarios
                      </Button>
                    )}
                  </div>
                ) : (
                  <Empty icon={<User className="h-12 w-12" />} text="No se encontraron usuarios" />
                )}
              </TabsContent>

              {/* Tab: Posts */}
              <TabsContent value="posts">
                {results.posts.length > 0 ? (
                  <div className="space-y-3">
                    {results.posts.map(post => (
                      <PostCard key={post.id} post={post} />
                    ))}
                    {canLoadMorePosts && (
                      <Button variant="outline" className="w-full mt-2" onClick={handleLoadMorePosts} disabled={isLoadingMore}>
                        {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Cargar más posts
                      </Button>
                    )}
                  </div>
                ) : (
                  <Empty icon={<FileText className="h-12 w-12" />} text="No se encontraron posts" />
                )}
              </TabsContent>

              {/* Tab: Hashtags */}
              <TabsContent value="hashtags">
                {results.hashtags.length > 0 ? (
                  <div className="space-y-2">
                    {results.hashtags.map(h => (
                      <button
                        key={h.tag}
                        onClick={() => { setQuery("#" + h.tag); doSearch("#" + h.tag) }}
                        className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border hover:border-primary/30 transition-colors text-left"
                      >
                        {h.previewUrls && h.previewUrls.length > 0 ? (
                          <div className="flex gap-1 shrink-0">
                            {h.previewUrls.slice(0, 3).map((url, i) => (
                              <img
                                key={`${h.tag}-${i}`}
                                src={url}
                                alt=""
                                className="h-10 w-10 rounded-md object-cover border border-border"
                                loading="lazy"
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Hash className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold">#{h.tag}</p>
                          <p className="text-xs text-muted-foreground">{h.usageCount} posts</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <Empty icon={<Hash className="h-12 w-12" />} text="No se encontraron hashtags" />
                )}
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  )
}

function UserCard({ user, onClick }: { user: UserProfile; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-card rounded-2xl border hover:border-primary/30 cursor-pointer transition-colors"
    >
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage src={user.profilePictureUrl || user.photos?.find(p => p.isPrimary)?.url} />
        <AvatarFallback>{user.nombres?.[0]}{user.apellidos?.[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate">{user.nombres} {user.apellidos}</p>
        {user.username && <p className="text-sm text-muted-foreground">@{user.username}</p>}
        {user.bio && <p className="text-sm text-muted-foreground line-clamp-1">{user.bio}</p>}
      </div>
    </div>
  )
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      {icon}
      <p className="mt-4 text-sm">{text}</p>
    </div>
  )
}
