"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { chatService } from "@/lib/services/chat"
import { useAuth } from "@/lib/auth-context"
import { useWebSocket } from "@/hooks/use-websocket"
import type { Message, Chat } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, Loader2, MessageCircle, Smile, Image as ImageIcon, X, Mic, Reply, MoreVertical, Copy, Paperclip, Check, Search, Star, Images } from "lucide-react"
import dynamic from "next/dynamic"
import { AudioMessage } from "@/components/audio-message"

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false })
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

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
  const [recordingTime, setRecordingTime] = useState(0)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const [messageReactions, setMessageReactions] = useState<Record<string, string[]>>({})
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [starredMessages, setStarredMessages] = useState<Set<string>>(new Set())
  const [showGallery, setShowGallery] = useState(false)
  const [selectedImageView, setSelectedImageView] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reactionsRef = useRef<HTMLDivElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRefDoc = useRef<HTMLInputElement>(null)

  // WebSocket para mensajes en tiempo real
  const { sendMessage: sendViaWebSocket, isConnected } = useWebSocket(
    user?.userId,
    useCallback((newMessage: Message) => {
      console.log('[Chat] Mensaje recibido por WebSocket:', newMessage)
      if (newMessage.chatId === chatId) {
        setMessages(prev => {
          const newId = newMessage.messageId || newMessage.id
          if (newId && prev.some(m => (m.messageId || m.id) === newId)) {
            console.log('[Chat] Mensaje duplicado, ignorando')
            return prev
          }
          console.log('[Chat] Agregando mensaje a la lista')
          return [...prev, newMessage]
        })
      } else {
        console.log('[Chat] Mensaje de otro chat, ignorando')
      }
    }, [chatId])
  )

  const fetchMessages = useCallback(async () => {
    console.log('[Chat] Obteniendo mensajes...')
    try {
      const data = await api.get<Message[]>(`/api/chat/${chatId}/messages`)
      console.log('[Chat] Mensajes obtenidos:', data.length)
      if (data.length > 0) {
        console.log('[Chat] Último mensaje:', data[data.length - 1])
      }
      setMessages([...data])
    } catch (error) {
      console.error('[Chat] Error al obtener mensajes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [chatId])

  const fetchChatInfo = useCallback(async () => {
    try {
      const chats = await api.get<Chat[]>("/api/chat/chats")
      const current = chats.find((c) => c.chatId === chatId)
      if (current) {
        try {
          const profile = await api.get<any>(`/api/profile/${current.otherUserId}`)
          current.otherUserPhoto = profile.profilePictureUrl || profile.photos?.find((p: any) => p.isPrimary || p.primary)?.url
        } catch {
          // Si falla, continuar sin foto
        }
        setChatInfo(current)
      }
    } catch {
      // silent
    }
  }, [chatId])

  useEffect(() => {
    fetchMessages()
    fetchChatInfo()
    // Marcar chat como leído al abrirlo
    chatService.markChatAsRead(chatId).catch(() => {})
  }, [fetchMessages, fetchChatInfo])

  // Auto-scroll to bottom
  useEffect(() => {
    console.log('[Chat] Mensajes en estado:', messages.length)
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Cerrar emoji picker y reacciones al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
      const target = event.target as HTMLElement
      if (showReactions && !target.closest('.reactions-menu') && !target.closest('.reactions-button')) {
        setShowReactions(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showReactions])

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

  const handleReaction = async (messageId: string, emoji: string) => {
    setMessageReactions(prev => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), emoji]
    }))
    setShowReactions(null)
  }

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error('Error al copiar:', error)
    }
  }

  const toggleStarMessage = (messageId: string) => {
    setStarredMessages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const filteredMessages = searchQuery
    ? messages.filter(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages

  const mediaMessages = messages.filter(msg => {
    const content = msg.content.startsWith('@reply:') ? msg.content.split('|')[1] : msg.content
    return content?.startsWith('http') && (content.includes('cloudinary.com') || content.match(/\.(jpg|jpeg|png|gif|webp)$/i))
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFilePreview(file.name)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRefDoc.current) fileInputRefDoc.current.value = ''
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      setSelectedImage(file)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => setImagePreview(reader.result as string)
        reader.readAsDataURL(file)
      } else {
        setImagePreview('video')
      }
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
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current)
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        // Convertir a MP3 usando Cloudinary o enviar como base64 temporalmente
        const reader = new FileReader()
        reader.onloadend = async () => {
          try {
            setIsUploading(true)
            const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' })
            const { mediaUrl } = await uploadToBackend(audioFile)
            setIsUploading(false)
            sendViaWebSocket(chatId, `🎤 ${mediaUrl}`)
            setTimeout(() => fetchMessages(), 800)
          } catch (error) {
            console.error('Error al subir audio:', error)
            setIsUploading(false)
          }
        }
        reader.readAsDataURL(audioBlob)
        
        stream.getTracks().forEach(track => track.stop())
        setRecordingTime(0)
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
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const uploadToBackend = async (file: File): Promise<{ mediaUrl: string; mediaPublicId: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    
    // Determinar el tipo de media
    let type = 'IMAGE'
    if (file.type.startsWith('video/')) type = 'VIDEO'
    else if (file.type.startsWith('audio/')) type = 'AUDIO'
    else if (!file.type.startsWith('image/')) type = 'FILE'
    
    // Cloudinary no soporta archivos de texto/documentos
    if (type === 'FILE') {
      throw new Error('Solo se permiten imágenes, videos y audios')
    }
    
    formData.append('type', type)
    return api.post<{ mediaUrl: string; mediaPublicId: string }>('/api/chat/upload/media', formData)
  }

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedImage && !selectedFile) return
    
    console.log('[Chat] Iniciando envío...', { 
      chatId, 
      hasMessage: !!newMessage.trim(), 
      hasImage: !!selectedImage, 
      hasFile: !!selectedFile,
      isConnected 
    })
    
    setIsSending(true)
    
    let messageContent = newMessage.trim()
    if (replyTo) {
      const replyId = replyTo.messageId || replyTo.id
      messageContent = `@reply:${replyId}|${messageContent}`
    }
    setNewMessage("")
    setReplyTo(null)
    
    try {
      if (selectedFile) {
        setIsUploading(true)
        const { mediaUrl } = await uploadToBackend(selectedFile)
        setIsUploading(false)
        // Enviar via REST para persistir con media
        const formData = new FormData()
        formData.append('message', JSON.stringify({ chatId, content: selectedFile.name, mediaType: 'FILE' }))
        formData.append('file', selectedFile)
        await api.post('/api/chat/send', formData)
        setTimeout(() => fetchMessages(), 800)
        handleRemoveFile()
      } else if (selectedImage) {
        setIsUploading(true)
        const { mediaUrl } = await uploadToBackend(selectedImage)
        setIsUploading(false)
        // Enviar via REST para persistir con media
        const formData = new FormData()
        formData.append('message', JSON.stringify({ chatId, content: '', mediaType: 'IMAGE' }))
        formData.append('file', selectedImage)
        await api.post('/api/chat/send', formData)
        setTimeout(() => fetchMessages(), 800)
        handleRemoveImage()
      } else {
        // Solo usar WebSocket
        sendViaWebSocket(chatId, messageContent)
      }
      
      // Refrescar mensajes después de 2 segundos para dar tiempo al servidor
      setTimeout(() => fetchMessages(), 2000)
    } catch (error) {
      console.error('[Chat] Error al enviar:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      }
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
          <AvatarImage src={chatInfo?.otherUserPhoto} alt={chatInfo?.otherUsername} />
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
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowGallery(!showGallery)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
          >
            <Images className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {showSearch && (
        <div className="sticky top-[calc(4rem+57px)] z-20 border-b border-primary/20 bg-background/95 px-4 py-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar mensajes..."
            className="bg-muted/50 border-primary/20"
          />
        </div>
      )}

      {showGallery && (
        <div className="sticky top-[calc(4rem+57px)] z-20 border-b border-primary/20 bg-background/95 px-4 py-2">
          <p className="text-xs font-semibold mb-1.5">Galería ({mediaMessages.length})</p>
          <div className="grid grid-cols-6 gap-1.5 max-h-20 overflow-y-auto">
            {mediaMessages.map((msg) => {
              const content = msg.content.startsWith('@reply:') ? msg.content.split('|')[1] : msg.content
              return (
                <img
                  key={msg.messageId || msg.id || ''}
                  src={content}
                  alt="Media"
                  className="w-full h-12 object-cover rounded cursor-pointer hover:opacity-80"
                  onClick={() => setSelectedImageView(content)}
                />
              )
            })}
          </div>
        </div>
      )}

      {selectedImageView && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setSelectedImageView(null)}>
          <img src={selectedImageView} alt="Full" className="max-w-[90%] max-h-[90%] object-contain" />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setSelectedImageView(null)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        <div className="flex flex-col gap-3">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <div className="relative">
                <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full" />
                <MessageCircle className="h-16 w-16 text-primary relative" />
              </div>
              <p className="text-muted-foreground">¡Envía el primer mensaje!</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const msgId = msg.messageId || msg.id || ''
              const isOwn = msg.senderId === user?.userId
              const isReply = msg.content.startsWith('@reply:')
              const replyMatch = isReply ? msg.content.match(/@reply:([^|]+)\|(.*)/) : null
              const replyToId = replyMatch?.[1]
              const actualContent = replyMatch?.[2] || msg.content
              const repliedMsg = replyToId ? messages.find(m => (m.messageId || m.id) === replyToId) : null
              const isAudio = actualContent.startsWith('🎤 ')
              const audioUrl = isAudio ? actualContent.substring(3) : null
              const isFile = actualContent.startsWith('📎 ')
              const fileMatch = isFile ? actualContent.match(/📎 (.+)\|(.+)/) : null
              const fileName = fileMatch?.[1]
              const fileUrl = fileMatch?.[2]
              const reactions = messageReactions[msgId] || []
              
              return (
                <div
                  key={msgId}
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
                        : "bg-gradient-to-br from-card to-muted/50 text-foreground rounded-bl-md border border-primary/5"
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
                    ) : msg.media?.mediaUrl && msg.mediaType === 'IMAGE' ? (
                      <img 
                        src={msg.media.mediaUrl} 
                        alt="Imagen" 
                        className="rounded-lg max-w-[200px] max-h-[200px] object-cover cursor-pointer hover:opacity-90" 
                        onClick={() => setSelectedImageView(msg.media!.mediaUrl)}
                      />
                    ) : msg.media?.mediaUrl && msg.mediaType === 'VIDEO' ? (
                      <video
                        src={msg.media.mediaUrl}
                        controls
                        className="rounded-lg max-w-[250px] max-h-[200px]"
                      />
                    ) : msg.media?.mediaUrl && msg.mediaType === 'FILE' ? (
                      <a href={msg.media.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/10 rounded-lg hover:bg-black/20 transition-colors">
                        <Paperclip className="h-4 w-4" />
                        <span className="text-sm truncate max-w-[200px]">{msg.media.format || 'Archivo'}</span>
                      </a>
                    ) : msg.media?.mediaUrl && msg.mediaType === 'AUDIO' ? (
                      <AudioMessage src={msg.media.mediaUrl} className="min-w-[200px]" />
                    ) : isFile && fileName && fileUrl ? (
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/10 rounded-lg hover:bg-black/20 transition-colors">
                        <Paperclip className="h-4 w-4" />
                        <span className="text-sm truncate max-w-[200px]">{fileName}</span>
                      </a>
                    ) : actualContent.startsWith('http') && (actualContent.includes('cloudinary.com') || actualContent.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                      <img 
                        src={actualContent} 
                        alt="Imagen" 
                        className="rounded-lg w-[100px] h-[100px] object-cover cursor-pointer hover:opacity-90" 
                        onClick={() => setSelectedImageView(actualContent)}
                      />
                    ) : (
                      <p className="text-sm leading-relaxed">{actualContent}</p>
                    )}
                    {reactions.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {reactions.map((emoji, idx) => (
                          <span key={idx} className="text-sm bg-black/10 px-2 py-0.5 rounded-full">
                            {emoji}
                          </span>
                        ))}
                      </div>
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
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleStarMessage(msgId)
                          }}
                          title="Destacar mensaje"
                        >
                          <Star className={cn("h-3 w-3", starredMessages.has(msgId) && "fill-yellow-500 text-yellow-500")} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopyMessage(actualContent, msgId)
                          }}
                          title="Copiar mensaje"
                        >
                          {copiedMessageId === msgId ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            setReplyTo(msg)
                          }}
                        >
                          <Reply className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 reactions-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowReactions(showReactions === msgId ? null : msgId)
                          }}
                        >
                          <Smile className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {showReactions === msgId && (
                      <div 
                        className="reactions-menu absolute -top-10 right-0 bg-background border border-primary/20 rounded-full px-2 py-1 shadow-lg flex gap-1 z-50"
                      >
                        {['❤️', '👍', '😂', '😮', '😢', '😡'].map(emoji => (
                          <button
                            key={emoji}
                            className="hover:scale-125 transition-transform text-lg p-1 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReaction(msgId, emoji)
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
              {imagePreview === 'video' ? (
                <div className="h-20 w-32 rounded-lg bg-muted flex items-center justify-center gap-2 text-muted-foreground">
                  <span className="text-xs">{selectedImage?.name}</span>
                </div>
              ) : (
                <img src={imagePreview} alt="Preview" className="h-20 rounded-lg" />
              )}
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
          {filePreview && (
            <div className="mb-2 flex items-center gap-2 bg-muted/50 border border-primary/20 rounded-lg px-3 py-2">
              <Paperclip className="h-4 w-4" />
              <span className="text-sm flex-1 truncate">{filePreview}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleRemoveFile}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          {isRecording && (
            <div className="mb-2 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-red-500 flex-1">
                Grabando... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={stopRecording}
              >
                Detener
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
              onClick={isRecording ? stopRecording : startRecording}
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
              accept="image/*,image/gif,video/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRefDoc.current?.click()}
              className="h-10 w-10 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
              title="Compartir archivo"
            >
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Archivo</span>
            </Button>
            <input
              ref={fileInputRefDoc}
              type="file"
              accept="*/*"
              className="hidden"
              onChange={handleFileSelect}
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
              disabled={isSending || isUploading || (!newMessage.trim() && !selectedImage && !selectedFile)}
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
