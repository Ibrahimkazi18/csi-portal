"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Calendar, Edit, Trash2, AlertCircle, Users, Shield, Settings } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { getAnnouncements, updateLastSeenAnnoucement, deleteAnnouncement } from "./actions"
import { CreateAnnouncementModal } from "./components/create-announcement-modal"
import { EditAnnouncementModal } from "./components/edit-announcement-modal"
import { DeleteAnnouncementDialog } from "./components/delete-announcement-modal"

export default function AnnouncementsPage() {
  const [loadingData, setLoadingData] = useState(true)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [announcementsForEdit, setAnnouncementsForEdit] = useState<any[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null)
  const [isManagementMode, setIsManagementMode] = useState(false)

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
          (announcement) => announcement.target_audience === "all" || announcement.target_audience === "core-team",
        )

        setAnnouncements(forView)
        setAnnouncementsForEdit(announcementsData)
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

  const handleEditAnnouncement = (announcement: any) => {
    setSelectedAnnouncement(announcement)
    setIsEditModalOpen(true)
  }

  const handleDeleteAnnouncement = (announcement: any) => {
    setSelectedAnnouncement(announcement)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedAnnouncement) return

    try {
      const response = await deleteAnnouncement(selectedAnnouncement.id)
      if (!response.success) {
        throw new Error(response.error)
      }

      toast.success("Announcement deleted successfully")
      handleAllAnnouncementsOnLoad()
      setIsDeleteDialogOpen(false)
      setSelectedAnnouncement(null)
    } catch (error: any) {
      toast.error("Error deleting announcement", {
        description: error.message || "Failed to delete announcement.",
      })
    }
  }

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neon">Announcements</h1>
          <p className="text-muted-foreground">Manage CSI announcements and notifications</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsManagementMode(!isManagementMode)}
            className={isManagementMode ? "glow-purple" : ""}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isManagementMode ? "Exit Management" : "Manage Announcements"}
          </Button>
          <Button className="glow-blue" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
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
              <p className="text-muted-foreground mb-4">Create your first announcement to get started!</p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="glow-blue">
                <Plus className="h-4 w-4 mr-2" />
                Create First Announcement
              </Button>
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

      {/* Management Section - All announcements for editing */}
      {isManagementMode && (
        <>
          <Separator className="my-6" />
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Manage All Announcements
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Edit and delete all announcements. Total: {announcementsForEdit.length} announcements
              </p>
            </CardHeader>
            <CardContent>
              {announcementsForEdit.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No announcements to manage.</div>
              ) : (
                <div className="space-y-3">
                  {announcementsForEdit.map((announcement) => {
                    const AudienceIcon = getAudienceIcon(announcement.target_audience)
                    return (
                      <div
                        key={announcement.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground truncate">{announcement.title}</h4>
                            {announcement.is_important && (
                              <Badge variant="destructive" className="text-xs">
                                Important
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-xs ${getAudienceColor(announcement.target_audience)}`}
                            >
                              <AudienceIcon className="h-3 w-3 mr-1" />
                              {announcement.target_audience.replace("-", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{announcement.content}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(announcement.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAnnouncement(announcement)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteAnnouncement(announcement)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Modals */}
      <CreateAnnouncementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleAllAnnouncementsOnLoad}
      />
      <EditAnnouncementModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        announcement={selectedAnnouncement}
        onSuccess={handleAllAnnouncementsOnLoad}
      />
      <DeleteAnnouncementDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        announcement={selectedAnnouncement}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
