"use client"

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react"
import { Mic, Play, Pause, Trash2, Square, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"

interface VoiceNotePlayerProps {
  url: string
}

interface VoiceNoteRecorderProps {
  currentUrl?: string | null
  onSaved: (url: string | null) => void
  onRecordingChange?: (isRecording: boolean) => void
}

const MAX_SECONDS = 30

// ── Player ────────────────────────────────────────────────────────────────────
export function VoiceNotePlayer({ url }: VoiceNotePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnd = () => { setPlaying(false); setProgress(0) }
    const onTime = () => setProgress(audio.currentTime)
    const onMeta = () => {
      if (audio.duration === Infinity || isNaN(audio.duration)) {
        audio.currentTime = 1e101
        const getDuration = () => {
          audio.removeEventListener('timeupdate', getDuration)
          audio.currentTime = 0
          setDuration(audio.duration)
        }
        audio.addEventListener('timeupdate', getDuration)
      } else {
        setDuration(audio.duration)
      }
    }
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    return () => {
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  }

  const fmt = (s: number) => {
    if (isNaN(s) || !isFinite(s)) return "0:00"
    const m = Math.floor(s / 60)
    const secs = Math.floor(s % 60)
    return `${m}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-md"
      >
        {playing
          ? <Pause className="h-4 w-4 text-black" />
          : <Play className="h-4 w-4 text-black ml-0.5" />
        }
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
            style={{ width: duration > 0 ? `${(progress / duration) * 100}%` : '0%' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{fmt(progress)}</span>
          <span>{duration > 0 && isFinite(duration) ? fmt(duration) : `0:${MAX_SECONDS}`}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">aqui🎙️</span>
    </div>
  )
}

export interface VoiceNoteRecorderHandle {
  isRecording: () => boolean
  stopAndUpload: () => Promise<void>
}

// ── Recorder ──────────────────────────────────────────────────────────────────
export const VoiceNoteRecorder = forwardRef<VoiceNoteRecorderHandle, VoiceNoteRecorderProps>(function VoiceNoteRecorder({ currentUrl, onSaved, onRecordingChange }, ref) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recordingRef = useRef(false)
  const uploadResolveRef = useRef<(() => void) | null>(null)
  const onRecordingChangeRef = useRef(onRecordingChange)
  useEffect(() => { onRecordingChangeRef.current = onRecordingChange }, [onRecordingChange])

  useImperativeHandle(ref, () => ({
    isRecording: () => recordingRef.current,
    stopAndUpload: () => {
      if (!recordingRef.current || !mediaRecorderRef.current) return Promise.resolve()
      return new Promise<void>((resolve) => {
        uploadResolveRef.current = resolve
        if (timerRef.current) clearInterval(timerRef.current)
        mediaRecorderRef.current!.stop()
        setRecording(false)
        recordingRef.current = false
        onRecordingChangeRef.current?.(false)
      })
    }
  }), [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Safari solo soporta audio/mp4, otros navegadores prefieren audio/webm
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : ''

      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      const actualMime = mr.mimeType || 'audio/webm'
      mediaRecorderRef.current = mr
      chunksRef.current = []

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: actualMime })
        const ext = actualMime.includes('mp4') ? 'mp4' : 'webm'
        const localUrl = URL.createObjectURL(blob)
        setPreviewUrl(localUrl)
        stream.getTracks().forEach(t => t.stop())
        await uploadAudio(blob, localUrl, ext)
        // Resolver promesa externa si fue llamado desde stopAndUpload
        if (uploadResolveRef.current) {
          uploadResolveRef.current()
          uploadResolveRef.current = null
        }
      }

      mr.start()
      setRecording(true)
      recordingRef.current = true
      onRecordingChangeRef.current?.(true)
      setSeconds(0)

      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev >= MAX_SECONDS - 1) {
            stopRecording()
            return MAX_SECONDS
          }
          return prev + 1
        })
      }, 1000)
    } catch {
      toast.error('No se pudo acceder al micrófono')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
    setRecording(false)
    recordingRef.current = false
    onRecordingChangeRef.current?.(false)
  }

  const uploadAudio = async (blob: Blob, localUrl: string, ext: string = 'webm') => {
    setUploading(true)
    try {
      const mimeType = blob.type || `audio/${ext}`
      const file = new File([blob], `voice-note-${Date.now()}.${ext}`, { type: mimeType })
      const formData = new FormData()
      formData.append('file', file)

      const token = typeof window !== 'undefined' ? localStorage.getItem('sparkd_token') : null
      const res = await fetch('/api/proxy/api/profile/voice-note', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      if (!res.ok) {
        const err = await res.text().catch(() => 'Error al guardar nota de voz')
        throw new Error(err)
      }

      toast.success('Nota de voz guardada')
      onSaved(localUrl)
      // Refrescar perfil desde el backend para obtener la URL real de Cloudinary
      try {
        const profile = await api.get<any>('/api/profile/me')
        onSaved(profile.voiceIntroUrl || localUrl)
      } catch {
        // si falla el refresh, usar la URL local
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar nota de voz')
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete('/api/profile/delete/voice')
      setPreviewUrl(null)
      onSaved(null)
      toast.success('Nota de voz eliminada')
    } catch {
      toast.error('Error al eliminar nota de voz')
    }
  }

  const activeUrl = previewUrl || currentUrl

  return (
    <div className="space-y-3">
      {activeUrl && !uploading && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <VoiceNotePlayer url={activeUrl} />
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="h-9 w-9 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors shrink-0"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </button>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Loader2 className="h-4 w-4 animate-spin" />
          Guardando nota de voz...
        </div>
      )}

      {!activeUrl && !uploading && (
        <div className="flex items-center gap-3">
          {recording ? (
            <>
              <div className="flex items-center gap-2 flex-1">
                <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-destructive rounded-full transition-all duration-1000"
                    style={{ width: `${(seconds / MAX_SECONDS) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-destructive font-mono shrink-0">
                  {seconds}s / {MAX_SECONDS}s
                </span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="h-9 w-9 rounded-full bg-destructive flex items-center justify-center shrink-0"
              >
                <Square className="h-4 w-4 text-white" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 hover:bg-primary/10 transition-colors text-sm text-foreground"
            >
              <Mic className="h-4 w-4 text-primary" />
              Grabar nota de voz (máx. {MAX_SECONDS}s)
            </button>
          )}
        </div>
      )}

      {activeUrl && !uploading && !recording && (
        <button
          type="button"
          onClick={handleDelete}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Grabar de nuevo
        </button>
      )}
    </div>
  )
})
