"use client"

import { AlertCircle } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { getAnnouncements, updateLastSeenAnnoucement } from "./actions"
import { AnnouncementBentoGrid } from "@/components/ui/announcement-bento-grid"
import { CtaCard, CtaCardContent } from "@/components/ui/cta-card"
import Preloader from "@/components/ui/preloader"

export default function AnnouncementsPage() {
  const [showPreloader, setShowPreloader] = useState(true)
  const [loadingData, setLoadingData] = useState(true)
  const [announcements, setAnnouncements] = useState<any[]>([])

  const handleAllAnnouncementsOnLoad = useCallback(async () => {
    setLoadingData(true)
    try {
      const [responseLastSeen, responseAnnouncements] = await Promise.all([
        updateLastSeenAnnoucement(),
        getAnnouncements(),
      ])
      if (responseLastSeen.error) {
        throw new Error(responseLastSeen.error)
      }
      if (responseAnnouncements.error) {
        throw new Error(responseAnnouncements.error)
      } else if (responseAnnouncements.data) {
        const announcementsData = responseAnnouncements.data
        const forView = announcementsData.filter(
          (announcement) => announcement.target_audience === "all" || announcement.target_audience === "members",
        )

        setAnnouncements(forView)
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error)
      toast.error("Error", {
        description: "Failed to load announcements. Please try again.",
      })
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    handleAllAnnouncementsOnLoad()
  }, [handleAllAnnouncementsOnLoad])

  // Separate announcements by importance for better layout
  const importantAnnouncements = announcements.filter(a => a.is_important)
  const regularAnnouncements = announcements.filter(a => !a.is_important)

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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Stay updated with CSI announcements and notifications</p>
        </div>
      </div>

      {/* Empty State */}
      {announcements.length === 0 && (
        <CtaCard>
          <CtaCardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No announcements yet</h3>
            <p className="text-muted-foreground">Wait for any announcement, Keep checking!</p>
          </CtaCardContent>
        </CtaCard>
      )}

      {/* Important Announcements */}
      {importantAnnouncements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-semibold">Important Announcements</h2>
          </div>
          <AnnouncementBentoGrid
            items={importantAnnouncements.map(a => ({
              ...a,
              colSpan: importantAnnouncements.length === 1 ? 2 : undefined,
              hasPersistentHover: true
            }))}
            showActions={false}
          />
        </div>
      )}

      {/* Regular Announcements */}
      {regularAnnouncements.length > 0 && (
        <div>
          {importantAnnouncements.length > 0 && (
            <div className="flex items-center gap-2 mb-4 mt-8">
              <h2 className="text-xl font-semibold">All Announcements</h2>
            </div>
          )}
          <AnnouncementBentoGrid
            items={regularAnnouncements}
            showActions={false}
          />
        </div>
      )}
    </div>
  )
}
