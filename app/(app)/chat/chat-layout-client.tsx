"use client"

import { useEffect } from "react"
import { ChatErrorBoundary } from "@/components/chat/chat-error-boundary"

const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || "unknown"

export default function ChatLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    document.documentElement.dataset.sparkdBuild = BUILD_ID
  }, [])

  return <ChatErrorBoundary>{children}</ChatErrorBoundary>
}
