"use client"

import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  checkRegistrationPasswordRules,
  REGISTRATION_PASSWORD_HINT,
} from "@/lib/password-policy"

type Props = {
  password: string
  showHintWhenEmpty?: boolean
  className?: string
}

export function PasswordRulesChecklist({
  password,
  showHintWhenEmpty = true,
  className,
}: Props) {
  const rules = checkRegistrationPasswordRules(password)

  if (password.length === 0) {
    if (!showHintWhenEmpty) return null
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        {REGISTRATION_PASSWORD_HINT}
      </p>
    )
  }

  return (
    <ul
      className={cn(
        "space-y-1 rounded-lg border px-3 py-2 text-xs",
        rules.every((r) => r.ok)
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-border bg-muted/30",
        className
      )}
      aria-live="polite"
    >
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={cn(
            "flex items-center gap-2 font-medium",
            rule.ok ? "text-emerald-500" : "text-muted-foreground"
          )}
        >
          {rule.ok ? (
            <Check className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <X className="h-3.5 w-3.5 shrink-0 text-destructive" />
          )}
          {rule.label}
        </li>
      ))}
    </ul>
  )
}
