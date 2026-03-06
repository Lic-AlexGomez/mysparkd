"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import type { UserProfile, Post } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Loader2, User, Hash, FileText } from "lucide-react"
import { toast } from "sonner"
import { PostCard } from "@/components/feed/post-card"
import { useAuth } from "@/lib/auth-context"
import { getFeatureFlags } from "@/lib/utils/feature-flags"

export default function SearchPage() {
  const { user } = useAuth()
  const features = getFeatureFlags(user?.email)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || "")
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'hashtags'>(searchParams.get('type') as any || 'users')
  const [userResults, setUserResults] = useState<UserProfile[]>([])
  const [postResults, setPostResults] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!features.searchPage) {
      toast.error("Esta funcionalidad no está disponible aún")
      router.push('/feed')
    }
  }, [features.searchPage, router])

  if (!features.searchPage) {
    return null
  }

  useEffect(() => {
    const q = searchParams.get('q')
    const type = searchParams.get('type')
    if (q) {
      setQuery(q)
      if (type === 'hashtag') {
        setActiveTab('hashtags')
        handleSearchHashtag(q)
      } else if (type === 'user') {
        setActiveTab('users')
        handleSearchUsers(q)
      }
    }
  }, [searchParams])

  const handleSearchUsers = async (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) return
    
    setIsLoading(true)
    try {
      const data = await api.get<UserProfile[]>(`/api/search/users?query=${encodeURIComponent(q)}`)
      setUserResults(data)
    } catch {
      toast.error("Error al buscar usuarios")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchPosts = async () => {
    if (!query.trim()) return
    
    setIsLoading(true)
    try {
      // TODO: Implementar endpoint de búsqueda de posts en backend
      // const data = await api.get<Post[]>(`/api/search/posts?query=${encodeURIComponent(query)}`)
      // setPostResults(data)
      toast.info("Búsqueda de posts pendiente de implementación en backend")
      setPostResults([])
    } catch {
      toast.error("Error al buscar posts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchHashtag = async (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) return
    
    setIsLoading(true)
    try {
      // TODO: Implementar endpoint de búsqueda por hashtag en backend
      // const data = await api.get<Post[]>(`/api/search/hashtag?tag=${encodeURIComponent(q)}`)
      // setPostResults(data)
      toast.info("Búsqueda por hashtag pendiente de implementación en backend")
      setPostResults([])
    } catch {
      toast.error("Error al buscar hashtag")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    if (activeTab === 'users') handleSearchUsers()
    else if (activeTab === 'posts') handleSearchPosts()
    else if (activeTab === 'hashtags') handleSearchHashtag()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Buscar</h1>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder={activeTab === 'hashtags' ? 'Buscar hashtag...' : activeTab === 'posts' ? 'Buscar posts...' : 'Buscar usuarios...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="pl-10 pr-24 h-12"
        />
        <Button
          onClick={handleSearch}
          disabled={isLoading}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="hashtags" className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Hashtags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          {userResults.length > 0 ? (
            <div className="space-y-3">
              {userResults.map((user) => (
                <div
                  key={user.userId}
                  onClick={() => router.push(`/profile/${user.userId}`)}
                  className="flex items-center gap-4 p-4 bg-card rounded-2xl border hover:border-primary/30 cursor-pointer transition-colors"
                >
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.photos?.find(p => p.isPrimary)?.url} />
                    <AvatarFallback>{user.nombres[0]}{user.apellidos[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h3 className="font-bold">{user.nombres} {user.apellidos}</h3>
                    {user.username && <p className="text-sm text-muted-foreground">@{user.username}</p>}
                    {user.bio && <p className="text-sm line-clamp-1">{user.bio}</p>}
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
          {postResults.length > 0 ? (
            <div className="space-y-3">
              {postResults.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : !isLoading && query ? (
            <div className="text-center py-20">
              <Hash className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No se encontraron posts con #{query}</p>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
