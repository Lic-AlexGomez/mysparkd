"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search, BarChart3, Users, Menu, X } from "lucide-react"
import { useFeatureFlags } from "@/hooks/use-feature-flags"

export function MobileQuickMenu() {
  const router = useRouter()
  const features = useFeatureFlags()
  const [isOpen, setIsOpen] = useState(false)

  if (!features.searchPage && !features.analyticsPage && !features.groupsPage) {
    return null
  }

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 left-4 z-40 h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg lg:hidden"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Menu overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-40 left-4 z-40 flex flex-col gap-2 lg:hidden">
            {features.searchPage && (
              <Button
                onClick={() => {
                  router.push('/search')
                  setIsOpen(false)
                }}
                className="h-12 w-12 rounded-full bg-card border-2 border-primary shadow-lg"
                variant="outline"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
            {features.analyticsPage && (
              <Button
                onClick={() => {
                  router.push('/analytics')
                  setIsOpen(false)
                }}
                className="h-12 w-12 rounded-full bg-card border-2 border-primary shadow-lg"
                variant="outline"
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
            )}
            {features.groupsPage && (
              <Button
                onClick={() => {
                  router.push('/groups')
                  setIsOpen(false)
                }}
                className="h-12 w-12 rounded-full bg-card border-2 border-primary shadow-lg"
                variant="outline"
              >
                <Users className="h-5 w-5" />
              </Button>
            )}
          </div>
        </>
      )}
    </>
  )
}
