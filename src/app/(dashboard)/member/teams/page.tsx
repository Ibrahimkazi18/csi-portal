"use client"

import { useCallback, useState } from "react"
import { TeamLeaderNotifications } from "@/components/teams/team-leader-notifications"
import Preloader from "@/components/ui/preloader"

export default function TeamsPage() {
  const [showPreloader, setShowPreloader] = useState(true)

  const handlePreloaderComplete = useCallback(() => {
    setShowPreloader(false)
  }, [])

  if (showPreloader) {
    return (
      <div className="relative w-full h-screen">
        <Preloader onComplete={handlePreloaderComplete} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <TeamLeaderNotifications />
    </div>
  )
}