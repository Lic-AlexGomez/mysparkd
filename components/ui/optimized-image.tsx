"use client"

import { useState } from "react"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  aspectRatio?: "square" | "video" | "portrait"
}

export function OptimizedImage({ src, alt, className = "", aspectRatio = "square" }: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]"
  }

  if (error) {
    return (
      <div className={`${aspectClasses[aspectRatio]} ${className} bg-muted flex items-center justify-center`}>
        <span className="text-muted-foreground text-sm">Error al cargar</span>
      </div>
    )
  }

  return (
    <div className={`relative ${aspectClasses[aspectRatio]} ${className} overflow-hidden`}>
      {isLoading && (
        <Skeleton className="absolute inset-0" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setError(true)
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  )
}
