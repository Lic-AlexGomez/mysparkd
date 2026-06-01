/** Puente global para notificar al companion desde capas sin React (p. ej. api.ts). */

export type CompanionApiHandlers = {
  onLoadingStart?: () => void
  onLoadingEnd?: () => void
  onError?: () => void
  onSuccess?: () => void
}

let handlers: CompanionApiHandlers = {}

export function registerCompanionApiHandlers(next: CompanionApiHandlers): () => void {
  handlers = next
  return () => {
    handlers = {}
  }
}

export function companionNotifyLoadingStart(): void {
  handlers.onLoadingStart?.()
}

export function companionNotifyLoadingEnd(): void {
  handlers.onLoadingEnd?.()
}

export function companionNotifyError(): void {
  handlers.onError?.()
}

export function companionNotifySuccess(): void {
  handlers.onSuccess?.()
}

/** Registro global para scroll rápido en feed (fuera del árbol React). */
let onScrollFastHandler: (() => void) | undefined

export function registerCompanionScrollFast(handler: () => void): () => void {
  onScrollFastHandler = handler
  return () => {
    onScrollFastHandler = undefined
  }
}

export function companionNotifyScrollFast(): void {
  onScrollFastHandler?.()
}
