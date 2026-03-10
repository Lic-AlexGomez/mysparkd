'use client'

import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  onClick?: () => void
}

export function OptimizedImage({ src, alt, className = '', onClick }: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
      )}
      {error ? (
        <div className="absolute inset-0 bg-muted flex items-center justify-center rounded-lg">
          <p className="text-sm text-muted-foreground">Error al cargar imagen</p>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`w-full object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setError(true)
          }}
          onClick={onClick}
        />
      )}
    </div>
  )
}
