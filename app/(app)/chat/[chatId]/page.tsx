"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useWebSocket } from "@/hooks/use-websocket"
import type { Message, Chat } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Send, Loader2, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function ChatRoomPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const chatId = params.chatId as string
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [chatInfo, setChatInfo] = useState<Chat | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // WebSocket para mensajes en tiempo real
  const { sendMessage: sendViaWebSocket, isConnected } = useWebSocket(
    user?.userId,
    useCallback((newMessage: Message) => {
      if (newMessage.chatId === chatId) {
        setMessages(prev => {
          if (prev.some(m => m.messageId === newMessage.messageId)) {
            return prev
          }
          return [...prev, newMessage]
        })
      }
    }, [chatId])
  )

  const fetchMessages = useCallback(async () => {
    try {
      const data = await api.get<Message[]>(`/api/chat/${chatId}/messages`)
      
      setMessages(data)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [chatId])

  const fetchChatInfo = useCallback(async () => {
    try {
      const chats = await api.get<Chat[]>("/api/chat/chats")
      const current = chats.find((c) => c.chatId === chatId)
      if (current) setChatInfo(current)
    } catch {
      // silent
    }
  }, [chatId])

  useEffect(() => {
    fetchMessages()
    fetchChatInfo()
  }, [fetchMessages, fetchChatInfo])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim()) return
    setIsSending(true)
    
    const messageContent = newMessage.trim()
    setNewMessage("")
    
    const sentViaWS = sendViaWebSocket(chatId, messageContent)
    
    if (!sentViaWS) {
      try {
        await api.post("/api/chat/send", {
          chatId,
          content: messageContent,
        })
        await fetchMessages()
      } catch (error) {
        console.error('[Chat] Error al enviar por HTTP:', error)
      }
    } else {
      setTimeout(() => {
        fetchMessages()
      }, 500)
    }
    
    setIsSending(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100svh-4rem)] flex-col lg:h-svh bg-gradient-to-b from-background to-muted/20">
      {/* Chat header */}
      <div className="sticky top-16 z-30 flex items-center gap-3 border-b border-primary/20 bg-background/95 backdrop-blur-xl px-4 py-3 shadow-lg shadow-primary/5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/chat")}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Volver</span>
        </Button>
        <Avatar className="h-10 w-10 border-2 border-primary/30 ring-2 ring-primary/10">
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
            {chatInfo?.otherUsername?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Link
            href={`/profile/${chatInfo?.otherUserId}`}
            className="font-bold text-foreground hover:text-primary hover:underline"
          >
            {chatInfo?.otherUsername || "Chat"}
          </Link>
          {isConnected && (
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              En línea
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        <div className="flex flex-col gap-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <div className="relative">
                <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full" />
                <MessageCircle className="h-16 w-16 text-primary relative" />
              </div>
              <p className="text-muted-foreground">¡Envía el primer mensaje!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === user?.userId
              return (
                <div
                  key={msg.messageId}
                  className={cn(
                    "flex",
                    isOwn ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-3 shadow-lg",
                      isOwn
                        ? "bg-gradient-to-br from-primary to-secondary text-black rounded-br-md"
                        : "bg-gradient-to-br from-card to-muted/50 text-foreground rounded-bl-md border border-primary/10"
                    )}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        isOwn
                          ? "text-black/60"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatDistanceToNow(new Date(msg.sentAt + 'Z'), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <div className="border-t border-primary/20 bg-background/95 backdrop-blur-xl px-4 py-3 pb-24 lg:pb-3 shadow-lg shadow-primary/5">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="bg-muted/50 border-primary/20 text-foreground placeholder:text-muted-foreground rounded-2xl focus:border-primary/40 transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={isSending || !newMessage.trim()}
            size="icon"
            className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-secondary text-black hover:scale-110 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Enviar</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
