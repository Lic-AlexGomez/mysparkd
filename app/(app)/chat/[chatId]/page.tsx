"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { chatService } from "@/lib/services/chat"
import { useAuth } from "@/lib/auth-context"
import { useWebSocket } from "@/hooks/use-websocket"
import type { Message, Chat } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, Loader2, MessageCircle, Smile, Image as ImageIcon, X, Mic, Reply, MoreVertical, Copy, Paperclip, Check, Search, Star, Images, Gamepad2, Pencil, Trash2, Pin } from "lucide-react"
import dynamic from "next/dynamic"
import { AudioMessage } from "@/components/audio-message"
import { GamePanel } from "@/components/chat/game-panel"
import { ChatInput } from "@/components/chat/chat-input"
import {
  ChatContextHeader,
  ChatContextHeaderAvatar,
} from "@/components/chat/chat-context-header"
import { ChatContextActions } from "@/components/chat/chat-context-actions"
import { ChatActivityFeed } from "@/components/chat/chat-activity-feed"
import { ChatContextQuickReplies } from "@/components/chat/chat-context-quick-replies"
import { contextAwareChatService } from "@/lib/services/context-aware-chat"
import type { ChatContextResponse } from "@/lib/types/context-aware-chat"
import { conversionLoopService } from "@/lib/services/conversion-loop"

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false })
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { privateChatPinnedService } from "@/lib/services/private-chat-pinned"
import { useI18n } from "@/lib/i18n"

function pinnedSnippet(msg: Message, te: (es: string, en: string) => string): string {
  const raw = msg.content?.startsWith("@reply:")
    ? (msg.content.match(/@reply:[^|]+\|(.*)/)?.[1] ?? msg.content)
    : (msg.content ?? "")
  if (!raw?.trim()) {
    if (msg.media?.mediaUrl || msg.mediaType === "IMAGE") return `📷 ${te("Imagen", "Image")}`
    if (msg.mediaType === "VIDEO") return `🎬 ${te("Vídeo", "Video")}`
    if (msg.mediaType === "AUDIO") return `🎤 ${te("Audio", "Audio")}`
    return te("Mensaje", "Message")
  }
  return raw.length > 100 ? `${raw.slice(0, 97)}…` : raw
}

function pinnedAuthorLabel(msg: Message, selfId: string | undefined, otherName: string | undefined, te: (es: string, en: string) => string): string {
  const sid = msg.senderId?.toString ? msg.senderId.toString() : String(msg.senderId)
  const my = selfId?.toString ? selfId.toString() : String(selfId)
  if (sid === my) return te("Tú", "You")
  return otherName || te("Usuario", "User")
}

