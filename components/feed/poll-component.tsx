"use client"

import { useState, useEffect, useRef } from "react"
import { Poll } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useWebSocket } from "@/hooks/use-websocket"
import { useAuth } from "@/lib/auth-context"

interface PollComponentProps {
  poll: Poll
  onVote?: (optionId: string) => void
}

export function PollComponent({ poll: initialPoll, onVote }: PollComponentProps) {
  const { user } = useAuth()
  const [poll, setPoll] = useState<Poll>(initialPoll)
  const [selectedOption, setSelectedOption] = useState<string | null>(initialPoll.userVoted || null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const isExpired = new Date(poll.expiresAt) < new Date()
  const hasVoted = !!selectedOption

  const { sendPollVote, subscribeToPoll, isConnected } = useWebSocket(user?.userId, {
    onPollState: (updatedPoll: Poll) => {
      // El backend confirma el voto con el estado real desde Redis
      if (updatedPoll.id === poll.id) {
        setPoll(updatedPoll)
        if (updatedPoll.userVoted) setSelectedOption(updatedPoll.userVoted)
      }
    },
  })

  // Suscribirse al topic del poll para recibir updates en tiempo real
  useEffect(() => {
    if (!isConnected) return

    unsubscribeRef.current = subscribeToPoll(poll.id, (updatedPoll: Poll) => {
      setPoll(updatedPoll)
    })

    return () => {
      unsubscribeRef.current?.()
    }
  }, [isConnected, poll.id, subscribeToPoll])

  // Sincronizar si el poll cambia desde el padre
  useEffect(() => {
    setPoll(initialPoll)
    setSelectedOption(initialPoll.userVoted || null)
  }, [initialPoll.id])

  const handleVote = (optionId: string) => {
    if (isExpired) return
    // El backend permite cambiar voto, solo bloqueamos si es la misma opción
    if (selectedOption === optionId) return

    // Optimistic update
    setSelectedOption(optionId)
    setPoll(prev => {
      const total = prev.totalVotes + 1
      return {
        ...prev,
        totalVotes: total,
        options: prev.options.map(o => {
          const votes = o.id === optionId ? o.votes + 1 : o.votes
          return { ...o, votes, percentage: Math.round((votes / total) * 100) }
        }),
      }
    })

    const sent = sendPollVote(optionId)
    if (!sent) {
      // Fallback: revertir optimistic si no se pudo enviar
      setSelectedOption(null)
      setPoll(initialPoll)
      toast.error("No conectado, intenta de nuevo")
      return
    }

    onVote?.(optionId)
    toast.success("Voto registrado")
  }

  const timeLeft = formatDistanceToNow(new Date(poll.expiresAt), {
    addSuffix: true,
    locale: es,
  })

  return (
    <div className="mt-3 p-4 bg-muted/50 rounded-xl border border-border">
      <h4 className="font-semibold text-foreground mb-3">{poll.question}</h4>

      <div className="space-y-2">
        {poll.options.map((option) => {
          const isSelected = selectedOption === option.id
          const showResults = hasVoted || isExpired

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted || isExpired}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                showResults ? 'cursor-default' : 'hover:border-primary hover:bg-muted cursor-pointer'
              } ${
                isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  {option.text}
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </span>
                {showResults && (
                  <span className="text-sm font-bold text-foreground">
                    {option.percentage}%
                  </span>
                )}
              </div>
              {showResults && <Progress value={option.percentage} className="h-2" />}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{poll.totalVotes} {poll.totalVotes === 1 ? 'voto' : 'votos'}</span>
        <span>
          {isExpired
            ? 'Finalizada'
            : hasVoted
            ? 'Puedes cambiar tu voto'
            : `Finaliza ${timeLeft}`}
        </span>
      </div>
    </div>
  )
}
