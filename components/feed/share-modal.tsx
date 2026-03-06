"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { 
  Copy, 
  Facebook, 
  Twitter, 
  Linkedin, 
  MessageCircle,
  QrCode,
  Check
} from "lucide-react"
import QRCode from "qrcode"

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: string
  postContent: string
  username: string
}

export function ShareModal({ open, onOpenChange, postId, postContent, username }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState("")

  const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/post/${postId}`
  const shareText = `${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl)
      setCopied(true)
      toast.success("Enlace copiado")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Error al copiar")
    }
  }

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
      '_blank',
      'width=600,height=400'
    )
  }

  const handleShareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`,
      '_blank',
      'width=600,height=400'
    )
  }

  const handleShareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
      '_blank',
      'width=600,height=400'
    )
  }

  const handleShareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText} ${postUrl}`)}`,
      '_blank'
    )
  }

  const handleGenerateQR = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(postUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
      setQrDataUrl(dataUrl)
      setShowQR(true)
    } catch {
      toast.error("Error al generar código QR")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Compartir post</DialogTitle>
        </DialogHeader>

        {!showQR ? (
          <div className="space-y-4">
            {/* Copy Link */}
            <div className="flex gap-2">
              <Input
                value={postUrl}
                readOnly
                className="bg-muted border-border text-foreground"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Social Media Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleShareFacebook}
                variant="outline"
                className="flex items-center gap-2 border-border"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
              <Button
                onClick={handleShareTwitter}
                variant="outline"
                className="flex items-center gap-2 border-border"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button
                onClick={handleShareLinkedIn}
                variant="outline"
                className="flex items-center gap-2 border-border"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>
              <Button
                onClick={handleShareWhatsApp}
                variant="outline"
                className="flex items-center gap-2 border-border"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>

            {/* QR Code Button */}
            <Button
              onClick={handleGenerateQR}
              variant="outline"
              className="w-full flex items-center gap-2 border-border"
            >
              <QrCode className="h-4 w-4" />
              Generar código QR
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img src={qrDataUrl} alt="QR Code" className="rounded-lg" />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Escanea este código para ver el post
            </p>
            <Button
              onClick={() => setShowQR(false)}
              variant="outline"
              className="w-full"
            >
              Volver
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
