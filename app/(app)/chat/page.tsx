"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import type { Chat } from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function ChatListPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchChats = useCallback(async () => {
    try {
      const data = await api.get<Chat[]>("/api/chat/chats")
      setChats(data)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="sticky top-16 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-bold text-foreground">Mensajes</h1>
      </div>

      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <MessageCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No tienes conversaciones</p>
          <p className="text-sm text-muted-foreground">
            Haz match con alguien para empezar a chatear
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {chats.map((chat) => (
            <Link
              key={chat.chatId}
              href={`/chat/${chat.chatId}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <Avatar className="h-12 w-12 border border-border">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {chat.otherUsername?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">
                    {chat.otherUsername}
                  </p>
                  {chat.lastMessageAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(chat.lastMessageAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {chat.lastMessage || "Sin mensajes aun"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
