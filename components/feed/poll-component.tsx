"use client"

import { useState, useEffect, useRef } from "react"
import { Poll } from "@/lib/types"
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
  const storageKey = `poll_vote_${initialPoll.id}_${user?.userId}`

  // Leer voto guardado localmente como fallback
  const savedVote = typeof window !== 'undefined'
    ? localStorage.getItem(storageKey)
    : null

  const [poll, setPoll] = useState<Poll>(initialPoll)
  const [selectedOption, setSelectedOption] = useState<string | null>(
    savedVote || initialPoll.userVoted || null
  )
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const expiresDate = poll.expiresAt ? new Date(poll.expiresAt) : null
  const isExpired = expiresDate instanceof Date && !isNaN(expiresDate.getTime())
    ? expiresDate < new Date()
    : false
  const hasVoted = !!selectedOption
  const timeLeft = expiresDate instanceof Date && !isNaN(expiresDate.getTime()) && !isExpired
    ? formatDistanceToNow(expiresDate, { addSuffix: true, locale: es })
    : null

  const { sendPollVote, subscribeToPoll, isConnected } = useWebSocket(user?.userId, {})

  // Normalizar PollResponse del backend al tipo Poll del frontend
  function normalizePollResponse(p: any): Poll {
    const totalVotes = p.options?.reduce((sum: number, o: any) => sum + (o.voteCount ?? o.votes ?? 0), 0) || 0
    return {
      id: p.pollId || p.id || '',
      question: p.question || '',
      options: (p.options || []).map((o: any) => {
        const votes = o.voteCount ?? o.votes ?? 0
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
        return {
          id: o.id || '',
          text: o.text || '',
          votes,
          percentage: isNaN(pct) ? 0 : pct,
        }
      }),
      totalVotes,
      expiresAt: p.expiresAt || '',
      userVoted: p.myVoteOptionId || p.userVoted || null,
      allowMultiple: false,
    }
  }

  useEffect(() => {
    if (!isConnected || !poll.id) return
    try {
      unsubscribeRef.current = subscribeToPoll(poll.id, (raw: any) => {
        const normalized = normalizePollResponse(raw)
        setPoll(normalized)
      })
    } catch {
      // WebSocket no disponible, ignorar
    }
    return () => { unsubscribeRef.current?.() }
  }, [isConnected, poll.id, subscribeToPoll])

  useEffect(() => {
    setPoll(initialPoll)
    const localVote = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
    setSelectedOption(localVote || initialPoll.userVoted || null)
  }, [initialPoll.id, initialPoll.userVoted])

  const handleVote = (optionId: string) => {
    if (isExpired || selectedOption === optionId) return

    setSelectedOption(optionId)
    setPoll(prev => {
      const total = prev.totalVotes + 1
      return {
        ...prev,
        totalVotes: total,
        options: prev.options.map(o => {
          const votes = o.id === optionId ? o.votes + 1 : o.votes
          return { ...o, votes, percentage: total > 0 ? Math.round((votes / total) * 100) : 0 }
        }),
      }
    })

    const tryVote = (attempts = 0) => {
      const sent = sendPollVote(optionId)
      if (sent) {
        if (typeof window !== 'undefined') localStorage.setItem(storageKey, optionId)
        onVote?.(optionId)
        toast.success("Voto registrado")
      } else if (attempts < 10) {
        setTimeout(() => tryVote(attempts + 1), 300)
      } else {
        setSelectedOption(null)
        setPoll(initialPoll)
        toast.error("No conectado, intenta de nuevo")
      }
    }

    tryVote()
  }

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
              disabled={isExpired}
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
                    {isNaN(option.percentage) ? '0' : option.percentage}%
                  </span>
                )}
              </div>
              {showResults && <Progress value={isNaN(option.percentage) ? 0 : option.percentage} className="h-2" />}
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
            ? 'Toca otra opción para cambiar tu voto'
            : timeLeft
            ? `Finaliza ${timeLeft}`
            : ''}
        </span>
      </div>
    </div>
  )
}
