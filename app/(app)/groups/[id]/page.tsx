"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/feed/post-card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Users, Settings, Shield, Crown, Plus, Send } from "lucide-react"
import { toast } from "sonner"
import type { Post } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { getFeatureFlags } from "@/lib/utils/feature-flags"

export default function GroupDetailPage() {
  const { user } = useAuth()
  const features = getFeatureFlags(user?.email)
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("posts")
  const [showPostDialog, setShowPostDialog] = useState(false)
  const [postContent, setPostContent] = useState("")
  const [userRole, setUserRole] = useState<'ADMIN' | 'MODERATOR' | 'MEMBER'>('MEMBER')

  const group = {
    id: params.id,
    name: "Viajeros del Mundo",
    description: "Comparte tus aventuras y descubre nuevos destinos",
    memberCount: 1234,
    isAdmin: userRole === 'ADMIN',
    isModerator: userRole === 'MODERATOR' || userRole === 'ADMIN'
  }

  const posts: Post[] = []

  const members = [
    { id: "1", username: "carlos", role: "ADMIN" },
    { id: "2", username: "maria", role: "MODERATOR" },
    { id: "3", username: "juan", role: "MEMBER" },
  ]

  const handleCreatePost = () => {
    if (!postContent.trim()) {
      toast.error("Escribe algo")
      return
    }
    toast.success("Post publicado en el grupo")
    setPostContent("")
    setShowPostDialog(false)
  }

  const handleChangeRole = (userId: string, newRole: string) => {
    toast.success(`Rol actualizado a ${newRole}`)
  }

  const handleRemoveMember = (userId: string) => {
    toast.success("Miembro removido del grupo")
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
            <p className="text-muted-foreground mt-1">{group.description}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{group.memberCount.toLocaleString()} miembros</span>
              </div>
              {group.isAdmin && (
                <Badge className="bg-primary/10 text-primary border-0">
                  <Crown className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
              {group.isModerator && !group.isAdmin && (
                <Badge className="bg-secondary/10 text-secondary border-0">
                  <Shield className="h-3 w-3 mr-1" />
                  Moderador
                </Badge>
              )}
            </div>
          </div>
          {group.isAdmin && (
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          {features.groupRoles && (
            <TabsTrigger value="members">Miembros</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {features.groupPosts && (
            <Button
              onClick={() => setShowPostDialog(true)}
              className="w-full mb-4 bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Publicar en el grupo
            </Button>
          )}

          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No hay posts aún</p>
              {features.groupPosts && (
                <p className="text-sm text-muted-foreground mt-2">Sé el primero en publicar</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>

        {features.groupRoles && (
          <TabsContent value="members" className="mt-6">
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-card rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{member.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{member.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {member.role === 'ADMIN' && (
                        <Badge className="bg-primary/10 text-primary border-0 text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {member.role === 'MODERATOR' && (
                        <Badge className="bg-secondary/10 text-secondary border-0 text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Moderador
                        </Badge>
                      )}
                      {member.role === 'MEMBER' && (
                        <Badge variant="outline" className="text-xs">Miembro</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {group.isAdmin && member.role !== 'ADMIN' && (
                  <div className="flex gap-2">
                    {member.role === 'MEMBER' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleChangeRole(member.id, 'MODERATOR')}
                      >
                        Hacer Moderador
                      </Button>
                    )}
                    {member.role === 'MODERATOR' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleChangeRole(member.id, 'MEMBER')}
                      >
                        Quitar Moderador
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remover
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
        )}
      </Tabs>

      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Publicar en {group.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="¿Qué quieres compartir con el grupo?"
              className="min-h-32 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{postContent.length}/500</p>
            <Button onClick={handleCreatePost} className="w-full" disabled={!postContent.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
