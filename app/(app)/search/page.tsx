"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import type { UserProfile, Post } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Loader2, User, Hash, FileText, TrendingUp } from "lucide-react"
import { PostCard } from "@/components/feed/post-card"
import { useAuth } from "@/lib/auth-context"

interface Hashtag {
  tag: string
  usageCount: number
}

interface AutocompleteResult {
  users: UserProfile[]
  hashtags: Hashtag[]
  posts: Post[]
}

export default function SearchPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || "")
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'hashtags'>(searchParams.get('type') as any || 'users')
  const [userResults, setUserResults] = useState<UserProfile[]>([])
  const [postResults, setPostResults] = useState<Post[]>([])
  const [hashtagResults, setHashtagResults] = useState<Hashtag[]>([])
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([])
  const [autocomplete, setAutocomplete] = useState<AutocompleteResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const autocompleteTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // cargar trending al montar
    api.get<Hashtag[]>('/api/search/hashtags/trending?limit=10')
      .then(setTrendingHashtags)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const q = searchParams.get('q')
    const type = searchParams.get('type')
    if (q) {
      setQuery(q)
      if (type === 'hashtag') { setActiveTab('hashtags'); doSearchHashtag(q) }
      else if (type === 'user') { setActiveTab('users'); doSearchUsers(q) }
    }
  }, [searchParams])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (autocompleteTimeout.current) clearTimeout(autocompleteTimeout.current)
    if (val.length >= 2) {
      autocompleteTimeout.current = setTimeout(async () => {
        try {
          const res = await api.get<AutocompleteResult>(`/api/search/autocomplete?q=${encodeURIComponent(val)}`)
          setAutocomplete(res)
        } catch {}
      }, 300)
    } else {
      setAutocomplete(null)
    }
  }

  const doSearchUsers = async (q: string) => {
    setIsLoading(true)
    try {
      const res = await api.get<AutocompleteResult>(`/api/search/autocomplete?q=${encodeURIComponent('@' + q.replace(/^@/, ''))}`)
      setUserResults(res.users || [])
    } catch { setUserResults([]) }
    finally { setIsLoading(false) }
  }

  const doSearchHashtag = async (q: string) => {
    setIsLoading(true)
    const tag = q.replace(/^#/, '')
    try {
      const [posts, tags] = await Promise.all([
        api.get<{ content: Post[] }>(`/api/search/hashtags/${encodeURIComponent(tag)}/posts?page=0&size=20`)
          .then(r => (r as any).content || r as any)
          .catch(() => []),
        api.get<Hashtag[]>(`/api/search/hashtags?query=${encodeURIComponent(tag)}`).catch(() => [])
      ])
      setPostResults(Array.isArray(posts) ? posts : [])
      setHashtagResults(Array.isArray(tags) ? tags : [])
    } catch { setPostResults([]); setHashtagResults([]) }
    finally { setIsLoading(false) }
  }

  const doSearchGeneral = async (q: string) => {
    setIsLoading(true)
    try {
      const res = await api.get<AutocompleteResult>(`/api/search/general?query=${encodeURIComponent(q)}`)
      setUserResults(res.users || [])
      setPostResults(res.posts || [])
      setHashtagResults(res.hashtags || [])
    } catch {}
    finally { setIsLoading(false) }
  }

  const handleSearch = () => {
    setAutocomplete(null)
    if (!query.trim()) return
    if (activeTab === 'users') doSearchUsers(query)
    else if (activeTab === 'hashtags') doSearchHashtag(query)
    else doSearchGeneral(query)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Buscar</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder={activeTab === 'hashtags' ? '#hashtag...' : activeTab === 'posts' ? 'Buscar posts...' : '@usuario o texto...'}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="pl-10 pr-24 h-12"
        />
        <Button onClick={handleSearch} disabled={isLoading} className="absolute right-1 top-1/2 -translate-y-1/2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
        </Button>

        {/* Autocomplete dropdown */}
        {autocomplete && (autocomplete.users.length > 0 || autocomplete.hashtags.length > 0) && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            {autocomplete.users.slice(0, 3).map(u => (
              <button
                key={u.userId}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                onClick={() => { setAutocomplete(null); router.push(`/profile/${u.userId}`) }}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={u.profilePictureUrl} />
                  <AvatarFallback className="text-xs">{u.nombres?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{u.nombres} {u.apellidos}</p>
                  {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                </div>
              </button>
            ))}
            {autocomplete.hashtags.slice(0, 3).map(h => (
              <button
                key={h.tag}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                onClick={() => { setQuery('#' + h.tag); setActiveTab('hashtags'); setAutocomplete(null); doSearchHashtag(h.tag) }}
              >
                <Hash className="h-4 w-4 text-primary" />
                <span className="text-sm">#{h.tag}</span>
                <span className="text-xs text-muted-foreground ml-auto">{h.usageCount} posts</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />Usuarios
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />Posts
          </TabsTrigger>
          <TabsTrigger value="hashtags" className="flex items-center gap-2">
            <Hash className="h-4 w-4" />Hashtags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          {userResults.length > 0 ? (
            <div className="space-y-3">
              {userResults.map((u) => (
                <div
                  key={u.userId}
                  onClick={() => router.push(`/profile/${u.userId}`)}
                  className="flex items-center gap-4 p-4 bg-card rounded-2xl border hover:border-primary/30 cursor-pointer transition-colors"
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={u.profilePictureUrl || u.photos?.find(p => p.isPrimary)?.url} />
                    <AvatarFallback>{u.nombres?.[0]}{u.apellidos?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-bold">{u.nombres} {u.apellidos}</h3>
                    {u.username && <p className="text-sm text-muted-foreground">@{u.username}</p>}
                    {u.bio && <p className="text-sm line-clamp-1 text-muted-foreground">{u.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : !isLoading && query ? (
            <div className="text-center py-20">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No se encontraron usuarios</p>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="posts" className="mt-6">
          {postResults.length > 0 ? (
            <div className="space-y-3">
              {postResults.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : !isLoading && query ? (
            <div className="text-center py-20">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No se encontraron posts</p>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="hashtags" className="mt-6">
          {/* Trending si no hay búsqueda */}
          {!query && trendingHashtags.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Tendencias</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingHashtags.map(h => (
                  <button
                    key={h.tag}
                    onClick={() => { setQuery('#' + h.tag); doSearchHashtag(h.tag) }}
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
          {hashtagResults.length > 0 && (
            <div className="space-y-2 mb-4">
              {hashtagResults.map(h => (
                <button
                  key={h.tag}
                  onClick={() => doSearchHashtag(h.tag)}
                  className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border hover:border-primary/30 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Hash className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">#{h.tag}</p>
                    <p className="text-xs text-muted-foreground">{h.usageCount} posts</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {postResults.length > 0 ? (
            <div className="space-y-3">
              {postResults.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : !isLoading && query ? (
            <div className="text-center py-20">
              <Hash className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No se encontraron posts con #{query.replace(/^#/, '')}</p>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
