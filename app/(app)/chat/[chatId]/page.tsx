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
import { ArrowLeft, Send, Loader2, MessageCircle, Smile, Image as ImageIcon, X, Mic, Reply, MoreVertical } from "lucide-react"
import dynamic from "next/dynamic"
import { AudioMessage } from "@/components/audio-message"

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false })
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reactionsRef = useRef<HTMLDivElement>(null)

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

  // Cerrar emoji picker y reacciones al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (reactionsRef.current && !reactionsRef.current.contains(event.target as Node)) {
        setShowReactions(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Indicador de escribiendo
  useEffect(() => {
    if (newMessage.length > 0) {
      setIsTyping(true)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1000)
    } else {
      setIsTyping(false)
    }
  }, [newMessage])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        // Convertir a MP3 usando Cloudinary o enviar como base64 temporalmente
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64Audio = reader.result as string
          
          try {
            setIsUploading(true)
            
            // Intentar subir a Cloudinary
            const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' })
            const audioUrl = await uploadToCloudinary(audioFile)
            
            setIsUploading(false)
            
            const sentViaWS = sendViaWebSocket(chatId, `🎤 ${audioUrl}`)
            if (!sentViaWS) {
              await api.post("/api/chat/send", { chatId, content: `🎤 ${audioUrl}` })
            }
            await fetchMessages()
          } catch (error) {
            console.error('Error al subir audio:', error)
            // Fallback: enviar como base64
            setIsUploading(false)
            const sentViaWS = sendViaWebSocket(chatId, `🎤 ${base64Audio}`)
            if (!sentViaWS) {
              await api.post("/api/chat/send", { chatId, content: `🎤 ${base64Audio}` })
            }
            await fetchMessages()
          }
        }
        reader.readAsDataURL(audioBlob)
        
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error al grabar audio:', error)
      alert('No se pudo acceder al micrófono. Verifica los permisos.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData()
    const isAudio = file.type.startsWith('audio')
    
    formData.append('file', file)
    formData.append('upload_preset', isAudio ? 'chat_audio' : 'ml_default')
    
    const resourceType = isAudio ? 'video' : 'image'
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dvk3yygql/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )
    
    if (!response.ok) {
      const error = await response.text()
      console.error('Error de Cloudinary:', error)
      throw new Error('Error al subir archivo')
    }
    
    const data = await response.json()
    console.log('Audio subido:', data.secure_url, 'Duración:', data.duration)
    return data.secure_url
  }

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedImage) return
    setIsSending(true)
    
    let messageContent = newMessage.trim()
    if (replyTo) {
      messageContent = `@reply:${replyTo.messageId}|${messageContent}`
    }
    setNewMessage("")
    setReplyTo(null)
    
    try {
      if (selectedImage) {
        setIsUploading(true)
        const imageUrl = await uploadToCloudinary(selectedImage)
        setIsUploading(false)
        
        const sentViaWS = sendViaWebSocket(chatId, imageUrl)
        
        if (!sentViaWS) {
          await api.post("/api/chat/send", {
            chatId,
            content: imageUrl,
          })
        }
        
        handleRemoveImage()
      } else {
        const sentViaWS = sendViaWebSocket(chatId, messageContent)
        
        if (!sentViaWS) {
          await api.post("/api/chat/send", {
            chatId,
            content: messageContent,
          })
        }
      }
      await fetchMessages()
    } catch (error) {
      console.error('[Chat] Error al enviar:', error)
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
              const isReply = msg.content.startsWith('@reply:')
              const replyMatch = isReply ? msg.content.match(/@reply:([^|]+)\|(.*)/) : null
              const replyToId = replyMatch?.[1]
              const actualContent = replyMatch?.[2] || msg.content
              const repliedMsg = replyToId ? messages.find(m => m.messageId === replyToId) : null
              const isAudio = actualContent.startsWith('🎤 ')
              const audioUrl = isAudio ? actualContent.substring(3) : null
              
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
                      "max-w-[75%] rounded-2xl px-4 py-3 shadow-lg relative group",
                      isOwn
                        ? "bg-gradient-to-br from-primary to-secondary text-black rounded-br-md"
                        : "bg-gradient-to-br from-card to-muted/50 text-foreground rounded-bl-md border border-primary/10"
                    )}
                  >
                    {repliedMsg && (
                      <div className="mb-2 p-2 bg-black/10 rounded-lg text-xs border-l-2 border-primary">
                        <p className="font-semibold">{repliedMsg.senderId === user?.userId ? 'Tú' : chatInfo?.otherUsername}</p>
                        <p className="truncate opacity-70">{repliedMsg.content.substring(0, 50)}</p>
                      </div>
                    )}
                    {isAudio && audioUrl ? (
                      <AudioMessage src={audioUrl} className="min-w-[200px]" />
                    ) : actualContent.startsWith('http') && (actualContent.includes('cloudinary.com') || actualContent.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                      <img src={actualContent} alt="Imagen" className="rounded-lg max-w-full max-h-64 object-cover" />
                    ) : (
                      <p className="text-sm leading-relaxed">{actualContent}</p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "mt-1 text-[10px]",
                          isOwn ? "text-black/60" : "text-muted-foreground"
                        )}
                      >
                        {formatDistanceToNow(new Date(msg.sentAt + 'Z'), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => setReplyTo(msg)}
                        >
                          <Reply className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => setShowReactions(showReactions === msg.messageId ? null : msg.messageId)}
                        >
                          <Smile className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {showReactions === msg.messageId && (
                      <div 
                        ref={reactionsRef}
                        className="absolute -top-10 right-0 bg-background border border-primary/20 rounded-full px-2 py-1 shadow-lg flex gap-1 z-50"
                      >
                        {['❤️', '👍', '😂', '😮', '😢', '😡'].map(emoji => (
                          <button
                            key={emoji}
                            className="hover:scale-125 transition-transform text-lg p-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log(`Reacción ${emoji} al mensaje ${msg.messageId}`)
                              setShowReactions(null)
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted/50 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message input */}
      <div className="border-t border-primary/20 bg-background/95 backdrop-blur-xl px-4 py-3 pb-3 lg:pb-3 shadow-lg shadow-primary/5">
        <div className="relative">
          {replyTo && (
            <div className="mb-2 p-2 bg-muted/50 rounded-lg flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold">Respondiendo a {replyTo.senderId === user?.userId ? 'ti mismo' : chatInfo?.otherUsername}</p>
                <p className="text-xs opacity-70 truncate">{replyTo.content.substring(0, 50)}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setReplyTo(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-full mb-2 right-0 z-50">
              <EmojiPicker
                onEmojiClick={(emojiData) => {
                  setNewMessage(prev => prev + emojiData.emoji)
                  setShowEmojiPicker(false)
                }}
              />
            </div>
          )}
          {imagePreview && (
            <div className="mb-2 relative inline-block">
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
              <img src={imagePreview} alt="Preview" className="h-20 rounded-lg" />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={handleRemoveImage}
                disabled={isUploading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="h-10 w-10 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <Smile className="h-5 w-5" />
              <span className="sr-only">Emojis</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <ImageIcon className="h-5 w-5" />
              <span className="sr-only">Imagen</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={cn(
                "h-10 w-10 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50",
                isRecording && "bg-red-500 text-white animate-pulse"
              )}
            >
              <Mic className="h-5 w-5" />
              <span className="sr-only">Audio</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,image/gif"
              className="hidden"
              onChange={handleImageSelect}
            />
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
              disabled={isSending || isUploading || (!newMessage.trim() && !selectedImage)}
              size="icon"
              className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-secondary text-black hover:scale-110 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100"
            >
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              <span className="sr-only">Enviar</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
