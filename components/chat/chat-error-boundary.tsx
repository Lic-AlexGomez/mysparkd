"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

type State = { hasError: boolean }

export class ChatErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No se pudo cargar el chat. Actualiza la página o vuelve a intentarlo.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              this.setState({ hasError: false })
              window.location.reload()
            }}
          >
            Reintentar
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
