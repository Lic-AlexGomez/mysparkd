"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
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
import { ArrowLeft, Send, Loader2, MessageCircle, Smile, Image as ImageIcon, X, Mic, Reply, MoreVertical, Copy, Paperclip, Check, Search, Star, Images, Sparkles, Gamepad2, Pencil, Trash2 } from "lucide-react"
import dynamic from "next/dynamic"
import { AudioMessage } from "@/components/audio-message"
import { GamePanel } from "@/components/chat/game-panel"
import { ChatInput } from "@/components/chat/chat-input"

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
  const newMessageRef = useRef("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [chatInfo, setChatInfo] = useState<Chat | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isTyping, setIsTyping] = useState(false) // typing del OTRO usuario
  const [isSelfTyping, setIsSelfTyping] = useState(false) // para enviar al backend
  const isSelfTypingRef = useRef(false)
  const [otherUserOnline, setOtherUserOnline] = useState(false)
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | null>(null)
  const lastActivityRef = useRef<Record<string, number>>({})
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const [messageReactions, setMessageReactions] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem(`chat_reactions_${chatId}`) || '{}') } catch { return {} }
  })
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [editedMessages, setEditedMessages] = useState<Record<string, string>>({})
  const [deletedMessages, setDeletedMessages] = useState<Set<string>>(new Set())
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [starredMessages, setStarredMessages] = useState<Set<string>>(new Set())
  const [showGallery, setShowGallery] = useState(false)
  const [showGame, setShowGame] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [aiType, setAiType] = useState<'suggestions' | 'icebreaker' | 'date'>('suggestions')
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

  const typingTimeoutOtherRef = useRef<NodeJS.Timeout | null>(null)
  const selfTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const chatIdRef = useRef(chatId)
  const userIdRef = useRef(user?.userId)
  const otherUserIdRef = useRef<string | undefined>(undefined)
  const sendSeenRef = useRef<(chatId: string) => void>(() => {})
  const pendingSnapshotRef = useRef<any[] | null>(null)
  useEffect(() => { chatIdRef.current = chatId }, [chatId])
  useEffect(() => { userIdRef.current = user?.userId }, [user?.userId])
  useEffect(() => {
    otherUserIdRef.current = chatInfo?.otherUserId
    // procesar snapshot pendiente si ya tenemos el otherUserId
    if (chatInfo?.otherUserId && pendingSnapshotRef.current) {
      const events = pendingSnapshotRef.current
      pendingSnapshotRef.current = null
      const found = events.find(e => {
        const id = e.userId?.toString ? e.userId.toString() : String(e.userId)
        return id === chatInfo.otherUserId
      })
      if (found) setOtherUserOnline(found.status?.toUpperCase() === 'ONLINE')
    }
  }, [chatInfo?.otherUserId])

  const wsCallbacksRef = useRef({
    
    onPresence: (event: any) => {
      const eventUserId = event.userId?.toString ? event.userId.toString() : String(event.userId)
      const otherId = otherUserIdRef.current
      if (otherId && eventUserId === otherId) {
        const isOnline = event.status?.toUpperCase() === 'ONLINE'
        setOtherUserOnline(isOnline)
        if (!isOnline) {
          if (event.lastSeen) {
            setOtherUserLastSeen(event.lastSeen)
          } else {
            // fallback REST solo si hay token
            const token = typeof window !== 'undefined' ? localStorage.getItem('sparkd_token') : null
            if (token) {
              api.get<any>(`/api/presence/${otherId}`)
                .then(res => setOtherUserLastSeen(res.lastSeen || null))
                .catch(() => {})
            }
          }
        } else {
          setOtherUserLastSeen(null)
        }
      }
    },
    onPresenceSnapshot: (events: any[]) => {
     
      const otherId = otherUserIdRef.current
      if (!otherId) {
        pendingSnapshotRef.current = events
        return
      }
      const found = events.find(e => {
        const id = e.userId?.toString ? e.userId.toString() : String(e.userId)
        return id === otherId
      })
      if (found) setOtherUserOnline(found.status?.toUpperCase() === 'ONLINE')
    },
    onTyping: (event: any) => {
      if (event.chatId !== chatIdRef.current) return
      setIsTyping(true)
      // Si recibimos typing, el otro usuario está online
      const otherId = otherUserIdRef.current
      if (otherId) setOtherUserOnline(true)
      if (typingTimeoutOtherRef.current) clearTimeout(typingTimeoutOtherRef.current)
      typingTimeoutOtherRef.current = setTimeout(() => setIsTyping(false), 3000)
    },
    onMessage: (newMessage: Message) => {
      if (newMessage.chatId !== chatIdRef.current) return
      // solo marcar online si el mensaje es del OTRO usuario, no del propio
      const senderId = newMessage.senderId?.toString ? newMessage.senderId.toString() : String(newMessage.senderId)
      const myId = userIdRef.current?.toString ? userIdRef.current.toString() : String(userIdRef.current)
      if (senderId !== myId) {
        setOtherUserOnline(true)
        sendSeenRef.current(chatIdRef.current)
      }
      setMessages(prev => {
        const newId = newMessage.messageId || newMessage.id
        if (newId && prev.some(m => (m.messageId || m.id) === newId)) return prev
        const optimisticIdx = prev.findIndex(m =>
          (m.messageId || m.id || '').startsWith('optimistic-') &&
          m.content === newMessage.content
        )
        if (optimisticIdx !== -1) {
          const next = [...prev]
          next[optimisticIdx] = newMessage
          return next
        }
        return [...prev, newMessage]
      })
    },
    onRead: (event: any) => {
      if (event.chatId !== chatIdRef.current) return
      setMessages(prev => prev.map(m =>
        m.senderId === userIdRef.current ? { ...m, read: true } : m
      ))
    },
    onMessageEdited: (edited: any) => {
      const id = edited.messageId || edited.id
      if (!id) return
      setMessages(prev => prev.map(m =>
        (m.messageId || m.id) === id ? { ...m, content: edited.content } : m
      ))
      setEditedMessages(prev => ({ ...prev, [id]: edited.content }))
    },
    onMessageDeleted: (messageId: any) => {
      const id = typeof messageId === 'string' ? messageId : String(messageId)
      setDeletedMessages(prev => new Set(prev).add(id))
    },
  })

  const { sendMessage: sendViaWebSocket, sendTyping, sendSeen, isConnected } = useWebSocket(
    user?.userId,
    wsCallbacksRef.current
  )

  // Mantener ref de sendSeen actualizada para usarla en callbacks del WS
  useEffect(() => { sendSeenRef.current = sendSeen }, [sendSeen])

  const fetchMessages = useCallback(async () => {
    try {
      const data = await api.get<Message[]>(`/api/messages/${chatId}/messages`)
      
      setMessages(prev => {
        const serverContents = new Set(data.map((m: Message) => m.content))
        const pendingOptimistic = prev.filter(m =>
          (m.messageId || m.id || '').startsWith('optimistic-') &&
          !serverContents.has(m.content)
        )
        return [...data, ...pendingOptimistic]
      })
    } catch (error) {
      console.error('[fetchMessages] ERROR:', error)
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
        // Consultar presencia actual via REST
        try {
          const presence = await api.get<any>(`/api/presence/${current.otherUserId}`)
         
          setOtherUserOnline(presence.status === 'ONLINE')
        
          if (presence.status !== 'ONLINE') {
          
            setOtherUserLastSeen(current.lastSeen || null)
          }
          
        } catch {
          // silent
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
    chatService.markChatAsRead(chatId).catch(() => {})
    // Marcar como leído via WebSocket también
    if (isConnected) sendSeen(chatId)
  }, [fetchMessages, fetchChatInfo, chatId])

  const scrollToBottom = useCallback((instant = false) => {
    const el = scrollAreaRef.current
    if (!el) return
    if (instant) {
      el.scrollTop = el.scrollHeight
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [])

  // Scroll al fondo al cargar mensajes
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      scrollToBottom(true)
    }
  }, [isLoading])

  // Scroll al fondo cuando llegan nuevos mensajes
  useEffect(() => {
    if (messages.length > 0) scrollToBottom(false)
  }, [messages.length])

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

  const handleTypingInput = useCallback((value: string) => {
    setNewMessage(value)
    if (value.length > 0 && isConnected && !isSelfTypingRef.current) {
      isSelfTypingRef.current = true
      sendTyping(chatId)
      if (selfTypingTimeoutRef.current) clearTimeout(selfTypingTimeoutRef.current)
      selfTypingTimeoutRef.current = setTimeout(() => { isSelfTypingRef.current = false }, 2000)
    }
  }, [isConnected, chatId, sendTyping])
  const handleReaction = async (messageId: string, emoji: string) => {
    setMessageReactions(prev => {
      const current = prev[messageId]
      const next = { ...prev, [messageId]: current === emoji ? '' : emoji }
      localStorage.setItem(`chat_reactions_${chatId}`, JSON.stringify(next))
      return next
    })
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

  const canEditMessage = (sentAt: string) => {
    if (!sentAt) return false
    const date = new Date(sentAt.endsWith('Z') ? sentAt : sentAt + 'Z')
    if (isNaN(date.getTime())) return false
    return (Date.now() - date.getTime()) < 15 * 60 * 1000
  }

  const handleStartEdit = (msg: Message) => {
    const msgId = msg.messageId || msg.id || ''
    setEditingMessageId(msgId)
    setEditingContent(editedMessages[msgId] || msg.content)
  }

  const handleSaveEdit = async (msgId: string) => {
    if (!editingContent.trim()) return
    try {
      await api.put(`/api/messages/messages/${msgId}`, { content: editingContent.trim() })
      setEditedMessages(prev => ({ ...prev, [msgId]: editingContent.trim() }))
      setEditingMessageId(null)
    } catch {
      toast.error('Error al editar el mensaje')
    }
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditingContent("")
  }

  const handleDeleteMessage = async (msgId: string, forEveryone: boolean) => {
    try {
      if (forEveryone) {
        await api.delete(`/api/messages/messages/${msgId}/everyone`)
      } else {
        await api.delete(`/api/messages/messages/${msgId}/me`)
      }
      setDeletedMessages(prev => new Set(prev).add(msgId))
    } catch {
      toast.error('Error al eliminar el mensaje')
    }
    setDeleteConfirmId(null)
  }

  const [activeMessageId, setActiveMessageId] = useState<string | null>(null)

  const filteredMessages = useMemo(() => searchQuery
    ? messages.filter(msg => !deletedMessages.has(msg.messageId || msg.id || '') && msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages.filter(msg => !deletedMessages.has(msg.messageId || msg.id || ''))
  , [messages, deletedMessages, searchQuery])

  const mediaMessages = useMemo(() => messages.filter(msg => {
    const content = msg.content.startsWith('@reply:') ? msg.content.split('|')[1] : msg.content
    return content?.startsWith('http') && (content.includes('cloudinary.com') || content.match(/\.(jpg|jpeg|png|gif|webp)$/i))
  }), [messages])

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
            fetchMessages()
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

  const callAI = async (type: 'suggestions' | 'icebreaker' | 'date') => {
    setAiLoading(true)
    setAiType(type)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          otherUsername: chatInfo?.otherUsername,
          lastMessages: messages.slice(-5)
        })
      })
      const data = await res.json()
      const result = Array.isArray(data.result) ? data.result.filter((s: string) => s.trim()) : [data.result].filter(Boolean)
      setAiSuggestions(result)
    } catch {
      toast.error('Error al obtener sugerencias')
    } finally {
      setAiLoading(false)
    }
  }

  const uploadToBackend = async (file: File): Promise<{ mediaUrl: string; mediaPublicId: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const token = typeof window !== 'undefined' ? localStorage.getItem('sparkd_token') : null
    setUploadProgress(0)
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/proxy/api/chat/upload/media')
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        setUploadProgress(100)
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          let msg = 'Error al subir archivo'
          try { msg = JSON.parse(xhr.responseText)?.message || msg } catch {}
          reject(new Error(`${msg} (${xhr.status})`))
        }
      }
      xhr.onerror = () => reject(new Error('Error de red al subir archivo'))
      xhr.send(formData)
    })
  }

  const handleSend = async (messageContent?: string) => {
    const content = messageContent ?? newMessage.trim()
    if (!content && !selectedImage && !selectedFile) return
    setIsSending(true)
    let finalContent = content
    if (replyTo) {
      const replyId = replyTo.messageId || replyTo.id
      finalContent = `@reply:${replyId}|${content}`
    }
    setNewMessage("")
    setReplyTo(null)
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMsg: Message = {
      messageId: optimisticId,
      id: optimisticId,
      chatId,
      senderId: user?.userId ?? '',
      receiverId: chatInfo?.otherUserId ?? '',
      content: finalContent,
      sentAt: new Date().toISOString().replace('Z', ''),
      read: false,
    }
    try {
      if (selectedFile) {
        setIsUploading(true)
        const formData = new FormData()
        let mediaType = 'FILE'
        if (selectedFile.type.startsWith('audio/')) mediaType = 'AUDIO'
        formData.append('message', JSON.stringify({ chatId, content: selectedFile.name, mediaType }))
        formData.append('file', selectedFile)
        await api.post('/api/chat/send', formData)
        setIsUploading(false)
        handleRemoveFile()
        fetchMessages()
      } else if (selectedImage) {
        setIsUploading(true)
        await uploadToBackend(selectedImage)
        setIsUploading(false)
        const formData = new FormData()
        formData.append('message', JSON.stringify({ chatId, content: '', mediaType: 'IMAGE' }))
        formData.append('file', selectedImage)
        await api.post('/api/chat/send', formData)
        handleRemoveImage()
        fetchMessages()
      } else {
        setMessages(prev => [...prev, optimisticMsg])
        const sentViaWS = sendViaWebSocket(chatId, finalContent)
        if (!sentViaWS) {
          const formData = new FormData()
          formData.append('message', JSON.stringify({ chatId, content: finalContent }))
          const saved = await api.post<Message>('/api/chat/send', formData)
          setMessages(prev => prev.map(m =>
            (m.messageId || m.id) === optimisticId
              ? { ...saved, messageId: saved.messageId || (saved as any).id }
              : m
          ))
        }
      }
    } catch (error) {
      console.error('[Chat] Error al enviar:', error)
      setMessages(prev => prev.filter(m => (m.messageId || m.id) !== optimisticId))
      if (error instanceof Error) toast.error(error.message)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="chat-room flex flex-col fixed inset-0 top-16 lg:left-20 xl:left-72 bg-background" style={{ zIndex: 10 }}>
      {/* Chat header */}
      <div className="flex-shrink-0 flex items-center gap-3 border-b border-primary/20 bg-background/95 backdrop-blur-xl px-4 py-3 shadow-lg shadow-primary/5">
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
          {isTyping ? (
            <p className="text-xs text-primary flex items-center gap-1">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              escribiendo...
            </p>
          ) : otherUserOnline ? (
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              En línea
            </p>
          ) : otherUserLastSeen ? (
            <p className="text-xs text-muted-foreground">
              En linea {formatDistanceToNow(new Date(otherUserLastSeen), { addSuffix: true, locale: es })}
            </p>
          ) : null}
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setShowAI(!showAI); if (!showAI) { setAiSuggestions([]); callAI('suggestions') } }}
            className={cn("text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl", showAI && "text-primary bg-primary/10")}
          >
            <Sparkles className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowGame(!showGame)} className={cn("text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl", showGame && "text-primary bg-primary/10")}>
            <Gamepad2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {showSearch && (
        <div className="flex-shrink-0 border-b border-primary/20 bg-background/95 px-4 py-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar mensajes..."
            className="bg-muted/50 border-primary/20"
          />
        </div>
      )}

      {showGallery && (
        <div className="flex-shrink-0 border-b border-primary/20 bg-background/95 px-4 py-2">
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

      {showAI && (
        <div className="flex-shrink-0 border-b border-primary/20 bg-background/95 px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Asistente IA</span>
            <div className="flex gap-1 ml-auto">
              {(['suggestions', 'icebreaker', 'date'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => callAI(t)}
                  className={cn(
                    "text-xs px-2 py-1 rounded-full border transition-colors",
                    aiType === t ? "bg-primary text-black border-primary" : "border-primary/30 text-muted-foreground hover:border-primary"
                  )}
                >
                  {t === 'suggestions' ? '💬 Temas' : t === 'icebreaker' ? '❄️ Romper hielo' : '📅 Citas'}
                </button>
              ))}
            </div>
          </div>
          {aiLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Generando sugerencias...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {aiSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setNewMessage(s); setShowAI(false) }}
                  className="text-left text-xs p-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showGame && (
        <div className="flex-shrink-0 mt-2 border-primary/20 bg-background/95 px-4 py-3">
          <GamePanel
            onClose={() => setShowGame(false)}
            onSendMessage={(msg) => sendViaWebSocket(chatId, msg)}
            myUsername={user?.username || user?.nombres || 'Tú'}
            otherUsername={chatInfo?.otherUsername || 'tu match'}
          />
        </div>
      )}

      {selectedImageView && (
        <div className="fixed  inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setSelectedImageView(null)}>
          <img src={selectedImageView} alt="Full" className="p-2 max-w-[90%] max-h-[90%] object-contain" />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20"
            onClick={() => setSelectedImageView(null)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4"
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
              const isSystem = msg.system === true || (!msg.senderId && !msg.receiverId)

              if (isSystem) {
                return (
                  <div key={msgId} className="flex justify-center my-4">
                    <div className="flex flex-col items-center gap-2 max-w-[280px]">
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-primary/15 via-secondary/15 to-primary/15 border border-primary/30 shadow-sm">
                        <span className="text-lg">⚡</span>
                        <p className="text-xs font-semibold text-foreground text-center leading-snug">
                          {msg.content}
                        </p>
                        <span className="text-lg">⚡</span>
                      </div>
                      {msg.sentAt && (
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.sentAt), { addSuffix: true, locale: es })}
                        </span>
                      )}
                    </div>
                  </div>
                )
              }

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
              const reactions = messageReactions[msgId] || ''
              const isEditing = editingMessageId === msgId
              const displayContent = editedMessages[msgId] || actualContent
              const wasEdited = !!editedMessages[msgId] || !!msg.edited
              const canEdit = isOwn && !msg.media?.mediaUrl && canEditMessage(msg.sentAt)
              
              return (
                <div
                  key={msgId}
                  className={cn(
                    "flex group/msg items-end gap-1 relative",
                    isOwn ? "justify-end" : "justify-start",
                    reactions ? "mb-4" : "mb-0"
                  )}
                >
                  {/* Botões de ação estilo WhatsApp - aparecem no hover, fora da bolha */}
                  {!isOwn && (
                    <div className={cn(
                      "flex items-center gap-0.5 transition-opacity order-2 mb-1",
                      activeMessageId === msgId ? "opacity-100" : "opacity-0 group-hover/msg:opacity-100"
                    )}>
                      <button
                        className="h-7 w-7 rounded-full flex items-center justify-center bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors reactions-button"
                        onClick={(e) => { e.stopPropagation(); setShowReactions(showReactions === msgId ? null : msgId) }}
                        title="Reaccionar"
                      >
                        <Smile className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="h-7 w-7 rounded-full flex items-center justify-center bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => { e.stopPropagation(); setReplyTo(msg) }}
                        title="Responder"
                      >
                        <Reply className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="h-7 w-7 rounded-full flex items-center justify-center bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => { e.stopPropagation(); handleCopyMessage(actualContent, msgId) }}
                        title="Copiar"
                      >
                        {copiedMessageId === msgId ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 pt-2 pb-3 shadow-lg relative",
                      repliedMsg ? "min-w-[220px]" : "",
                      isOwn
                        ? "text-white rounded-br-md order-1"
                        : "bg-card text-foreground rounded-bl-md border border-border order-1"
                    )}
                    onTouchStart={(e) => { e.stopPropagation(); setActiveMessageId(activeMessageId === msgId ? null : msgId) }}
                    onClick={(e) => { e.stopPropagation(); setActiveMessageId(activeMessageId === msgId ? null : msgId) }}
                    style={isOwn ? { background: 'linear-gradient(135deg, #0f3f52 0%, #0a5c55 100%)' } : undefined}
                  >
                    {repliedMsg && (
                      <div className={`mb-2 p-2 rounded-lg text-xs border-l-2 border-primary/70 w-full ${
                        isOwn ? 'bg-black/20' : 'bg-primary/10'
                      }`}>
                        <p className="font-semibold text-primary/90 mb-0.5">
                          {repliedMsg.senderId === user?.userId ? 'Tú' : chatInfo?.otherUsername}
                        </p>
                        <p className="opacity-80 line-clamp-2">
                          {repliedMsg.media?.mediaUrl ? '📎 Archivo multimedia' : repliedMsg.content.substring(0, 100)}
                        </p>
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
                        className="rounded-lg w-full min-w-[260px] max-h-[300px]"
                      />
                    ) : msg.media?.mediaUrl && msg.mediaType === 'FILE' ? (
                      <a href={msg.media.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/10 rounded-lg hover:bg-black/20 transition-colors">
                        <span className="text-lg">📄</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">PDF</span>
                          <span className="text-xs opacity-70">{msg.media.format?.toUpperCase() || 'Documento'}</span>
                        </div>
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
                      isEditing ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full text-sm bg-white/10 rounded-lg p-2 text-white resize-none outline-none border border-white/30 focus:border-white/60"
                            rows={2}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(msgId) }
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                          />
                          <div className="flex gap-1 justify-end">
                            <button onClick={handleCancelEdit} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white">Cancelar</button>
                            <button onClick={() => handleSaveEdit(msgId)} className="text-xs px-2 py-1 rounded bg-white/30 hover:bg-white/40 font-medium text-white">Guardar</button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm leading-relaxed break-words">
                          {displayContent}
                          {wasEdited && <span className="text-[10px] opacity-50 ml-1">editado</span>}
                          {/* Spacer invisible para reservar espacio de la hora */}
                          <span className="inline-block align-bottom ml-2 opacity-0 select-none text-[10px] whitespace-nowrap">
                            {msg.sentAt ? formatDistanceToNow(new Date(msg.sentAt), { addSuffix: false, locale: es }) : ''}{isOwn ? ' ✓✓' : ''}
                          </span>
                        </span>
                      )
                    )}
                    {/* Hora + check flotando abajo a la derecha */}
                    <div className="flex items-center justify-end gap-1 -mt-4 pointer-events-none">
                      <p className={cn("text-[10px]", isOwn ? "text-white/50" : "text-muted-foreground")}>
                        {msg.sentAt ? formatDistanceToNow(new Date(msg.sentAt), { addSuffix: false, locale: es }) : ''}
                      </p>
                      {isOwn && (
                        <span className={cn(
                          "text-[10px]",
                          msg.read ? "text-blue-300" : "text-white/40"
                        )}>
                          {msgId.startsWith('optimistic-') ? '✓' : msg.read ? '✓✓' : '✓✓'}
                        </span>
                      )}
                    </div>
                    {reactions && (
                      <div
                        className={cn(
                          "absolute -bottom-3 flex gap-0.5 rounded-full px-1.5 py-0.5 border border-white/10 shadow-sm",
                          isOwn ? "right-2" : "left-2"
                        )}
                        style={isOwn ? { background: 'linear-gradient(135deg, #082838 0%, #063d38 100%)' } : undefined}
                      >
                        <span className="text-sm leading-none">{reactions}</span>
                      </div>
                    )}
                  </div>

                  {/* Picker de reacciones - fuera de la burbuja */}
                  {showReactions === msgId && (
                    <div
                      className="reactions-menu absolute -top-10 left-1/2 -translate-x-1/2 bg-background border border-primary/20 rounded-full px-2 py-1 shadow-lg flex gap-1 z-50"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {['❤️', '👍', '😂', '😮', '😢', '😡'].map(emoji => (
                        <button
                          key={emoji}
                          className="hover:scale-125 transition-transform text-lg p-1 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); handleReaction(msgId, emoji) }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Botões de ação para mensagens próprias */}
                  {isOwn && (
                    <div className={cn(
                      "flex items-center gap-0.5 transition-opacity order-0 mb-1",
                      activeMessageId === msgId ? "opacity-100" : "opacity-0 group-hover/msg:opacity-100"
                    )}>
                      <button
                        className="h-7 w-7 rounded-full flex items-center justify-center bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors reactions-button"
                        onClick={(e) => { e.stopPropagation(); setShowReactions(showReactions === msgId ? null : msgId) }}
                        title="Reaccionar"
                      >
                        <Smile className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="h-7 w-7 rounded-full flex items-center justify-center bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => { e.stopPropagation(); setReplyTo(msg) }}
                        title="Responder"
                      >
                        <Reply className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="h-7 w-7 rounded-full flex items-center justify-center bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => { e.stopPropagation(); handleCopyMessage(actualContent, msgId) }}
                        title="Copiar"
                      >
                        {copiedMessageId === msgId ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      {canEdit && (
                        <button
                          className="h-7 w-7 rounded-full flex items-center justify-center bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleStartEdit(msg) }}
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        className="h-7 w-7 rounded-full flex items-center justify-center bg-muted/80 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(msgId) }}
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="h-7 w-7 rounded-full flex items-center justify-center bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => { e.stopPropagation(); toggleStarMessage(msgId) }}
                        title="Destacar"
                      >
                        <Star className={cn("h-3.5 w-3.5", starredMessages.has(msgId) && "fill-yellow-500 text-yellow-500")} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Diálogo eliminar mensaje */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 pb-6 px-4" onClick={() => setDeleteConfirmId(null)}>
          <div className="w-full max-w-sm bg-card rounded-2xl border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold text-center text-foreground px-4 pt-4 pb-2">Eliminar mensaje</p>
            <div className="divide-y divide-border">
              <button
                className="w-full px-4 py-3.5 text-sm text-destructive font-medium hover:bg-muted/50 transition-colors text-left"
                onClick={() => handleDeleteMessage(deleteConfirmId, true)}
              >
                Eliminar para todos
              </button>
              <button
                className="w-full px-4 py-3.5 text-sm text-foreground hover:bg-muted/50 transition-colors text-left"
                onClick={() => handleDeleteMessage(deleteConfirmId, false)}
              >
                Eliminar para mí
              </button>
              <button
                className="w-full px-4 py-3.5 text-sm text-muted-foreground hover:bg-muted/50 transition-colors text-left"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        onTyping={handleTypingInput}
        onImageSelect={(file) => {
          setSelectedImage(file)
          if (file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onloadend = () => setImagePreview(reader.result as string)
            reader.readAsDataURL(file)
          } else {
            setImagePreview('video')
          }
        }}
        onFileSelect={(file) => { setSelectedFile(file); setFilePreview(file.name) }}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        isRecording={isRecording}
        recordingTime={recordingTime}
        isSending={isSending}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        imagePreview={imagePreview}
        filePreview={filePreview}
        selectedImage={selectedImage}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onRemoveImage={handleRemoveImage}
        onRemoveFile={handleRemoveFile}
        otherUsername={chatInfo?.otherUsername}
        userId={user?.userId}
      />
    </div>
  )
}
