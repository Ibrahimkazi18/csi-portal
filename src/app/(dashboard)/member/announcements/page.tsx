"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Calendar, Edit, Trash2, AlertCircle, Users, Shield, Settings } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { getAnnouncements, updateLastSeenAnnoucement } from "./actions"
import { AnnouncementsPageSkeleton } from "./components/announcements-skeleton"

export default function AnnouncementsPage() {
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


  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case "all":
        return Users
      case "core-team":
        return Shield
      case "members":
        return Users
      default:
        return Users
    }
  }

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case "all":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "core-team":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "members":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  if (loadingData) {
    return <AnnouncementsPageSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neon text-lavender">Announcements</h1>
          <p className="text-muted-foreground">Manage CSI announcements and notifications</p>
        </div>
        <div className="flex items-center gap-3">
          
        </div>
      </div>

      {/* For View Section - Announcements visible to core team */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Recent Announcements
          </CardTitle>
          <p className="text-sm text-muted-foreground">Announcements visible to you as a core team member</p>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-8 text-muted-foreground">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No announcements yet</h3>
              <p className="text-muted-foreground mb-4">Wait for any announcement, Keep checking!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => {
                const AudienceIcon = getAudienceIcon(announcement.target_audience)
                return (
                  <div
                    key={announcement.id}
                    className={`p-4 rounded-lg border transition-all ${
                      announcement.is_important
                        ? "border-red-500/30 bg-red-500/5 glow-red"
                        : "border-border bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                        {announcement.is_important && (
                          <Badge variant="destructive" className="text-xs">
                            Important
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getAudienceColor(announcement.target_audience)}`}
                        >
                          <AudienceIcon className="h-3 w-3 mr-1" />
                          {announcement.target_audience.replace("-", " ")}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <p className="text-foreground leading-relaxed">{announcement.content}</p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