export default function ChatRoomPage() {
  const { te, t, language } = useI18n()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const chatId = params.chatId as string
  const [chatContext, setChatContext] = useState<ChatContextResponse | null>(null)

  const contextQuery = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString())
    if (language === "en") p.set("lang", "en")
    return p.toString()
  }, [searchParams, language])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const ctx = await contextAwareChatService.getContext(chatId, contextQuery)
        if (!cancelled) setChatContext(ctx)
      } catch {
        if (!cancelled) setChatContext(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [chatId, contextQuery])
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

  // Cargar reactions del backend al recibir mensajes
  const syncReactionsFromMessages = useCallback((msgs: Message[]) => {
    const backendReactions: Record<string, string> = {}
    const reactionToEmoji: Record<string, string> = {
      'LOVE': '❤️', 'LIKE': '👍', 'LAUGH': '😂', 'WOW': '😮', 'SAD': '😢', 'FIRE': '😡'
    }
    msgs.forEach(msg => {
      const msgId = msg.messageId || msg.id || ''
      if (msg.reactions && msg.reactions.length > 0) {
        // mostrar la reaction del otro usuario (no la propia)
        const otherReaction = msg.reactions.find((r: any) => r.userId !== user?.userId)
        if (otherReaction) {
          backendReactions[msgId] = reactionToEmoji[otherReaction.reaction] || ''
        }
      }
    })
    if (Object.keys(backendReactions).length > 0) {
      setMessageReactions(prev => ({ ...backendReactions, ...prev }))
    }
  }, [user?.userId])
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
  const [aiType, setAiType] = useState<"suggestions" | "icebreaker" | "date" | "coordination">("suggestions")
  const [selectedImageView, setSelectedImageView] = useState<string | null>(null)
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([])
  const [pinUpdatingId, setPinUpdatingId] = useState<string | null>(null)
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
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
      setPinnedMessages((prev) => prev.filter((m) => (m.messageId || m.id) !== id))
    },
    onMessagePinned: (event: any) => {
      if (!event?.type) return
      if (event.type === "MESSAGE_PINNED" && event.message) {
        const raw = event.message as Message
        const mid = String(raw.messageId || raw.id || "")
        if (!mid) return
        const mChat = String(raw.chatId ?? "")
        if (mChat && mChat !== chatIdRef.current) return
        const normalized: Message = { ...raw, messageId: mid, id: mid, chatId: raw.chatId }
        setPinnedMessages((prev) => {
          if (prev.some((p) => (p.messageId || p.id) === mid)) {
            return prev.map((p) => ((p.messageId || p.id) === mid ? { ...p, ...normalized } : p))
          }
          return [normalized, ...prev]
        })
        setMessages((prev) => {
          if (!prev.some((x) => (x.messageId || x.id) === mid)) return prev
          return prev.map((x) => ((x.messageId || x.id) === mid ? { ...x, ...normalized, pinnedAt: normalized.pinnedAt } : x))
        })
        return
      }
      if (event.type === "MESSAGE_UNPINNED" && event.messageId) {
        const eChat = event.chatId != null ? String(event.chatId) : ""
        if (eChat && eChat !== chatIdRef.current) return
        const id = String(event.messageId)
        setPinnedMessages((prev) => prev.filter((m) => (m.messageId || m.id) !== id))
      }
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
        const merged = [...data, ...pendingOptimistic]
        syncReactionsFromMessages(data)
        return merged
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

  const loadPinnedMessages = useCallback(async () => {
    try {
      const data = await privateChatPinnedService.list(chatId)
      setPinnedMessages(data)
    } catch {
      // list endpoint opcional: no bloquear el chat
    }
  }, [chatId])

  const scrollToPinnedInThread = useCallback((messageId: string) => {
    const el = document.getElementById(`chat-msg-${messageId}`)
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
    el?.classList.add("ring-2", "ring-primary/40", "rounded-2xl", "transition-shadow")
    window.setTimeout(() => {
      el?.classList.remove("ring-2", "ring-primary/40", "rounded-2xl", "transition-shadow")
    }, 2000)
  }, [])

  const handlePinToggle = useCallback(
    async (msg: Message) => {
      const id = String(msg.messageId || msg.id || "")
      if (!id) return
      const isPinned = pinnedMessages.some((p) => (p.messageId || p.id) === id)
      setPinUpdatingId(id)
      try {
        if (isPinned) {
          await privateChatPinnedService.unpin(id)
          setPinnedMessages((prev) => prev.filter((m) => (m.messageId || m.id) !== id))
          setMessages((prev) =>
            prev.map((m) => ((m.messageId || m.id) === id ? { ...m, pinnedAt: null } : m))
          )
        } else {
          const updated = await privateChatPinnedService.pin(id)
          const mid = String(updated.messageId || updated.id || id)
          setPinnedMessages((prev) => {
            const next = prev.filter((m) => (m.messageId || m.id) !== mid)
            return [{ ...updated, messageId: mid, id: mid }, ...next]
          })
          setMessages((prev) =>
            prev.map((m) => ((m.messageId || m.id) === mid ? { ...m, ...updated, pinnedAt: updated.pinnedAt } : m))
          )
        }
      } catch (e: unknown) {
        const err = e as { message?: string }
        toast.error(err?.message || te("No se pudo actualizar el mensaje fijado", "Could not update pinned message"))
        void loadPinnedMessages()
      } finally {
        setPinUpdatingId(null)
      }
    },
    [pinnedMessages, loadPinnedMessages]
  )

  useEffect(() => {
    fetchMessages()
    fetchChatInfo()
    void loadPinnedMessages()
    chatService.markChatAsRead(chatId).catch(() => {})
    // Marcar como leído via WebSocket también
    if (isConnected) sendSeen(chatId)
  }, [fetchMessages, fetchChatInfo, loadPinnedMessages, chatId])

  // Mantiene el chat ajustado al viewport visible (teclado móvil incluido).
  useEffect(() => {
    const vv = window.visualViewport
    const updateViewport = () => {
      setViewportHeight(Math.round(vv?.height ?? window.innerHeight))
    }
    updateViewport()
    vv?.addEventListener("resize", updateViewport)
    vv?.addEventListener("scroll", updateViewport)
    window.addEventListener("resize", updateViewport)
    return () => {
      vv?.removeEventListener("resize", updateViewport)
      vv?.removeEventListener("scroll", updateViewport)
      window.removeEventListener("resize", updateViewport)
    }
  }, [])

  // Evita que el teclado desplace toda la app en móviles.
  useEffect(() => {
    const scrollY = window.scrollY
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyLeft = document.body.style.left
    const previousBodyRight = document.body.style.right
    const previousBodyWidth = document.body.style.width

    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = "0"
    document.body.style.right = "0"
    document.body.style.width = "100%"

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.left = previousBodyLeft
      document.body.style.right = previousBodyRight
      document.body.style.width = previousBodyWidth
      window.scrollTo(0, scrollY)
    }
  }, [])

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
    // Mapear emoji a ReactionType del backend
    const emojiToReaction: Record<string, string> = {
      '❤️': 'LOVE', '👍': 'LIKE', '😂': 'LAUGH', '😮': 'WOW', '😢': 'SAD', '😡': 'FIRE'
    }
    const reactionType = emojiToReaction[emoji]
    if (!reactionType) return

    // Toggle local optimista
    setMessageReactions(prev => {
      const current = prev[messageId]
      const next = { ...prev, [messageId]: current === emoji ? '' : emoji }
      localStorage.setItem(`chat_reactions_${chatId}`, JSON.stringify(next))
      return next
    })
    setShowReactions(null)

    // Sync con backend
    try {
      await api.post(`/api/messages/messages/${messageId}/react?reaction=${reactionType}`)
    } catch {
      // silent - la reacción local ya se aplicó
    }
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
      toast.error(te('Error al editar el mensaje', 'Error editing message'))
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
    } catch (e: any) {
      console.error('[delete] error:', e)
      toast.error(te('Error al eliminar el mensaje', 'Error deleting message'))
    }
    setDeleteConfirmId(null)
  }

  const deleteConfirmMessage = deleteConfirmId 
    ? messages.find(m => (m.messageId || m.id) === deleteConfirmId) 
    : null
  const deleteConfirmIsOwn = deleteConfirmMessage?.senderId === user?.userId

  const filteredMessages = useMemo(() => searchQuery
    ? messages.filter(msg => !deletedMessages.has(msg.messageId || msg.id || '') && msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages.filter(msg => !deletedMessages.has(msg.messageId || msg.id || ''))
  , [messages, deletedMessages, searchQuery])

  const mediaMessages = useMemo(() => messages.filter(msg => {
    const content = msg.content.startsWith('@reply:') ? msg.content.split('|')[1] : msg.content
    return content?.startsWith('http') && (content.includes('cloudinary.com') || content.match(/\.(jpg|jpeg|png|gif|webp)$/i))
  }), [messages])

  const pinnedIdSet = useMemo(
    () => new Set(pinnedMessages.map((m) => String(m.messageId || m.id || "")).filter(Boolean)),
    [pinnedMessages]
  )

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
      alert(te('No se pudo acceder al micrófono. Verifica los permisos.', 'Could not access microphone. Check permissions.'))
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

  const callAI = async (type: "suggestions" | "icebreaker" | "date" | "coordination") => {
    setAiLoading(true)
    setAiType(type)
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          otherUsername: chatInfo?.otherUsername,
          lastMessages: messages.slice(-5),
          contextTitle: chatContext?.context_title,
        }),
      })
      const data = await res.json()
      const result = Array.isArray(data.result) ? data.result.filter((s: string) => s.trim()) : [data.result].filter(Boolean)
      setAiSuggestions(result)
    } catch {
      toast.error(te('Error al obtener sugerencias', 'Error getting suggestions'))
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
          let msg = te('Error al subir archivo', 'Error uploading file')
          try { msg = JSON.parse(xhr.responseText)?.message || msg } catch {}
          reject(new Error(`${msg} (${xhr.status})`))
        }
      }
      xhr.onerror = () => reject(new Error(te('Error de red al subir archivo', 'Network error while uploading file')))
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
      if (user?.userId) {
        void conversionLoopService
          .track({ stage: "chat", metadata: { channel_id: chatId } })
          .catch(() => {})
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
    <div
      className="chat-room fixed inset-x-0 top-0 z-10 flex flex-col overflow-hidden bg-background lg:left-20 xl:left-72"
      style={{ height: viewportHeight ? `${viewportHeight}px` : "100dvh" }}
    >
      {/* Chat header */}
      <div className="z-20 flex-shrink-0 flex items-center gap-3 border-b border-primary/20 bg-background/95 backdrop-blur-xl px-4 py-3 shadow-lg shadow-primary/5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/chat")}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Volver</span>
        </Button>
   
        <ChatContextHeaderAvatar
          otherUserPhoto={chatInfo?.otherUserPhoto}
          otherUsername={chatInfo?.otherUsername}
        />
        <ChatContextHeader
          context={chatContext}
          otherUsername={chatInfo?.otherUsername}
          otherUserId={chatInfo?.otherUserId}
          isTyping={isTyping}
          otherUserOnline={otherUserOnline}
          otherUserLastSeen={otherUserLastSeen}
          te={te}
          language={language}
        />
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
            <Star className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowGame(!showGame)} className={cn("text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl", showGame && "text-primary bg-primary/10")}>
            <Gamepad2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ChatContextActions chatId={chatId} context={chatContext} te={te} />
      <ChatActivityFeed chatId={chatId} search={contextQuery} language={language} te={te} />

      {showSearch && (
        <div className="flex-shrink-0 border-b border-primary/20 bg-background/95 px-4 py-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={te("Buscar mensajes...", "Search messages...")}
            className="bg-muted/50 border-primary/20"
          />
        </div>
      )}

      {showGallery && (
        <div className="flex-shrink-0 border-b border-primary/20 bg-background/95 px-4 py-2">
          <p className="text-xs font-semibold mb-1.5">{te("Galería", "Gallery")} ({mediaMessages.length})</p>
          <div className="grid grid-cols-6 gap-1.5 max-h-20 overflow-y-auto">
            {mediaMessages.map((msg, gIdx) => {
              const content = msg.content.startsWith('@reply:') ? msg.content.split('|')[1] : msg.content
              return (
                <img
                  key={msg.messageId || msg.id || `gallery-${gIdx}`}
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
            <Star className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Asistente IA</span>
            <div className="flex gap-1 ml-auto">
              {(["suggestions", "icebreaker", "date", "coordination"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => callAI(t)}
                  className={cn(
                    "text-xs px-2 py-1 rounded-full border transition-colors",
                    aiType === t ? "bg-primary text-black border-primary" : "border-primary/30 text-muted-foreground hover:border-primary"
                  )}
                >
                  {t === "suggestions"
                    ? "💬 Temas"
                    : t === "icebreaker"
                      ? "❄️ Romper hielo"
                      : t === "date"
                        ? "📅 Citas"
                        : "📍 Plan"}
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
            myUsername={user?.username || user?.nombres || te('Tú', 'You')}
            otherUsername={chatInfo?.otherUsername || 'tu match'}
          />
        </div>
      )}

      {pinnedMessages.length > 0 && (
        <div className="flex-shrink-0 border-b border-primary/20 bg-primary/5 px-3 py-2 max-h-32 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{te("Fijados", "Pinned")}</p>
          <div className="flex flex-col gap-1.5">
            {pinnedMessages.map((pm) => {
              const pId = String(pm.messageId || pm.id || "")
              if (!pId) return null
              const inThread = messages.some((m) => (m.messageId || m.id) === pId)
              return (
                <div
                  key={pId}
                  className="flex items-center gap-2 rounded-lg border border-primary/20 bg-background/90 px-2 py-1.5"
                >
                  <Pin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground">
                      {pinnedAuthorLabel(pm, user?.userId, chatInfo?.otherUsername, te)}
                    </p>
                    <p className="text-xs line-clamp-2 break-words">{pinnedSnippet(pm, te)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {inThread && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => scrollToPinnedInThread(pId)}
                      >
                        Ir
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] text-muted-foreground"
                      disabled={pinUpdatingId === pId}
                      onClick={() => void handlePinToggle(pm)}
                    >
                      {pinUpdatingId === pId ? "…" : "Desfijar"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
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
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4"
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
            filteredMessages.map((msg, msgIdx) => {
              const msgId = msg.messageId || msg.id || `msg-${msgIdx}`
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
              const isDeletedContent = actualContent === te('Mensaje eliminado', 'Message deleted')
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
                  id={`chat-msg-${msgId}`}
                  key={msgId}
                  className={cn(
                    "flex group/msg items-end gap-1 relative",
                    isOwn ? "justify-end" : "justify-start",
                    reactions ? "mb-4" : "mb-0"
                  )}
                >
                  {/* Botões de ação estilo WhatsApp - aparecem no hover, fora da bolha */}
                  {!isOwn && !deletedMessages.has(msgId) && !isDeletedContent && (
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
                        title={t("common.copy")}
                      >
                        {copiedMessageId === msgId ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
                          pinnedIdSet.has(msgId) && "text-primary"
                        )}
                        onClick={(e) => { e.stopPropagation(); void handlePinToggle(msg) }}
                        title={pinnedIdSet.has(msgId) ? "Desfijar" : "Fijar"}
                        disabled={pinUpdatingId === msgId}
                      >
                        <Pin className={cn("h-3.5 w-3.5", pinnedIdSet.has(msgId) && "fill-primary/30")} />
                      </button>
                      <button
                        className="h-7 w-7 rounded-full flex items-center justify-center bg-muted/80 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(msgId) }}
                        title={te("Eliminar para mí", "Delete for me")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
                          {repliedMsg.senderId === user?.userId ? te('Tú', 'You') : chatInfo?.otherUsername}
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
                        alt={te("Imagen", "Image")} 
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
                        alt={te("Imagen", "Image")} 
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
                  {isOwn && !deletedMessages.has(msgId) && !isDeletedContent && (
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
                        title={t("common.copy")}
                      >
                        {copiedMessageId === msgId ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      {canEdit && (
                        <button
                          className="h-7 w-7 rounded-full flex items-center justify-center bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleStartEdit(msg) }}
                          title={t("common.edit")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
                          pinnedIdSet.has(msgId) && "text-primary"
                        )}
                        onClick={(e) => { e.stopPropagation(); void handlePinToggle(msg) }}
                        title={pinnedIdSet.has(msgId) ? "Desfijar" : "Fijar"}
                        disabled={pinUpdatingId === msgId}
                      >
                        <Pin className={cn("h-3.5 w-3.5", pinnedIdSet.has(msgId) && "fill-primary/30")} />
                      </button>
                      <button
                        className="h-7 w-7 rounded-full flex items-center justify-center bg-muted/80 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(msgId) }}
                        title={t("common.delete")}
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
            <p className="text-sm font-semibold text-center text-foreground px-4 pt-4 pb-2">{te("Eliminar mensaje", "Delete message")}</p>
            <div className="divide-y divide-border">
              {deleteConfirmIsOwn && (
                <button
                  className="w-full px-4 py-3.5 text-sm text-destructive font-medium hover:bg-muted/50 transition-colors text-left"
                  onClick={() => handleDeleteMessage(deleteConfirmId, true)}
                >
                  {te("Eliminar para todos", "Delete for everyone")}
                </button>
              )}
              <button
                className="w-full px-4 py-3.5 text-sm text-foreground hover:bg-muted/50 transition-colors text-left"
                onClick={() => handleDeleteMessage(deleteConfirmId, false)}
              >
                {te("Eliminar para mí", "Delete for me")}
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

      <ChatContextQuickReplies
        context={chatContext}
        onPick={(text) => {
          setNewMessage(text)
          newMessageRef.current = text
        }}
        te={te}
      />
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
