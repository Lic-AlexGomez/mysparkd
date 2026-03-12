"use client"

import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react"

export function SocialFooter() {
  const socialLinks = [
    {
      name: "Facebook",
      href: "https://facebook.com/sparkdapp",
      icon: Facebook,
      color: "hover:text-[#1877F2]"
    },
    {
      name: "Twitter",
      href: "https://twitter.com/sparkdapp",
      icon: Twitter,
      color: "hover:text-black"
    },
    {
      name: "Instagram",
      href: "https://instagram.com/sparkdapp",
      icon: Instagram,
      color: "hover:text-[#E4405F]"
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/company/sparkdapp",
      icon: Linkedin,
      color: "hover:text-[#0A66C2]"
    },
    {
      name: "YouTube",
      href: "https://youtube.com/@sparkdapp",
      icon: Youtube,
      color: "hover:text-[#FF0000]"
    }
  ]

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      {socialLinks.map((social) => {
        const Icon = social.icon
        return (
          <Link
            key={social.name}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-muted-foreground transition-colors ${social.color}`}
            aria-label={`Síguenos en ${social.name}`}
          >
            <Icon className="h-5 w-5" />
          </Link>
        )
      })}
    </div>
  )
}
