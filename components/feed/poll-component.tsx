"use client"

import { useState } from "react"
import { Poll } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface PollComponentProps {
  poll: Poll
  onVote?: (optionId: string) => void
}

export function PollComponent({ poll, onVote }: PollComponentProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(poll.userVoted || null)
  const hasVoted = !!selectedOption
  const isExpired = new Date(poll.expiresAt) < new Date()

  const handleVote = (optionId: string) => {
    if (hasVoted || isExpired) return
    
    setSelectedOption(optionId)
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
                showResults
                  ? 'cursor-default'
                  : 'hover:border-primary hover:bg-muted cursor-pointer'
              } ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card'
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
              
              {showResults && (
                <Progress value={option.percentage} className="h-2" />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{poll.totalVotes} votos</span>
        <span>{isExpired ? 'Finalizada' : `Finaliza ${timeLeft}`}</span>
      </div>
    </div>
  )
}
