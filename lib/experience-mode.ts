import {
  experienceObjectiveToAccountType,
  toBackendAccountType,
  type BackendAccountType,
} from "./account-type"

export type ExperienceObjective = "social" | "connection" | "both"

export function accountTypeToObjective(
  accountType?: string | null
): ExperienceObjective {
  if (!accountType || !String(accountType).trim()) return "social"
  const mode = toBackendAccountType(accountType)
  if (mode === "SOCIAL") return "social"
  if (mode === "DATING") return "connection"
  return "both"
}

export function isDatingAccountType(accountType?: string | null): boolean {
  if (!accountType || !String(accountType).trim()) return false
  const mode = toBackendAccountType(accountType)
  return mode === "DATING" || mode === "BOTH"
}

export function objectiveToAccountType(objective: ExperienceObjective): BackendAccountType {
  return experienceObjectiveToAccountType(objective)
}

export function isDatingObjective(objective: ExperienceObjective): boolean {
  return objective === "connection" || objective === "both"
}

export function isBothObjective(objective: ExperienceObjective): boolean {
  return objective === "both"
}

/** Barra flotante dating: solo modo Conexión (citas puras). */
export function usesDatingBottomNav(objective: ExperienceObjective): boolean {
  return objective === "connection"
}

export function isSocialObjective(objective: ExperienceObjective): boolean {
  return objective === "social"
}

/** Swipes, matches, descubrir, etc. — Conexión y Ambos. */
export function hasDatingFeatures(objective: ExperienceObjective): boolean {
  return isDatingObjective(objective)
}

export function settingsKeyForUser(userId: string) {
  return `sparkd_settings_${userId}`
}
