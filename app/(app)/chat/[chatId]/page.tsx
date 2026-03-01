"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useWebSocket } from "@/hooks/use-websocket"
import type { Message, Chat } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Send, Loader2 } from "lucide-react"
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
      // Solo agregar si es del chat actual
      if (newMessage.chatId === chatId) {
        setMessages(prev => {
          // Evitar duplicados
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
    
    // Intentar enviar por WebSocket primero
    const sentViaWS = sendViaWebSocket(chatId, newMessage.trim())
    
    if (!sentViaWS) {
      // Fallback a HTTP si WebSocket no está conectado
      try {
        await api.post("/api/chat/send", {
          chatId,
          content: newMessage.trim(),
        })
        fetchMessages()
      } catch {
        // silent
      }
    }
    
    setNewMessage("")
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
    <div className="flex h-[calc(100svh-4rem)] flex-col lg:h-[calc(100svh-4rem)]">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/chat")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Volver</span>
        </Button>
        <Avatar className="h-9 w-9 border border-border">
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {chatInfo?.otherUsername?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {chatInfo?.otherUsername || "Chat"}
          </p>
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
            <p className="py-8 text-center text-sm text-muted-foreground">
              Envia el primer mensaje!
            </p>
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
                      "max-w-[75%] rounded-2xl px-4 py-2.5",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        isOwn
                          ? "text-primary-foreground/60"
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
      <div className="border-t border-border px-4 py-3 pb-24 lg:pb-3">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
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
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Enviar</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
