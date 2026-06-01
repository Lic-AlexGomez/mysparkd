'use client'
import { Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThePulseProps {
  isActive?: boolean
  className?: string
}

export function ThePulse({ isActive, className }: ThePulseProps) {
  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className={cn(
        'relative flex items-center justify-center h-16 w-16 rounded-full border-4 transition-all duration-300',
        isActive
          ? 'border-orange-500 bg-gradient-to-br from-orange-600 to-red-700 shadow-[0_0_30px_rgba(234,88,12,0.9)]'
          : 'border-primary bg-gradient-to-br from-primary/80 to-secondary/80 shadow-[0_0_20px_rgba(139,92,246,0.7)]'
      )}>
        <Radio className="h-7 w-7 text-white animate-pulse" />
        {isActive && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,1)]" />
        )}
      </div>
      <span className="text-[9px] font-bold tracking-widest text-white uppercase">The Pulse</span>
    </div>
  )
}
