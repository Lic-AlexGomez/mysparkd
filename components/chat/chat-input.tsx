"use client"

import { memo, useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Smile, Image as ImageIcon, Mic, Paperclip, X, Loader2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import type { Message } from "@/lib/types"

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false })

interface ChatInputProps {
  onSend: (content: string) => void
  onTyping: (value: string) => void
  onImageSelect: (file: File) => void
  onFileSelect: (file: File) => void
  onStartRecording: () => void
  onStopRecording: () => void
  isRecording: boolean
  recordingTime: number
  isSending: boolean
  isUploading: boolean
  uploadProgress: number
  imagePreview: string | null
  filePreview: string | null
  selectedImage: File | null
  replyTo: Message | null
  onCancelReply: () => void
  onRemoveImage: () => void
  onRemoveFile: () => void
  otherUsername?: string
  userId?: string
}

export const ChatInput = memo(function ChatInput({
  onSend, onTyping, onImageSelect, onFileSelect,
  onStartRecording, onStopRecording, isRecording, recordingTime,
  isSending, isUploading, uploadProgress,
  imagePreview, filePreview, selectedImage,
  replyTo, onCancelReply, onRemoveImage, onRemoveFile,
  otherUsername, userId
}: ChatInputProps) {
  const [value, setValue] = useState("")
  const [showEmoji, setShowEmoji] = useState(false)
  const [showExtras, setShowExtras] = useState(false)
  const emojiRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileDocRef = useRef<HTMLInputElement>(null)
  const extrasRef = useRef<HTMLDivElement>(null)

  // Cerrar extras al hacer clic fuera
  useEffect(() => {
    if (!showExtras) return
    const handler = (e: MouseEvent) => {
      if (extrasRef.current && !extrasRef.current.contains(e.target as Node)) {
        setShowExtras(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showExtras])

  const handleChange = (v: string) => {
    setValue(v)
    onTyping(v)
    // Al escribir, colapsar el expandible
    if (v.length > 0) setShowExtras(false)
  }

  const handleSend = () => {
    if (!value.trim() && !imagePreview && !filePreview) return
    onSend(value.trim())
    setValue("")
  }

  return (
    <div className="flex-shrink-0 border-t border-primary/20 bg-background/95 backdrop-blur-xl px-3 py-3 shadow-lg shadow-primary/5">
      <div className="relative">
        {replyTo && (
          <div className="mb-2 p-2 bg-muted/50 rounded-lg flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold">Respondiendo a {replyTo.senderId === userId ? 'ti mismo' : otherUsername}</p>
              <p className="text-xs opacity-70 truncate">{replyTo.content.substring(0, 50)}</p>
            </div>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCancelReply}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {showEmoji && (
          <div ref={emojiRef} className="absolute bottom-full mb-2 right-0 z-50">
            <EmojiPicker onEmojiClick={(e) => { setValue(prev => prev + e.emoji); setShowEmoji(false) }} />
          </div>
        )}

        {imagePreview && (
          <div className="mb-2 relative inline-block">
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center gap-1">
                <span className="text-white text-xs font-bold">{uploadProgress}%</span>
              </div>
            )}
            {imagePreview === 'video'
              ? <div className="h-20 w-32 rounded-lg bg-muted flex items-center justify-center"><span className="text-xs">{selectedImage?.name}</span></div>
              : <img src={imagePreview} alt="Preview" className="h-20 rounded-lg" />
            }
            <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={onRemoveImage} disabled={isUploading}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {filePreview && (
          <div className="mb-2 flex items-center gap-2 bg-muted/50 border border-primary/20 rounded-lg px-3 py-2">
            <Paperclip className="h-4 w-4" />
            <span className="text-sm flex-1 truncate">{filePreview}</span>
            <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={onRemoveFile}>
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
            <Button type="button" size="sm" variant="destructive" onClick={onStopRecording}>Detener</Button>
          </div>
        )}

        {/* Panel expandible de opciones — solo visible en móvil cuando showExtras */}
        {showExtras && (
          <div
            ref={extrasRef}
            className="absolute bottom-full mb-2 left-0 z-50 flex gap-3 p-3 bg-card border border-border rounded-2xl shadow-xl lg:hidden"
          >
            <button
              type="button"
              onClick={() => { setShowEmoji(!showEmoji); setShowExtras(false) }}
              className="flex flex-col items-center gap-1"
            >
              <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                <Smile className="h-6 w-6 text-yellow-500" />
              </div>
              <span className="text-[10px] text-muted-foreground">Emoji</span>
            </button>
            <button
              type="button"
              onClick={() => { fileInputRef.current?.click(); setShowExtras(false) }}
              className="flex flex-col items-center gap-1"
            >
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-blue-500" />
              </div>
              <span className="text-[10px] text-muted-foreground">Imagen</span>
            </button>
            <button
              type="button"
              onClick={() => { isRecording ? onStopRecording() : onStartRecording(); setShowExtras(false) }}
              className="flex flex-col items-center gap-1"
            >
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", isRecording ? "bg-red-500" : "bg-red-500/10")}>
                <Mic className={cn("h-6 w-6", isRecording ? "text-white" : "text-red-500")} />
              </div>
              <span className="text-[10px] text-muted-foreground">{isRecording ? 'Detener' : 'Audio'}</span>
            </button>
            <button
              type="button"
              onClick={() => { fileDocRef.current?.click(); setShowExtras(false) }}
              className="flex flex-col items-center gap-1"
            >
              <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <Paperclip className="h-6 w-6 text-green-500" />
              </div>
              <span className="text-[10px] text-muted-foreground">Archivo</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Botón + expandible — solo móvil */}
          <button
            type="button"
            onClick={() => setShowExtras(!showExtras)}
            className={cn(
              "lg:hidden h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0",
              showExtras
                ? "bg-primary text-black rotate-45"
                : "bg-muted/80 text-muted-foreground hover:bg-muted"
            )}
          >
            <Plus className="h-5 w-5" />
          </button>

          {/* Botones individuales — solo desktop */}
          <div className="hidden lg:flex gap-1">
            <Button type="button" variant="ghost" size="icon" onClick={() => setShowEmoji(!showEmoji)} className="h-10 w-10 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50">
              <Smile className="h-5 w-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-10 w-10 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50">
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={isRecording ? onStopRecording : onStartRecording} className={cn("h-10 w-10 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50", isRecording && "bg-red-500 text-white animate-pulse")}>
              <Mic className="h-5 w-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => fileDocRef.current?.click()} className="h-10 w-10 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50">
              <Paperclip className="h-5 w-5" />
            </Button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*,image/gif,video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { onImageSelect(f); setShowExtras(false) } }} />
          <input ref={fileDocRef} type="file" accept="image/*,video/*,audio/*,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { onFileSelect(f); setShowExtras(false) } }} />

          <Input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="bg-muted/50 border-primary/20 text-foreground placeholder:text-muted-foreground rounded-2xl focus:border-primary/40 transition-colors"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            onFocus={() => setShowExtras(false)}
          />
          <Button
            onClick={handleSend}
            disabled={isSending || isUploading || (!value.trim() && !imagePreview && !filePreview)}
            size="icon"
            className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-secondary text-black hover:scale-110 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0"
          >
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
})
