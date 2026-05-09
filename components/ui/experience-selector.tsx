"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AccountType } from "@/lib/types"

interface ExperienceSelectorProps {
  value: AccountType
  onChange: (value: AccountType) => void
  onSave?: () => void
  showSaveButton?: boolean
}

const experiences = [
  {
    value: "SOCIAL" as AccountType,
    emoji: "🤝",
    title: "Social",
    description: "Solo red social",
  },
  {
    value: "DATING" as AccountType,
    emoji: "💫",
    title: "Conexión",
    description: "Solo dating/matching",
  },
  {
    value: "BOTH" as AccountType,
    emoji: "⚡",
    title: "Ambos",
    description: "Experiencia completa",
  },
]

export function ExperienceSelector({
  value,
  onChange,
  onSave,
  showSaveButton = true,
}: ExperienceSelectorProps) {
  return (
    <div className="p-4 rounded-lg border border-primary/30 bg-card">
      <label className="text-sm leading-none text-foreground font-medium mb-3 block">
        Experiencia
      </label>
      
      <div className="flex flex-col gap-2">
        {experiences.map((exp) => {
          const isSelected = value === exp.value
          return (
            <button
              key={exp.value}
              type="button"
              onClick={() => onChange(exp.value)}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg transition-colors",
                isSelected
                  ? "bg-primary/10 border border-primary"
                  : "bg-muted border border-transparent hover:bg-muted/80"
              )}
            >
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">
                  {exp.emoji} {exp.title}
                </p>
                <p className="text-xs text-muted-foreground">{exp.description}</p>
              </div>
              {isSelected && (
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>

      {showSaveButton && onSave && (
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          <Check className="mr-2 h-4 w-4" aria-hidden="true" />
          Guardar experiencia
        </button>
      )}
    </div>
  )
}
