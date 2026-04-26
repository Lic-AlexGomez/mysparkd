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

/** Máxima duración de nota de voz (grabación y subida de archivo). */
export const MAX_VOICE_NOTE_SECONDS = 30

/** Límite razonable para clips de voz (alineado con notas cortas; el backend puede imponer otro tope) */
export const VOICE_NOTE_MAX_FILE_BYTES = 5 * 1024 * 1024

const VOICE_FILE_NAME_EXT = /\.(webm|m4a|mp3|mpeg|mpga|ogg|opus|aac|wav|flac|3gp|oga)$/i

function isAllowedAudioMimeType(type: string): boolean {
  if (!type) return false
  if (type.startsWith("audio/")) return true
  if (type === "application/ogg") return true
  return false
}

/**
 * Valida un archivo elegido en file input antes de subir (tipo MIME, extensión y tamaño).
 * La grabación con MediaRecorder siempre genera `audio/*`; sigue siendo válida.
 */
export function validateVoiceNoteFile(
  file: File,
  maxBytes: number = VOICE_NOTE_MAX_FILE_BYTES
): { ok: true } | { ok: false; message: string } {
  if (file.size > maxBytes) {
    const mb = maxBytes / (1024 * 1024)
    return {
      ok: false,
      message: `El archivo supera el tamaño máximo (${mb} MB). Prueba con un audio más corto o de menor calidad.`,
    }
  }
  if (file.type && file.type.startsWith("video/")) {
    return { ok: false, message: "Solo se permiten archivos de audio, no vídeo." }
  }
  if (file.type && file.type !== "application/octet-stream") {
    if (isAllowedAudioMimeType(file.type)) return { ok: true }
    return { ok: false, message: "Solo se permiten archivos de audio (voz o música en formato de audio)." }
  }
  if (VOICE_FILE_NAME_EXT.test(file.name)) return { ok: true }
  return {
    ok: false,
    message: "No se pudo verificar el audio. Usa un archivo .webm, .m4a, .mp3, .ogg u otro formato de audio común.",
  }
}

/** Mensaje cuando el audio supera el máximo de segundos (grabación y subida). */
export function voiceNoteDurationExceededMessage(
  maxSeconds: number = MAX_VOICE_NOTE_SECONDS
): string {
  return `El audio no puede superar ${maxSeconds} segundos.`
}

/**
 * Obtiene la duración en segundos de un archivo de audio (object URL + elemento Audio).
 * Incluye workaround para WebM sin metadatos de duración (p. ej. Chrome / MediaRecorder).
 */
export function getAudioDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const audio = document.createElement("audio")
    audio.preload = "metadata"
    let settled = false
    let seekFallbackStarted = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const cleanup = () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId)
      URL.revokeObjectURL(objectUrl)
      audio.removeAttribute("src")
    }

    const resolveOnce = (seconds: number) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(seconds)
    }

    const rejectOnce = (message: string) => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error(message))
    }

    const tryInfinityWorkaround = () => {
      if (seekFallbackStarted || settled) return
      seekFallbackStarted = true
      const onTimeUpdate = () => {
        audio.removeEventListener("timeupdate", onTimeUpdate)
        const d = audio.duration
        try {
          audio.currentTime = 0
        } catch {
          /* ignore */
        }
        if (isFinite(d) && d > 0) {
          resolveOnce(d)
        } else {
          rejectOnce("No se pudo determinar la duración del audio")
        }
      }
      audio.addEventListener("timeupdate", onTimeUpdate)
      try {
        audio.currentTime = 1e101
      } catch {
        seekFallbackStarted = false
        audio.removeEventListener("timeupdate", onTimeUpdate)
        rejectOnce("No se pudo leer la duración del audio")
      }
    }

    const tryReadDuration = () => {
      if (settled) return
      const d = audio.duration
      if (isFinite(d) && d > 0) {
        resolveOnce(d)
        return
      }
      if (d === Infinity) {
        tryInfinityWorkaround()
      }
    }

    timeoutId = setTimeout(() => {
      rejectOnce("Tiempo de espera al leer la duración del audio")
    }, 15_000)

    audio.addEventListener("loadedmetadata", tryReadDuration)
    audio.addEventListener("durationchange", tryReadDuration)
    audio.addEventListener("canplaythrough", tryReadDuration)
    audio.addEventListener("error", () => rejectOnce("No se pudo leer el audio"), { once: true })
    audio.src = objectUrl
  })
}

