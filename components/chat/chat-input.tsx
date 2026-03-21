"use client"

import { memo, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Smile, Image as ImageIcon, Mic, Paperclip, X, Loader2 } from "lucide-react"
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
  const emojiRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileDocRef = useRef<HTMLInputElement>(null)

  const handleChange = (v: string) => {
    setValue(v)
    onTyping(v)
  }

  const handleSend = () => {
    if (!value.trim() && !imagePreview && !filePreview) return
    onSend(value.trim())
    setValue("")
  }

  return (
    <div className="border-t border-primary/20 bg-background/95 backdrop-blur-xl px-4 py-3 shadow-lg shadow-primary/5">
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

        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="icon" onClick={() => setShowEmoji(!showEmoji)} className="h-10 w-10 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50">
            <Smile className="h-5 w-5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-10 w-10 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50">
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={isRecording ? onStopRecording : onStartRecording} className={cn("h-10 w-10 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50", isRecording && "bg-red-500 text-white animate-pulse")}>
            <Mic className="h-5 w-5" />
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*,image/gif,video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImageSelect(f) }} />
          <Button type="button" variant="ghost" size="icon" onClick={() => fileDocRef.current?.click()} className="h-10 w-10 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50">
            <Paperclip className="h-5 w-5" />
          </Button>
          <input ref={fileDocRef} type="file" accept="image/*,video/*,audio/*,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f) }} />
          <Input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="bg-muted/50 border-primary/20 text-foreground placeholder:text-muted-foreground rounded-2xl focus:border-primary/40 transition-colors"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          />
          <Button
            onClick={handleSend}
            disabled={isSending || isUploading || (!value.trim() && !imagePreview && !filePreview)}
            size="icon"
            className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-secondary text-black hover:scale-110 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100"
          >
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
})
