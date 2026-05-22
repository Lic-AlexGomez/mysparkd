"use client"

import { ChatErrorBoundary } from "@/components/chat/chat-error-boundary"

export default function ChatLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return <ChatErrorBoundary>{children}</ChatErrorBoundary>
}
