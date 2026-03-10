import { Star } from 'lucide-react'

interface ReputationStarsProps {
  reputation: number
  size?: 'sm' | 'md' | 'lg'
}

export function ReputationStars({ reputation, size = 'sm' }: ReputationStarsProps) {
  const stars = Math.round(reputation / 20) // 0-5 estrellas
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }
  
  return (
    <div className="flex gap-0.5" title={`Reputación: ${reputation}/100`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sizeClasses[size]} ${
            i < stars 
              ? 'fill-yellow-500 text-yellow-500' 
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}
