"use client"

import { useState } from "react"
import { Share2, Facebook, Twitter, Linkedin, MessageCircle, Mail, Link2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface SocialShareProps {
  url?: string
  title?: string
  description?: string
  hashtags?: string[]
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost"
  showLabel?: boolean
}

export function SocialShare({
  url = typeof window !== 'undefined' ? window.location.href : '',
  title = "Sparkd - Red Social y Dating App",
  description = "Conoce gente nueva con Sparkd, la app de citas y red social. Haz match, chatea y encuentra personas con tus intereses.",
  hashtags = ["Sparkd", "Dating", "RedSocial"],
  size = "default",
  variant = "ghost",
  showLabel = false
}: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description)
  const hashtagsString = hashtags.join(',')

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&hashtags=${hashtagsString}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
  }

  const handleShare = (platform: keyof typeof shareLinks) => {
    const link = shareLinks[platform]
    window.open(link, '_blank', 'width=600,height=400')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("¡Link copiado!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Error al copiar")
    }
  }

  // Si el navegador soporta Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        })
      } catch (err) {
        // Usuario canceló o error
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Share2 className="h-4 w-4" />
          {showLabel && <span>Compartir</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border-border">
        <DropdownMenuItem
          onClick={() => handleShare('facebook')}
          className="cursor-pointer flex items-center gap-3 py-2.5"
        >
          <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center">
            <Facebook className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="font-medium">Facebook</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare('twitter')}
          className="cursor-pointer flex items-center gap-3 py-2.5"
        >
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <Twitter className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="font-medium">Twitter / X</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare('linkedin')}
          className="cursor-pointer flex items-center gap-3 py-2.5"
        >
          <div className="w-8 h-8 rounded-full bg-[#0A66C2] flex items-center justify-center">
            <Linkedin className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="font-medium">LinkedIn</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare('whatsapp')}
          className="cursor-pointer flex items-center gap-3 py-2.5"
        >
          <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="font-medium">WhatsApp</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare('telegram')}
          className="cursor-pointer flex items-center gap-3 py-2.5"
        >
          <div className="w-8 h-8 rounded-full bg-[#0088cc] flex items-center justify-center">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
          </div>
          <span className="font-medium">Telegram</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare('reddit')}
          className="cursor-pointer flex items-center gap-3 py-2.5"
        >
          <div className="w-8 h-8 rounded-full bg-[#FF4500] flex items-center justify-center">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.68 13.32c-.18.18-.48.18-.66 0-.18-.18-.18-.48 0-.66 1.5-1.5 1.5-3.96 0-5.46-.18-.18-.18-.48 0-.66.18-.18.48-.18.66 0 1.86 1.86 1.86 4.92 0 6.78zM9 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-3 4c-1.66 0-3-1.34-3-3h6c0 1.66-1.34 3-3 3z"/>
            </svg>
          </div>
          <span className="font-medium">Reddit</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare('pinterest')}
          className="cursor-pointer flex items-center gap-3 py-2.5"
        >
          <div className="w-8 h-8 rounded-full bg-[#E60023] flex items-center justify-center">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 4.26 2.67 7.9 6.43 9.34-.09-.79-.17-2.01.04-2.87.19-.78 1.23-5.21 1.23-5.21s-.31-.63-.31-1.56c0-1.46.85-2.55 1.9-2.55.9 0 1.33.67 1.33 1.48 0 .9-.57 2.25-.87 3.5-.25 1.04.52 1.89 1.55 1.89 1.86 0 3.29-1.96 3.29-4.79 0-2.5-1.8-4.25-4.37-4.25-2.98 0-4.73 2.23-4.73 4.54 0 .9.35 1.86.78 2.38.09.1.1.19.07.3-.08.31-.25 1.04-.29 1.18-.05.19-.17.23-.39.14-1.39-.65-2.26-2.68-2.26-4.31 0-3.51 2.55-6.73 7.36-6.73 3.87 0 6.87 2.76 6.87 6.44 0 3.84-2.42 6.93-5.78 6.93-1.13 0-2.19-.59-2.55-1.28l-.69 2.64c-.25.97-.93 2.19-1.39 2.93C9.58 21.85 10.77 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
            </svg>
          </div>
          <span className="font-medium">Pinterest</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare('email')}
          className="cursor-pointer flex items-center gap-3 py-2.5"
        >
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <span className="font-medium">Email</span>
        </DropdownMenuItem>

        <div className="my-1 h-px bg-border" />

        <DropdownMenuItem
          onClick={copyToClipboard}
          className="cursor-pointer flex items-center gap-3 py-2.5"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            {copied ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Link2 className="h-4 w-4 text-primary" />
            )}
          </div>
          <span className="font-medium">{copied ? "¡Copiado!" : "Copiar link"}</span>
        </DropdownMenuItem>

        {navigator.share && (
          <DropdownMenuItem
            onClick={handleNativeShare}
            className="cursor-pointer flex items-center gap-3 py-2.5"
          >
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
              <Share2 className="h-4 w-4 text-secondary" />
            </div>
            <span className="font-medium">Más opciones...</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