// ── Player ────────────────────────────────────────────────────────────────────
export function VoiceNotePlayer({ url }: VoiceNotePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    setDuration(0)
    setProgress(0)
    setPlaying(false)

    const onEnd = () => { setPlaying(false); setProgress(0) }
    const onTime = () => {
      if (isFinite(audio.currentTime)) setProgress(audio.currentTime)
    }

    const tryGetDuration = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
        return true
      }
      return false
    }

    const onMeta = () => {
      if (!tryGetDuration()) {
        // webm sin duración en header: cargar todo el audio
        audio.preload = 'auto'
        audio.load()
      }
    }

    const onDurationChange = () => { tryGetDuration() }

    const onCanPlayThrough = () => { tryGetDuration() }

    audio.addEventListener('ended', onEnd)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('canplaythrough', onCanPlayThrough)

    // forzar carga
    audio.load()

    return () => {
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('canplaythrough', onCanPlayThrough)
    }
  }, [url])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      // Si el seek de duración dejó el audio al final, resetear
      if (audio.currentTime >= (audio.duration || 0) - 0.1) {
        audio.currentTime = 0
      }
      audio.play()
      setPlaying(true)
    }
  }

  const fmt = (s: number) => {
    if (isNaN(s) || !isFinite(s)) return "0:00"
    const m = Math.floor(s / 60)
    const secs = Math.floor(s % 60)
    return `${m}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
      <audio ref={audioRef} src={url} preload="auto" />
      <button
        type="button"
        onClick={toggle}
        className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-md"
        aria-label={playing ? "Pausar reproducción" : "Reproducir nota de voz"}
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
        <div className="text-[10px] text-muted-foreground text-right">
          {playing
            ? `${fmt(progress)} / ${fmt(duration)}`
            : duration > 0 && isFinite(duration)
              ? fmt(duration)
              : '...'}
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">🎙️</span>
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
          if (prev >= MAX_VOICE_NOTE_SECONDS - 1) {
            stopRecording()
            return MAX_VOICE_NOTE_SECONDS
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
      const check = validateVoiceNoteFile(file)
      if (!check.ok) {
        URL.revokeObjectURL(localUrl)
        toast.error(check.message)
        setPreviewUrl(null)
        return
      }
      try {
        const durationSec = await getAudioDurationSeconds(file)
        if (durationSec > MAX_VOICE_NOTE_SECONDS) {
          URL.revokeObjectURL(localUrl)
          toast.error(voiceNoteDurationExceededMessage())
          setPreviewUrl(null)
          return
        }
      } catch (e) {
        URL.revokeObjectURL(localUrl)
        toast.error(e instanceof Error ? e.message : "No se pudo leer la duración del audio")
        setPreviewUrl(null)
        return
      }
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
            aria-label="Eliminar nota de voz"
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
              <div className="flex items-center gap-2 flex-1" role="status" aria-live="polite">
                <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-destructive rounded-full transition-all duration-1000"
                    style={{ width: `${(seconds / MAX_VOICE_NOTE_SECONDS) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-destructive font-mono shrink-0">
                  {seconds}s / {MAX_VOICE_NOTE_SECONDS}s
                </span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="h-9 w-9 rounded-full bg-destructive flex items-center justify-center shrink-0"
                aria-label="Detener y subir la grabación"
              >
                <Square className="h-4 w-4 text-white" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 hover:bg-primary/10 transition-colors text-sm text-foreground"
              aria-label={`Grabar con el micrófono, máximo ${MAX_VOICE_NOTE_SECONDS} segundos`}
            >
              <Mic className="h-4 w-4 text-primary" aria-hidden />
              Grabar con el micrófono (máx. {MAX_VOICE_NOTE_SECONDS}s)
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
          Volver a grabar
        </button>
      )}
    </div>
  )
})
